// LOCAL SAMPLE BACKEND. Used only when VITE_PLATFORM_BACKEND_ENABLED !== "true".
// Everything lives in this browser's localStorage. Nothing is sent anywhere.
// The "demo admin" switch here is a local sample toggle, never a production bypass.
import { DEALS, EVENTS } from "@/try/data";
import { THREADS } from "@/try/threads";
import type {
  AdminStats, Announcement, Member, Message, Notification, OrgSettings, PDeal, PEvent, PlatformApi, Question, Role, Rsvp, Session, Thread, WaitlistEntry,
} from "./contract";
import { PlatformError } from "./contract";

const KEY = "catalyst-sample-backend-v1";
const ME = "sample-you";
const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10);

type DB = {
  session: Session | null;
  members: Member[]; events: PEvent[]; rsvps: Rsvp[]; deals: PDeal[]; questions: Question[];
  saves: { userId: string; dealId: string; createdAt: string }[];
  threads: Thread[]; messages: Message[]; notifications: Notification[]; announcements: Announcement[];
  waitlist: WaitlistEntry[]; settings: OrgSettings;
};

const EVENT_DATES = ["2026-10-15T19:00", "2026-10-20T18:30", "2026-10-24T10:00", "2026-10-28T19:00"];
const NAMES = ["Jordan K.", "Priya S.", "Dev P.", "Maya R.", "Luis T.", "Ana G.", "Sam W.", "Chris B.", "Nia O.", "Theo M.", "Rae L.", "Omar H."];

function seed(): DB {
  const t0 = "2026-09-01T12:00:00.000Z";
  const members: Member[] = [
    { id: ME, email: "you@sample.local", name: "You (sample)", role: "member", city: "New York", bio: null, interests: ["Food", "Climate"], notifPrefs: ["deals", "messages"], createdAt: t0 },
    ...NAMES.map((n, i) => ({ id: `m${i}`, email: `${n.split(" ")[0].toLowerCase()}@sample.local`, name: n, role: (i === 0 ? "admin" : "member") as Role, city: ["Brooklyn", "Queens", "Jersey City", "Manhattan"][i % 4], bio: null, interests: [], notifPrefs: [], createdAt: t0 })),
  ];
  const events: PEvent[] = EVENTS.map((e, i) => ({
    id: e.id, title: e.title, startsAt: new Date(EVENT_DATES[i]).toISOString(), endsAt: null, venue: e.place, address: null,
    capacity: [40, 30, 12, 60][i], coverUrl: e.photo, description: e.blurb, status: "published", goingCount: 0, waitlistCount: 0, createdAt: t0,
  }));
  events.push({ id: "e-draft", title: "Climate founders roundtable", startsAt: new Date("2026-11-05T18:30").toISOString(), venue: "Gowanus, Brooklyn", capacity: 20, coverUrl: null, description: "Draft. Not visible to members yet.", status: "draft", goingCount: 0, waitlistCount: 0, createdAt: t0 });
  const rsvps: Rsvp[] = [];
  NAMES.forEach((n, i) => {
    const ev = events[i % 3];
    rsvps.push({ id: `r${i}`, eventId: ev.id, userId: `m${i}`, memberName: n, memberEmail: members[i + 1].email, status: i % 5 === 0 ? "pending" : "approved", checkedInAt: null, createdAt: t0 });
  });
  const deals: PDeal[] = DEALS.map((d) => ({
    id: d.id, slug: d.id, name: d.name, line: d.line, sector: d.sector, city: d.city, about: d.about, minCheck: d.min, valuationCap: d.cap,
    instrument: d.type, goal: d.goal, status: "preview", isSample: true, coverUrl: null, traction: d.traction, useOfFunds: d.use, createdAt: t0,
  }));
  const questions: Question[] = [
    { id: "q1", dealId: "stoop-coffee", userId: "m2", memberName: "Dev P.", body: "What happens to carts in winter?", answer: null, hidden: false, createdAt: t0 },
    { id: "q2", dealId: "gridlight", userId: "m5", memberName: "Ana G.", body: "Who owns the panels if a landlord sells?", answer: "The lease transfers with the building. (Sample answer.)", answeredAt: t0, hidden: false, createdAt: t0 },
  ];
  const threads: Thread[] = THREADS.map((t) => ({ id: t.id, kind: t.kind === "group" ? "event" : "dm", title: t.name, lastMessageAt: t0, unread: t.unread, memberIds: [ME] }));
  const messages: Message[] = THREADS.flatMap((t) => t.messages.map((m, j) => ({ id: `${t.id}-${j}`, threadId: t.id, userId: m.from === "me" ? ME : "other", senderName: m.from === "me" ? "You" : m.who || t.name, body: m.text, createdAt: t0 })));
  const notifications: Notification[] = [
    { id: "n1", kind: "announcement", title: "Welcome to the Catalyst preview", body: "This is sample data on your device.", link: "/app/discover", readAt: null, createdAt: t0 },
  ];
  const waitlist: WaitlistEntry[] = Array.from({ length: 37 }, (_, i) => ({ id: `w${i}`, email: `sample${i + 1}@example.com`, name: null, source: ["site", "event", "newsletter"][i % 3], createdAt: new Date(Date.parse(t0) + i * 36e5 * 7).toISOString() }));
  return { session: null, members, events, rsvps, deals, questions, saves: [], threads, messages, notifications, announcements: [], waitlist,
    settings: { orgName: "Catalyst", contactEmail: "catalystintroapp@gmail.com", defaultCapacity: 40, requireApproval: false } };
}

let db: DB = (() => { try { const r = localStorage.getItem(KEY); return r ? { ...seed(), ...JSON.parse(r) } : seed(); } catch { return seed(); } })();
const sessionSubs = new Set<(s: Session | null) => void>();
function commit() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ } }
const wait = <T,>(v: T) => new Promise<T>((r) => setTimeout(() => r(structuredClone(v)), 120));

function counts(e: PEvent): PEvent {
  const rs = db.rsvps.filter((r) => r.eventId === e.id);
  return { ...e, goingCount: rs.filter((r) => r.status === "approved").length, waitlistCount: rs.filter((r) => r.status === "waitlisted").length };
}
function need(): Session { if (!db.session) throw new PlatformError("unauthenticated", "Sign in first."); return db.session; }
function admin(): Session { const s = need(); if (s.role !== "admin") throw new PlatformError("forbidden", "Admins only."); return s; }
function find<T extends { id: string }>(arr: T[], id: string): T { const x = arr.find((a) => a.id === id); if (!x) throw new PlatformError("not_found", "Not found."); return x; }
function notify(n: Omit<Notification, "id" | "createdAt" | "readAt">) { db.notifications.unshift({ ...n, id: uid(), readAt: null, createdAt: now() }); }

/** Local sample only: flip the sample session between member and admin. */
export function setSampleRole(role: Role) {
  db.session = { userId: ME, email: "you@sample.local", role };
  find(db.members, ME).role = role; commit(); sessionSubs.forEach((f) => f(db.session));
}
export function resetSample() { db = seed(); commit(); sessionSubs.forEach((f) => f(null)); }

export const sampleApi: PlatformApi = {
  getSession: async () => wait(db.session),
  onSession: (cb) => { sessionSubs.add(cb); return () => { sessionSubs.delete(cb); }; },
  signIn: async () => { setSampleRole("member"); return wait(db.session!); },
  signUp: async () => { setSampleRole("member"); return wait(db.session); },
  signOut: async () => { db.session = null; commit(); sessionSubs.forEach((f) => f(null)); },
  sendReset: async () => undefined,
  getMe: async () => wait(find(db.members, need().userId)),
  updateMe: async (p) => { Object.assign(find(db.members, need().userId), p); commit(); return wait(find(db.members, ME)); },

  listEvents: async () => wait(db.events.filter((e) => e.status === "published").map(counts).sort((a, b) => a.startsAt.localeCompare(b.startsAt))),
  getEvent: async (id) => { const e = find(db.events, id); if (e.status === "draft" && db.session?.role !== "admin") throw new PlatformError("not_found", "Not found."); return wait(counts(e)); },
  rsvp: async (eventId) => {
    const s = need(); const ev = db.events.find((x) => x.id === eventId);
    if (!ev || ev.status !== "published") throw new PlatformError("not_found", "Event not available.");
    const e = counts(ev); const me = find(db.members, s.userId);
    let r = db.rsvps.find((x) => x.eventId === eventId && x.userId === s.userId);
    if (r?.status === "declined") throw new PlatformError("forbidden", "RSVP declined; contact the event organizer.");
    if (r && (r.status === "approved" || r.status === "pending" || r.status === "waitlisted")) return wait(r);
    if (Date.parse(e.startsAt) <= Date.now()) throw new PlatformError("conflict", "Event has already started.");
    const full = e.capacity != null && e.goingCount >= e.capacity;
    const status = full ? "waitlisted" : db.settings.requireApproval ? "pending" : "approved";
    if (r) Object.assign(r, { status, checkedInAt: null });
    else { r = { id: uid(), eventId, userId: s.userId, memberName: me.name, memberEmail: me.email, status, checkedInAt: null, createdAt: now() }; db.rsvps.push(r); }
    notify({ kind: "rsvp", title: status === "approved" ? `You're going: ${e.title}` : status === "waitlisted" ? `Waitlisted: ${e.title}` : `Request sent: ${e.title}`, body: "Sample notification.", link: `/app/events/${eventId}` });
    commit(); return wait(r);
  },
  cancelRsvp: async (eventId) => {
    const s = need(); const r = db.rsvps.find((x) => x.eventId === eventId && x.userId === s.userId);
    if (!db.events.some((x) => x.id === eventId)) throw new PlatformError("not_found", "Event not available.");
    if (!r) throw new PlatformError("not_found", "Not found.");
    if (r.status === "declined") throw new PlatformError("forbidden", "RSVP declined; contact the event organizer.");
    if (r.checkedInAt) throw new PlatformError("forbidden", "Checked-in RSVP must be changed by an organizer.");
    r.status = "cancelled"; r.checkedInAt = null; // no auto-promotion: admins approve waitlist manually
    commit();
  },
  myRsvps: async () => { const s = need(); return wait(db.rsvps.filter((r) => r.userId === s.userId && r.status !== "cancelled").map((r) => ({ ...r, event: counts(find(db.events, r.eventId)) }))); },

  listDeals: async () => wait(db.deals.filter((d) => d.status === "preview")),
  getDeal: async (k) => { const d = db.deals.find((x) => x.id === k || x.slug === k); if (!d) throw new PlatformError("not_found", "Not found."); return wait(d); },
  listSaves: async () => { const s = need(); return wait(db.saves.filter((x) => x.userId === s.userId).map(({ dealId, createdAt }) => ({ dealId, createdAt }))); },
  toggleSave: async (dealId) => {
    const s = need(); const i = db.saves.findIndex((x) => x.userId === s.userId && x.dealId === dealId);
    if (i >= 0) db.saves.splice(i, 1); else db.saves.push({ userId: s.userId, dealId, createdAt: now() });
    commit(); return i < 0;
  },
  listQuestions: async (dealId) => wait(db.questions.filter((q) => q.dealId === dealId && (!q.hidden || db.session?.role === "admin"))),
  askQuestion: async (dealId, body) => { const s = need(); const q: Question = { id: uid(), dealId, userId: s.userId, memberName: find(db.members, s.userId).name, body, answer: null, hidden: false, createdAt: now() }; db.questions.push(q); commit(); return wait(q); },

  listThreads: async () => { need(); return wait(db.threads); },
  listMessages: async (id) => { need(); return wait(db.messages.filter((m) => m.threadId === id)); },
  sendMessage: async (threadId, body) => { const s = need(); const m: Message = { id: uid(), threadId, userId: s.userId, senderName: "You", body, createdAt: now() }; db.messages.push(m); find(db.threads, threadId).lastMessageAt = m.createdAt; commit(); return wait(m); },
  markThreadRead: async (id) => { need(); find(db.threads, id).unread = false; commit(); },
  listNotifications: async () => { need(); return wait(db.notifications); },
  markNotificationRead: async (id) => { need(); db.notifications.forEach((n) => { if (id === "all" || n.id === id) n.readAt = n.readAt || now(); }); commit(); },

  adminStats: async () => { admin(); const s: AdminStats = {
    members: db.members.length, admins: db.members.filter((m) => m.role === "admin").length,
    eventsUpcoming: db.events.filter((e) => e.status === "published" && e.startsAt > now()).length,
    rsvpsPending: db.rsvps.filter((r) => r.status === "pending").length, dealsPreview: db.deals.filter((d) => d.status === "preview").length,
    questionsOpen: db.questions.filter((q) => !q.answer && !q.hidden).length, waitlist: db.waitlist.length }; return wait(s); },
  adminListEvents: async () => { admin(); return wait(db.events.map(counts).sort((a, b) => a.startsAt.localeCompare(b.startsAt))); },
  createEvent: async (input) => { admin(); const e: PEvent = { endsAt: null, address: null, coverUrl: null, ...input, id: uid(), goingCount: 0, waitlistCount: 0, createdAt: now() }; db.events.push(e); commit(); return wait(e); },
  updateEvent: async (id, p) => { admin(); if (p.capacity != null && db.rsvps.filter((x) => x.eventId === id && x.status === "approved").length > p.capacity) throw new PlatformError("conflict", "Capacity below approved occupancy."); Object.assign(find(db.events, id), p); commit(); return wait(counts(find(db.events, id))); },
  deleteEvent: async (id) => { admin(); db.events = db.events.filter((e) => e.id !== id); db.rsvps = db.rsvps.filter((r) => r.eventId !== id); commit(); },
  uploadEventCover: async (file) => { admin(); return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result)); fr.onerror = () => rej(new PlatformError("unknown", "Could not read file.")); fr.readAsDataURL(file); }); },
  adminListRsvps: async (eventId) => { admin(); return wait(db.rsvps.filter((r) => r.eventId === eventId)); },
  setRsvpStatus: async (id, status) => { admin(); const r = find(db.rsvps, id); const e = find(db.events, r.eventId);
    if (status === "approved" && e.capacity != null && db.rsvps.filter((x) => x.eventId === e.id && x.status === "approved" && x.id !== r.id).length >= e.capacity) throw new PlatformError("conflict", "Capacity reached.");
    r.status = status; if (status !== "approved") r.checkedInAt = null;
    if (r.userId === ME) notify({ kind: "rsvp", title: `RSVP ${status}: ${e.title}`, body: "Sample notification.", link: `/app/events/${e.id}` }); commit(); return wait(r); },
  checkIn: async (id, on) => { admin(); const r = find(db.rsvps, id); if (on && r.status !== "approved") throw new PlatformError("conflict", "Approval required."); r.checkedInAt = on ? now() : null; commit(); return wait(r); },
  adminListDeals: async () => { admin(); return wait(db.deals); },
  createDeal: async (input) => { admin(); const d: PDeal = { ...input, id: uid(), createdAt: now() }; db.deals.push(d); commit(); return wait(d); },
  updateDeal: async (id, p) => { admin(); Object.assign(find(db.deals, id), p); commit(); return wait(find(db.deals, id)); },
  deleteDeal: async (id) => { admin(); db.deals = db.deals.filter((d) => d.id !== id); commit(); },
  adminListQuestions: async (o) => { admin(); return wait(db.questions.filter((q) => !o?.open || (!q.answer && !q.hidden)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))); },
  answerQuestion: async (id, answer) => { admin(); const q = find(db.questions, id); q.answer = answer; q.answeredAt = now();
    if (q.userId === ME) notify({ kind: "answer", title: "Your question was answered", body: answer, link: `/app/deal/${q.dealId}` }); commit(); return wait(q); },
  setQuestionHidden: async (id, hidden) => { admin(); const q = find(db.questions, id); q.hidden = hidden; commit(); return wait(q); },
  adminListMembers: async (o) => { admin(); const q = (o?.q || "").toLowerCase();
    return wait(db.members.filter((m) => !q || m.name.toLowerCase().includes(q) || m.email.includes(q)).map((m) => ({ ...m, rsvpCount: db.rsvps.filter((r) => r.userId === m.id && r.status !== "cancelled").length }))); },
  adminGetMember: async (id) => { admin(); const m = find(db.members, id); return wait({ ...m, rsvps: db.rsvps.filter((r) => r.userId === id).map((r) => ({ ...r, event: counts(find(db.events, r.eventId)) })) }); },
  setMemberRole: async (id, role) => { const s = admin(); void s; const m = find(db.members, id);
    if (role !== "admin" && m.role === "admin" && db.members.filter((x) => x.role === "admin").length <= 1) throw new PlatformError("conflict", "Can't remove the last admin."); find(db.members, id).role = role; commit(); return wait(find(db.members, id)); },
  listAnnouncements: async () => { admin(); return wait(db.announcements); },
  sendAnnouncement: async (input) => { const s = admin(); if (typeof input.audience === "object" && !db.events.some((x) => x.id === (input.audience as { eventId: string }).eventId)) throw new PlatformError("not_found", "Event not found."); const a: Announcement = { ...input, id: uid(), sentAt: now(), createdBy: s.userId, createdAt: now() };
    db.announcements.unshift(a); const au = a.audience; const meRole = find(db.members, ME).role;
    const reachesMe = au === "all" || (au === "admins" && meRole === "admin") || (typeof au === "object" && db.rsvps.some((r) => r.eventId === au.eventId && r.userId === ME && (r.status === "approved" || r.status === "pending" || r.status === "waitlisted")));
    if (reachesMe) notify({ kind: "announcement", title: a.title, body: a.body, link: null }); commit(); return wait(a); },
  adminListWaitlist: async ({ q, limit, offset }) => { admin(); const f = db.waitlist.filter((w) => !q || w.email.includes(q.toLowerCase())); return wait({ rows: f.slice(offset, offset + limit), total: f.length }); },
  getSettings: async () => { admin(); return wait(db.settings); },
  updateSettings: async (p) => { admin(); Object.assign(db.settings, p); commit(); return wait(db.settings); },
};
