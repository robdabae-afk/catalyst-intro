import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Menu, X } from "lucide-react";

const links = [
  { to: "/exitfund/mission", label: "Mission" },
  { to: "/exitfund/about", label: "About" },
  { to: "/exitfund/team", label: "Team" },
  { to: "/exitfund/contact", label: "Contact" },
];

/** Catalyst app signup — where founders apply. */
export const FOUNDER_APPLY_URL = "/app/signup";

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`ef-wordmark ${className}`}>
      <span className="ef-wordmark-the">THE</span>
      <span className="ef-wordmark-main">EXIT&nbsp;FUND</span>
    </span>
  );
}

export function FounderButton({ compact = false }: { compact?: boolean }) {
  return (
    <div className="inline-flex flex-col items-start gap-1.5">
      <Link
        to={FOUNDER_APPLY_URL}
        className={`ef-btn ${compact ? "ef-btn-sm" : ""}`}
      >
        Apply as a Founder <ArrowUpRight className="size-4" />
      </Link>
      {!compact && <span className="text-xs text-[var(--ef-muted)]">Via Catalyst</span>}
    </div>
  );
}

export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-[var(--ef-border)] py-16 sm:py-24">
      <div className="ef-container grid gap-6 lg:grid-cols-[0.8fr_1.6fr] lg:gap-8">
        <p className="ef-eyebrow">{eyebrow}</p>
        <div>
          <h1 className="max-w-4xl font-[Manrope] text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            {title}
          </h1>
          {children && (
            <div className="mt-7 max-w-2xl text-lg leading-8 text-[var(--ef-muted)]">{children}</div>
          )}
        </div>
      </div>
    </section>
  );
}

export function FounderBand() {
  return (
    <section className="bg-[var(--ef-accent)] py-14 sm:py-20">
      <div className="ef-container flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
        <div>
          <p className="ef-eyebrow">For founders</p>
          <h2 className="mt-3 max-w-2xl font-[Manrope] text-2xl font-bold sm:text-4xl">
            We discover founders through Catalyst.
          </h2>
          <p className="mt-3 text-[var(--ef-muted)]">Apply there to get on our radar.</p>
        </div>
        <FounderButton />
      </div>
    </section>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--ef-border)] bg-[var(--ef-bg)]/95 backdrop-blur">
      <div className="ef-container flex h-20 items-center justify-between">
        <Link to="/exitfund" aria-label="The Exit Fund home">
          <Wordmark />
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`ef-nav-link ${pathname === link.to ? "ef-nav-link-active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
          <FounderButton compact />
        </nav>
        <button
          type="button"
          className="ef-icon-btn md:hidden"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <nav aria-label="Mobile" className="ef-container border-t border-[var(--ef-border)] py-5 md:hidden">
          <div className="flex flex-col items-start gap-4">
            {links.map((link) => (
              <Link key={link.to} to={link.to} className="text-lg font-semibold">
                {link.label}
              </Link>
            ))}
            <FounderButton />
          </div>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--ef-border)] bg-[var(--ef-dark)] text-[var(--ef-dark-fg)]">
      <div className="ef-container grid gap-8 py-12 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <Wordmark className="ef-wordmark-inverse text-xl" />
          <p className="mt-3 max-w-md text-sm text-[var(--ef-dark-muted)]">
            First checks for founders building consequential companies.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-7 gap-y-3 text-sm text-[var(--ef-dark-muted)]">
          <Link to="/exitfund/contact" className="hover:text-[var(--ef-dark-fg)]">
            Contact
          </Link>
          <span>Email forthcoming</span>
          <span>LinkedIn forthcoming</span>
        </div>
      </div>
      <div className="ef-container border-t border-[var(--ef-dark-border)] py-5 text-xs text-[var(--ef-dark-muted)]">
        © {new Date().getFullYear()} The Exit Fund, by Catalyst. All rights reserved.
      </div>
    </footer>
  );
}

export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    const tag = document.querySelector('meta[name="description"]');
    const previousDesc = tag?.getAttribute("content") ?? "";
    tag?.setAttribute("content", description);
    return () => {
      document.title = previous;
      tag?.setAttribute("content", previousDesc);
    };
  }, [title, description]);
}

export default function ExitFundLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="ef-root min-h-screen bg-[var(--ef-bg)] text-[var(--ef-fg)]">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
