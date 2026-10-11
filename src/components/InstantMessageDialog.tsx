import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBilling } from "@/hooks/useBilling";
import { billingRpc } from "@/lib/billing";
import "@/features/screens/pricing.css";
interface Props { open:boolean;onOpenChange:(open:boolean)=>void;senderId:string;receiverId:string;receiverName:string;userType:"founder"|"investor";isPopular?:boolean;onMessageSent?:()=>void }
export function InstantMessageDialog({open,onOpenChange,receiverId,receiverName,onMessageSent}:Props) {
 const billing=useBilling();const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const request=useRef<string|null>(null); const sending=useRef(false);
 const send=async()=>{
  if(sending.current||!message.trim())return;
  sending.current=true;setBusy(true);setError("");request.current??=crypto.randomUUID();
  try {
   await billingRpc("billing_send_instant",{p_target:receiverId,p_content:message,p_request:request.current});
   request.current=null;setMessage("");await billing.refresh();onOpenChange(false);onMessageSent?.();
  } catch(e){setError(e instanceof Error?e.message:"Could not send your message. Retrying will not spend another credit.");}
  finally{sending.current=false;setBusy(false);}
 };
 return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="cf"><DialogHeader><DialogTitle>Start the conversation.</DialogTitle><DialogDescription>Connect with {receiverName} and send an opening message. This uses one instant-message credit.</DialogDescription></DialogHeader><p className="note">{billing.loading?"Checking balance…":billing.entitlement.credits+" credits available"}</p><label htmlFor="instant-content">Your message</label><textarea id="instant-content" className="price-input" value={message} disabled={busy} maxLength={4000} onChange={e=>{setMessage(e.target.value);request.current=null;}} rows={5}/>{error&&<p role="alert">{error}</p>}{billing.entitlement.credits<1?<Link to="/pricing" className="btn" onClick={()=>onOpenChange(false)}>Get instant messages</Link>:<button className="btn" disabled={busy||!message.trim()||billing.loading} onClick={()=>void send()}>{busy?"Sending…":"Connect & send"}</button>}</DialogContent></Dialog>;
}
