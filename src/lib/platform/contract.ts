// UI-side contract for the Catalyst platform backend.
// Mirrors /home/kit/platform-api-proposal.md. When src/platform/api.ts lands, the
// client in ./client.ts loads it; until then (or when the flag is off) the
// clearly-labelled local sample backend in ./sample.ts is used.
// No investment execution exists anywhere in this contract (registration pending).

export type Role = "member" | "admin";
export type Session = { userId: string; email: string; role: Role };

export type Member = {
  id: string; email: string; name: string; role: Role;
  city?: string | null; bio?: string | null; interests: string[]; notifPrefs: string[];
  createdAt: string; rsvpCount?: number;
};

export type EventStatus = "draft" | "published" | "cancelled";
export type PEvent = {
  id: string; title: string; startsAt: string; endsAt?: string | null; venue: string; address?: string | null;
  capacity: number | null; coverUrl?: string | null; description: string; status: EventStatus;
  goingCount: number; waitlistCount: number; createdAt: string;
};
export type EventInput = Pick<PEvent, "title" | "startsAt" | "venue" | "capacity" | "description" | "status"> &
  Partial<Pick<PEvent, "endsAt" | "address" | "coverUrl">>;

export type RsvpStatus = "pending" | "approved" | "declined" | "waitlisted" | "cancelled";
export type Rsvp = {
  id: string; eventId: string; userId: string; memberName: string; memberEmail: string;
  status: RsvpStatus; checkedInAt?: string | null; createdAt: string;
};

export type DealStatus = "draft" | "preview" | "archived";
export type PDeal = {
  id: string; slug: string; name: string; line: string; sector: string; city: string; about: string;
  minCheck: number; valuationCap: string; instrument: string; goal: number; status: DealStatus;
  isSample: boolean; coverUrl?: string | null; traction: string[]; useOfFunds: string[]; createdAt: string;
};
export type DealInput = Omit<PDeal, "id" | "createdAt">;

export type Question = {
  id: string; dealId: string; userId: string; memberName: string; body: string;
  answer?: string | null; answeredAt?: string | null; hidden: boolean; createdAt: string;
};
export type Save = { dealId: string; createdAt: string };
export type Thread = { id: string; kind: "dm" | "event" | "deal"; title: string; lastMessageAt: string; unread: boolean; memberIds: string[] };
export type Message = { id: string; threadId: string; userId: string; senderName: string; body: string; createdAt: string };
export type Notification = {
  id: string; kind: "announcement" | "rsvp" | "answer" | "message"; title: string; body: string;
  link?: string | null; readAt?: string | null; createdAt: string;
};
export type Audience = "all" | "admins" | { eventId: string };
export type Announcement = { id: string; title: string; body: string; audience: Audience; sentAt: string | null; createdBy: string; createdAt: string };
export type WaitlistEntry = { id: string; email: string; name?: string | null; source?: string | null; createdAt: string };
export type AdminStats = { members: number; admins: number; eventsUpcoming: number; rsvpsPending: number; dealsPreview: number; questionsOpen: number; waitlist: number };
export type OrgSettings = { orgName: string; contactEmail: string; defaultCapacity: number; requireApproval: boolean };

export type PlatformErrorCode = "not_enabled" | "unauthenticated" | "forbidden" | "missing_table" | "not_found" | "conflict" | "unknown";
export class PlatformError extends Error {
  constructor(public code: PlatformErrorCode, message: string) { super(message); this.name = "PlatformError"; }
}

export interface PlatformApi {
  getSession(): Promise<Session | null>;
  onSession(cb: (s: Session | null) => void): () => void;
  signIn(email: string, password: string): Promise<Session>;
  signUp(email: string, password: string, name: string): Promise<Session | null>;
  signOut(): Promise<void>;
  sendReset(email: string): Promise<void>;
  getMe(): Promise<Member>;
  updateMe(patch: Partial<Pick<Member, "name" | "bio" | "city" | "interests" | "notifPrefs">>): Promise<Member>;

  listEvents(opts?: { upcoming?: boolean }): Promise<PEvent[]>;
  getEvent(id: string): Promise<PEvent>;
  rsvp(eventId: string): Promise<Rsvp>;
  cancelRsvp(eventId: string): Promise<void>;
  myRsvps(): Promise<(Rsvp & { event: PEvent })[]>;

  listDeals(): Promise<PDeal[]>;
  getDeal(idOrSlug: string): Promise<PDeal>;
  listSaves(): Promise<Save[]>;
  toggleSave(dealId: string): Promise<boolean>;
  listQuestions(dealId: string): Promise<Question[]>;
  askQuestion(dealId: string, body: string): Promise<Question>;

  listThreads(): Promise<Thread[]>;
  listMessages(threadId: string): Promise<Message[]>;
  sendMessage(threadId: string, body: string): Promise<Message>;
  markThreadRead(threadId: string): Promise<void>;
  listNotifications(): Promise<Notification[]>;
  markNotificationRead(id: string | "all"): Promise<void>;

  adminStats(): Promise<AdminStats>;
  adminListEvents(): Promise<PEvent[]>;
  createEvent(input: EventInput): Promise<PEvent>;
  updateEvent(id: string, patch: Partial<EventInput>): Promise<PEvent>;
  deleteEvent(id: string): Promise<void>;
  uploadEventCover(file: File): Promise<string>;
  adminListRsvps(eventId: string): Promise<Rsvp[]>;
  setRsvpStatus(rsvpId: string, status: RsvpStatus): Promise<Rsvp>;
  checkIn(rsvpId: string, on: boolean): Promise<Rsvp>;
  adminListDeals(): Promise<PDeal[]>;
  createDeal(input: DealInput): Promise<PDeal>;
  updateDeal(id: string, patch: Partial<DealInput>): Promise<PDeal>;
  deleteDeal(id: string): Promise<void>;
  adminListQuestions(opts?: { open?: boolean }): Promise<Question[]>;
  answerQuestion(id: string, answer: string): Promise<Question>;
  setQuestionHidden(id: string, hidden: boolean): Promise<Question>;
  adminListMembers(opts?: { q?: string }): Promise<Member[]>;
  adminGetMember(id: string): Promise<Member & { rsvps: (Rsvp & { event: PEvent })[] }>;
  setMemberRole(id: string, role: Role): Promise<Member>;
  listAnnouncements(): Promise<Announcement[]>;
  sendAnnouncement(input: { title: string; body: string; audience: Audience }): Promise<Announcement>;
  adminListWaitlist(opts: { q?: string; limit: number; offset: number }): Promise<{ rows: WaitlistEntry[]; total: number }>;
  getSettings(): Promise<OrgSettings>;
  updateSettings(patch: Partial<OrgSettings>): Promise<OrgSettings>;
}
