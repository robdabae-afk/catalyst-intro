import { useRef } from "react";

/* To add real photos: drop files in /public/redesign/events/ and set `img` (and `alt`). */
type Ev = { title: string; blurb: string; img?: string; alt?: string };
export const EVENTS: Ev[] = [
  { title: "Mixers", blurb: "Weekly evenings where founders, angels and operators meet over coffee and drinks." },
  { title: "Founder-investor coffee hours", blurb: "Small morning sessions with open time to talk one on one." },
  { title: "Founder-investor walks", blurb: "Conversations that happen better on foot, along the High Line and beyond." },
  { title: "Founder-investor run club", blurb: "Group runs that end with coffee and introductions." },
  { title: "Founder-investor mini golf", blurb: "A low-key night out that makes it easy to start a conversation." },
  { title: "Pitch nights", blurb: "Founders pitch the room and get live feedback from investors." },
];

export default function EventGallery() {
  const track = useRef<HTMLUListElement>(null);
  const go = (d: number) => {
    const t = track.current; if (!t) return;
    const card = t.querySelector("li") as HTMLElement | null;
    t.scrollBy({ left: d * ((card?.offsetWidth ?? 300) + 16), behavior: "smooth" });
  };
  return (
    <div className="evg">
      <ul ref={track} className="evg-track" tabIndex={0} aria-label="Past Catalyst events">
        {EVENTS.map((e, i) => (
          <li key={e.title} className="evg-card">
            <div className="evg-media">
              {e.img ? <img src={e.img} alt={e.alt ?? e.title} loading="lazy" /> : (
                <div className="evg-ph" aria-hidden="true"><span>{String(i + 1).padStart(2, "0")}</span><small>Photo coming soon</small></div>
              )}
            </div>
            <h3>{e.title}</h3>
            <p>{e.blurb}</p>
          </li>
        ))}
      </ul>
      <div className="evg-nav">
        <button type="button" className="evg-btn" onClick={() => go(-1)} aria-label="Previous events">←</button>
        <button type="button" className="evg-btn" onClick={() => go(1)} aria-label="Next events">→</button>
      </div>
    </div>
  );
}
