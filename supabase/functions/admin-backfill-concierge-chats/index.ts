import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key to bypass RLS
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create user client to verify the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }
    
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Get the calling user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized: Invalid user');
    }
    
    // Verify the user is an admin
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();
    
    if (roleError || !adminRole) {
      console.log('Admin check failed:', roleError?.message);
      throw new Error('Unauthorized: Admin access required');
    }
    
    console.log('Admin verified, starting backfill...');
    
    // Get all fulfilled manual matches with matched_user_id
    const { data: fulfilledMatches, error: matchesError } = await supabaseAdmin
      .from('manual_matches')
      .select('*')
      .eq('payment_status', 'fulfilled')
      .not('matched_user_id', 'is', null);
    
    if (matchesError) {
      throw new Error('Failed to fetch fulfilled matches: ' + matchesError.message);
    }
    
    console.log('Found', fulfilledMatches?.length || 0, 'fulfilled matches to backfill');
    
    const results = {
      total: fulfilledMatches?.length || 0,
      swipesCreated: 0,
      matchesCreated: 0,
      introsCreated: 0,
      errors: [] as string[]
    };
    
    // Get all user types upfront
    const allUserIds = new Set<string>();
    fulfilledMatches?.forEach(m => {
      allUserIds.add(m.requester_id);
      if (m.matched_user_id) allUserIds.add(m.matched_user_id);
    });
    
    const { data: allProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, user_type, name')
      .in('id', Array.from(allUserIds));
    
    const profileMap = new Map(allProfiles?.map(p => [p.id, p]) || []);
    
    for (const match of fulfilledMatches || []) {
      try {
        const requesterId = match.requester_id;
        const matchedUserId = match.matched_user_id;
        
        console.log('Processing match:', { requesterId, matchedUserId });
        
        const requesterProfile = profileMap.get(requesterId);
        const matchedProfile = profileMap.get(matchedUserId);
        
        // 1. Create mutual swipes
        const { error: swipe1Error } = await supabaseAdmin
          .from('swipes')
          .upsert({
            swiper_id: requesterId,
            swiped_id: matchedUserId,
            action: 'like'
          }, { 
            onConflict: 'swiper_id,swiped_id',
            ignoreDuplicates: false
          });
        
        if (!swipe1Error) results.swipesCreated++;
        
        const { error: swipe2Error } = await supabaseAdmin
          .from('swipes')
          .upsert({
            swiper_id: matchedUserId,
            swiped_id: requesterId,
            action: 'like'
          }, { 
            onConflict: 'swiper_id,swiped_id',
            ignoreDuplicates: false
          });
        
        if (!swipe2Error) results.swipesCreated++;
        
        // 2. Create match record
        const [user1Id, user2Id] = [requesterId, matchedUserId].sort();
        
        const { data: existingMatch } = await supabaseAdmin
          .from('matches')
          .select('id')
          .or(`and(user_1_id.eq.${user1Id},user_2_id.eq.${user2Id}),and(user_1_id.eq.${user2Id},user_2_id.eq.${user1Id})`)
          .maybeSingle();
        
        let matchRecordId = existingMatch?.id;
        
        if (!existingMatch) {
          const { data: newMatch, error: newMatchError } = await supabaseAdmin
            .from('matches')
            .insert({
              user_1_id: user1Id,
              user_2_id: user2Id,
              status: 'active'
            })
            .select('id')
            .single();
          
          if (!newMatchError && newMatch) {
            matchRecordId = newMatch.id;
            results.matchesCreated++;
          }
        }
        
        // 3. Create intro message if none exists
        const { data: existingMessages } = await supabaseAdmin
          .from('messages')
          .select('id')
          .or(`and(sender_id.eq.${requesterId},receiver_id.eq.${matchedUserId}),and(sender_id.eq.${matchedUserId},receiver_id.eq.${requesterId})`)
          .limit(1);
        
        if (!existingMessages || existingMessages.length === 0) {
          // Determine sender: investor should message first
          let senderId = requesterId;
          let receiverId = matchedUserId;
          
          if (requesterProfile?.user_type === 'founder' && matchedProfile?.user_type === 'investor') {
            senderId = matchedUserId;
            receiverId = requesterId;
          }
          
          const { error: msgError } = await supabaseAdmin
            .from('messages')
            .insert({
              sender_id: senderId,
              receiver_id: receiverId,
              content: `You've been introduced via Premium Match. Say hello and set up a time to chat!`,
              read: false
            });
          
          if (!msgError) {
            results.introsCreated++;
            
            // Update match record with first message info
            if (matchRecordId) {
              await supabaseAdmin
                .from('matches')
                .update({
                  first_message_sender_id: senderId,
                  first_message_at: new Date().toISOString()
                })
                .eq('id', matchRecordId)
                .is('first_message_sender_id', null);
            }
          }
        }
        
        console.log('Processed match successfully');
        
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error processing match:', errorMessage);
        results.errors.push(`Match ${match.id}: ${errorMessage}`);
      }
    }
    
    console.log('Backfill complete:', results);
    
    return new Response(JSON.stringify({
      ok: true,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error:', errorMessage);
    return new Response(JSON.stringify({
      ok: false,
      error: errorMessage
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
