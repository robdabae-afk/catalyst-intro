import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ExitFundLayout, { FounderBand, PageIntro, usePageMeta } from "./ExitFundLayout";

const differentiators: [string, string][] = [
  ["Early conviction", "We engage before consensus forms and move with founder speed."],
  ["Operator perspective", "We favor direct, useful counsel over performative involvement."],
  ["Ecosystem access", "Catalyst expands the community and connections available to founders."],
];

export default function ExitFundAbout() {
  usePageMeta(
    "About — The Exit Fund",
    "Learn why The Exit Fund exists and how it works alongside the Catalyst founder ecosystem.",
  );

  return (
    <ExitFundLayout>
      <PageIntro eyebrow="About us" title="A focused fund for the formative stage.">
        The Exit Fund was created to meet founders at the moment when early belief, useful access,
        and a first check can change the trajectory of a company.
      </PageIntro>

      <section className="ef-container py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Built alongside an ecosystem, structured with independence.
          </h2>
          <div className="space-y-8 text-lg leading-8 text-[var(--ef-muted)]">
            <p>
              The Exit Fund is by Catalyst, and it makes its own investment decisions. The fund works
              closely with the Catalyst ecosystem to discover and support exceptional founders while
              keeping its investment process its own.
            </p>
            <p>
              That relationship gives us a distinctive view into emerging talent and gives founders
              access to a broader community beyond capital. Our model stays intentionally clear:
              focused decisions, direct communication, and support that serves the company rather
              than the investor.
            </p>
          </div>
        </div>

        <div className="mt-16 grid border-l border-t border-[var(--ef-border)] md:grid-cols-3">
          {differentiators.map(([title, body]) => (
            <article
              key={title}
              className="border-b border-r border-[var(--ef-border)] bg-[var(--ef-surface)] p-8"
            >
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="mt-4 text-sm leading-6 text-[var(--ef-muted)]">{body}</p>
            </article>
          ))}
        </div>

        <Link
          to="/exitfund/team"
          className="mt-10 inline-flex items-center gap-2 font-bold text-[var(--ef-primary)] hover:text-[var(--ef-primary-strong)]"
        >
          Meet the team <ArrowRight className="size-4" />
        </Link>
      </section>

      <FounderBand />
    </ExitFundLayout>
  );
}
