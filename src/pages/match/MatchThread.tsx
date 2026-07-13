import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MatchLayout } from "@/match/MatchLayout";
import { useMatchSession } from "@/match/useMatchSession";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText } from "lucide-react";

const DOC_TYPES = [
  { v: "pitch_deck", l: "Pitch Deck" },
  { v: "cap_table", l: "Cap Table" },
  { v: "incorporation", l: "Incorporation Docs" },
  { v: "financials", l: "Financials" },
  { v: "other", l: "Other" },
];

export default function MatchThread() {
  const { id: threadId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId, profile, loading } = useMatchSession();
  const [thread, setThread] = useState<any>(null);
  const [other, setOther] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [docRequests, setDocRequests] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [docType, setDocType] = useState("pitch_deck");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!userId) { navigate("/match/auth"); return; }
    if (!threadId) return;
    load();
  }, [userId, threadId, loading]);

  useEffect(() => {
    if (!threadId) return;
    const ch = supabase.channel(`match-thread-${threadId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "match_messages", filter: `thread_id=eq.${threadId}` },
        (p) => setMessages(prev => [...prev, p.new]))
      .on("postgres_changes", { event: "*", schema: "public", table: "match_document_requests", filter: `thread_id=eq.${threadId}` },
        () => loadDocRequests())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [threadId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const load = async () => {
    const { data: t } = await (supabase as any).from("match_threads").select("*").eq("id", threadId).maybeSingle();
    if (!t) { navigate("/match/inbox"); return; }
    setThread(t);
    const otherId = t.investor_id === userId ? t.founder_id : t.investor_id;
    const { data: o } = await (supabase as any).from("match_profiles").select("*").eq("id", otherId).maybeSingle();
    setOther(o);
    const { data: msgs } = await (supabase as any).from("match_messages").select("*").eq("thread_id", threadId).order("created_at");
    setMessages(msgs ?? []);
    loadDocRequests();
  };

  const loadDocRequests = async () => {
    const { data } = await (supabase as any).from("match_document_requests").select("*").eq("thread_id", threadId).order("created_at", { ascending: false });
    setDocRequests(data ?? []);
  };

  const send = async () => {
    if (!input.trim() || !userId || !threadId) return;
    const content = input.trim();
    setInput("");
    const { error } = await (supabase as any).from("match_messages").insert({ thread_id: threadId, sender_id: userId, content });
    if (error) toast.error(error.message);
  };

  const requestDoc = async () => {
    if (!userId || !threadId || !thread) return;
    const { error } = await (supabase as any).from("match_document_requests").insert({
      thread_id: threadId, requester_id: userId, founder_id: thread.founder_id, doc_type: docType,
    });
    if (error) toast.error(error.message); else toast.success("Request sent");
  };

  const uploadDoc = async (req: any, file: File) => {
    if (!threadId) return;
    const safeName = file.name.replace(/[^\w.\-]+/g, "_");
    const path = `${threadId}/${req.id}-${safeName}`;
    const { error } = await supabase.storage.from("match-documents").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    const { error: updErr } = await (supabase as any).from("match_document_requests")
      .update({ status: "fulfilled", file_path: path, fulfilled_at: new Date().toISOString() })
      .eq("id", req.id);
    if (updErr) { toast.error(updErr.message); return; }
    toast.success("Document shared");
    loadDocRequests();
  };

  const sendDocProactive = async (file: File) => {
    if (!userId || !threadId || !thread) return;
    const { data: req, error: insErr } = await (supabase as any)
      .from("match_document_requests")
      .insert({ thread_id: threadId, requester_id: userId, founder_id: thread.founder_id, doc_type: docType })
      .select()
      .single();
    if (insErr || !req) { toast.error(insErr?.message ?? "Failed to create record"); return; }
    await uploadDoc(req, file);
  };


  const downloadDoc = async (req: any) => {
    if (!req.file_path) return;
    const { data, error } = await supabase.storage.from("match-documents").createSignedUrl(req.file_path, 60);
    if (error) { toast.error(error.message); return; }
    window.open(data.signedUrl, "_blank");
  };

  const isFounder = thread && userId === thread.founder_id;

  return (
    <MatchLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col" style={{ height: "calc(100vh - 60px)" }}>
        <div className="flex items-center gap-3 pb-4 border-b border-white/10">
          {other?.avatar_url ? <img src={other.avatar_url} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-white/10" />}
          <div className="flex-1">
            <div className="font-semibold">{other?.name}</div>
            <div className="text-xs text-white/50 capitalize">{other?.role}</div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon" className="relative bg-white/5 border-white/10" title="Documents">
                <FileText className="w-4 h-4" />
                {docRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-white text-black text-[10px] rounded-full w-4 h-4 flex items-center justify-center">{docRequests.length}</span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Documents</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{DOC_TYPES.map(d => <SelectItem key={d.v} value={d.v}>{d.l}</SelectItem>)}</SelectContent>
                  </Select>
                  {isFounder ? (
                    <label className="cursor-pointer">
                      <span className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm whitespace-nowrap">Send</span>
                      <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && sendDocProactive(e.target.files[0])} />
                    </label>
                  ) : (
                    <Button size="sm" onClick={requestDoc}>Request</Button>
                  )}
                </div>
                {docRequests.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center">No documents yet.</div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {docRequests.map(req => (
                      <Card key={req.id} className="p-3 flex items-center gap-3">
                        <div className="flex-1 text-sm">
                          <div className="font-medium">{DOC_TYPES.find(d => d.v === req.doc_type)?.l}</div>
                          <Badge variant="outline" className="mt-1 capitalize">{req.status}</Badge>
                        </div>
                        {req.status === "pending" && isFounder && (
                          <label className="cursor-pointer">
                            <span className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm">Upload</span>
                            <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && uploadDoc(req, e.target.files[0])} />
                          </label>
                        )}
                        {req.status === "fulfilled" && req.file_path && (
                          <Button size="sm" variant="outline" onClick={() => downloadDoc(req)}>Download</Button>
                        )}
                      </Card>
                    ))}

                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-2">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.sender_id === userId ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-lg ${m.sender_id === userId ? "bg-white text-black" : "bg-white/10 text-white"}`}>
                {m.content}
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message…" className="bg-white/5 border-white/10" />
          <Button type="submit" className="bg-white text-black hover:bg-white/90">Send</Button>
        </form>

      </div>
    </MatchLayout>
  );
}
