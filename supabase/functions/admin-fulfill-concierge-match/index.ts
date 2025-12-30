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
    
    console.log('Admin verified:', user.id);
    
    // Parse request body
    const { manualMatchId, matchedUserId, introMessage } = await req.json();
    
    if (!manualMatchId || !matchedUserId) {
      throw new Error('Missing required fields: manualMatchId and matchedUserId');
    }
    
    console.log('Fulfilling match:', { manualMatchId, matchedUserId });
    
    // 1. Get the manual_match record
    const { data: manualMatch, error: matchError } = await supabaseAdmin
      .from('manual_matches')
      .select('*')
      .eq('id', manualMatchId)
      .single();
    
    if (matchError || !manualMatch) {
      throw new Error('Manual match not found');
    }
    
    const requesterId = manualMatch.requester_id;
    console.log('Requester ID:', requesterId);
    
    // 2. Get user types to determine who sends the intro message
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, user_type, name')
      .in('id', [requesterId, matchedUserId]);
    
    if (profilesError || !profiles || profiles.length !== 2) {
      throw new Error('Could not fetch user profiles');
    }
    
    const requesterProfile = profiles.find(p => p.id === requesterId);
    const matchedProfile = profiles.find(p => p.id === matchedUserId);
    
    console.log('Profiles:', { requester: requesterProfile?.user_type, matched: matchedProfile?.user_type });
    
    // 3. Create mutual swipes (force 'like' action, upsert to handle existing swipes)
    // Swipe from requester to matched user
    const { error: swipe1Error } = await supabaseAdmin
      .from('swipes')
      .upsert({
        swiper_id: requesterId,
        swiped_id: matchedUserId,
        action: 'like'
      }, { 
        onConflict: 'swiper_id,swiped_id',
        ignoreDuplicates: false // Force update to 'like' if exists
      });
    
    if (swipe1Error) {
      console.log('Swipe 1 error (may be ok if duplicate):', swipe1Error.message);
    }
    
    // Swipe from matched user to requester
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
    
    if (swipe2Error) {
      console.log('Swipe 2 error (may be ok if duplicate):', swipe2Error.message);
    }
    
    console.log('Mutual swipes created/updated');
    
    // 4. Create match record (sorted user IDs for consistency)
    const [user1Id, user2Id] = [requesterId, matchedUserId].sort();
    
    const { data: existingMatch, error: existingMatchError } = await supabaseAdmin
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
      
      if (newMatchError) {
        console.log('Match insert error:', newMatchError.message);
      } else {
        matchRecordId = newMatch?.id;
        console.log('Match record created:', matchRecordId);
      }
    } else {
      console.log('Match record already exists:', matchRecordId);
    }
    
    // 5. Create intro message if none exists
    // Check existing messages between the pair
    const { data: existingMessages, error: msgCheckError } = await supabaseAdmin
      .from('messages')
      .select('id')
      .or(`and(sender_id.eq.${requesterId},receiver_id.eq.${matchedUserId}),and(sender_id.eq.${matchedUserId},receiver_id.eq.${requesterId})`)
      .limit(1);
    
    let introSent = false;
    
    if (!existingMessages || existingMessages.length === 0) {
      // Determine sender: investor should message first (so Basic founders can reply)
      // If requester is founder and matched is investor -> investor (matched) sends
      // If requester is investor and matched is founder -> investor (requester) sends
      // Otherwise: requester sends
      let senderId = requesterId;
      let receiverId = matchedUserId;
      
      if (requesterProfile?.user_type === 'founder' && matchedProfile?.user_type === 'investor') {
        senderId = matchedUserId;
        receiverId = requesterId;
      }
      
      const defaultIntro = introMessage || `You've been introduced via Premium Match. Say hello and set up a time to chat!`;
      
      const { error: msgError } = await supabaseAdmin
        .from('messages')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          content: defaultIntro,
          read: false
        });
      
      if (msgError) {
        console.log('Message insert error:', msgError.message);
      } else {
        introSent = true;
        console.log('Intro message sent from', senderId, 'to', receiverId);
        
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
    } else {
      console.log('Messages already exist between users');
    }
    
    // 6. Update manual_matches record
    const { error: updateError } = await supabaseAdmin
      .from('manual_matches')
      .update({
        matched_user_id: matchedUserId,
        payment_status: 'fulfilled',
        fulfilled_at: new Date().toISOString(),
        fulfilled_by: user.id
      })
      .eq('id', manualMatchId);
    
    if (updateError) {
      throw new Error('Failed to update manual_matches: ' + updateError.message);
    }
    
    console.log('Manual match fulfilled successfully');
    
    return new Response(JSON.stringify({
      ok: true,
      repaired: {
        swipesCreated: true,
        matchEnsured: !!matchRecordId,
        introSent
      }
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
