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
    const path = `${threadId}/${req.id}-${file.name}`;
    const { error } = await supabase.storage.from("match-documents").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); return; }
    await (supabase as any).from("match_document_requests")
      .update({ status: "fulfilled", file_path: path, fulfilled_at: new Date().toISOString() })
      .eq("id", req.id);
    toast.success("Document shared");
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
          <div>
            <div className="font-semibold">{other?.name}</div>
            <div className="text-xs text-white/50 capitalize">{other?.role}</div>
          </div>
        </div>

        {docRequests.length > 0 && (
          <div className="py-3 border-b border-white/10 space-y-2">
            <div className="text-xs uppercase tracking-wider text-white/50">Document Requests</div>
            {docRequests.map(req => (
              <Card key={req.id} className="bg-white/5 border-white/10 p-3 flex items-center gap-3 text-white">
                <div className="flex-1 text-sm">
                  <div className="font-medium">{DOC_TYPES.find(d => d.v === req.doc_type)?.l}</div>
                  <Badge variant="outline" className="mt-1 capitalize">{req.status}</Badge>
                </div>
                {req.status === "pending" && isFounder && (
                  <label className="cursor-pointer">
                    <span className="px-3 py-1.5 bg-white text-black rounded text-sm">Upload</span>
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

        <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-2">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.sender_id === userId ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-lg ${m.sender_id === userId ? "bg-white text-black" : "bg-white/10 text-white"}`}>
                {m.content}
              </div>
            </div>
          ))}
        </div>

        {!isFounder && (
          <div className="flex items-center gap-2 pb-2">
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className="w-48 bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
              <SelectContent>{DOC_TYPES.map(d => <SelectItem key={d.v} value={d.v}>{d.l}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={requestDoc}>Request Document</Button>
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message…" className="bg-white/5 border-white/10" />
          <Button type="submit" className="bg-white text-black hover:bg-white/90">Send</Button>
        </form>
      </div>
    </MatchLayout>
  );
}
