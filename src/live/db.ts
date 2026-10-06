// Real backend calls for the production live screens. Every call degrades quietly
// when a table is not deployed yet (returns empty / { ok:false, missing:true }).
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isDemoMode } from "@/demo/mode";
import { demoDb, DEMO_UID } from "@/demo/localDb";

// supabase-js types don't know the app_* tables until types are regenerated
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => isDemoMode() ? demoDb as any : supabase as any;

type PgErr = { code?: string; message?: string } | null;
export const isMissing = (e: PgErr) => !!e && (e.code === "42P01" || e.code === "PGRST205" || e.code === "42883" || e.code === "PGRST202" || /does not exist|schema cache|could not find/i.test(e.message ?? ""));
export type Res<T = null> = { ok: boolean; missing?: boolean; error?: string; data?: T };
const res = <T,>(error: PgErr, data?: T): Res<T> => (error ? { ok: false, missing: isMissing(error), error: isMissing(error) ? "This feature isn't switched on yet." : error.message ?? "Something went wrong." } : { ok: true, data });

export const ID_RE = /^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/;
export const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

export async function currentUid(): Promise<string | null> {
  if (isDemoMode()) return DEMO_UID;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}
export function useUid() {
  const [uid, setUid] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    void currentUid().then((u) => live && setUid(u));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => live && setUid(s?.user.id ?? null));
    return () => { live = false; data.subscription.unsubscribe(); };
  }, []);
  return uid;
}

let adminCache: Promise<boolean> | null = null;
export function checkAdmin(): Promise<boolean> {
  adminCache ??= (async () => {
    if (!(await currentUid())) return false;
    const { data, error } = await db().rpc("app_is_admin");
    return !error && data === true;
  })().catch(() => false);
  return adminCache;
}
supabase.auth.onAuthStateChange(() => { adminCache = null; });
export function useAdmin() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => { let live = true; void checkAdmin().then((v) => live && setOk(v)); return () => { live = false; }; }, []);
  return ok;
}

/* ---------- Q&A ---------- */
export type QRow = { id: string; user_id: string; company_id: string; body: string; answer: string | null; asker_name?: string | null; answered_at?: string | null; created_at: string };
export async function listQuestions(companyId: string): Promise<Res<QRow[]>> {
  const { data, error } = await db().from("app_questions").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(200);
  return res(error, (data ?? []) as QRow[]);
}
export async function askQuestion(companyId: string, body: string, askerName?: string): Promise<Res> {
  const user_id = await currentUid(); if (!user_id) return { ok: false, error: "Sign in first." };
  const text = body.trim();
  if (!text || text.length > 2000) return { ok: false, error: "Enter a question up to 2,000 characters." };
  const row: Record<string, unknown> = { user_id, company_id: companyId, body: text };
  if (askerName) row.asker_name = askerName.slice(0, 80);
  let { error } = await db().from("app_questions").insert(row);
  if (error && askerName && /asker_name/.test(error.message ?? "")) ({ error } = await db().from("app_questions").insert({ user_id, company_id: companyId, body: row.body }));
  return res(error);
}
export async function answerQuestion(id: string, answer: string): Promise<Res> {
  const { error } = await db().from("app_questions").update({ answer: answer.trim().slice(0, 4000) || null }).eq("id", id);
  return res(error);
}

/* ---------- Messages (thread_id = company id) ---------- */
export type MRow = { id: string; user_id: string; thread_id: string; body: string; sender_id?: string | null; created_at: string };
export async function listMessages(companyId: string, investorId?: string): Promise<Res<MRow[]>> {
  let q = db().from("app_messages").select("*").eq("thread_id", companyId).order("created_at").limit(500);
  if (investorId) q = q.eq("user_id", investorId);
  const { data, error } = await q;
  return res(error, (data ?? []) as MRow[]);
}
export async function listMyThreads(): Promise<Res<MRow[]>> {
  const { data, error } = await db().from("app_messages").select("*").order("created_at", { ascending: false }).limit(500);
  return res(error, (data ?? []) as MRow[]);
}
/** Investor writes in own thread (user_id = self); founder replies with user_id = investor, sender_id = self. */
export async function sendMessage(companyId: string, body: string, investorId?: string): Promise<Res> {
  const me = await currentUid(); if (!me) return { ok: false, error: "Sign in first." };
  const b = body.trim().slice(0, 4000); if (!b) return { ok: false, error: "Empty message." };
  let { error } = await db().from("app_messages").insert({ user_id: investorId ?? me, thread_id: companyId, body: b, sender_id: me });
  if (error && !investorId && /sender_id/.test(error.message ?? "")) ({ error } = await db().from("app_messages").insert({ user_id: me, thread_id: companyId, body: b }));
  return res(error);
}

/* ---------- Reservations (interest only, no money) ---------- */
export type ReservationRow = { id: string; company_id: string; amount: number; status: string; created_at: string; user_id?: string };
export async function listMyReservations(): Promise<Res<ReservationRow[]>> {
  const me = await currentUid(); if (!me) return { ok: true, data: [] };
  const { data, error } = await db().from("app_reservations").select("*").eq("user_id", me).neq("status", "cancelled");
  return res(error, (data ?? []) as ReservationRow[]);
}
export async function reserveInterest(companyId: string, amount: number): Promise<Res> {
  const user_id = await currentUid(); if (!user_id) return { ok: false, error: "Sign in first." };
  if (!(amount > 0 && amount <= 124000)) return { ok: false, error: "Enter an amount within your Reg CF limit." };
  const { error } = await db().from("app_reservations").upsert({ user_id, company_id: companyId, amount, status: "interest", ack_risk: true, updated_at: new Date().toISOString() }, { onConflict: "user_id,company_id" });
  return res(error);
}
export async function cancelReservation(companyId: string): Promise<Res> {
  const user_id = await currentUid(); if (!user_id) return { ok: false };
  const { error } = await db().from("app_reservations").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("user_id", user_id).eq("company_id", companyId);
  return res(error);
}
export async function myLimit(): Promise<number | null> {
  const me = await currentUid(); if (!me) return null;
  const { data, error } = await db().from("app_invest_profile").select("limit_12mo,accredited").eq("user_id", me).maybeSingle();
  if (error || !data) return null;
  return data.accredited ? null : Number(data.limit_12mo);
}
/** Same formula as public.app_calc_regcf_limit (non-accredited, 12 months). */
export function regCfLimit(income: number, netWorth: number) {
  const g = Math.max(income, netWorth);
  return income < 124000 || netWorth < 124000 ? Math.max(2500, 0.05 * g) : Math.min(124000, 0.1 * g);
}

/* ---------- Companies + events (admin / founder) ---------- */
export type CompanyStatus = "draft" | "pending" | "published" | "archived";
export type CompanyRow = { id: string; owner_id: string | null; status: CompanyStatus; data: Record<string, unknown>; sort: number; created_at: string; updated_at: string };
export type EventStatus = "draft" | "published" | "archived";
export type EventRow = { id: string; title: string; starts_at: string; ends_at: string | null; venue: string; city: string; image_url: string | null; url: string | null; capacity: number | null; company_ids: string[]; status: EventStatus };

export async function listCompanies(scope: "mine" | "all"): Promise<Res<CompanyRow[]>> {
  const me = await currentUid(); if (!me) return { ok: true, data: [] };
  let q = db().from("app_companies").select("*").order("updated_at", { ascending: false }).limit(500);
  if (scope === "mine") q = q.eq("owner_id", me);
  const { data, error } = await q;
  return res(error, (data ?? []) as CompanyRow[]);
}
export async function saveCompany(row: { id: string; status: CompanyStatus; data: Record<string, unknown>; sort?: number; owner_id?: string | null }, isNew: boolean): Promise<Res> {
  if (!ID_RE.test(row.id)) return { ok: false, error: "ID must be 3–60 lowercase letters, numbers or dashes." };
  const me = await currentUid(); if (!me) return { ok: false, error: "Sign in first." };
  const payload: Record<string, unknown> = { id: row.id, status: row.status, data: row.data };
  if (row.sort !== undefined) payload.sort = row.sort;
  if (isNew) payload.owner_id = row.owner_id === undefined ? me : row.owner_id;
  const { error } = isNew ? await db().from("app_companies").insert(payload) : await db().from("app_companies").update(payload).eq("id", row.id);
  return res(error);
}
export async function deleteCompany(id: string): Promise<Res> { const { error } = await db().from("app_companies").delete().eq("id", id); return res(error); }
export async function listEvents(): Promise<Res<EventRow[]>> {
  const { data, error } = await db().from("app_events").select("*").order("starts_at", { ascending: false }).limit(500);
  return res(error, (data ?? []) as EventRow[]);
}
export async function saveEvent(row: Partial<EventRow> & { title: string; starts_at: string }): Promise<Res> {
  const me = await currentUid(); if (!me) return { ok: false, error: "Sign in first." };
  const { id, ...rest } = row;
  const { error } = id ? await db().from("app_events").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id) : await db().from("app_events").insert({ ...rest, created_by: me });
  return res(error);
}
export async function deleteEvent(id: string): Promise<Res> { const { error } = await db().from("app_events").delete().eq("id", id); return res(error); }

export type AdminAction = "announce" | "approve" | "reject" | "publish" | "unpublish" | "archive" | "event_publish" | "event_archive";
export async function logAdmin(action: AdminAction, target_id: string, note?: string) {
  const admin_id = await currentUid(); if (!admin_id) return;
  const { error } = await db().from("app_admin_actions").insert({ admin_id, action, target_id: target_id.slice(0, 120), note: note ?? null });
  if (error) console.warn("[admin log]", error.message);
}
export async function countRows(table: string): Promise<number | null> {
  const { count, error } = await db().from(table).select("*", { count: "exact", head: true });
  return error ? null : count ?? 0;
}

/* ---------- Media upload: app-media/<uid>/<file> ---------- */
export async function uploadMedia(file: File): Promise<Res<string>> {
  if (isDemoMode()) return { ok: true, data: URL.createObjectURL(file) };
  const me = await currentUid(); if (!me) return { ok: false, error: "Sign in first." };
  if (file.size > 50 * 1024 * 1024) return { ok: false, error: "Max file size is 50 MB." };
  if (!/^(image\/(jpeg|png|webp)|video\/(mp4|quicktime))$/.test(file.type)) return { ok: false, error: "Use JPG, PNG, WebP, MP4 or MOV." };
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5);
  const path = `${me}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("app-media").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { ok: false, error: /bucket/i.test(error.message) ? "Uploads aren't switched on yet." : error.message };
  return { ok: true, data: supabase.storage.from("app-media").getPublicUrl(path).data.publicUrl };
}

export const ago = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "NOW"; if (s < 3600) return `${Math.floor(s / 60)}M`; if (s < 86400) return `${Math.floor(s / 3600)}H`; return `${Math.floor(s / 86400)}D`;
};
