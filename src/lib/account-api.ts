import { auth } from "./firebase";

/**
 * Calls one of the signed-in person's own API routes (/api/email/preferences,
 * /api/saved-searches) with their ID token, and turns a refusal into an Error
 * carrying the server's message.
 */
export async function accountApi<T>(path: string, init: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown } = {}): Promise<T> {
  const user = auth?.currentUser;
  if (!user) throw new Error("Sign in first.");
  const token = await user.getIdToken();
  const response = await fetch(path, {
    method: init.method ?? "GET",
    headers: { Authorization: `Bearer ${token}`, ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}) },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  const data = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "That didn't work. Try again in a moment.");
  return data;
}

export type SavedSearchRow = {
  id: string;
  label: string;
  query: string;
  alerts: boolean;
  createdAt: string;
  lastCheckedAt: string;
  lastAlertAt: string | null;
};
