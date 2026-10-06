import { isDemoMode } from "@/demo/mode";
import { demoQuestions } from "@/features/catalog";
import type { Deal, Question } from "@/platform/types";
export type PitchChapterKey = "hook" | "problem" | "demo" | "traction" | "team" | "ask";
export type PitchChapter = { key: PitchChapterKey; t: number };
export const CHAPTER_LABEL: Record<PitchChapterKey, string> = { hook: "Hook", problem: "Problem", demo: "Product", traction: "Traction", team: "Team", ask: "Ask" };

export type Metric = { label: string; unit: string; series: number[] }; // monthly, oldest first
export type Doc = { name: string; kind: "deck" | "form_c" | "financials" | "safe"; ready: boolean };
export type Update = { title: string; body: string; when: string };
export type Company = Deal & {
  problem: string; solution: string; stage: "Pre-seed" | "Seed";
  media: { src: string; kind: "image" | "video"; caption: string }[];
  metric: Metric; milestones: string[];
  market: { headline: string; tam: string; sam: string; why: string };
  model: { headline: string; price: string; points: string[] };
  docs: Doc[]; updates: Update[]; risks: string[]; eventIds: string[];
  chapters: PitchChapter[];
  ownerId?: string | null;
};

export { DETAIL_COMPANIES as COMPANIES } from "@/features/catalog";
export function companyQuestions(c: Company, founderName: string): (Question & { votes: number; when: string; answeredBy?: string })[] { return isDemoMode() ? demoQuestions(c as never, founderName) : []; }
export const SECTIONS = [
  ["overview", "Overview"], ["product", "Product"], ["traction", "Traction"], ["team", "Team"], ["market", "Market"],
  ["model", "Business model"], ["raise", "The raise"], ["docs", "Documents"], ["updates", "Updates"], ["qa", "Q&A"],
  ["risks", "Risks"], ["events", "Events"], ["limit", "Your limit"],
] as const;
export type SectionId = (typeof SECTIONS)[number][0];
