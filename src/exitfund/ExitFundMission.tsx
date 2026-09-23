import ExitFundLayout, { FounderBand, PageIntro, usePageMeta } from "./ExitFundLayout";

const sectors: [string, string][] = [
  [
    "Hardware",
    "Physical innovation creates lasting advantage. We look for technical ambition grounded in real customer need.",
  ],
  [
    "Defense technology",
    "Mission-critical systems demand speed, resilience, and founders prepared to solve difficult, consequential problems.",
  ],
  [
    "Consumer technology",
    "Category-defining products begin with an unusually sharp understanding of people, behavior, and distribution.",
  ],
  [
    "Fashion technology",
    "Software, materials, and new commerce models are reshaping how products are designed, made, and discovered.",
  ],
];

export default function ExitFundMission() {
  usePageMeta(
    "Mission — The Exit Fund",
    "Our thesis for backing hardware, defense, consumer, and fashion technology founders at pre-seed.",
  );

  return (
    <ExitFundLayout>
      <PageIntro eyebrow="Our mission" title="Back conviction before it becomes consensus.">
        We partner with founders at pre-seed and seed, when the company is still defined by the
        quality of the insight and the velocity of the team.
      </PageIntro>

      <section className="ef-container py-16 sm:py-24">
        <div className="grid gap-px bg-[var(--ef-border)] md:grid-cols-2">
          {sectors.map(([title, body], index) => (
            <article key={title} className="bg-[var(--ef-bg)] p-8 sm:p-12">
              <span className="text-xs font-bold text-[var(--ef-primary)]">0{index + 1}</span>
              <h2 className="mt-8 text-2xl font-bold">{title}</h2>
              <p className="mt-4 leading-7 text-[var(--ef-muted)]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[var(--ef-dark)] py-16 text-[var(--ef-dark-fg)] sm:py-24">
        <div className="ef-container grid gap-10 lg:grid-cols-3">
          <div>
            <p className="ef-eyebrow" style={{ color: "#8FB3E8" }}>
              Stage
            </p>
            <p className="mt-4 text-3xl font-bold">Pre-seed &amp; seed</p>
          </div>
          <div>
            <p className="ef-eyebrow" style={{ color: "#8FB3E8" }}>
              First check
            </p>
            <p className="mt-4 text-3xl font-bold">Under $25K</p>
          </div>
          <div>
            <p className="ef-eyebrow" style={{ color: "#8FB3E8" }}>
              What matters
            </p>
            <p className="mt-4 text-lg leading-8 text-[var(--ef-dark-muted)]">
              Technical depth, clarity of insight, earned velocity, and the resolve to build through
              uncertainty.
            </p>
          </div>
        </div>
      </section>

      <section className="ef-container grid gap-10 py-16 sm:py-24 lg:grid-cols-2">
        <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">More than a check.</h2>
        <div className="space-y-5 text-lg leading-8 text-[var(--ef-muted)]">
          <p>
            Capital is the starting point. Our founders gain access to the Catalyst network, an
            active founder community, and practical support at the earliest company-building moments.
          </p>
          <p>
            We work alongside founders without adding noise — opening useful doors, sharing direct
            perspective, and respecting the focus required to build.
          </p>
        </div>
      </section>

      <FounderBand />
    </ExitFundLayout>
  );
}
