import { useCallback, useEffect, useState } from "react";

const KEY = "catalyst-try-v1";
export type TryState = {
  saved: string[];
  passed: string[];
  interests: string[];
  income: number;
  netWorth: number;
  rsvps: string[];
  notify: boolean;
  intents: { id: string; amount: number }[];
  readThreads: string[];
  sent: Record<string, { text: string; at: number }[]>;
  questions: { deal: string; text: string; at: number }[];
  idVerified: boolean;
  bankLinked: boolean;
  notifPrefs: string[];
};
const DEFAULT: TryState = { saved: [], passed: [], interests: ["Food", "Climate"], income: 60000, netWorth: 40000, rsvps: [], notify: false, intents: [], readThreads: [], sent: {}, questions: [], idVerified: false, bankLinked: false, notifPrefs: ["deals", "messages"] };

function read(): TryState {
  try { return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return DEFAULT; }
}
const subs = new Set<(s: TryState) => void>();

export function useTry() {
  const [s, setS] = useState<TryState>(read);
  useEffect(() => { subs.add(setS); return () => { subs.delete(setS); }; }, []);
  const update = useCallback((fn: (s: TryState) => TryState) => {
    const next = fn(read());
    localStorage.setItem(KEY, JSON.stringify(next));
    subs.forEach((f) => f(next));
  }, []);
  return [s, update] as const;
}

export const toggle = (arr: string[], v: string) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
