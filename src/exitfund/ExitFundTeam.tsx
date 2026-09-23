import ExitFundLayout, { FounderBand, PageIntro, usePageMeta } from "./ExitFundLayout";

const team = [
  {
    name: "Julie",
    initials: "J",
    title: "Partner · title forthcoming",
    bio: "Julie’s full biography and investment focus will be added soon. This space is reserved for her background, perspective, and the experience she brings to founders.",
  },
  {
    name: "Stefan",
    initials: "S",
    title: "Partner · title forthcoming",
    bio: "Stefan’s full biography and investment focus will be added soon. This space is reserved for his background, perspective, and the experience he brings to founders.",
  },
  {
    name: "Rob",
    initials: "R",
    title: "Partner · title forthcoming",
    bio: "Rob’s full biography and investment focus will be added soon. This space is reserved for his background, perspective, and the experience he brings to founders.",
  },
];

export default function ExitFundTeam() {
  usePageMeta(
    "Team — The Exit Fund",
    "Meet Julie, Stefan, and Rob, the partners behind The Exit Fund.",
  );

  return (
    <ExitFundLayout>
      <PageIntro eyebrow="Our team" title="Founder-first, by design.">
        A small partnership built for direct relationships, clear decisions, and practical support
        from the first conversation onward.
      </PageIntro>

      <section className="ef-container py-16 sm:py-24">
        <div className="grid gap-10 md:grid-cols-3">
          {team.map((person) => (
            <article key={person.name}>
              <div
                className="flex aspect-[4/5] items-end bg-[var(--ef-accent)] p-7"
                aria-label={`${person.name} portrait forthcoming`}
              >
                <span className="text-7xl font-extrabold text-[var(--ef-primary)] opacity-35">
                  {person.initials}
                </span>
              </div>
              <h2 className="mt-6 text-2xl font-bold">{person.name}</h2>
              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[var(--ef-primary)]">
                {person.title}
              </p>
              <p className="mt-4 text-sm leading-6 text-[var(--ef-muted)]">{person.bio}</p>
            </article>
          ))}
        </div>
      </section>

      <FounderBand />
    </ExitFundLayout>
  );
}
