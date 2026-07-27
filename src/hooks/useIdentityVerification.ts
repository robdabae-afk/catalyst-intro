import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type VerificationStatus = "unverified" | "pending" | "approved" | "rejected";

export interface IdentityVerificationRecord {
  id: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}

export function useIdentityVerification(userId: string | null | undefined) {
  const [record, setRecord] = useState<IdentityVerificationRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await (supabase as any)
      .from("identity_verifications")
      .select("id, status, rejection_reason, submitted_at, reviewed_at")
      .eq("profile_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setRecord(data ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const status: VerificationStatus = record?.status ?? "unverified";

  const submit = async (idPhoto: Blob, selfiePhoto: Blob) => {
    if (!userId) return { ok: false, error: "Not signed in" };

    const stamp = Date.now();
    const idPath = `${userId}/${stamp}/id-document.jpg`;
    const selfiePath = `${userId}/${stamp}/selfie.jpg`;

    const { error: idErr } = await supabase.storage
      .from("id-verification")
      .upload(idPath, idPhoto, { contentType: "image/jpeg" });
    if (idErr) return { ok: false, error: idErr.message };

    const { error: selfieErr } = await supabase.storage
      .from("id-verification")
      .upload(selfiePath, selfiePhoto, { contentType: "image/jpeg" });
    if (selfieErr) return { ok: false, error: selfieErr.message };

    const { error: insertErr } = await (supabase as any).from("identity_verifications").insert({
      profile_id: userId,
      id_document_url: idPath,
      selfie_url: selfiePath,
      status: "pending",
    });
    if (insertErr) return { ok: false, error: insertErr.message };

    await refetch();
    return { ok: true };
  };

  return { status, record, loading, submit, refetch };
}

export async function getSignedVerificationUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from("id-verification").createSignedUrl(path, 300);
  return data?.signedUrl ?? null;
}
