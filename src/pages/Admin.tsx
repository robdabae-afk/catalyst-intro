import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Shield, UserCheck, UserX, Crown, ArrowLeft, MessageCircle, Megaphone, Sparkles, Eye, Edit, XCircle, Mail, Gift, EyeOff, Star, DollarSign, Heart, Download, CheckCircle2, Circle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminSupportPanel } from "@/components/AdminSupportPanel";
import { AdminAdPanel } from "@/components/AdminAdPanel";
import { AdminUserSubscriptions } from "@/components/AdminUserSubscriptions";
import { AdminProfilePreview } from "@/components/AdminProfilePreview";
import { AdminEditSuggestion } from "@/components/AdminEditSuggestion";
import { AdminEmailComposer } from "@/components/AdminEmailComposer";
import { AdminReferralPanel } from "@/components/AdminReferralPanel";
import { AdminConciergePanel } from "@/components/AdminConciergePanel";
import { AdminFeedbackPanel } from "@/components/AdminFeedbackPanel";
import { AdminMatchFeedbackPanel } from "@/components/AdminMatchFeedbackPanel";
import { AdminRevenueTracker } from "@/components/AdminRevenueTracker";
import { AdminDeckLeadsPanel } from "@/components/AdminDeckLeadsPanel";
import { AdminTestDataSeeder } from "@/components/AdminTestDataSeeder";

interface UserWithStatus {
  id: string;
  name: string;
  email: string;
  user_type: 'founder' | 'investor';
  created_at: string;
  roles: { role: string }[];
  subscription_status: string | null;
  subscription_plan: string | null;
  subscription_expires_at: string | null;
  weekly_spotlight_used_at: string | null;
  has_pending_update: boolean | null;
  last_profile_update_at: string | null;
  is_hidden: boolean;
  hidden_at: string | null;
  // TODO: These columns don't exist in the database yet
  is_verified?: boolean;
  is_featured?: boolean;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isLoading: adminLoading } = useIsAdmin();
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [useTestMode, setUseTestMode] = useState(false); // Test Mode State
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [subscriptionDialogUser, setSubscriptionDialogUser] = useState<UserWithStatus | null>(null);
  const [previewUser, setPreviewUser] = useState<UserWithStatus | null>(null);
  const [editSuggestionUser, setEditSuggestionUser] = useState<UserWithStatus | null>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/dashboard');
      return;
    }

    if (isAdmin) {
      loadUsers();
      checkTestMode();
    }
  }, [isAdmin, adminLoading, navigate]);

  const checkTestMode = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('is_test_mode').eq('id', user.id).single();
      if (data) setUseTestMode(data.is_test_mode || false);
    }
  };

  const handleToggleVerification = async (userId: string, currentStatus: boolean) => {
    // TODO: is_verified column doesn't exist yet
    toast({ variant: "destructive", title: "Not available", description: "is_verified column not in database" });
    return;
    try {
      const error = null; // Skip until column exists

      if (error) throw error;

      // Refresh users list
      await loadUsers();

      toast({
        title: currentStatus ? "User unverified" : "User verified",
        description: `Verification status updated successfully.`
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message
      });
    }
  };

  const handleToggleFeatured = async (userId: string, currentStatus: boolean) => {
    // TODO: is_featured column doesn't exist yet
    toast({ variant: "destructive", title: "Not available", description: "is_featured column not in database" });
    return;
    try {
      const error = null; // Skip until column exists

      if (error) throw error;

      await loadUsers();

      toast({
        title: !currentStatus ? "User Featured" : "User Feature Removed",
        description: !currentStatus
          ? "User will now appear with the Featured header."
          : "User removed from Featured list."
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message
      });
    }
  };

  const handleTestModeToggle = async (checked: boolean) => {
    setUseTestMode(checked);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ is_test_mode: checked }).eq('id', user.id);
      toast({ title: checked ? "Test Mode Enabled" : "Test Mode Disabled" });
    }
  };

  const loadUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        roles: roles?.filter(r => r.user_id === profile.id).map(r => ({ role: r.role })) || []
      })) || [];

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading users",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async (userId: string, type: "approved" | "denied" | "edit_suggestion", editSuggestion?: string, editMessage?: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-admin-notification', {
        body: { userId, type, editSuggestion, editMessage }
      });
      if (error) {
        console.error('Error sending notification:', error);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const approveUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'user' });

      if (error) throw error;

      // Send approval email
      await sendNotification(userId, 'approved');

      toast({
        title: "User approved",
        description: "The user can now access the platform."
      });

      loadUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error approving user",
        description: error.message
      });
    } finally {
      setActionLoading(null);
    }
  };

  const makeAdmin = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (error) throw error;

      toast({
        title: "Admin role granted",
        description: "The user now has admin privileges."
      });

      loadUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error granting admin role",
        description: error.message
      });
    } finally {
      setActionLoading(null);
    }
  };

  const revokeAccess = async (userId: string) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'user');

      if (error) throw error;

      toast({
        title: "Access revoked",
        description: "The user can no longer access the platform."
      });

      loadUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error revoking access",
        description: error.message
      });
    } finally {
      setActionLoading(null);
    }
  };

  const denyUser = async (userId: string) => {
    setActionLoading(userId);
    try {
      // Clear any pending update flags when denying
      const { error } = await supabase
        .from('profiles')
        .update({
          has_pending_update: false,
          admin_edit_suggestion: null,
          admin_edit_message: null
        })
        .eq('id', userId);

      if (error) throw error;

      // Send denial email
      await sendNotification(userId, 'denied');

      toast({
        title: "User denied",
        description: "The user application has been denied."
      });

      loadUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error denying user",
        description: error.message
      });
    } finally {
      setActionLoading(null);
    }
  };

  const clearUpdateFlag = async (userId: string) => {
    try {
      await supabase
        .from('profiles')
        .update({ has_pending_update: false })
        .eq('id', userId);
      loadUsers();
    } catch (error) {
      console.error('Error clearing update flag:', error);
    }
  };

  const toggleHideProfile = async (userId: string, currentlyHidden: boolean) => {
    setActionLoading(userId);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('profiles')
        .update({
          is_hidden: !currentlyHidden,
          hidden_at: !currentlyHidden ? new Date().toISOString() : null,
          hidden_by: !currentlyHidden ? user?.id : null
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: currentlyHidden ? "Profile unhidden" : "Profile hidden",
        description: currentlyHidden
          ? "The user will now appear in discovery."
          : "The user is now hidden from discovery."
      });

      loadUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating profile visibility",
        description: error.message
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatus = (roles: { role: string }[]) => {
    if (roles.some(r => r.role === 'admin')) return 'admin';
    if (roles.some(r => r.role === 'user')) return 'approved';
    return 'pending';
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const pendingUsers = users.filter(u => getStatus(u.roles) === 'pending');
  const approvedUsers = users.filter(u => getStatus(u.roles) !== 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Admin Dashboard
              </h1>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Test Mode Toggle */}
        <div className="mb-6 flex items-center justify-between bg-card p-4 rounded-lg border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-2 rounded-full">
              <Shield className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className="font-medium">Test Mode</h3>
              <p className="text-sm text-muted-foreground">View dashboard as if you are a test user (filters organic profiles)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={useTestMode ? "default" : "outline"} className={useTestMode ? "bg-amber-500 hover:bg-amber-600" : ""}>
              {useTestMode ? "Enabled" : "Disabled"}
            </Badge>
            <Button
              variant={useTestMode ? "destructive" : "default"}
              size="sm"
              onClick={() => handleTestModeToggle(!useTestMode)}
            >
              {useTestMode ? "Disable Test Mode" : "Enable Test Mode"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-9 max-w-6xl">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="concierge" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Concierge
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Referrals
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Feedback
            </TabsTrigger>
            <TabsTrigger value="match-feedback" className="flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Match Feedback
            </TabsTrigger>
            <TabsTrigger value="ads" className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              Ads
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Support
            </TabsTrigger>
            <TabsTrigger value="deck-leads" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Deck Leads
            </TabsTrigger>
            <TabsTrigger value="test-data" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Test Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <AdminRevenueTracker />
          </TabsContent>

          <TabsContent value="feedback">
            <AdminFeedbackPanel />
          </TabsContent>

          <TabsContent value="match-feedback">
            <AdminMatchFeedbackPanel />
          </TabsContent>

          <TabsContent value="concierge">
            <AdminConciergePanel />
          </TabsContent>

          <TabsContent value="referrals">
            <AdminReferralPanel />
          </TabsContent>

          <TabsContent value="users" className="space-y-8">
            {/* Pending Approvals */}
            {pendingUsers.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
                  <UserCheck className="w-5 h-5 text-amber-500" />
                  Pending Approvals ({pendingUsers.length})
                </h2>
                <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Signed Up</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingUsers.map(user => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {user.has_pending_update && (
                                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" title="User made updates" />
                              )}
                              {user.name}
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {user.user_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPreviewUser(user)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditSuggestionUser(user)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Suggest Edit
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => approveUser(user.id)}
                              disabled={actionLoading === user.id}
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => denyUser(user.id)}
                              disabled={actionLoading === user.id}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Deny
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* All Users */}
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
                <Shield className="w-5 h-5" />
                All Users ({users.length})
              </h2>
              <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Visibility</TableHead>
                      <TableHead>Pro</TableHead>
                      <TableHead>Signed Up</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => {
                      const status = getStatus(user.roles);
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {user.has_pending_update && (
                                <span
                                  className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse cursor-pointer"
                                  title="User made updates - click to clear"
                                  onClick={() => clearUpdateFlag(user.id)}
                                />
                              )}
                              {user.name}
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {user.user_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={status === 'admin' ? 'default' : status === 'approved' ? 'secondary' : 'destructive'}
                              className="capitalize"
                            >
                              {status === 'admin' && <Crown className="w-3 h-3 mr-1" />}
                              {status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.is_hidden ? (
                              <Badge variant="destructive" className="cursor-pointer" onClick={() => toggleHideProfile(user.id, user.is_hidden)}>
                                <EyeOff className="w-3 h-3 mr-1" />
                                Hidden
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="cursor-pointer" onClick={() => toggleHideProfile(user.id, user.is_hidden)}>
                                <Eye className="w-3 h-3 mr-1" />
                                Visible
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.subscription_status === 'active' ? (
                              <Badge className="bg-amber-500 hover:bg-amber-500">
                                <Crown className="w-3 h-3 mr-1" />
                                Pro
                              </Badge>
                            ) : (
                              <Badge variant="outline">Free</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              {user.is_verified ? (
                                <Badge
                                  variant="default"
                                  className="cursor-pointer bg-green-600 hover:bg-green-700 w-fit"
                                  onClick={() => handleToggleVerification(user.id, user.is_verified)}
                                >
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="cursor-pointer w-fit"
                                  onClick={() => handleToggleVerification(user.id, user.is_verified)}
                                >
                                  <Circle className="w-3 h-3 mr-1" />
                                  Unverified
                                </Badge>
                              )}

                              {/* Featured Toggle */}
                              {user.user_type === 'founder' && (
                                user.is_featured ? (
                                  <Badge
                                    variant="default"
                                    className="cursor-pointer bg-[#C5A059] hover:bg-[#b08d4d] text-black w-fit"
                                    onClick={() => handleToggleFeatured(user.id, user.is_featured)}
                                  >
                                    <Star className="w-3 h-3 mr-1 fill-black" />
                                    Featured
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="cursor-pointer w-fit opacity-50 hover:opacity-100"
                                    onClick={() => handleToggleFeatured(user.id, user.is_featured)}
                                  >
                                    <Star className="w-3 h-3 mr-1" />
                                    Feature
                                  </Badge>
                                )
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setPreviewUser(user)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSubscriptionDialogUser(user)}
                            >
                              <Sparkles className="w-4 h-4 mr-1" />
                              Manage
                            </Button>
                            {status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => approveUser(user.id)}
                                disabled={actionLoading === user.id}
                              >
                                <UserCheck className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                            )}
                            {status === 'approved' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => makeAdmin(user.id)}
                                  disabled={actionLoading === user.id}
                                >
                                  <Crown className="w-4 h-4 mr-1" />
                                  Admin
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => revokeAccess(user.id)}
                                  disabled={actionLoading === user.id}
                                >
                                  <UserX className="w-4 h-4 mr-1" />
                                  Revoke
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ads">
            <AdminAdPanel />
          </TabsContent>

          <TabsContent value="email">
            <AdminEmailComposer />
          </TabsContent>

          <TabsContent value="support">
            <AdminSupportPanel />
          </TabsContent>

          <TabsContent value="deck-leads">
            <AdminDeckLeadsPanel />
          </TabsContent>

          <TabsContent value="test-data">
            <AdminTestDataSeeder />
          </TabsContent>
        </Tabs>
      </div>

      {/* Subscription Management Dialog */}
      {subscriptionDialogUser && (
        <AdminUserSubscriptions
          user={subscriptionDialogUser}
          open={!!subscriptionDialogUser}
          onOpenChange={(open) => !open && setSubscriptionDialogUser(null)}
          onUpdate={() => {
            loadUsers();
            setSubscriptionDialogUser(null);
          }}
        />
      )}

      {/* Profile Preview Dialog */}
      {previewUser && (
        <AdminProfilePreview
          userId={previewUser.id}
          userType={previewUser.user_type}
          open={!!previewUser}
          onOpenChange={(open) => !open && setPreviewUser(null)}
        />
      )}

      {/* Edit Suggestion Dialog */}
      {editSuggestionUser && (
        <AdminEditSuggestion
          userId={editSuggestionUser.id}
          userName={editSuggestionUser.name}
          open={!!editSuggestionUser}
          onOpenChange={(open) => !open && setEditSuggestionUser(null)}
          onSent={() => {
            loadUsers();
            setEditSuggestionUser(null);
          }}
        />
      )}
    </div>
  );
};

export default Admin;
