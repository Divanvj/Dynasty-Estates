"use client";

import { useId, useState } from "react";

import { AgencyGate } from "@/components/agency-gate";
import { useAgencyTeam } from "@/components/agency-team";
import {
  ConfirmDialog,
  emptyBoxClass,
  errorBoxClass,
  linkClass,
  PageHeading,
  panelClass,
  primaryButtonClass,
  rowClass,
  secondaryButtonClass,
} from "@/components/dashboard-ui";
import { deleteInvite, EMAIL_PATTERN, inviteAgent, removeMember, type AgencyInvite } from "@/lib/agency";
import { formatDate } from "@/lib/formatters";
import { useAccountUid } from "@/lib/use-owner-listings";

// Pattern 1 — List (docs/dashboards/PLAN.md, Phase G). The agency's agents,
// the invitations still open, and the form to invite another. No e-mail is
// sent yet: the invited agent sees the invitation on their profile.

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none aria-[invalid=true]:border-rose-500 dark:border-white/10 dark:bg-surface-ink dark:text-white";

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

            {notice ? <p role="status" className="mb-4 rounded-control border border-emerald-400/40 bg-emerald-50 p-3.5 text-sm text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-200">{notice}</p> : null}
            {error ? <p role="alert" className={`mb-4 ${errorBoxClass}`}>{error}</p> : null}

            <section aria-labelledby="agents-heading" className={`mb-6 ${panelClass}`}>
              <h2 id="agents-heading" className="mb-4 text-2xl font-semibold text-slate-900 dark:text-white">Agents</h2>
              <ul className="space-y-3">
                {agents.map((a) => (
                  <li key={a.uid} className={`${rowClass} flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm`}>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-slate-900 dark:text-white">
                        {a.name}
                        {a.isPrincipal ? <span className="ml-2 text-xs font-normal text-slate-600 dark:text-slate-400">Principal (you)</span> : null}
                      </p>
                      <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                        {a.email ? <a href={`mailto:${a.email}`} className={linkClass}>{a.email}</a> : null}
                        {a.joinedAt ? ` · ${a.isPrincipal ? "Registered" : "Joined"} ${formatDate(a.joinedAt)}` : ""}
                        {` · ${a.activeListings} active ${a.activeListings === 1 ? "listing" : "listings"}`}
                      </p>
                    </div>
                    {!a.isPrincipal ? (
                      <button type="button" disabled={busy === a.uid} onClick={() => setRemoving({ uid: a.uid, name: a.name })} className={secondaryButtonClass}>
                        Remove
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="invite-heading" className={panelClass}>
              <h2 id="invite-heading" className="text-2xl font-semibold text-slate-900 dark:text-white">Invite an agent</h2>
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

              <h3 className="mt-6 text-sm font-bold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-400">Open invitations</h3>
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
