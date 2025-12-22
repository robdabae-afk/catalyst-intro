import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Star, MessageSquare, Search, Loader2, Bell } from 'lucide-react';
import { format } from 'date-fns';

interface FeedbackWithProfile {
  id: string;
  user_id: string;
  rating: number;
  feedback_text: string | null;
  created_at: string;
  profile?: {
    name: string;
    email: string;
  };
}

export const AdminFeedbackPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState('');
  const [requestingUserId, setRequestingUserId] = useState<string | null>(null);

  // Fetch all feedback
  const { data: feedback, isLoading: loadingFeedback } = useQuery({
    queryKey: ['admin-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each feedback
      const userIds = [...new Set(data.map(f => f.user_id))];
      const profiles = await Promise.all(
        userIds.map(async (id) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', id)
            .single();
          return { id, profile };
        })
      );

      const profileMap = Object.fromEntries(
        profiles.map(p => [p.id, p.profile])
      );

      return data.map(f => ({
        ...f,
        profile: profileMap[f.user_id]
      })) as FeedbackWithProfile[];
    }
  });

  // Search for user to request feedback
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['search-users-feedback', searchEmail],
    queryFn: async () => {
      if (!searchEmail || searchEmail.length < 3) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email')
        .ilike('email', `%${searchEmail}%`)
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: searchEmail.length >= 3
  });

  // Request feedback mutation
  const requestFeedbackMutation = useMutation({
    mutationFn: async (userId: string) => {
      // First check if record exists
      const { data: existing } = await supabase
        .from('feedback_prompts')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('feedback_prompts')
          .update({ admin_requested_at: new Date().toISOString() })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('feedback_prompts')
          .insert({
            user_id: userId,
            admin_requested_at: new Date().toISOString()
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: 'Feedback request sent' });
      setSearchEmail('');
      setRequestingUserId(null);
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message
      });
      setRequestingUserId(null);
    }
  });

  const handleRequestFeedback = (userId: string) => {
    setRequestingUserId(userId);
    requestFeedbackMutation.mutate(userId);
  };

  const getRatingColor = (rating: number) => {
    if (rating <= 2) return 'destructive';
    if (rating === 3) return 'secondary';
    return 'default';
  };

  const averageRating = feedback && feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold flex items-center gap-2">
              <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
              {averageRating}
            </div>
            <p className="text-sm text-muted-foreground">Average Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              {feedback?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Total Responses</p>
          </CardContent>
        </Card>
      </div>

      {/* Request Feedback */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Request Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="pl-9"
            />
          </div>

          {searching && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Searching...
            </div>
          )}

          {searchResults && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleRequestFeedback(user.id)}
                    disabled={requestingUserId === user.id}
                  >
                    {requestingUserId === user.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Request'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feedback List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingFeedback ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : feedback && feedback.length > 0 ? (
            <div className="space-y-4">
              {feedback.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-lg border space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{item.profile?.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.profile?.email || item.user_id}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getRatingColor(item.rating)}>
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        {item.rating}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  {item.feedback_text && (
                    <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                      {item.feedback_text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No feedback yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
