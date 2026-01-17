import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-TOKEN-PRODUCTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
    if (!STRIPE_SECRET_KEY) {
      return new Response(
        JSON.stringify({ error: 'Stripe not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
    });

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check for admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: { user } } = await supabaseAuth.auth.getUser(token);
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    // For now, allow any authenticated user to run this (you can restrict to admins later)
    // In production, add: if (!has_role(user.id, 'admin')) return error

    // Get token packages from database
    const { data: packages, error: packagesError } = await supabaseAdmin
      .from('token_packages')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (packagesError) throw packagesError;
    if (!packages || packages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No token packages found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep('Creating Stripe products and prices', { packageCount: packages.length });

    const results = [];

    for (const pkg of packages) {
      try {
        // Create or get product
        let product;
        const productName = `Token Pack: ${pkg.name}`;
        
        // Check if product already exists (by name)
        const existingProducts = await stripe.products.list({
          limit: 100,
        });
        
        const existingProduct = existingProducts.data.find(
          (p: { name: string; active: boolean }) => p.name === productName && p.active
        );

        if (existingProduct) {
          product = existingProduct;
          logStep('Using existing product', { productId: product.id, name: productName });
        } else {
          product = await stripe.products.create({
            name: productName,
            description: `${pkg.tokens} tokens`,
            metadata: {
              token_package_id: pkg.id,
              tokens: pkg.tokens.toString(),
            },
          });
          logStep('Created product', { productId: product.id, name: productName });
        }

        // Create price if it doesn't exist
        let price;
        if (pkg.stripe_price_id) {
          try {
            price = await stripe.prices.retrieve(pkg.stripe_price_id);
            logStep('Using existing price', { priceId: price.id });
          } catch {
            // Price doesn't exist, create new one
            price = null;
          }
        }

        if (!price) {
          price = await stripe.prices.create({
            product: product.id,
            unit_amount: pkg.price_cents,
            currency: 'usd',
            metadata: {
              token_package_id: pkg.id,
              tokens: pkg.tokens.toString(),
            },
          });
          logStep('Created price', { priceId: price.id, amount: pkg.price_cents });

          // Update package with price ID
          await supabaseAdmin
            .from('token_packages')
            .update({ stripe_price_id: price.id })
            .eq('id', pkg.id);
        }

        results.push({
          packageId: pkg.id,
          packageName: pkg.name,
          productId: product.id,
          priceId: price.id,
          tokens: pkg.tokens,
          amount: pkg.price_cents,
        });
      } catch (error: any) {
        logStep('Error creating product/price', { packageId: pkg.id, error: error.message });
        results.push({
          packageId: pkg.id,
          packageName: pkg.name,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    logStep('Error', { error: error.message, stack: error.stack });
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});


