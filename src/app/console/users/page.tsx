"use client";

import { useMemo, useState } from "react";

import { ConsoleRequestError, consoleJson, dateTime, timeAgo, useConsole, useConsoleData } from "../_lib/console-client";
import type { ConsoleUser } from "../_lib/types";
import { Button, Empty, ErrorNotice, PageHeader, Panel, Pill, RefreshButton, SkeletonRows, StateBadge, cx } from "../_components/ui";

const ROLES = ["buyer", "seller", "agent", "admin", "developer"] as const;

type Pending = { uid: string; kind: "role"; role: string } | { uid: string; kind: "disable" | "enable" | "revoke" };

export default function UsersPage() {
  const { user: me, caller } = useConsole();
  const { data, error, loading, refresh, loadedAt } = useConsoleData<{ users: ConsoleUser[] }>("/api/console/users");
  const [query, setQuery] = useState("");
  const [roleDraft, setRoleDraft] = useState<Record<string, string>>({});
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<ConsoleRequestError | null>(null);

  const users = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = data?.users ?? [];
    return q
      ? all.filter((u) => `${u.email ?? ""} ${u.phone ?? ""} ${u.displayName ?? ""} ${u.uid} ${u.role ?? ""}`.toLowerCase().includes(q))
      : all;
  }, [data, query]);

  const testAccounts = (data?.users ?? []).filter((u) => u.testAccount);

  async function apply(action: Pending) {
    setBusy(true);
    setActionError(null);
    setMessage(null);
    try {
      const body =
        action.kind === "role"
          ? { action: "setRole", uid: action.uid, role: action.role }
          : action.kind === "revoke"
            ? { action: "revokeSessions", uid: action.uid }
            : { action: "setDisabled", uid: action.uid, disabled: action.kind === "disable" };
      const result = await consoleJson<{ note?: string }>(me, "/api/console/users", { method: "PATCH", body: JSON.stringify(body) });
      setMessage(result.note ?? "Done. The change is recorded in the event log.");
      setPending(null);
      setRoleDraft((d) => {
        const next = { ...d };
        delete next[action.uid];
        return next;
      });
      await refresh();
    } catch (err) {
      setActionError(err as ConsoleRequestError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Users and roles"
        description="Every Firebase Auth account with its role claim, sign-in method and last sign-in. Role changes set the claim the security rules enforce and update the profile mirror; each one is logged."
        actions={<RefreshButton onClick={refresh} loading={loading} loadedAt={loadedAt} />}
      />

      {error ? <ErrorNotice error={error} onRetry={refresh} /> : null}

      {testAccounts.length ? (
        <Panel className="mb-6" title="Test accounts" description="The four role logins used for testing. Passwords live in TEST_ACCOUNTS.md (not in git).">
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {testAccounts.map((u) => {
              const healthy = u.role === u.expectedTestRole && !u.disabled && u.hasProfile;
              return (
                <li key={u.uid} className="rounded-xl border border-white/[0.06] bg-black/20 p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold capitalize text-[var(--ink)]">{u.expectedTestRole}</span>
                    <StateBadge state={healthy ? "ok" : "warning"} label={healthy ? "Ready" : "Check"} />
                  </div>
                  <p className="mt-1 truncate text-[var(--ink-subtle)]">{u.email}</p>
                  <p className="mt-1 text-[var(--ink-subtle)]">Last sign-in {timeAgo(u.lastSignInAt)}</p>
                  {!healthy ? (
                    <p className="mt-1 text-amber-200">
                      {u.role !== u.expectedTestRole ? `Claim is ${u.role ?? "missing"}, expected ${u.expectedTestRole}. ` : ""}
                      {u.disabled ? "Disabled. " : ""}
                      {!u.hasProfile ? "No profile document." : ""}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Panel>
      ) : null}

      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative w-full sm:max-w-sm">
          <span className="sr-only">Find an account</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find by email, phone, name, uid or role"
            className="min-h-9 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-xs text-[var(--ink)] placeholder:text-[var(--ink-subtle)] focus:border-[var(--brand)]/60 focus:outline-none"
          />
        </label>
        <span className="text-xs text-[var(--ink-subtle)] tabular-nums">{data ? `${users.length} of ${data.users.length} accounts` : ""}</span>
      </div>

      {message ? <p className="mb-3 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2 text-xs text-emerald-200">{message}</p> : null}
      {actionError ? (
        <div className="mb-3">
          <ErrorNotice error={actionError} />
        </div>
      ) : null}

      {!data && loading ? (
        <SkeletonRows rows={6} />
      ) : users.length === 0 ? (
        <Empty title="No matching accounts" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-white/[0.07] bg-[#0a1517]">
          <table className="w-full min-w-[880px] text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-[var(--ink-subtle)]">
                <th scope="col" className="px-4 py-2.5 font-medium">Account</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Role claim</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Sign-in</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Created</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Last sign-in</th>
                <th scope="col" className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const self = u.uid === caller.uid;
                const draft = roleDraft[u.uid] ?? u.role ?? "buyer";
                const roleChanged = draft !== (u.role ?? "buyer");
                const developerLocked = (draft === "developer" || u.role === "developer") && caller.role !== "developer";
                const confirming = pending?.uid === u.uid ? pending : null;
                return (
                  <tr key={u.uid} className={cx("border-b border-white/[0.04] align-top last:border-0", u.disabled && "opacity-60")}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[var(--ink)]">
                        {u.email ?? u.phone ?? "no email"} {self ? <Pill tone="brand">you</Pill> : null}
                      </p>
                      <p className="mt-0.5 text-[var(--ink-subtle)]">{u.displayName ?? "no name"}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {u.disabled ? <Pill tone="bad">disabled</Pill> : null}
                        {!u.hasProfile ? <Pill tone="warn">no profile</Pill> : null}
                        {u.email && !u.emailVerified ? <Pill>email unverified</Pill> : null}
                        {u.profileRole && u.profileRole !== (u.role ?? "buyer") ? <Pill tone="warn">profile says {u.profileRole}</Pill> : null}
                        {u.testAccount ? <Pill>test account</Pill> : null}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <label className="sr-only" htmlFor={`role-${u.uid}`}>
                        Role for {u.email ?? u.uid}
                      </label>
                      <select
                        id={`role-${u.uid}`}
                        value={draft}
                        disabled={self || busy}
                        onChange={(e) => {
                          setRoleDraft((d) => ({ ...d, [u.uid]: e.target.value }));
                          setPending(null);
                        }}
                        className="min-h-9 cursor-pointer rounded-lg border border-white/10 bg-black/30 px-2 text-xs capitalize text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                            {r === "buyer" && !u.role ? " (no claim)" : ""}
                          </option>
                        ))}
                      </select>
                      {roleChanged ? (
                        <div className="mt-2 flex flex-col gap-1.5">
                          {developerLocked ? (
                            <p className="text-amber-200">Only a developer can grant or remove the developer role.</p>
                          ) : confirming?.kind === "role" ? (
                            <div className="flex gap-1.5">
                              <Button variant="primary" loading={busy} onClick={() => void apply(confirming)}>
                                Confirm {draft}
                              </Button>
                              <Button variant="ghost" onClick={() => setPending(null)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button onClick={() => setPending({ uid: u.uid, kind: "role", role: draft })}>Apply</Button>
                          )}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-3 text-[var(--ink-muted)]">{u.providers.join(", ") || "none"}</td>
                    <td className="px-3 py-3 text-[var(--ink-muted)]" title={dateTime(u.createdAt)}>
                      {timeAgo(u.createdAt)}
                    </td>
                    <td className="px-3 py-3 text-[var(--ink-muted)]" title={dateTime(u.lastSignInAt)}>
                      {timeAgo(u.lastSignInAt)}
                    </td>
                    <td className="px-4 py-3">
                      {confirming && confirming.kind !== "role" ? (
                        <div className="flex flex-col items-end gap-1.5">
                          <p className="text-right text-[var(--ink-muted)]">
                            {confirming.kind === "revoke"
                              ? "Sign this account out on every device?"
                              : confirming.kind === "disable"
                                ? "Disable sign-in for this account?"
                                : "Allow this account to sign in again?"}
                          </p>
                          <div className="flex gap-1.5">
                            <Button variant={confirming.kind === "disable" ? "danger" : "primary"} loading={busy} onClick={() => void apply(confirming)}>
                              Confirm
                            </Button>
                            <Button variant="ghost" onClick={() => setPending(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1.5">
                          <Button variant="ghost" disabled={busy} onClick={() => setPending({ uid: u.uid, kind: "revoke" })}>
                            Sign out
                          </Button>
                          {!self ? (
                            <Button
                              variant={u.disabled ? "secondary" : "ghost"}
                              disabled={busy}
                              onClick={() => setPending({ uid: u.uid, kind: u.disabled ? "enable" : "disable" })}
                              className={u.disabled ? undefined : "text-rose-300 hover:text-rose-200"}
                            >
                              {u.disabled ? "Enable" : "Disable"}
                            </Button>
                          ) : null}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
