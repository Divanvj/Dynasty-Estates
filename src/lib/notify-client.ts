import { auth } from "./firebase";

/**
 * Asks the server to e-mail about a record the signed-in user just saved
 * (see src/lib/server/notify.ts). Fire-and-forget: the record is already
 * saved, so a failed e-mail must never turn the user's action into an error.
 * The outcome is logged on the server (mail_log, /console/email).
 */
export function requestNotification(path: "/api/notify/enquiry" | "/api/notify/agency-invite", body: Record<string, string>): void {
  const user = auth?.currentUser;
  if (!user) return;
  void user
    .getIdToken()
    .then((token) =>
      fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
        keepalive: true,
      }),
    )
    .catch((error) => console.warn("[notify] request failed:", error));
}
