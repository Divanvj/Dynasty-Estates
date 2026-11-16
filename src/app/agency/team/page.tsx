"use client";

import { useId, useState } from "react";

import { AgencyGate } from "@/components/agency-gate";
import { useAgencyTeam } from "@/components/agency-team";
import {
  AgeChip,
  ConfirmDialog,
  emptyBoxClass,
  errorBoxClass,
  formatAge,
  Initials,
  linkClass,
  PageHeading,
  panelClass,
  primaryButtonClass,
  rowClass,
  secondaryButtonClass,
  SummaryStrip,
} from "@/components/dashboard-ui";
import { deleteInvite, EMAIL_PATTERN, inviteAgent, removeMember, type AgencyInvite } from "@/lib/agency";
import { formatDate } from "@/lib/formatters";
import { useAccountUid } from "@/lib/use-owner-listings";

// Pattern 1 — List (docs/dashboards/PLAN.md, Phase G). The agency's agents,
// the invitations still open, and the form to invite another. No e-mail is
// sent yet: the invited agent sees the invitation on their profile.

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[var(--dash-d1)] focus:outline-none aria-[invalid=true]:border-rose-500 dark:border-white/10 dark:bg-surface-ink dark:text-white";

export default function AgencyTeamPage() {
  const uid = useAccountUid();
  const { load, reload } = useAgencyTeam(uid);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [removing, setRemoving] = useState<{ uid: string; name: string } | null>(null);
  const emailId = useId();

  return (
    <AgencyGate uid={uid} load={load} reload={reload}>
      {({ agency, agents, invites }) => {
        const memberEmails = new Set(agents.map((a) => a.email.toLowerCase()));
        const check = (value: string) => {
          const v = value.trim().toLowerCase();
          if (!EMAIL_PATTERN.test(v)) return "Enter the agent's e-mail address.";
          if (memberEmails.has(v)) return "That agent is already in your agency.";
          if (invites.some((i) => i.email === v)) return "That agent already has an invitation.";
          return "";
        };

        async function invite(event: React.FormEvent) {
          event.preventDefault();
          const problem = check(email);
          setEmailError(problem);
          if (problem || !uid) {
            document.getElementById(emailId)?.focus();
            return;
          }
          setBusy("invite");
          setError(null);
          setNotice(null);
          try {
            await inviteAgent(uid, agency.name, email);
            setNotice(`Invitation saved for ${email.trim().toLowerCase()}. Ask them to sign in to Dynasty and open Agent → Profile to accept it.`);
            setEmail("");
            reload();
          } catch (err) {
            console.error("Could not invite the agent:", err);
            setError("The invitation wasn't saved. Check your connection and try again.");
          } finally {
            setBusy(null);
          }
        }

        async function cancel(row: AgencyInvite) {
          setBusy(row.id);
          setError(null);
          try {
            await deleteInvite(row.id);
            reload();
          } catch (err) {
            console.error("Could not cancel the invitation:", err);
            setError("The invitation wasn't cancelled. Try again.");
          } finally {
            setBusy(null);
          }
        }

        async function confirmRemove() {
          if (!removing || !uid) return;
          setBusy(removing.uid);
          setError(null);
          try {
            await removeMember(uid, removing.uid);
            setNotice(`${removing.name} is no longer in ${agency.name}. Their listings and enquiries stay with them.`);
            setRemoving(null);
            reload();
          } catch (err) {
            console.error("Could not remove the agent:", err);
            setError("The agent wasn't removed. Try again.");
          } finally {
            setBusy(null);
          }
        }

        return (
          <>
            <PageHeading title="Team" description={`The agents of ${agency.name}. Invite an agent by the e-mail address they sign in with.`} />

            {notice ? <p role="status" className="mb-4 rounded-control border border-[var(--dash-line-2)] border-l-[3px] border-l-[var(--dash-d1)] bg-[var(--dash-card)] p-3.5 text-sm text-slate-800 dark:text-slate-200">{notice}</p> : null}
            {error ? <p role="alert" className={`mb-4 ${errorBoxClass}`}>{error}</p> : null}

            <SummaryStrip
              label="Team at a glance"
              items={[
                { label: "Agents", value: String(agents.length), note: "Including you" },
                { label: "Active listings", value: String(agents.reduce((n, a) => n + a.activeListings, 0)), note: "Published or under offer" },
                { label: "Enquiries, 30 days", value: String(agents.reduce((n, a) => n + a.enquiries30, 0)), note: "Across the team" },
                {
                  label: "Waiting for a reply",
                  value: String(agents.reduce((n, a) => n + a.waiting, 0)),
                  note: agents.some((a) => a.waiting > 0) ? "New, not yet answered" : "Nobody is waiting",
                  tone: agents.some((a) => a.waiting > 0) ? "late" : undefined,
                },
              ]}
            />

            <section aria-labelledby="agents-heading" className="mb-6">
              <h2 id="agents-heading" className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Agents</h2>
              <ul className="grid gap-4 md:grid-cols-2">
                {agents.map((a) => (
                  <li key={a.uid} className={`${panelClass} flex flex-col gap-4 text-sm`}>
                    <div className="flex items-start gap-3.5">
                      <Initials name={a.name} size={48} />
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-base font-semibold text-slate-900 dark:text-white">
                          {a.name}
                          {a.isPrincipal ? <AgeChip label="Principal · you" tone="neutral" /> : null}
                        </p>
                        <p className="mt-0.5 truncate text-slate-600 dark:text-slate-300">
                          {a.email ? <a href={`mailto:${a.email}`} className={linkClass}>{a.email}</a> : null}
                        </p>
                        {a.joinedAt ? (
                          <p className="text-xs text-slate-600 dark:text-slate-400">{a.isPrincipal ? "Registered" : "Joined"} {formatDate(a.joinedAt)}</p>
                        ) : null}
                      </div>
                      {!a.isPrincipal ? (
                        <button type="button" disabled={busy === a.uid} onClick={() => setRemoving({ uid: a.uid, name: a.name })} className={secondaryButtonClass}>
                          Remove<span className="sr-only"> {a.name}</span>
                        </button>
                      ) : null}
                    </div>
                    <dl className="grid grid-cols-4 gap-2 border-t border-[var(--dash-line)] pt-4">
                      {[
                        { label: "Active listings", value: String(a.activeListings) },
                        { label: "Enquiries, 30 d", value: String(a.enquiries30) },
                        { label: "Waiting", value: String(a.waiting), late: a.waiting > 0 },
                        { label: "Median reply", value: a.reply ? formatAge(new Date(0), a.reply.ms) : "–" },
                      ].map((m) => (
                        <div key={m.label} className="flex min-w-0 flex-col-reverse">
                          <dt className="text-xs text-slate-600 dark:text-slate-400">{m.label}</dt>
                          <dd className={`text-lg font-semibold tabular-nums ${m.late ? "text-[var(--dash-down)]" : "text-slate-900 dark:text-white"}`}>{m.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="invite-heading" className={panelClass}>
              <h2 id="invite-heading" className="text-base font-semibold text-slate-900 dark:text-white">Invite an agent</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-700 dark:text-slate-300">
                No e-mail goes out yet. The agent sees the invitation on their profile once they sign in with this address, and must
                hold the agent role on Dynasty to accept.
              </p>
              <form noValidate onSubmit={invite} className="mt-4 flex flex-wrap items-start gap-3">
                <div className="w-full max-w-sm">
                  <label htmlFor={emailId} className="mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200">Agent&rsquo;s e-mail</label>
                  <input
                    id={emailId}
                    type="email"
                    autoComplete="off"
                    value={email}
                    maxLength={254}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    onBlur={(e) => e.target.value && setEmailError(check(e.target.value))}
                    aria-invalid={emailError ? true : undefined}
                    aria-describedby={emailError ? `${emailId}-error` : undefined}
                    className={inputClass}
                  />
                  {emailError ? <p id={`${emailId}-error`} className="mt-1 text-sm text-rose-700 dark:text-rose-300">{emailError}</p> : null}
                </div>
                <button type="submit" disabled={busy === "invite"} className={`${primaryButtonClass} sm:mt-7`}>
                  {busy === "invite" ? "Saving…" : "Send invitation"}
                </button>
              </form>

              <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-400">Open invitations</h3>
              {invites.length === 0 ? (
                <p className={`mt-2 ${emptyBoxClass}`}>No open invitations.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {invites.map((row) => (
                    <li key={row.id} className={`${rowClass} flex flex-wrap items-center justify-between gap-3 text-sm`}>
                      <span>
                        <span className="font-semibold text-slate-900 dark:text-white">{row.email}</span>
                        {row.invitedAt ? <span className="text-slate-600 dark:text-slate-400"> · invited {formatDate(row.invitedAt)}</span> : null}
                      </span>
                      <button type="button" disabled={busy === row.id} onClick={() => void cancel(row)} className={secondaryButtonClass}>
                        {busy === row.id ? "Cancelling…" : "Cancel invitation"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <ConfirmDialog
              open={Boolean(removing)}
              title={`Remove ${removing?.name ?? "this agent"} from ${agency.name}?`}
              body="You'll stop seeing their listings, enquiries and figures. Enquiries you handed to them stay with them until you hand them to someone else. They can rejoin only with a new invitation."
              confirmLabel="Remove agent"
              busy={Boolean(removing && busy === removing.uid)}
              onConfirm={() => void confirmRemove()}
              onCancel={() => setRemoving(null)}
            />
          </>
        );
      }}
    </AgencyGate>
  );
}
