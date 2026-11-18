import { SITE_URL } from "@/lib/site-url";

/**
 * The e-mails the site sends, as plain text plus a simple HTML version.
 * Everything that comes from a user (names, messages, titles) is escaped:
 * these are rendered by mail clients, and an enquiry's message is written by a
 * stranger.
 */

function escape(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** One-line plain text: no line breaks that could start a new header-looking line. */
function line(value: string, max = 140): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function layout(heading: string, bodyHtml: string, button?: { label: string; href: string }): string {
  return `<!doctype html>
<html><body style="margin:0;background:#f2f5f5;font-family:Arial,Helvetica,sans-serif;color:#1d2a2c">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #dde5e5;border-radius:12px">
<tr><td style="padding:20px 24px;border-bottom:1px solid #e7eded;font-size:13px;letter-spacing:2px;color:#0f4c4a;font-weight:bold">DYNASTY ESTATES</td></tr>
<tr><td style="padding:24px">
<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#10201f">${escape(heading)}</h1>
${bodyHtml}
${button ? `<p style="margin:24px 0 0"><a href="${escape(button.href)}" style="display:inline-block;background:#0f4c4a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold;font-size:14px">${escape(button.label)}</a></p>` : ""}
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #e7eded;font-size:12px;color:#5b6b6c">Sent by Dynasty Estates · <a href="${escape(SITE_URL)}" style="color:#0f4c4a">${escape(SITE_URL.replace(/^https?:\/\//, ""))}</a></td></tr>
</table></td></tr></table></body></html>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 12px;font-size:15px;line-height:1.5">${escape(text)}</p>`;
}

function facts(rows: Array<[string, string]>): string {
  const cells = rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;font-size:13px;color:#5b6b6c;vertical-align:top;white-space:nowrap">${escape(label)}</td><td style="padding:6px 0;font-size:15px">${escape(value)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 12px">${cells}</table>`;
}

function quote(text: string): string {
  return `<div style="margin:4px 0 12px;padding:12px 14px;background:#f2f5f5;border-left:3px solid #0f4c4a;border-radius:4px;font-size:15px;line-height:1.5;white-space:pre-wrap">${escape(text)}</div>`;
}

const KIND_LABEL: Record<string, string> = { tour: "Virtual tour request", viewing: "Viewing request", message: "Message" };

export function enquiryEmail(input: {
  listingTitle: string;
  listingId: string;
  kind: string;
  buyerName: string;
  buyerEmail: string | null;
  buyerPhone: string;
  notes: string;
  /** Where the owner reads their enquiries. */
  inboxPath: string;
}) {
  const kind = KIND_LABEL[input.kind] ?? "Enquiry";
  const title = line(input.listingTitle || "your listing", 100);
  const buyer = line(input.buyerName || "A buyer", 80);
  const inbox = `${SITE_URL}${input.inboxPath}`;
  const listing = `${SITE_URL}/property/${encodeURIComponent(input.listingId)}`;
  const rows: Array<[string, string]> = [
    ["Type", kind],
    ["Name", buyer],
    ["E-mail", input.buyerEmail ?? ""],
    ["Phone", line(input.buyerPhone, 40)],
  ];
  const notes = input.notes.trim().slice(0, 2000);
  return {
    subject: `New enquiry: ${title}`,
    text: [
      `${buyer} sent an enquiry about ${title}.`,
      "",
      ...rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
      ...(notes ? ["", "Message:", notes] : []),
      "",
      `Reply to this e-mail to answer them directly, or open your enquiries: ${inbox}`,
      `Listing: ${listing}`,
    ].join("\n"),
    html: layout(
      `New enquiry on ${title}`,
      paragraph(`${buyer} sent an enquiry about your listing.`) +
        facts(rows) +
        (notes ? quote(notes) : "") +
        paragraph("Reply to this e-mail to answer them directly."),
      { label: "Open your enquiries", href: inbox },
    ),
  };
}

export function agencyInviteEmail(input: { agencyName: string; principalName: string | null }) {
  const agency = line(input.agencyName || "an agency", 100);
  const who = input.principalName ? line(input.principalName, 80) : "The agency's principal";
  const join = `${SITE_URL}/agent/profile`;
  return {
    subject: `${agency} invited you to their team on Dynasty Estates`,
    text: [
      `${who} invited you to join ${agency} on Dynasty Estates.`,
      "",
      "Sign in (or create an account) with this e-mail address, then accept the invitation on your agent profile:",
      join,
      "",
      `Not registered as an agent on Dynasty Estates yet? Register first: ${SITE_URL}/join/agent`,
      "",
      "If you weren't expecting this, you can ignore it.",
    ].join("\n"),
    html: layout(
      `Join ${agency} on Dynasty Estates`,
      paragraph(`${who} invited you to join ${agency}.`) +
        paragraph("Sign in, or create an account, with this e-mail address, then accept the invitation on your agent profile.") +
        paragraph(`Not registered as an agent on Dynasty Estates yet? Register first at ${SITE_URL}/join/agent.`) +
        paragraph("If you weren't expecting this, you can ignore it."),
      { label: "Accept the invitation", href: join },
    ),
  };
}

export function opsAlertEmail(input: { summary: string; failures: string[]; ranAt: string }) {
  const console = `${SITE_URL}/console/events`;
  return {
    subject: `Nightly jobs failed: ${line(input.failures.map((f) => f.split(":")[0]).join(", "), 80)}`,
    text: [`The nightly jobs at ${input.ranAt} finished with problems:`, "", ...input.failures.map((f) => `- ${f}`), "", `Details: ${console}`].join("\n"),
    html: layout(
      "Nightly jobs finished with problems",
      paragraph(`Run at ${input.ranAt}.`) + `<ul style="margin:0 0 12px;padding-left:20px;font-size:14px;line-height:1.5">${input.failures.map((f) => `<li>${escape(f)}</li>`).join("")}</ul>`,
      { label: "Open the event log", href: console },
    ),
  };
}

export function testEmail(input: { requestedBy: string; provider: string }) {
  return {
    subject: "Dynasty Estates test e-mail",
    text: `This is a test e-mail from the developer console, sent through ${input.provider} at the request of ${input.requestedBy}. If you can read this, e-mail sending works.`,
    html: layout(
      "E-mail sending works",
      paragraph(`This is a test e-mail from the developer console, sent through ${input.provider} at the request of ${input.requestedBy}.`),
    ),
  };
}
