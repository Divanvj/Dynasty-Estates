"use client";

import { useState } from "react";

import { ConsoleRequestError, consoleJson, dateTime, useConsole, useConsoleData } from "../_lib/console-client";
import { Button, Empty, ErrorNotice, Facts, PageHeader, Panel, Pill, RefreshButton, SkeletonRows, StateBadge } from "../_components/ui";

type Setup = { provider: string | null; fromEmail: string | null; fromName: string; alertsTo: string[]; ready: boolean };
type LogRow = { id: string; kind: string; to: string; subject: string; ref: string | null; status: "sent" | "skipped" | "failed"; provider: string | null; detail: string | null; at: string };
type EmailResponse = { setup: Setup; log: LogRow[] };
type TestResult = { result: { status: string; reason?: string; error?: string; messageId?: string | null } };

const KIND: Record<string, string> = {
  enquiry: "New enquiry",
  agency_invite: "Agency invitation",
  ops_alert: "Nightly alert",
  weekly_report: "Weekly report",
  saved_search: "Saved-search alert",
  verify_email: "Confirm e-mail address",
  test: "Test",
};

type RunResult = { run: { emailed: number; skipped: number; failed: number; owners?: number; searches?: number } };

export default function EmailPage() {
  const { user, caller } = useConsole();
  const { data, error, loading, refresh, loadedAt } = useConsoleData<EmailResponse>("/api/console/email");
  const [sending, setSending] = useState(false);
  const [testError, setTestError] = useState<ConsoleRequestError | null>(null);
  const [testOutcome, setTestOutcome] = useState<string | null>(null);

  async function sendTest(to: "me" | "alerts") {
    setSending(true);
    setTestError(null);
    setTestOutcome(null);
    try {
      const { result } = await consoleJson<TestResult>(user, "/api/console/email", { method: "POST", body: JSON.stringify({ to }) });
      const where = to === "alerts" ? (data?.setup.alertsTo.join(", ") ?? "the alerts address") : caller.email;
      setTestOutcome(
        result.status === "sent"
          ? `Sent to ${where}. Check that inbox (and its spam folder).`
          : result.status === "skipped"
            ? `Not sent: ${result.reason}`
            : `Failed: ${result.error}`,
      );
      refresh();
    } catch (err) {
      setTestError(err as ConsoleRequestError);
    } finally {
      setSending(false);
    }
  }

  async function runMine(action: "weekly_report" | "saved_search_alerts") {
    setSending(true);
    setTestError(null);
    setTestOutcome(null);
    try {
      const { run } = await consoleJson<RunResult>(user, "/api/console/email", { method: "POST", body: JSON.stringify({ action }) });
      const none =
        action === "weekly_report"
          ? "Nothing to send: this account has no live listings."
          : "Nothing to send: none of this account's saved searches (with alerts on) has a new match since it was last checked.";
      setTestOutcome(
        run.emailed + run.skipped + run.failed === 0
          ? none
          : `${run.emailed} sent, ${run.skipped} skipped, ${run.failed} failed. The row below says why anything was skipped.`,
      );
      refresh();
    } catch (err) {
      setTestError(err as ConsoleRequestError);
    } finally {
      setSending(false);
    }
  }

  const setup = data?.setup;

  return (
    <>
      <PageHeader
        title="E-mail"
        description="E-mails the site sends: new-enquiry alerts and Monday listing reports to agents and sellers, saved-search alerts to buyers, agency invitations, and nightly-job failure alerts. Each kind has a switch under Site switches; people turn off their own on /alerts."
        actions={<RefreshButton onClick={refresh} loading={loading} loadedAt={loadedAt} />}
      />
      {error ? <ErrorNotice error={error} onRetry={refresh} /> : null}

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Panel
          title="Set-up"
          description="Set in the server's environment variables (Vercel, and .env.local for local runs). Keys are never shown."
          actions={setup ? <StateBadge state={setup.ready ? "ok" : "error"} label={setup.ready ? "Ready" : "Not set up"} /> : null}
        >
          {!setup ? (
            <SkeletonRows rows={4} />
          ) : (
            <Facts
              rows={[
                ["Provider", setup.provider ? <Pill tone="brand">{setup.provider}</Pill> : "None: set BREVO_API_KEY (or RESEND_API_KEY)"],
                ["Sender", setup.fromEmail ? `${setup.fromName} <${setup.fromEmail}>` : "MAIL_FROM_EMAIL not set"],
                ["Nightly alerts to", setup.alertsTo.length ? setup.alertsTo.join(", ") : "MAIL_ALERTS_TO not set (no alerts sent)"],
              ]}
            />
          )}
        </Panel>
        <Panel title="Send a test" description={`Sends one e-mail through the configured provider, to ${caller.email ?? "your account"} or to the nightly-alerts address.`}>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => void sendTest("me")} loading={sending} disabled={!caller.email}>
              Send me a test e-mail
            </Button>
            {setup?.alertsTo.length ? (
              <Button onClick={() => void sendTest("alerts")} disabled={sending}>
                Send to the alerts address
              </Button>
            ) : null}
          </div>
          <p className="mt-4 text-xs text-[var(--ink-muted)]">The scheduled e-mails, for your own account only:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button onClick={() => void runMine("weekly_report")} disabled={sending}>
              Send me my weekly report
            </Button>
            <Button onClick={() => void runMine("saved_search_alerts")} disabled={sending}>
              Run my saved-search alerts
            </Button>
          </div>
          {testOutcome ? (
            <p role="status" className="mt-3 text-xs text-[var(--ink)]">
              {testOutcome}
            </p>
          ) : null}
          {testError ? (
            <div className="mt-3">
              <ErrorNotice error={testError} />
            </div>
          ) : null}
        </Panel>
      </div>

      <Panel title="Recent e-mails" description="The last 50 attempts, newest first. Recipients are partly hidden.">
        {!data ? (
          <SkeletonRows rows={5} />
        ) : data.log.length === 0 ? (
          <Empty title="No e-mails yet">Nothing has been sent or attempted.</Empty>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {data.log.map((row) => (
              <li key={row.id} className="flex flex-wrap items-start justify-between gap-2 py-3 text-xs">
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--ink)]">{row.subject}</p>
                  <p className="mt-0.5 text-[var(--ink-subtle)]">
                    {KIND[row.kind] ?? row.kind} · to {row.to} · {dateTime(row.at)}
                    {row.provider ? ` · ${row.provider}` : ""}
                  </p>
                  {row.status !== "sent" && row.detail ? <p className="mt-0.5 text-[var(--ink-subtle)]">{row.detail}</p> : null}
                </div>
                <StateBadge state={row.status === "sent" ? "ok" : row.status === "skipped" ? "warning" : "error"} label={row.status === "sent" ? "Sent" : row.status === "skipped" ? "Skipped" : "Failed"} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
