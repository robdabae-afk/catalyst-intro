import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Heart, Search, Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface Match {
  id: string;
  user_1_id: string;
  user_2_id: string;
  created_at: string;
  first_message_at: string | null;
  status: string;
  user1_name: string;
  user2_name: string;
}

export const AdminMatchFeedbackPanel = () => {
  const { toast } = useToast();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const { data: matchesData, error } = await supabase
        .from('matches')
        .select('id, user_1_id, user_2_id, created_at, first_message_at, status')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (!matchesData || matchesData.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      // Get all unique user IDs
      const userIds = [
        ...new Set([
          ...matchesData.map(m => m.user_1_id),
          ...matchesData.map(m => m.user_2_id)
        ])
      ];

      // Fetch profile names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      const profileMap = profiles?.reduce((acc, p) => ({ ...acc, [p.id]: p.name }), {}) || {};

      const formattedMatches = matchesData.map((match) => ({
        id: match.id,
        user_1_id: match.user_1_id,
        user_2_id: match.user_2_id,
        created_at: match.created_at,
        first_message_at: match.first_message_at,
        status: match.status,
        user1_name: profileMap[match.user_1_id] || 'Unknown',
        user2_name: profileMap[match.user_2_id] || 'Unknown',
      }));

      setMatches(formattedMatches);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error loading matches',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerFeedbackPrompt = async (matchId: string, userId: string) => {
    setSending(`${matchId}-${userId}`);
    try {
      const { error } = await supabase
        .from('match_feedback_prompts')
        .upsert({
          match_id: matchId,
          user_id: userId,
          admin_requested_at: new Date().toISOString(),
          last_prompt_at: new Date().toISOString()
        }, { onConflict: 'match_id,user_id' });

      if (error) throw error;

      toast({
        title: 'Feedback prompt triggered',
        description: 'The user will see the feedback modal on their next visit.'
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error triggering prompt',
        description: error.message
      });
    } finally {
      setSending(null);
    }
  };

  const filteredMatches = matches.filter(match => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      match.user1_name.toLowerCase().includes(query) ||
      match.user2_name.toLowerCase().includes(query) ||
      match.id.toLowerCase().includes(query)
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5" />
          Match Feedback Management
        </CardTitle>
        <CardDescription>
          Trigger feedback prompts for specific matches. Users will see the feedback modal on their next visit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by user name or match ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={loadMatches}
              disabled={loading}
            >
              <Loader2 className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
              Loading matches...
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No matches found</p>
              {searchQuery && (
                <p className="text-sm mt-1">Try adjusting your search query</p>
              )}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Match ID</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>First Message</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatches.map((match) => (
                    <TableRow key={match.id}>
                      <TableCell className="font-mono text-xs">
                        {match.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{match.user1_name}</div>
                          <div className="text-sm text-muted-foreground">{match.user2_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(match.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {match.first_message_at ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => triggerFeedbackPrompt(match.id, match.user_1_id)}
                            disabled={sending === `${match.id}-${match.user_1_id}`}
                          >
                            {sending === `${match.id}-${match.user_1_id}` ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4 mr-1" />
                            )}
                            {match.user1_name.split(' ')[0]}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => triggerFeedbackPrompt(match.id, match.user_2_id)}
                            disabled={sending === `${match.id}-${match.user_2_id}`}
                          >
                            {sending === `${match.id}-${match.user_2_id}` ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4 mr-1" />
                            )}
                            {match.user2_name.split(' ')[0]}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

