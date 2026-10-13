import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Token costs for instant messages
const TOKEN_COST = 30; // Uniform cost for all users

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-INSTANT-MESSAGE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseAuth.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('User authenticated', { userId: user.id });

    const body = await req.json();
    const { receiverId, content } = body;

    if (!receiverId || !content || !content.trim()) {
      return new Response(
        JSON.stringify({ error: 'Receiver ID and message content required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Shared atomic wallet debit + legacy inbox insert. Cached clients keep their shape.
    const {data, error} = await supabaseAdmin.rpc("billing_legacy_instant", {
      p_user:user.id, p_target:receiverId, p_content:content,
      p_request:body.requestId || crypto.randomUUID(),
    });
    if (error) throw error;
    return new Response(JSON.stringify(data), {status:200,headers:{...corsHeaders,'Content-Type':'application/json'}});

  } catch (error: any) {
    logStep('Error', { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


