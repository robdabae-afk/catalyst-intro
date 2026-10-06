import { Link, useNavigate } from "react-router-dom";
import { api, useP } from "@/lib/platform/client";
import { Err, Head, Loading, fmtDate } from "./Layout";

export default function Dashboard() {
  const s = useP(["adminStats"], () => api.adminStats());
  const ev = useP(["adminEvents"], () => api.adminListEvents());
  const qs = useP(["adminQuestions", true], () => api.adminListQuestions({ open: true }));
  const nav = useNavigate();
  const upcoming = (ev.data || []).filter((e) => e.status !== "cancelled" && e.startsAt > new Date().toISOString()).slice(0, 5);
  const tiles: [string, keyof NonNullable<typeof s.data>, string][] = [
    ["Members", "members", "/admin/members"], ["Upcoming events", "eventsUpcoming", "/admin/events"], ["RSVPs to review", "rsvpsPending", "/admin/events"],
    ["Open questions", "questionsOpen", "/admin/questions"], ["Deals in preview", "dealsPreview", "/admin/deals"], ["Admins", "admins", "/admin/members"],
    ["Waitlist signups", "waitlist", "/admin/waitlist"],
  ];
  return (
    <>
      <Head k="Overview" title="Dashboard"><Link className="b k" to="/admin/events/new">New event</Link><Link className="b" to="/admin/announcements">Announce</Link></Head>
      <div className="ad-body fade">
        {s.error ? <Err e={s.error} /> : (
          <div className="stats">
            {tiles.map(([l, k, to]) => <Link key={k} to={to}><span className="lbl">{l}</span><b>{s.data ? s.data[k] : "–"}</b></Link>)}
            <div><span className="lbl">Community</span><span className="note">28,000 people in the Catalyst community. Separate from app accounts above.</span></div>
          </div>
        )}
        <div className="split" style={{ marginTop: 8 }}>
          <div className="sec">
            <span className="lbl">Next events</span>
            {ev.isLoading ? <Loading /> : ev.error ? <Err e={ev.error} /> : upcoming.length === 0 ? <div className="empty">No upcoming events. <Link className="lnk" to="/admin/events/new">Create one</Link></div> : (
              <table className="rsp"><tbody>{upcoming.map((e) => (
                <tr key={e.id} className="click" onClick={() => nav(`/admin/events/${e.id}`)}>
                  <td className="t">{e.title}<div className="note mono">{fmtDate(e.startsAt)}</div></td>
                  <td className="num" data-l="Going">{e.goingCount}{e.capacity ? `/${e.capacity}` : ""}</td>
                  <td className="hm">{e.status === "draft" ? <span className="pill d">Draft</span> : <span className="pill o">Live</span>}</td>
                </tr>))}</tbody></table>
            )}
          </div>
          <div className="sec">
            <span className="lbl">Waiting on an answer</span>
            {qs.isLoading ? <Loading rows={3} /> : qs.error ? <Err e={qs.error} /> : (qs.data || []).length === 0 ? <div className="empty">All caught up.</div> : (
              <div className="list">{(qs.data || []).slice(0, 4).map((q) => <Link to="/admin/questions" key={q.id}><span>{q.body}<div className="note">{q.memberName}</div></span><span className="lnk">Answer</span></Link>)}</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
