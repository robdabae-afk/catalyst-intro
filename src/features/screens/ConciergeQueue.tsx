import { useEffect, useState } from "react";
import { useAdmin } from "@/live/db";
import { supabase } from "@/integrations/supabase/client";
import { billingRpc } from "@/lib/billing";
import { Head } from "../FeaturesApp";
import "./pricing.css";
type Job={id:string;user_id:string;match_count:number;status:string;created_at:string};
export default function ConciergeQueue() {
 const admin=useAdmin();
 const [jobs,setJobs]=useState<Job[]>([]);
 const [error,setError]=useState("");
 const load=async()=>{const r=await (supabase as any).from("concierge_jobs").select("*").eq("status","queued").order("created_at"); if(r.error)setError(r.error.message);else setJobs(r.data??[]);};
 useEffect(()=>{if(admin) void load();},[admin]);
 return <div><Head title="Concierge queue" back />{admin===null?<p>Checking access…</p>:!admin?<p role="alert">Admin access required.</p>:<>{error&&<p role="alert">{error}</p>}<p className="dim">Paid requests only. Select approved profile IDs to create their real connections.</p>{jobs.map(j=><JobCard key={j.id} job={j} done={load}/>)}{!jobs.length&&!error&&<p className="dim">No queued requests.</p>}</>}</div>;
}
function JobCard({job,done}:{job:Job;done:()=>Promise<void>}) {
 const [targets,setTargets]=useState("");const [note,setNote]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const fulfill=async()=>{setBusy(true);setError("");try{await billingRpc("billing_fulfill_concierge",{p_job:job.id,p_targets:targets.split(/[\s,]+/).filter(Boolean),p_note:note});await done();}catch(e){setError(e instanceof Error?e.message:"Failed");}finally{setBusy(false);}};
 return <section className="card price-admin-job"><h2>{job.match_count} {job.match_count===1?"investor match":"matches"}</h2><p className="note">Requester {job.user_id} · {new Date(job.created_at).toLocaleDateString()}</p><label htmlFor={job.id+"targets"}>Approved profile IDs, separated by commas</label><input className="price-input" id={job.id+"targets"} value={targets} onChange={e=>setTargets(e.target.value)}/><label htmlFor={job.id+"note"}>Fulfillment note</label><textarea className="price-input" id={job.id+"note"} maxLength={2000} value={note} onChange={e=>setNote(e.target.value)}/>{error&&<p role="alert">{error}</p>}<button className="btn" disabled={busy||!targets.trim()} onClick={()=>void fulfill()}>{busy?"Connecting…":"Fulfill request"}</button></section>;
}
