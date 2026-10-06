import { useCallback, useEffect, useState } from "react";
import { NOTIFS, NotifKind } from "./data";
import { isDemoMode, DEMO_STORE_KEY } from "@/demo/mode";

const KEY = isDemoMode() ? DEMO_STORE_KEY : "catalyst.production.v1";

export interface State {
  readIds: string[];
  prefs: Record<NotifKind, boolean> & { investing_opens: boolean };
  watch: Record<string, { raise: boolean; closing: boolean; update: boolean }>;
  follows: string[];
  recent: string[];
  learned: Record<string, boolean>;
  streak: number;
  steps: string[];
  checkedIn: boolean;
  onboarded: boolean;
  role: "investor" | "founder" | null;
  interests: string[];
  launch: string[];                       // "Save for launch" company ids
  msgs: Record<string, string[]>;         // thread id -> my sent messages
  qs: Record<string, string[]>;           // company id -> my questions (newest first)
  rsvps: string[];                        // event ids I'm going to
  people: string[];                       // founder/person ids I follow
  profile: { bio: string; photo: string };
  invest: { inc: number; nw: number } | null;
  passes: string[];
}

export const initial: State = {
  readIds: [],
  prefs: { new_pitch: true, founder_update: true, event_reminder: true, qa_answered: true, new_follower: true, raise_milestone: true, investing_opens: false },
  watch: {},
  follows: [],
  recent: [],
  learned: {},
  streak: 0,
  steps: [],
  checkedIn: false,
  onboarded: false,
  role: null,
  interests: [],
  launch: [],
  msgs: {},
  qs: {},
  rsvps: [],
  people: [],
  profile: { bio: "", photo: "" },
  invest: null,
  passes: [],
};

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...initial, ...JSON.parse(raw) } : initial;
  } catch { return initial; }
}

let state: State = typeof window === "undefined" ? initial : load();
const subs = new Set<() => void>();

export function getState() { return state; }
const changeSubs = new Set<(prev: State, next: State) => void>();
export function onChange(f: (prev: State, next: State) => void) { changeSubs.add(f); return () => { changeSubs.delete(f); }; }

/** replace state without notifying change listeners (used when hydrating from the server) */
export function hydrate(fn: (s: State) => State) {
  state = fn(state);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
  subs.forEach((f) => f());
}

/** Transactional writer. Installed by sync for signed-in production users: must persist
 *  prev->next to the account DB and resolve true before the UI commits. */
type Writer = (prev: State, next: State) => Promise<boolean>;
let writer: Writer | null = null;
export function setWriter(w: Writer | null) { writer = w; }
const errSubs = new Set<(m: string) => void>();
export function onWriteError(f: (m: string) => void) { errSubs.add(f); return () => { errSubs.delete(f); }; }
export function reportWriteError(m = "Couldn't save. Check your connection and try again.") { errSubs.forEach((f) => f(m)); }

let queue: Promise<unknown> = Promise.resolve();
export const flushWrites = () => queue.then(() => undefined);
let accountGeneration = 0;
export function invalidatePendingWrites() { accountGeneration += 1; }
function commit(next: State) {
  const prev = state;
  state = next;
  changeSubs.forEach((f) => f(prev, state));
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
  subs.forEach((f) => f());
}

/** Resolves true once the change is saved (to the account DB when signed in). UI only changes on success. */
export function setState(fn: (s: State) => State): Promise<boolean> {
  const generation = accountGeneration;
  const run = async () => {
    if (generation !== accountGeneration) return false;
    const prev = state, next = fn(prev);
    if (next === prev) return true;
    if (!writer) { commit(next); return true; }
    let ok = false;
    try { ok = await writer(prev, next); } catch { ok = false; }
    if (generation !== accountGeneration) return false;
    if (!ok) { reportWriteError(); return false; }
    // Never apply one account's in-flight update to a newly hydrated account.
    if (state !== prev) return false;
    commit(next);
    return true;
  };
  const p = queue.then(run, run);
  queue = p.catch(() => undefined);
  return p;
}

export function useStore(): [State, typeof setState] {
  const [, force] = useState(0);
  useEffect(() => { const f = () => force((n) => n + 1); subs.add(f); return () => { subs.delete(f); }; }, []);
  return [state, setState];
}

export function useReducedMotion() {
  const q = typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  const [rm, set] = useState(!!q?.matches);
  useEffect(() => { if (!q) return; const f = () => set(q.matches); q.addEventListener("change", f); return () => q.removeEventListener("change", f); }, [q]);
  return rm;
}

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((m: string) => { setMsg(m); window.setTimeout(() => setMsg(null), 1800); }, []);
  return { msg, show };
}

export const unreadCount = (s: State) => NOTIFS.filter((n) => !s.readIds.includes(n.id) && s.prefs[n.kind]).length;

export const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

export const DEFAULT_WATCH = { raise: true, closing: true, update: true };
export const watchAdd = (id: string): Promise<boolean> => setState((s) => ({ ...s, watch: { ...s.watch, [id]: s.watch[id] ?? DEFAULT_WATCH } }));
export const watchToggle = (id: string): Promise<boolean> => setState((s) => { const w = { ...s.watch }; if (w[id]) delete w[id]; else w[id] = DEFAULT_WATCH; return { ...s, watch: w }; });
