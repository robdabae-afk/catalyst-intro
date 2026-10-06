import { useState } from "react";
import { Icon } from "@/brand/icons";

/** Bookmark that fills and pops a tick badge when saved. Uses brand save/saved/check icons. */
export function SaveToggle({ on, onChange, className = "" }: { on: boolean; onChange: (v: boolean) => void; className?: string }) {
  const [n, setN] = useState(0);
  return (
    <button type="button" aria-label={on ? "Saved" : "Save"} aria-pressed={on} title={on ? "Saved" : "Save"}
      className={`cib cb-secondary cib-md lv-savet${on ? " on" : ""} ${className}`} onClick={() => { setN(n + 1); onChange(!on); }}>
      <span key={n} className="lv-savet-ic"><Icon name={on ? "saved" : "save"} size={20} /></span>
      <span className="lv-savet-tick" aria-hidden><Icon name="check" size={11} /></span>
    </button>
  );
}

/** Big brand icon that pops over the swipe stack after a save/pass. */
export function Burst({ kind, id }: { kind: "save" | "pass" | null; id: number }) {
  if (!kind) return null;
  return <div key={id} className={`lv-burst ${kind}`} aria-hidden><Icon name={kind === "save" ? "check" : "pass"} size={34} /></div>;
}
