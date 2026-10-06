// Picks the platform backend.
// - VITE_PLATFORM_BACKEND_ENABLED === "true": real backend from src/platform/api.ts (Forge-owned).
//   If that module is missing or throws missing_table, we FAIL CLOSED. No sample fallback.
// - otherwise: local sample backend, and the UI shows a "demo, sample data" banner.
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient, type QueryClient, type QueryKey } from "@tanstack/react-query";
import { PlatformError, type PlatformApi, type Session } from "./contract";
import { sampleApi } from "./sample";

export const backendEnabled = import.meta.env.VITE_PLATFORM_BACKEND_ENABLED === "true";
export const isSample = !backendEnabled;

const realModules = import.meta.glob("../../platform/api.ts");
let realPromise: Promise<PlatformApi> | null = null;
function loadReal(): Promise<PlatformApi> {
  if (!realPromise) {
    const loader = Object.values(realModules)[0];
    realPromise = loader
      ? loader().then((m) => {
          const mod = m as Record<string, unknown>;
          const api = (mod.api || mod.platformApi || mod.default || mod) as PlatformApi;
          return api;
        })
      : Promise.reject(new PlatformError("not_enabled", "Backend is enabled but not installed in this build."));
  }
  return realPromise;
}

/** Proxy: every call resolves against the chosen backend. */
export const api: PlatformApi = new Proxy({} as PlatformApi, {
  get(_t, prop: string) {
    if (prop === "onSession") {
      return (cb: (s: Session | null) => void) => {
        if (isSample) return sampleApi.onSession(cb);
        let off: (() => void) | undefined; let dead = false;
        loadReal().then((a) => { if (!dead) off = a.onSession(cb); }).catch(() => cb(null));
        return () => { dead = true; off?.(); };
      };
    }
    return async (...args: unknown[]) => {
      const a = isSample ? sampleApi : await loadReal();
      const fn = (a as unknown as Record<string, (...x: unknown[]) => Promise<unknown>>)[prop];
      if (typeof fn !== "function") throw new PlatformError("not_enabled", `Backend is missing "${prop}".`);
      return fn.apply(a, args);
    };
  },
});

export function errText(e: unknown): string {
  if (e instanceof PlatformError || (e && typeof e === "object" && "code" in e)) {
    const code = (e as PlatformError).code;
    if (code === "missing_table") return "The backend isn't set up for this yet (missing table). Nothing was shown or saved.";
    if (code === "unauthenticated") return "Sign in to continue.";
    if (code === "forbidden") return "You don't have access to this.";
    if (code === "not_enabled") return (e as unknown as Error).message || "Backend not available.";
  }
  return (e as Error)?.message || "Something went wrong.";
}

// ---- Identity tracking (security) ----
// Private queries (profile, inbox, RSVPs, admin data) must never outlive the identity that loaded them.
// One module-level store is shared by every useSession mount, so the cache is cleared exactly once per change.
type SessState = { loading: boolean; session: Session | null };
let sess: SessState = { loading: true, session: null };
let identity = "pending"; // "pending" | "anon" | `${userId}|${role}`
let epoch = 0; // bumps on every auth event; stale getSession results are dropped
const listeners = new Set<() => void>();
const clients = new Set<QueryClient>();
let started = false;

function idOf(s: Session | null) { return s ? `${s.userId}|${s.role}` : "anon"; }

function purge(qc: QueryClient) {
  void qc.cancelQueries({ queryKey: ["p"] });
  qc.removeQueries({ queryKey: ["p"], type: "inactive" });
  void qc.resetQueries({ queryKey: ["p"] }); // drops data of active queries, refetches under new identity
}

function apply(s: Session | null) {
  const next = idOf(s);
  const changed = next !== identity;
  identity = next;
  sess = { loading: false, session: s };
  if (changed) clients.forEach(purge);
  listeners.forEach((l) => l());
}

function start() {
  if (started) return;
  started = true;
  const myEpoch = epoch;
  api.getSession()
    .then((s) => { if (epoch === myEpoch) apply(s); })
    .catch(() => { if (epoch === myEpoch) apply(null); });
  api.onSession((s) => { epoch++; apply(s); });
}

export function useSession() {
  const qc = useQueryClient();
  const [state, set] = useState<SessState>(sess);
  useEffect(() => {
    clients.add(qc);
    const l = () => set(sess);
    listeners.add(l);
    start();
    set(sess);
    return () => { listeners.delete(l); };
  }, [qc]);
  return state;
}

export function useP<T>(key: QueryKey, fn: () => Promise<T>, enabled = true) {
  const qc = useQueryClient();
  useEffect(() => { clients.add(qc); start(); }, [qc]);
  return useQuery({ queryKey: ["p", identity, ...key], queryFn: fn, enabled, retry: (n, e) => !(e instanceof PlatformError) && n < 1 });
}
export function useAct<A, R>(fn: (a: A) => Promise<R>, invalidate: QueryKey[] = [[]]) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => invalidate.forEach((k) => qc.invalidateQueries({ queryKey: k.length ? ["p", identity, ...k] : ["p"] })) });
}
