import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const accounts = [
    {
      email: "test.founder@catalyst.test",
      password: "test1234",
      meta: {
        user_type: "founder",
        name: "Test Founder",
        startup_name: "Acme Labs",
        one_liner: "AI-powered widgets for modern teams.",
        preferred_city: "San Francisco, CA",
        stage: "seed",
        industry: ["AI", "Fintech"],
        legal_accepted_at: new Date().toISOString(),
      },
    },
    {
      email: "test.investor@catalyst.test",
      password: "test1234",
      meta: {
        user_type: "investor",
        name: "Test Investor",
        firm_name: "Catalyst Capital",
        position: "Partner",
        location: "New York, NY",
        preferred_stage: "seed",
        sectors_of_interest: ["AI", "Fintech"],
        legal_accepted_at: new Date().toISOString(),
      },
    },
  ];

  const results: any[] = [];
  for (const a of accounts) {
    // delete if exists
    const { data: existing } = await admin.auth.admin.listUsers();
    const found = existing?.users.find((u) => u.email === a.email);
    if (found) await admin.auth.admin.deleteUser(found.id);

    const { data, error } = await admin.auth.admin.createUser({
      email: a.email,
      password: a.password,
      email_confirm: true,
      user_metadata: a.meta,
    });
    if (error) {
      results.push({ email: a.email, error: error.message });
      continue;
    }
    const uid = data.user!.id;
    // approve role
    await admin.from("user_roles").insert({ user_id: uid, role: "user" as any });
    results.push({ email: a.email, password: a.password, id: uid });
  }

  return new Response(JSON.stringify({ results }, null, 2), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
