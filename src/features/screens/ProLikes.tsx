import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useBilling } from "@/hooks/useBilling";
import { supabase } from "@/integrations/supabase/client";
import { Head } from "../FeaturesApp";
export default function ProLikes() {
 const { uid, entitlement, loading } = useBilling();
 const [likes,setLikes] = useState<{id:string;name:string}[]>([]);
 const [error,setError] = useState("");
 useEffect(()=>{
  let live=true; setLikes([]);
  if(!uid || !entitlement.isPro) return;
  void (async()=>{
   const {data,error:e}=await supabase.from("swipes").select("swiper_id").eq("swiped_id",uid).eq("action","like").order("created_at",{ascending:false}).limit(200);
   if(e) { if(live) setError(e.message); return; }
   const ids=(data??[]).map(x=>x.swiper_id); if(!ids.length) return;
   const r=await supabase.from("profiles").select("id,name").in("id",ids);
   if(live){ if(r.error) setError(r.error.message); else setLikes(r.data??[]); }
  })(); return ()=>{live=false};
 },[uid,entitlement.isPro]);
 return <div><Head title="People who liked you" back />{loading?<p className="dim">Loading…</p>:!entitlement.isPro?<><p className="dim">See your incoming likes with Pro.</p><Link className="btn" to="/pricing">Explore Pro</Link></>:<div className="price-likes">{error?<p role="alert">{error}</p>:likes.length?likes.map(p=><Link key={p.id} to={"/profile/"+p.id}>{p.name}</Link>):<p className="dim">Your incoming likes will appear here.</p>}</div>}</div>;
}
