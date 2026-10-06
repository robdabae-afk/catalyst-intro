import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon, type IconName } from "./icons";
import "./brand.css";

/*
 * Catalyst buttons. Radius: pill (999) for CTAs/chips, circle for icon buttons.
 * Type: Schibsted Grotesk 600. States: hover (darken/fill), press (scale .97),
 * disabled (.35 opacity), loading (spinner tick, label kept for width).
 */
export type Variant = "primary" | "secondary" | "ghost" | "danger";
export type Size = "sm" | "md" | "lg";

type Common = { variant?: Variant; size?: Size; icon?: IconName; iconRight?: IconName; loading?: boolean; block?: boolean; children?: ReactNode; className?: string };
const cls = ({ variant = "primary", size = "md", loading, block, className = "" }: Common) =>
  `cb cb-${variant} cb-${size}${loading ? " is-loading" : ""}${block ? " cb-block" : ""} ${className}`.trim();
const inner = ({ icon, iconRight, children, size = "md" }: Common) => {
  const s = size === "sm" ? 15 : 18;
  return <>{icon && <Icon name={icon} size={s} />}{children && <span>{children}</span>}{iconRight && <Icon name={iconRight} size={s} />}<i className="cb-spin" aria-hidden /></>;
};

export function Button(p: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  const { variant, size, icon, iconRight, loading, block, children, className, disabled, type, ...rest } = p;
  return <button type={type ?? "button"} className={cls(p)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>{inner(p)}</button>;
}

export function ButtonLink(p: Common & { to: string; onClick?: () => void }) {
  return <Link to={p.to} className={cls(p)} onClick={p.onClick}>{inner(p)}</Link>;
}

export function IconButton({ icon, label, variant = "secondary", size = "md", className = "", ...rest }: { icon: IconName; label: string; variant?: Variant; size?: Size } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" aria-label={label} title={label} className={`cib cb-${variant} cib-${size} ${className}`} {...rest}><Icon name={icon} size={size === "sm" ? 16 : 20} /></button>;
}

export function Chip({ on, icon, children, ...rest }: { on?: boolean; icon?: IconName; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" aria-pressed={on} className={`cchip${on ? " on" : ""}`} {...rest}>{icon && <Icon name={icon} size={14} />}{children}</button>;
}

/** Swipe deck actions. kind=pass (outline, X) or save (filled, bookmark). */
export function SwipeAction({ kind, big, ...rest }: { kind: "pass" | "save" | "info"; big?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const map = { pass: ["pass", "Pass"], save: ["save", "Save"], info: ["forward", "Details"] } as const;
  const [ic, label] = map[kind];
  return <button type="button" aria-label={label} className={`csw csw-${kind}${big ? " big" : ""}`} {...rest}><Icon name={ic} size={big ? 26 : 22} /></button>;
}

export function RsvpButton({ state = "open", ...rest }: { state?: "open" | "pending" | "going" | "waitlist" | "full" } & Omit<Common, "variant" | "icon"> & ButtonHTMLAttributes<HTMLButtonElement>) {
  const m = { open: ["primary", "rsvp", "RSVP"], pending: ["secondary", "draft", "Requested"], going: ["secondary", "check", "You're going"], waitlist: ["secondary", "waitlist", "Join waitlist"], full: ["secondary", "close", "Full"] } as const;
  const [v, ic, txt] = m[state];
  return <Button variant={v} icon={ic} disabled={state === "full" || rest.disabled} {...rest}>{rest.children ?? txt}</Button>;
}

export function InvestButton(p: Omit<Common, "variant" | "iconRight"> & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <Button {...p} variant="primary" iconRight="invest" className={`cb-invest ${p.className ?? ""}`}>{p.children ?? "Invest"}</Button>;
}

/** Match reason chip (Discover). Icon + short reason, mono-free. */
export function ReasonChip({ icon, children }: { icon: IconName; children: ReactNode }) {
  return <span className="creason"><Icon name={icon} size={13} />{children}</span>;
}

/** Pitch-video badge. Same tilted-card glyph as the swipe icon, with play mark. */
export function PitchBadge({ len, open, ...rest }: { len: string; open?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" aria-expanded={open} aria-label={`${open ? "Hide" : "Play"} pitch preview, ${len}`} className={`cpitch${open ? " on" : ""}`} {...rest}><Icon name={open ? "close" : "pitch"} size={16} /><span>{open ? "Close" : `Pitch · ${len}`}</span></button>;
}

/** Circular match score (0–100). */
export function MatchRing({ score, size = 46 }: { score: number; size?: number }) {
  const r = (size - 5) / 2, c = 2 * Math.PI * r;
  return (
    <span className="cring" style={{ width: size, height: size }} role="img" aria-label={`Match ${score} of 100`}>
      <svg width={size} height={size} aria-hidden><circle cx={size / 2} cy={size / 2} r={r} className="bg" /><circle cx={size / 2} cy={size / 2} r={r} className="fg" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} /></svg>
      <b>{score}</b>
    </span>
  );
}
