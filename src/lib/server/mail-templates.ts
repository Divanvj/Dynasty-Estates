// Server code only (audit item 3.2): importing this from a Client Component
// fails the build, so nothing here (keys, Admin SDK) can reach the browser.
import "server-only";

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

/** The footer line on an e-mail the recipient can turn off. */
export type OptOutLink = { url: string | null; what: string };

function optOutHtml(optOut?: OptOutLink): string {
  if (!optOut) return "";
  const manage = `${SITE_URL}/alerts`;
  return `<br>You get this because ${escape(optOut.what)} is on. ${
    optOut.url ? `<a href="${escape(optOut.url)}" style="color:#0f4c4a">Stop these e-mails</a> or ` : ""
  }<a href="${escape(manage)}" style="color:#0f4c4a">choose which e-mails you get</a>.`;
}

function optOutText(optOut?: OptOutLink): string[] {
  if (!optOut) return [];
  return ["", "--", `You get this because ${optOut.what} is on.`, optOut.url ? `Stop these e-mails: ${optOut.url}` : "", `Choose which e-mails you get: ${SITE_URL}/alerts`].filter(Boolean);
}

function layout(heading: string, bodyHtml: string, button?: { label: string; href: string }, optOut?: OptOutLink): string {
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
<tr><td style="padding:16px 24px;border-top:1px solid #e7eded;font-size:12px;color:#5b6b6c">Sent by Dynasty Estates · <a href="${escape(SITE_URL)}" style="color:#0f4c4a">${escape(SITE_URL.replace(/^https?:\/\//, ""))}</a>${optOutHtml(optOut)}</td></tr>
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
  optOut?: OptOutLink;
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
      ...optOutText(input.optOut),
    ].join("\n"),
    html: layout(
      `New enquiry on ${title}`,
      paragraph(`${buyer} sent an enquiry about your listing.`) +
        facts(rows) +
        (notes ? quote(notes) : "") +
        paragraph("Reply to this e-mail to answer them directly."),
      { label: "Open your enquiries", href: inbox },
      input.optOut,
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

export type ReportListing = {
  title: string;
  /** The listing's page in the owner's portal. */
  path: string;
  views: number;
  saves: number;
  contactClicks: number;
  enquiries: number;
};

/** The Monday report: last week's numbers for each live listing. */
export function weeklyReportEmail(input: { name: string | null; weekLabel: string; listings: ReportListing[]; portalPath: string; optOut?: OptOutLink }) {
  const total = input.listings.reduce(
    (t, l) => ({ views: t.views + l.views, saves: t.saves + l.saves, contactClicks: t.contactClicks + l.contactClicks, enquiries: t.enquiries + l.enquiries }),
    { views: 0, saves: 0, contactClicks: 0, enquiries: 0 },
  );
  const n = input.listings.length;
  const hello = input.name ? `Hi ${line(input.name, 60)},` : "Hi,";
  const summary = `${total.views} views, ${total.saves} saves, ${total.contactClicks} contact clicks and ${total.enquiries} enquiries across your ${n} live listing${n === 1 ? "" : "s"}.`;
  const cell = "padding:8px 6px;font-size:14px;border-top:1px solid #e7eded;text-align:right";
  const head = "padding:0 6px 6px;font-size:12px;color:#5b6b6c;text-align:right;font-weight:normal";
  const rows = input.listings
    .map(
      (l) =>
        `<tr><td style="padding:8px 6px 8px 0;font-size:14px;border-top:1px solid #e7eded"><a href="${escape(SITE_URL + l.path)}" style="color:#0f4c4a">${escape(line(l.title || "Untitled listing", 70))}</a></td><td style="${cell}">${l.views}</td><td style="${cell}">${l.saves}</td><td style="${cell}">${l.contactClicks}</td><td style="${cell}">${l.enquiries}</td></tr>`,
    )
    .join("");
  const table = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 12px;border-collapse:collapse"><tr><th style="padding:0 6px 6px 0;font-size:12px;color:#5b6b6c;text-align:left;font-weight:normal">Listing</th><th style="${head}">Views</th><th style="${head}">Saves</th><th style="${head}">Contact clicks</th><th style="${head}">Enquiries</th></tr>${rows}</table>`;
  const portal = `${SITE_URL}${input.portalPath}`;
  return {
    subject: `Your listings last week: ${total.views} views, ${total.enquiries} enquiries`,
    text: [
      hello,
      "",
      `Your listings, ${input.weekLabel}: ${summary}`,
      "",
      ...input.listings.map(
        (l) => `- ${line(l.title || "Untitled listing", 70)}: ${l.views} views, ${l.saves} saves, ${l.contactClicks} contact clicks, ${l.enquiries} enquiries. ${SITE_URL}${l.path}`,
      ),
      "",
      `Open your listings: ${portal}`,
      ...optOutText(input.optOut),
    ].join("\n"),
    html: layout(
      `Your listings, ${input.weekLabel}`,
      paragraph(hello) + paragraph(summary) + table + paragraph("Views and saves are counted on the listing pages; enquiries are the messages and viewing requests buyers sent."),
      { label: "Open your listings", href: portal },
      input.optOut,
    ),
  };
}

export type AlertListing = { title: string; slug: string; price: string; location: string; beds: number; baths: number };

/** New listings for one person's saved searches. */
export function savedSearchEmail(input: {
  /** `stopUrl` (S1-11) stops this one search; the footer link stops them all. */
  searches: Array<{ label: string; url: string; listings: AlertListing[]; more: number; stopUrl?: string | null }>;
  optOut?: OptOutLink;
}) {
  const count = input.searches.reduce((n, s) => n + s.listings.length + s.more, 0);
  const one = input.searches.length === 1 ? input.searches[0] : null;
  const subject = one ? `${count} new home${count === 1 ? "" : "s"} for "${line(one.label, 70)}"` : `${count} new homes for your saved searches`;
  const home = (h: AlertListing) => `${SITE_URL}/property/${encodeURIComponent(h.slug)}`;
  const facts = (h: AlertListing) => line([h.location, h.beds ? `${h.beds} bed` : "", h.baths ? `${h.baths} bath` : ""].filter(Boolean).join(" · "), 120);
  const homeHtml = (h: AlertListing) =>
    `<tr><td style="padding:10px 0;border-top:1px solid #e7eded"><a href="${escape(home(h))}" style="color:#0f4c4a;font-weight:bold;font-size:15px">${escape(line(h.title, 90))}</a><div style="font-size:14px;margin-top:2px">${escape(line(h.price, 40))}</div><div style="font-size:13px;color:#5b6b6c;margin-top:2px">${escape(facts(h))}</div></td></tr>`;
  const blocks = input.searches
    .map(
      (s) =>
        `<h2 style="margin:20px 0 4px;font-size:16px;color:#10201f">${escape(line(s.label, 100))}</h2><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${s.listings.map(homeHtml).join("")}</table>${
          s.more ? `<p style="margin:6px 0 0;font-size:14px"><a href="${escape(s.url)}" style="color:#0f4c4a">See ${s.more} more</a></p>` : ""
        }${
          s.stopUrl
            ? `<p style="margin:6px 0 0;font-size:12px;color:#5b6b6c"><a href="${escape(s.stopUrl)}" style="color:#5b6b6c">Stop alerts for this search</a></p>`
            : ""
        }`,
    )
    .join("");
  return {
    subject,
    text: [
      `New homes for your saved search${input.searches.length === 1 ? "" : "es"}:`,
      ...input.searches.flatMap((s) => [
        "",
        line(s.label, 100),
        ...s.listings.map((h) => `- ${line(h.title, 90)}, ${line(h.price, 40)}, ${facts(h)}: ${home(h)}`),
        ...(s.more ? [`See ${s.more} more: ${s.url}`] : []),
        ...(s.stopUrl ? [`Stop alerts for this search: ${s.stopUrl}`] : []),
      ]),
      ...optOutText(input.optOut),
    ].join("\n"),
    html: layout(
      one ? "New homes for your saved search" : "New homes for your saved searches",
      paragraph(`Listed since we last wrote, and ${count === 1 ? "it matches" : "they match"} what you saved.`) + blocks,
      one ? { label: "See the search", href: one.url } : { label: "Your saved searches", href: `${SITE_URL}/alerts` },
      input.optOut,
    ),
  };
}

export type DropListing = {
  title: string;
  slug: string;
  location: string;
  listingType: string;
  /** Rand figures, not the formatted strings: the e-mail prints both. */
  from: number;
  to: number;
  percent: number;
  why: string;
};

/**
 * S1-10 — homes that cut their asking price, for someone who saved the home or
 * saved a search it matches. One e-mail covers every drop that person should
 * hear about, each saying which it is.
 */
export function priceDropEmail(input: { drops: DropListing[]; optOut?: OptOutLink }) {
  const rands = (value: number) => `R ${value.toLocaleString("en-ZA").replace(/,/g, " ")}`;
  const per = (d: DropListing) => (d.listingType === "rent" ? " a month" : "");
  const count = input.drops.length;
  const first = input.drops[0];
  const subject =
    count === 1 ? `${line(first.title, 60)} is down ${first.percent}% to ${rands(first.to)}` : `${count} homes you follow cut their price`;
  const url = (d: DropListing) => `${SITE_URL}/property/${encodeURIComponent(d.slug)}`;
  const dropHtml = (d: DropListing) =>
    `<tr><td style="padding:10px 0;border-top:1px solid #e7eded"><a href="${escape(url(d))}" style="color:#0f4c4a;font-weight:bold;font-size:15px">${escape(line(d.title, 90))}</a><div style="font-size:15px;margin-top:2px"><span style="font-weight:bold">${escape(rands(d.to))}${escape(per(d))}</span> <span style="color:#5b6b6c;text-decoration:line-through">${escape(rands(d.from))}</span> <span style="color:#0f4c4a;font-weight:bold">−${d.percent}%</span></div><div style="font-size:13px;color:#5b6b6c;margin-top:2px">${escape(line([d.location, d.why].filter(Boolean).join(" · "), 120))}</div></td></tr>`;
  return {
    subject,
    text: [
      count === 1 ? "A home you follow has cut its asking price:" : "Homes you follow have cut their asking price:",
      "",
      ...input.drops.map((d) => `- ${line(d.title, 90)}: ${rands(d.to)}${per(d)}, was ${rands(d.from)} (${d.percent}% off). ${d.why}. ${url(d)}`),
      "",
      "A lower asking price is not an offer and the home may still sell at any figure.",
      ...optOutText(input.optOut),
    ].join("\n"),
    html: layout(
      count === 1 ? "A home you follow has cut its price" : "Homes you follow have cut their price",
      paragraph(count === 1 ? "The asking price came down since we last looked." : "These asking prices came down since we last looked.") +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${input.drops.map(dropHtml).join("")}</table>` +
        paragraph("A lower asking price is not an offer, and the home may still sell at any figure."),
      count === 1 ? { label: "See the home", href: url(first) } : { label: "Your saved homes", href: `${SITE_URL}/saved` },
      input.optOut,
    ),
  };
}

/**
 * S1-9 — an agent's Fidelity Fund Certificate is running out (60 days, 30 days
 * or a week). Dynasty does not renew it: the e-mail says what to do and where,
 * and sends them to their profile to file the new date.
 */
export function ffcReminderEmail(input: {
  name: string | null;
  ffcNumber: string;
  ffcExpiry: string;
  expiryLabel: string;
  daysLeft: number;
  ppraUrl: string;
  optOut?: OptOutLink;
}) {
  const hello = input.name ? `Hi ${line(input.name, 80)},` : "Hi,";
  const left = input.daysLeft === 1 ? "tomorrow" : input.daysLeft === 0 ? "today" : `in ${input.daysLeft} days`;
  const profile = `${SITE_URL}/agent/profile`;
  const subject = `Your Fidelity Fund Certificate expires ${left} (${input.expiryLabel})`;
  return {
    subject,
    text: [
      hello,
      "",
      `The Fidelity Fund Certificate on your Dynasty Estates profile expires ${left}, on ${input.expiryLabel}.`,
      "Without a valid FFC you may not trade as a property practitioner, and your listings cannot stay live.",
      "",
      `Certificate: ${line(input.ffcNumber, 40)}`,
      `Expires: ${input.expiryLabel}`,
      "",
      `Renew with the PPRA: ${input.ppraUrl}`,
      `Then file the new date on your profile: ${profile}`,
      "",
      "If you have already renewed, file the new expiry date and this reminder stops.",
    ].join("\n"),
    html: layout(
      "Your Fidelity Fund Certificate is running out",
      paragraph(hello) +
        paragraph(`The Fidelity Fund Certificate on your Dynasty Estates profile expires ${left}, on ${input.expiryLabel}.`) +
        paragraph("Without a valid FFC you may not trade as a property practitioner, and your listings cannot stay live.") +
        facts([
          ["Certificate", line(input.ffcNumber, 40)],
          ["Expires", input.expiryLabel],
        ]) +
        paragraph(`Renew with the PPRA at ${input.ppraUrl}, then file the new date on your profile. If you have already renewed, file the new expiry date and this reminder stops.`),
      { label: "Update my certificate", href: profile },
      input.optOut,
    ),
  };
}

export function verifyEmailEmail(input: { name: string | null; link: string; reminder: boolean }) {
  const hello = input.name ? `Hi ${line(input.name, 80)},` : "Hi,";
  const intro = input.reminder
    ? "You created a Dynasty Estates account a few days ago but haven't confirmed your e-mail address yet."
    : "Thanks for creating a Dynasty Estates account.";
  return {
    subject: input.reminder ? "Reminder: confirm your e-mail address for Dynasty Estates" : "Confirm your e-mail address for Dynasty Estates",
    text: [
      hello,
      "",
      intro,
      "Confirm your e-mail address so agents and sellers can reach you and so you get your alerts:",
      input.link,
      "",
      "The link works once and expires after a while. If it has expired, sign in and choose \"Send the link again\".",
      "If you didn't create this account, you can ignore this e-mail.",
    ].join("\n"),
    html: layout(
      "Confirm your e-mail address",
      paragraph(hello) +
        paragraph(intro) +
        paragraph("Confirm your e-mail address so agents and sellers can reach you and so you get your alerts.") +
        paragraph('The link works once and expires after a while. If it has expired, sign in and choose "Send the link again".') +
        paragraph("If you didn't create this account, you can ignore this e-mail."),
      { label: "Confirm my e-mail address", href: input.link },
    ),
  };
}
