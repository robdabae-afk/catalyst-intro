// Mirrors the app store into Supabase app_* tables for the signed-in user.
// Production starts empty and reads account state only after auth resolves.
// The server remains the source of truth; demo persistence is separate.
// Tables: supabase/migrations/20261006140000_app_actions.sql
import { supabase } from "@/integrations/supabase/client";
import { hydrate, initial, setWriter, flushWrites, invalidatePendingWrites, type State } from "./store";
import { isDemoMode } from "@/demo/mode";

export type SyncStatus = "signed_out" | "loading" | "ok" | "tables_missing" | "error";
let status: SyncStatus = "signed_out";
let uid: string | null = null;
const listeners = new Set<(s: SyncStatus) => void>();
const setStatus = (s: SyncStatus) => { status = s; (window as unknown as { __appSync?: SyncStatus }).__appSync = s; listeners.forEach((f) => f(s)); };
export const syncStatus = () => status;
export const onSyncStatus = (f: (s: SyncStatus) => void) => { listeners.add(f); return () => { listeners.delete(f); }; };
export const isSignedIn = () => !!uid;
export const currentUserId = () => uid;
export function requireAccount() { if (isDemoMode() || uid) return true; window.location.assign("/signup"); return false; }
export const flushSync = flushWrites;
export function clearAccountState() { hydrate(() => ({ ...initial, prefs: { ...initial.prefs }, watch: {}, follows: [], people: [], msgs: {}, qs: {} })); }


// supabase-js types don't know the new tables until types are regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => supabase as any;

type Kind = "save" | "pass" | "watch" | "follow" | "notify" | "read" | "learn" | "checklist";
const SETS: [Kind, (s: State) => string[]][] = [
  ["pass", (s) => s.passes],
  ["save", (s) => Object.keys(s.watch)],
  ["watch", (s) => Object.keys(s.watch)],
  ["follow", (s) => [...s.follows, ...s.people.map((p) => `person:${p}`)]],
  ["notify", (s) => s.launch],
  ["read", (s) => s.readIds],
  ["learn", (s) => Object.keys(s.learned).filter((k) => s.learned[k])],
  ["checklist", (s) => s.steps],
];

const missing = (e: { code?: string; message?: string } | null) =>
  !!e && (e.code === "42P01" || e.code === "PGRST205" || /does not exist|schema cache/i.test(e.message ?? ""));

async function run(p: PromiseLike<{ error: { code?: string; message?: string } | null }>) {
  const { error } = await p;
  if (missing(error)) { setStatus("tables_missing"); return false; }
  if (error) { console.warn("[app sync]", error.message); return false; }
  return true;
}

// Read existing accounts without migrating or changing their original rows.
async function pullLegacyProfile(id: string) {
  const { data: profile } = await supabase.from("profiles")
    .select("user_type,avatar_url").eq("id", id).maybeSingle();
  if (!profile) return null;
  const founder = profile.user_type === "founder"
    ? await supabase.from("founder_profiles").select("one_liner,industry")
      .eq("profile_id", id).maybeSingle() : null;
  const investor = profile.user_type === "investor"
    ? await supabase.from("investor_profiles").select("investment_thesis,sectors_of_interest")
      .eq("profile_id", id).maybeSingle() : null;
  return {
    role: profile.user_type,
    profile: { photo: profile.avatar_url ?? "", bio: founder?.data?.one_liner ?? investor?.data?.investment_thesis ?? "" },
    interests: founder?.data?.industry ?? investor?.data?.sectors_of_interest ?? [],
  };
}

async function pull(id: string) {
  const [legacy, items, prefs, rsvps, qs, msgs, inv] = await Promise.all([
    pullLegacyProfile(id),
    db().from("app_item_state").select("kind,item_id").eq("user_id", id),
    db().from("app_prefs").select("*").eq("user_id", id).maybeSingle(),
    db().from("app_rsvps").select("event_id,status").eq("user_id", id),
    db().from("app_questions").select("company_id,body,created_at").eq("user_id", id).order("created_at", { ascending: false }),
    db().from("app_messages").select("thread_id,body,created_at").eq("user_id", id).order("created_at"),
    db().from("app_invest_profile").select("annual_income,net_worth").eq("user_id", id).maybeSingle(),
  ]);
  const err = [items, prefs, rsvps, qs, msgs, inv].map((r) => r.error).find(Boolean);
  if (uid !== id) return;
  // Optional app-table failures must not hide an existing member's profile.
  if (legacy) hydrate((s) => ({ ...s, ...legacy }));
  if (missing(err)) { setStatus("tables_missing"); return; }
  if (err) { setStatus("error"); return; }

  const by = (k: Kind) => (items.data as { kind: Kind; item_id: string }[]).filter((r) => r.kind === k).map((r) => r.item_id);
  if (uid !== id) return;

  const p = prefs.data as { prefs: Record<string, unknown>; interests: string[]; role: State["role"] } | null;
  const follows = by("follow");
  hydrate((s) => ({
    ...s,
    passes: by("pass"),
    watch: Object.fromEntries(by("watch").map((c) => [c, s.watch[c] ?? { raise: true, closing: true, update: true }])),
    follows: follows.filter((f) => !f.startsWith("person:")),
    people: follows.filter((f) => f.startsWith("person:")).map((f) => f.slice(7)),
    launch: by("notify"),
    readIds: by("read"),
    learned: Object.fromEntries(by("learn").map((k) => [k, true])),
    steps: by("checklist"),
    rsvps: (rsvps.data as { event_id: string; status: string }[]).filter((r) => r.status === "going").map((r) => r.event_id),
    qs: (qs.data as { company_id: string; body: string }[]).reduce<Record<string, string[]>>((a, r) => ({ ...a, [r.company_id]: [...(a[r.company_id] ?? []), r.body] }), {}),
    msgs: (msgs.data as { thread_id: string; body: string }[]).reduce<Record<string, string[]>>((a, r) => ({ ...a, [r.thread_id]: [...(a[r.thread_id] ?? []), r.body] }), {}),
    invest: inv.data ? { inc: +inv.data.annual_income, nw: +inv.data.net_worth } : null,
    ...(p ? {
      prefs: { ...s.prefs, ...(p.prefs.notif as State["prefs"] ?? {}) },
      profile: { ...s.profile, ...(p.prefs.profile as State["profile"] ?? {}) },
      watch: Object.fromEntries(by("watch").map((c) => [c, (p.prefs.watch as State["watch"] ?? {})[c] ?? s.watch[c] ?? { raise: true, closing: true, update: true }])),
      interests: p.interests ?? s.interests,
      role: p.role ?? s.role,
      onboarded: !!(prefs.data as any)?.onboarded_at,
      recent: Array.isArray(p.prefs.recent) ? p.prefs.recent as string[] : [],
      checkedIn: !!p.prefs.checkedIn,
    } : {}),
  }));
  setStatus("ok");
}

async function push(prev: State, next: State, force = false): Promise<boolean> {
  if (!uid || (status !== "ok" && !force)) return false;
  const user_id = uid;
  const jobs: PromiseLike<{ error: { code?: string; message?: string } | null }>[] = [];
  for (const [kind, get] of SETS) {
    const a = new Set(get(prev)), b = new Set(get(next));
    const add = [...b].filter((x) => !a.has(x)), del = [...a].filter((x) => !b.has(x));
    if (add.length) jobs.push(db().from("app_item_state").upsert(add.map((item_id) => ({ user_id, kind, item_id })), { onConflict: "user_id,kind,item_id", ignoreDuplicates: true }));
    if (del.length) jobs.push(db().from("app_item_state").delete().eq("user_id", user_id).eq("kind", kind).in("item_id", del));
  }
  const ra = new Set(prev.rsvps), rb = new Set(next.rsvps);
  for (const e of next.rsvps) if (!ra.has(e)) jobs.push(db().from("app_rsvps").upsert({ user_id, event_id: e, status: "going", updated_at: new Date().toISOString() }, { onConflict: "user_id,event_id" }));
  for (const e of prev.rsvps) if (!rb.has(e)) jobs.push(db().from("app_rsvps").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("user_id", user_id).eq("event_id", e));
  for (const [co, list] of Object.entries(next.qs)) {
    const n = list.length - (prev.qs[co]?.length ?? 0);
    if (n > 0) jobs.push(db().from("app_questions").insert(list.slice(0, n).reverse().map((body) => ({ user_id, company_id: co, body }))));
  }
  for (const [t, list] of Object.entries(next.msgs)) {
    const n = list.length - (prev.msgs[t]?.length ?? 0);
    if (n > 0) jobs.push(db().from("app_messages").insert(list.slice(-n).map((body) => ({ user_id, thread_id: t, body }))));
  }
  if (force || prev.recent !== next.recent || prev.checkedIn !== next.checkedIn || prev.prefs !== next.prefs || prev.profile !== next.profile || prev.interests !== next.interests || prev.role !== next.role || prev.watch !== next.watch || prev.onboarded !== next.onboarded)
    jobs.push(db().from("app_prefs").upsert({ user_id, prefs: { notif: next.prefs, profile: next.profile, watch: next.watch, recent: next.recent, checkedIn: next.checkedIn }, interests: next.interests, role: next.role === "investor" || next.role === "founder" ? next.role : null, onboarded_at: next.onboarded ? new Date().toISOString() : null, updated_at: new Date().toISOString() }, { onConflict: "user_id" }));
  if (next.invest && (force || prev.invest !== next.invest))
    jobs.push(db().from("app_invest_profile").upsert({ user_id, annual_income: next.invest.inc, net_worth: next.invest.nw }, { onConflict: "user_id" }));
  for (const j of jobs) { if (uid !== user_id) return false; if (!(await run(j))) return false; }
  if (status === "error") setStatus("ok");
  return true;
}

let started = false;
export function startSync() {
  if (started || typeof window === "undefined" || isDemoMode()) return;
  started = true;
  let resolved = false;
  const set = (id: string | null) => {
    if (resolved && id === uid) return;
    resolved = true;
    invalidatePendingWrites();
    uid = id;
    clearAccountState();
    setWriter(id ? (prev, next) => (uid === id ? push(prev, next) : Promise.resolve(false)) : null);
    if (id) { setStatus("loading"); setTimeout(() => { if (uid === id) void pull(id); }, 0); } else setStatus("signed_out");
  };
  supabase.auth.getSession().then(({ data }) => set(data.session?.user.id ?? null));
  supabase.auth.onAuthStateChange((_e, session) => set(session?.user.id ?? null));
}
