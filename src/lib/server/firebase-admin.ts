import { readFileSync } from "node:fs";
import path from "node:path";

import { cert, getApp, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getSecurityRules } from "firebase-admin/security-rules";

/**
 * The Admin SDK, for server route handlers only (the developer console and the
 * telemetry endpoints). It bypasses Firestore rules entirely, so every route that
 * uses it must decide for itself who may call it — see console-auth.ts.
 *
 * Credentials, in order:
 *   FIREBASE_SERVICE_ACCOUNT       the key JSON itself, raw or base64 (Vercel)
 *   FIREBASE_SERVICE_ACCOUNT_PATH  a path to the key file (local .env.local)
 *
 * Nothing is thrown at import time. A deployment without a key still serves the
 * site; the console reports "not connected" instead of a 500 on every page.
 */

export const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dynasty-estates";

type KeyFile = ServiceAccount & { project_id?: string; client_email?: string; private_key?: string };

function readServiceAccount(): KeyFile | null {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (inline) {
    const json = inline.startsWith("{") ? inline : Buffer.from(inline, "base64").toString("utf8");
    return JSON.parse(json) as KeyFile;
  }
  const file = process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();
  if (file) {
    return JSON.parse(readFileSync(path.resolve(process.cwd(), file), "utf8")) as KeyFile;
  }
  return null;
}

let cached: App | null | undefined;
let configError: string | null = null;

/** The admin app, or null when no key is configured or the key is unreadable. */
export function adminApp(): App | null {
  if (cached !== undefined) return cached;
  try {
    const key = readServiceAccount();
    if (!key) {
      configError = "No service-account key. Set FIREBASE_SERVICE_ACCOUNT (Vercel) or FIREBASE_SERVICE_ACCOUNT_PATH (local).";
      cached = null;
      return null;
    }
    const name = "dynasty-console";
    cached = getApps().some((a) => a.name === name)
      ? getApp(name)
      : initializeApp(
          {
            credential: cert({
              projectId: key.project_id ?? key.projectId,
              clientEmail: key.client_email ?? key.clientEmail,
              privateKey: (key.private_key ?? key.privateKey)?.replace(/\\n/g, "\n"),
            }),
            projectId: key.project_id ?? PROJECT_ID,
          },
          name,
        );
  } catch (error) {
    configError = `Service-account key could not be read: ${error instanceof Error ? error.message : String(error)}`;
    cached = null;
  }
  return cached;
}

export function adminConfigError(): string | null {
  adminApp();
  return configError;
}

export class AdminUnavailableError extends Error {
  constructor() {
    super(adminConfigError() ?? "Admin SDK unavailable.");
    this.name = "AdminUnavailableError";
  }
}

function requireApp(): App {
  const app = adminApp();
  if (!app) throw new AdminUnavailableError();
  return app;
}

export const adminAuth = () => getAuth(requireApp());
export const adminDb = () => getFirestore(requireApp());
// Every service must be bound to the named app: the no-argument getters look
// for the default app, which this module never creates.
export const adminRules = () => getSecurityRules(requireApp());

/** An OAuth token for Google REST APIs the Admin SDK does not wrap. */
export async function googleAccessToken(): Promise<string> {
  const credential = requireApp().options.credential;
  if (!credential) throw new AdminUnavailableError();
  return (await credential.getAccessToken()).access_token;
}

/** GET a Google REST API with the service account. Never throws on HTTP status. */
export async function googleApi<T = unknown>(
  url: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: T | null; error: string | null }> {
  try {
    const token = await googleAccessToken();
    const response = await fetch(url, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    const text = await response.text();
    const data = text ? (JSON.parse(text) as T) : null;
    const error = response.ok
      ? null
      : ((data as { error?: { message?: string } } | null)?.error?.message ?? `HTTP ${response.status}`);
    return { ok: response.ok, status: response.status, data, error };
  } catch (error) {
    return { ok: false, status: 0, data: null, error: error instanceof Error ? error.message : String(error) };
  }
}
