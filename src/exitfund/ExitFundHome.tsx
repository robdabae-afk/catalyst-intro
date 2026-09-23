import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ExitFundLayout, { FounderBand, Wordmark, usePageMeta } from "./ExitFundLayout";

export default function ExitFundHome() {
  usePageMeta(
    "The Exit Fund — First Checks for Bold Founders",
    "Pre-seed investment for founders building in hardware, defense, consumer, and fashion technology.",
  );

  return (
    <ExitFundLayout>
      <section className="ef-container flex min-h-[calc(100vh-5rem)] flex-col justify-center py-14 sm:py-20">
        <Wordmark className="self-center text-4xl sm:text-6xl" />
        <h1 className="mx-auto mt-10 max-w-3xl text-center text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          First checks for founders building what comes next.
        </h1>
        <p className="mx-auto mt-7 max-w-2xl text-center text-base leading-7 text-[var(--ef-muted)] sm:text-lg">
          The Exit Fund is by Catalyst. We back early-stage founders in hardware, defense, consumer
          technology, and fashion technology — writing first checks before the signal shows up.
          Founders we back receive capital and access to the Catalyst ecosystem.
        </p>
      </section>

      <section className="border-y border-[var(--ef-border)] py-16 sm:py-24">
        <div className="ef-container">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="ef-eyebrow">Our portfolio</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
                Backing the earliest believers.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-[var(--ef-muted)]">
              Founder announcements are coming soon.
            </p>
          </div>
          <div className="mt-12 grid border-l border-t border-[var(--ef-border)] sm:grid-cols-2 lg:grid-cols-5">
            {["01", "02", "03", "04", "05"].map((number) => (
              <div
                key={number}
                className="flex min-h-48 flex-col justify-between border-b border-r border-[var(--ef-border)] bg-[var(--ef-surface)] p-6"
              >
                <span className="text-xs font-bold text-[var(--ef-primary)]">{number}</span>
                <div>
                  <p className="text-lg font-bold">To be announced</p>
                  <p className="mt-1 text-sm text-[var(--ef-muted)]">Portfolio company</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/exitfund/mission"
            className="mt-9 inline-flex items-center gap-2 text-sm font-bold text-[var(--ef-primary)] hover:text-[var(--ef-primary-strong)]"
          >
            Read our investment thesis <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <FounderBand />
    </ExitFundLayout>
  );
}
