import { useCallback, useEffect, useState } from "react";
import { NOTIFS, NotifKind } from "./data";

const KEY = "catalyst.features.v2";

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
}

const initial: State = {
  readIds: NOTIFS.filter((n) => n.read).map((n) => n.id),
  prefs: { new_pitch: true, founder_update: true, event_reminder: true, qa_answered: true, new_follower: true, raise_milestone: true, investing_opens: false },
  watch: { lumen: { raise: true, closing: true, update: true }, gridline: { raise: true, closing: false, update: true } },
  follows: ["lumen", "pulsebox"],
  recent: ["climate brooklyn", "fintech pre-seed"],
  learned: {},
  streak: 0,
  steps: ["photo", "interests"],
  checkedIn: false,
};

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...initial, ...JSON.parse(raw) } : initial;
  } catch { return initial; }
}

let state: State = typeof window === "undefined" ? initial : load();
const subs = new Set<() => void>();

export function setState(fn: (s: State) => State) {
  state = fn(state);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
  subs.forEach((f) => f());
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
