import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FOUNDER = {
  email: "test.founder@catalystintro.com",
  password: "CatalystFounder!2026",
  name: "Test Founder",
  role: "founder" as const,
};

const INVESTOR = {
  email: "test.investor@catalystintro.com",
  password: "CatalystInvestor!2026",
  name: "Test Investor",
  role: "investor" as const,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const results: any[] = [];
    for (const u of [FOUNDER, INVESTOR]) {
      let userId: string | null = null;
      const { data: created, error: cErr } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { match_role: u.role, match_name: u.name },
      });
      if (cErr) {
        // If already exists, look it up
        const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
        const found = list.users.find((x: any) => x.email === u.email);
        if (!found) {
          results.push({ email: u.email, error: cErr.message });
          continue;
        }
        userId = found.id;
        // Reset password to known value
        await admin.auth.admin.updateUserById(userId, { password: u.password, email_confirm: true });
      } else {
        userId = created.user.id;
      }

      if (userId) {
        await admin.from("match_profiles").upsert({
          id: userId, role: u.role, name: u.name, email: u.email,
        });
        if (u.role === "founder") {
          await admin.from("match_founder_profiles").upsert({
            profile_id: userId,
            startup_name: "Test Ventures",
            one_liner: "Demo founder account for admin testing.",
            stage: "Seed",
            funding_amount: "$500K",
            location: "San Francisco, CA",
          }, { onConflict: "profile_id" });
        } else {
          await admin.from("match_investor_profiles").upsert({
            profile_id: userId,
            firm_name: "Test Capital",
            accreditation: "accredited",
            avg_check_size: "$25K – $100K",
            philosophy: "Demo investor account for admin testing.",
          }, { onConflict: "profile_id" });
        }
        results.push({ email: u.email, password: u.password, role: u.role, id: userId });
      }
    }

    return new Response(JSON.stringify({ ok: true, users: results }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
