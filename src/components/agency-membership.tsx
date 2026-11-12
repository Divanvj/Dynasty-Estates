"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { ConfirmDialog, errorBoxClass, linkClass, panelClass, primaryButtonClass, rowClass, secondaryButtonClass } from "@/components/dashboard-ui";
import { acceptInvite, deleteInvite, getMemberships, getMyInvites, getOwnAgency, removeMember, type Agency, type AgencyInvite, type AgencyMember } from "@/lib/agency";
import { formatDate } from "@/lib/formatters";
import { getPractitioner } from "@/lib/practitioners";

/**
 * The agent's side of an agency (PLAN.md Phase G), on /agent/profile:
 * invitations to accept or decline, the agency they belong to (and leaving
 * it), or the agency they run. The dashboard uses useAgencyInvites to show
 * an open invitation in "Needs you today".
 */

export function useAgencyInvites(email: string | null | undefined) {
  const [loaded, setLoaded] = useState<{ email: string; invites: AgencyInvite[] } | null>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    getMyInvites(email)
      .then((invites) => !cancelled && setLoaded({ email, invites }))
      .catch((error) => {
        console.error("Could not load agency invitations:", error);
        if (!cancelled) setLoaded({ email, invites: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [email, version]);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { invites: email && loaded?.email === email ? loaded.invites : null, reload };
}

type State = { loading: true } | { loading: false; failed: boolean; own: Agency | null; memberships: { member: AgencyMember; agency: Agency | null }[] };

export function AgencyMembership({ uid }: { uid: string | null | undefined }) {
  const { user } = useAuth();
  const { invites, reload: reloadInvites } = useAgencyInvites(user?.email);
  const [state, setState] = useState<State>({ loading: true });
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<{ principalUid: string; name: string } | null>(null);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    Promise.all([getOwnAgency(uid), getMemberships(uid)])
      .then(([own, memberships]) => !cancelled && setState({ loading: false, failed: false, own, memberships }))
      .catch((err) => {
        console.error("Could not load agency membership:", err);
        if (!cancelled) setState({ loading: false, failed: true, own: null, memberships: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [uid, version]);

  const refresh = () => {
    setVersion((v) => v + 1);
    reloadInvites();
  };

  async function accept(invite: AgencyInvite) {
    if (!uid || !user?.email) return;
    setBusy(invite.id);
    setError(null);
    try {
      const me = await getPractitioner(uid).catch(() => null);
      await acceptInvite(invite, uid, me?.fullName || user.displayName || user.email, user.email);
      refresh();
    } catch (err) {
      console.error("Could not accept the invitation:", err);
      setError("You weren't added to the agency. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  async function decline(invite: AgencyInvite) {
    setBusy(invite.id);
    setError(null);
    try {
      await deleteInvite(invite.id);
      refresh();
    } catch (err) {
      console.error("Could not decline the invitation:", err);
      setError("The invitation wasn't declined. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function confirmLeave() {
    if (!leaving || !uid) return;
    setBusy("leave");
    setError(null);
    try {
      await removeMember(leaving.principalUid, uid);
      setLeaving(null);
      refresh();
    } catch (err) {
      console.error("Could not leave the agency:", err);
      setError("You're still in the agency. Try again.");
    } finally {
      setBusy(null);
    }
  }

  if (!uid || state.loading || invites === null) {
    return <p role="status" className="mt-6 text-sm text-slate-600 dark:text-slate-300">Loading your agency…</p>;
  }

  const joinedIds = new Set(state.memberships.map((m) => m.member.principalUid));
  const open = invites.filter((i) => !joinedIds.has(i.principalUid));

  return (
    <section aria-labelledby="agency-heading" className={`mt-6 ${panelClass}`}>
      <h2 id="agency-heading" className="text-2xl font-semibold text-slate-900 dark:text-white">Agency</h2>
      {error ? <p role="alert" className={`mt-3 ${errorBoxClass}`}>{error}</p> : null}
      {state.failed ? <p role="alert" className={`mt-3 ${errorBoxClass}`}>Your agency couldn&rsquo;t be loaded. Refresh the page.</p> : null}

      {open.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {open.map((invite) => (
            <li key={invite.id} className={`${rowClass} border-l-4 border-l-emerald-600 text-sm dark:border-l-emerald-400`}>
              <p className="text-base font-semibold text-slate-900 dark:text-white">{invite.agencyName} invited you to join</p>
              <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                The principal will see your listings, enquiries and reply times, and may hand enquiries to you.
                {invite.invitedAt ? ` Invited ${formatDate(invite.invitedAt)}.` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={busy === invite.id} onClick={() => void accept(invite)} className={primaryButtonClass}>
                  {busy === invite.id ? "Saving…" : `Join ${invite.agencyName}`}
                </button>
                <button type="button" disabled={busy === invite.id} onClick={() => void decline(invite)} className={secondaryButtonClass}>
                  Decline
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {state.own ? (
        <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
          You&rsquo;re the principal of <strong className="text-slate-900 dark:text-white">{state.own.name}</strong>.{" "}
          <Link href="/agency" className={linkClass}>Open the agency view</Link>
        </p>
      ) : null}

      {state.memberships.map(({ member, agency }) => (
        <div key={member.id} className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-700 dark:text-slate-300">
          <p>
            You&rsquo;re an agent at <strong className="text-slate-900 dark:text-white">{agency?.name ?? "an agency"}</strong>
            {member.joinedAt ? ` since ${formatDate(member.joinedAt)}` : ""}.
          </p>
          <button type="button" onClick={() => setLeaving({ principalUid: member.principalUid, name: agency?.name ?? "the agency" })} className={secondaryButtonClass}>
            Leave agency
          </button>
        </div>
      ))}

      {!state.own && state.memberships.length === 0 && open.length === 0 ? (
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
          You&rsquo;re not part of an agency. Invitations from a principal appear here.{" "}
          <Link href="/agency" className={linkClass}>Register your own agency</Link>
        </p>
      ) : null}

      <ConfirmDialog
        open={Boolean(leaving)}
        title={`Leave ${leaving?.name ?? "the agency"}?`}
        body="The principal stops seeing your listings, enquiries and figures. Enquiries they handed to you stay in your inbox. You can rejoin only with a new invitation."
        confirmLabel="Leave agency"
        busy={busy === "leave"}
        onConfirm={() => void confirmLeave()}
        onCancel={() => setLeaving(null)}
      />
    </section>
  );
}
