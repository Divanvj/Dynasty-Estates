"use client";

import type { User } from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/** Who is using the console, as confirmed by /api/console/me (server-checked claim). */
export type ConsoleCaller = { uid: string; email: string | null; role: "developer" | "admin" };
export type BuildInfo = { sha: string; builtAt: string | null; env: string };

type ConsoleContextValue = {
  user: User;
  caller: ConsoleCaller;
  build: BuildInfo;
};

const ConsoleContext = createContext<ConsoleContextValue | null>(null);

export const ConsoleProvider = ConsoleContext.Provider;

export function useConsole(): ConsoleContextValue {
  const value = useContext(ConsoleContext);
  if (!value) throw new Error("useConsole must be used inside the console shell.");
  return value;
}

export class ConsoleRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public notConnected = false,
  ) {
    super(message);
  }
}

/** fetch() with the caller's Firebase ID token. Throws ConsoleRequestError on a non-2xx. */
export async function consoleFetch(user: User, path: string, init: RequestInit = {}): Promise<Response> {
  const token = await user.getIdToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init.body && typeof init.body === "string" ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    let notConnected = false;
    try {
      const body = (await response.json()) as { error?: string; notConnected?: boolean };
      message = body.error ?? message;
      notConnected = body.notConnected === true;
    } catch {
      // Not JSON; keep the status message.
    }
    throw new ConsoleRequestError(message, response.status, notConnected);
  }
  return response;
}

export async function consoleJson<T>(user: User, path: string, init?: RequestInit): Promise<T> {
  return (await consoleFetch(user, path, init)).json() as Promise<T>;
}

/**
 * Loads a console endpoint. `refresh()` reloads it; the previous data stays on
 * screen while a refresh runs, so numbers do not blank out and jump back.
 */
export function useConsoleData<T>(path: string | null) {
  const { user } = useConsole();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ConsoleRequestError | null>(null);
  const [loading, setLoading] = useState(path !== null);
  const [loadedAt, setLoadedAt] = useState<number | null>(null);
  const request = useRef(0);

  const load = useCallback(async () => {
    if (!path) return;
    const id = ++request.current;
    setLoading(true);
    try {
      const body = await consoleJson<T>(user, path);
      if (id !== request.current) return;
      setData(body);
      setError(null);
      setLoadedAt(Date.now());
    } catch (err) {
      if (id !== request.current) return;
      setError(err instanceof ConsoleRequestError ? err : new ConsoleRequestError(String(err), 0));
    } finally {
      if (id === request.current) setLoading(false);
    }
  }, [path, user]);

  useEffect(() => {
    // Fetching on mount and on path change is the point of this hook.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  return { data, error, loading, loadedAt, refresh: load, setData };
}

// ---------------------------------------------------------------- formatting

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function timeAgo(value: string | number | null | undefined): string {
  if (value == null) return "never";
  const ms = typeof value === "number" ? value : Date.parse(value);
  if (Number.isNaN(ms)) return "unknown";
  const seconds = Math.round((ms - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return "just now";
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.round(seconds / 3600), "hour");
  if (abs < 30 * 86_400) return rtf.format(Math.round(seconds / 86_400), "day");
  return new Date(ms).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

export function dateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return "—";
  return new Date(ms).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const formatInt = (n: number | null | undefined) => (n == null ? "—" : new Intl.NumberFormat("en-ZA").format(n));

export const shortSha = (sha: string | null | undefined) => (sha && sha !== "unknown" ? sha.slice(0, 7) : "unknown");
