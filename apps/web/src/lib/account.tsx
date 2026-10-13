"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { AccountData } from "./account-types";
interface AccountContext {
  demo: boolean;
  userId: string | null;
  data: AccountData | null;
  loading: boolean;
  busy: boolean;
  error: string;
  refresh: () => Promise<void>;
  mutate: (kind: string, body: unknown, method?: string) => Promise<boolean>;
  request: <T>(path: string, body?: unknown, method?: string) => Promise<T>;
}
const Context = createContext<AccountContext | null>(null);
export async function api<T>(
  path: string,
  body?: unknown,
  method = body === undefined ? "GET" : "POST",
): Promise<T> {
  const response = await fetch(path, {
    method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  let value;
  try {
    value = await response.json();
  } catch {
    throw new Error("Service unavailable. Try again.");
  }
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "Session expired. Sign in again."
        : (value.error ?? "Unable to save. Try again."),
    );
  return value as T;
}
export function AccountProvider({
  demo,
  userId,
  children,
}: {
  demo: boolean;
  userId: string | null;
  children: ReactNode;
}) {
  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(!demo && !!userId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    if (demo || !userId) return;
    setLoading(true);
    try {
      setData(await api<AccountData>("/api/account"));
      setError("");
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : "Unable to load account.");
    } finally {
      setLoading(false);
    }
  }, [demo, userId]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  async function mutate(kind: string, body: unknown, method = "POST") {
    if (busy) return false;
    setBusy(true);
    setError("");
    try {
      await api("/api/data/" + kind, body, method);
      await refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  const request = useCallback(
    async <T,>(path: string, body?: unknown, method?: string): Promise<T> => {
      try {
        return await api<T>(path, body, method);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request failed.");
        throw e;
      }
    },
    [],
  );
  return (
    <Context.Provider
      value={{
        demo,
        userId,
        data,
        loading,
        busy,
        error,
        refresh,
        mutate,
        request,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAccount() {
  const value = useContext(Context);
  if (!value) throw new Error("AccountProvider required");
  return value;
}
