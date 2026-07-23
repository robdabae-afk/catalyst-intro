import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Shield, UserCheck, UserX, Crown, ArrowLeft, MessageCircle, Megaphone, Sparkles, Eye, Edit, XCircle, Mail, Gift, EyeOff, Star, DollarSign, Heart, Download, CheckCircle2, Circle, BarChart3, Flag, Zap, CalendarDays, Newspaper, LogOut } from "lucide-react";
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
import { AdminReviewMode } from "@/components/AdminReviewMode";
import { AdminProfileReviewsPanel } from "@/components/AdminProfileReviewsPanel";
import { AdminEditSuggestion } from "@/components/AdminEditSuggestion";
import { AdminProfileEditor } from "@/components/AdminProfileEditor";
import { AdminEmailComposer } from "@/components/AdminEmailComposer";
import { AdminReferralPanel } from "@/components/AdminReferralPanel";
import { AdminConciergePanel } from "@/components/AdminConciergePanel";
import { AdminFeedbackPanel } from "@/components/AdminFeedbackPanel";
import { AdminMatchFeedbackPanel } from "@/components/AdminMatchFeedbackPanel";
import { AdminRevenueTracker } from "@/components/AdminRevenueTracker";
import { AdminDeckLeadsPanel } from "@/components/AdminDeckLeadsPanel";
import { AdminTestDataSeeder } from "@/components/AdminTestDataSeeder";
import { AdminAnalyticsPanel } from "@/components/AdminAnalyticsPanel";
import { AdminEventAttendeesPanel } from "@/components/AdminEventAttendeesPanel";
import { AdminMatchAnalyticsPanel } from "@/components/AdminMatchAnalyticsPanel";
import { AdminFeedPanel } from "@/components/AdminFeedPanel";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  early_access: boolean;
  is_flagged: boolean;
  rejection_reason: string | null;
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
  const [editProfileUser, setEditProfileUser] = useState<UserWithStatus | null>(null);
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'founder' | 'investor'>('all');
  const [denyDialogUser, setDenyDialogUser] = useState<UserWithStatus | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);

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
    try {
      // Cast to any to bypass type check until types are regenerated
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified: !currentStatus } as any)
        .eq('id', userId);

      if (error) throw error;

      // Refresh users list
      await loadUsers();

      toast({
        title: !currentStatus ? "User verified" : "User unverified",
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
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_featured: !currentStatus })
        .eq('id', userId);

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
      // Idempotent role grant — ignore duplicates when the user already has the role
      const { error: roleErr } = await supabase
        .from('user_roles')
        .upsert(
          { user_id: userId, role: 'user' },
          { onConflict: 'user_id,role', ignoreDuplicates: true }
        );

      if (roleErr) throw roleErr;

      // Clear stale review flags so the row leaves Pending / Needs Re-Review cleanly
      await supabase
        .from('profiles')
        .update({
          has_pending_update: false,
          admin_edit_suggestion: null,
          admin_edit_message: null,
          rejection_reason: null,
        } as any)
        .eq('id', userId);

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

  const revokeAdmin = async (userId: string) => {
    if (!confirm("Remove admin privileges from this user?")) return;
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');
      if (error) throw error;
      toast({ title: "Admin role revoked" });
      loadUsers();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error revoking admin", description: error.message });
    } finally {
      setActionLoading(null);
    }
  };

  const addAdminByEmail = async () => {
    const email = adminEmail.trim().toLowerCase();
    if (!email) return;
    setAddingAdmin(true);
    try {
      const { data: profile, error: lookupErr } = await supabase
        .from('profiles')
        .select('id, name, email')
        .ilike('email', email)
        .maybeSingle();
      if (lookupErr) throw lookupErr;
      if (!profile) {
        toast({ variant: "destructive", title: "User not found", description: `No account with email ${email}. They must sign up first.` });
        return;
      }
      // Ensure they have base 'user' role too (so they're approved)
      await supabase.from('user_roles').insert({ user_id: profile.id, role: 'user' });
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: profile.id, role: 'admin' });
      if (error && !error.message.toLowerCase().includes('duplicate')) throw error;
      toast({ title: "Admin added", description: `${profile.name || profile.email} is now an admin.` });
      setAdminEmail("");
      loadUsers();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error adding admin", description: error.message });
    } finally {
      setAddingAdmin(false);
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
      // Update status and reason. If the schema isn't migrated, this might fail. We'll try without rejection_reason if it does.
      let updateError;
      const { error: primaryError } = await supabase
        .from('profiles')
        .update({
          has_pending_update: false,
          admin_edit_suggestion: null,
          admin_edit_message: null,
          rejection_reason: rejectionReason || "Your profile does not meet our platform criteria at this time."
        } as any)
        .eq('id', userId);

      updateError = primaryError;

      // Fallback if rejection_reason column doesn't exist yet
      if (primaryError?.message?.includes("rejection_reason")) {
        const { error: fallbackError } = await supabase
          .from('profiles')
          .update({
            has_pending_update: false,
            admin_edit_suggestion: null,
            admin_edit_message: null
          })
          .eq('id', userId);
        updateError = fallbackError;
      }

      if (updateError) throw updateError;

      // Revoke any previously granted 'user' role so denial actually takes effect
      // even for users who were previously approved.
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'user');

      // Send denial email (will need backend function update to include reason)
      await sendNotification(userId, 'denied', undefined, rejectionReason);

      toast({
        title: "User denied",
        description: "The user application has been denied and they have been notified."
      });

      setDenyDialogUser(null);
      setRejectionReason("");
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

  const toggleFlagProfile = async (userId: string, currentlyFlagged: boolean) => {
    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_flagged: !currentlyFlagged
        } as any)
        .eq('id', userId);

      if (error) {
        if (error.message.includes("is_flagged")) {
          throw new Error("Schema update required. Please apply the Supabase migration for is_flagged.");
        }
        throw error;
      }

      toast({
        title: currentlyFlagged ? "Flag removed" : "Profile flagged",
        description: currentlyFlagged
          ? "The profile is no longer flagged."
          : "The profile has been flagged for further review."
      });

      loadUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error flagging profile",
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

  const getStatus = (user: UserWithStatus) => {
    if (user.roles.some(r => r.role === 'admin')) return 'admin';
    if (user.roles.some(r => r.role === 'user')) return 'approved';
    if (user.rejection_reason) return 'rejected';
    return 'pending';
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredUsers = userTypeFilter === 'all' ? users : users.filter(u => u.user_type === userTypeFilter);
  const pendingUsers = filteredUsers.filter(u => getStatus(u) === 'pending');
  const approvedUsers = filteredUsers.filter(u => getStatus(u) === 'approved' || getStatus(u) === 'admin');

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
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await supabase.auth.signOut();
                navigate('/');
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </Button>
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

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto justify-start w-full bg-muted p-1">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Reviews
            </TabsTrigger>
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
            <TabsTrigger value="event-attendees" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="match-analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Match Data
            </TabsTrigger>
            <TabsTrigger value="test-data" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Test Data
            </TabsTrigger>
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <Newspaper className="w-4 h-4" />
              Feed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="event-attendees">
            <AdminEventAttendeesPanel />
          </TabsContent>

          <TabsContent value="match-analytics">
            <AdminMatchAnalyticsPanel />
          </TabsContent>

          <TabsContent value="feed">
            <AdminFeedPanel />
          </TabsContent>



          <TabsContent value="analytics">
            <AdminAnalyticsPanel />
          </TabsContent>

          <TabsContent value="reviews">
            <AdminProfileReviewsPanel
              actionLoadingId={actionLoading}
              onApprove={approveUser}
              onRequestEdits={(u) => setEditSuggestionUser(u as any)}
              onReject={(u) => setDenyDialogUser(u as any)}
            />
          </TabsContent>

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
            {/* Add Admin by Email */}
            <div className="bg-card rounded-lg border border-border shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-foreground">
                <Crown className="w-5 h-5 text-amber-500" />
                Add Admin
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                Grant admin privileges to an existing user by email. The user must have signed up first.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm"
                  onKeyDown={(e) => { if (e.key === 'Enter') addAdminByEmail(); }}
                />
                <Button onClick={addAdminByEmail} disabled={addingAdmin || !adminEmail.trim()}>
                  <Crown className="w-4 h-4 mr-1" />
                  {addingAdmin ? "Adding..." : "Make Admin"}
                </Button>
              </div>
            </div>

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
                              {user.early_access && (
                                <span title="Paid Early Access" className="inline-flex">
                                  <Zap className="w-4 h-4 text-amber-500" />
                                </span>
                              )}
                              {user.has_pending_update && (
                                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" title="User made updates" />
                              )}
                              {user.is_flagged && (
                                <span title="Flagged Profile" className="inline-flex">
                                  <Flag className="w-4 h-4 text-red-500" />
                                </span>
                              )}
                              {user.name}
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize text-black bg-white hover:bg-gray-100">
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
                              onClick={() => setEditProfileUser(user)}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditSuggestionUser(user)}
                            >
                              Suggest
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
                              onClick={() => setDenyDialogUser(user)}
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
                  <Shield className="w-5 h-5" />
                  All Users ({filteredUsers.length})
                </h2>
                <div className="flex items-center gap-2">
                  {(['all', 'founder', 'investor'] as const).map((type) => (
                    <Button
                      key={type}
                      size="sm"
                      variant={userTypeFilter === type ? 'default' : 'outline'}
                      onClick={() => setUserTypeFilter(type)}
                      className="capitalize"
                    >
                      {type === 'all' ? 'All' : type === 'founder' ? 'Founders' : 'Investors'}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                <div className="divide-y divide-border">
                  {filteredUsers.map(user => {
                    const status = getStatus(user);
                    return (
                      <div
                        key={user.id}
                        className={`grid grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(220px,1.2fr)_minmax(210px,0.85fr)_minmax(220px,0.9fr)_minmax(280px,1.15fr)] ${user.is_flagged ? "bg-destructive/5" : ""}`}
                      >
                        <div className="min-w-0 space-y-2">
                          <div className="flex min-w-0 items-center gap-2 font-medium">
                            {user.early_access && (
                              <span title="Paid Early Access" className="inline-flex shrink-0">
                                <Zap className="w-4 h-4 text-amber-500" />
                              </span>
                            )}
                            {user.has_pending_update && (
                              <button
                                type="button"
                                className="h-3 w-3 shrink-0 rounded-full bg-destructive animate-pulse"
                                title="User made updates - click to clear"
                                onClick={() => clearUpdateFlag(user.id)}
                              />
                            )}
                            <span className={`truncate ${user.is_flagged ? "text-destructive" : ""}`}>{user.name}</span>
                          </div>
                          <div className="break-words text-sm text-muted-foreground">{user.email}</div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="capitalize">
                              {user.user_type}
                            </Badge>
                            <Badge variant="outline">
                              {new Date(user.created_at).toLocaleDateString()}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 self-start sm:max-w-sm lg:max-w-none">
                          <Badge
                            variant={status === 'admin' ? 'default' : status === 'approved' ? 'secondary' : status === 'rejected' ? 'destructive' : 'outline'}
                            className="h-10 justify-center capitalize"
                          >
                            {status === 'admin' && <Crown className="w-3 h-3 mr-1" />}
                            {status}
                          </Badge>
                          {user.subscription_status === 'active' ? (
                            <Badge className="h-10 justify-center bg-primary hover:bg-primary">
                              <Crown className="w-3 h-3 mr-1" />
                              Pro
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="h-10 justify-center">Free</Badge>
                          )}
                          {user.is_hidden ? (
                            <Badge variant="destructive" className="h-10 cursor-pointer justify-center" onClick={() => toggleHideProfile(user.id, user.is_hidden)}>
                              <EyeOff className="w-3 h-3 mr-1" />
                              Hidden
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="h-10 cursor-pointer justify-center" onClick={() => toggleHideProfile(user.id, user.is_hidden)}>
                              <Eye className="w-3 h-3 mr-1" />
                              Visible
                            </Badge>
                          )}
                          {user.is_verified ? (
                            <Badge
                              variant="default"
                              className="h-10 cursor-pointer justify-center"
                              onClick={() => handleToggleVerification(user.id, user.is_verified)}
                            >
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="h-10 cursor-pointer justify-center"
                              onClick={() => handleToggleVerification(user.id, user.is_verified)}
                            >
                              <Circle className="w-3 h-3 mr-1" />
                              Unverified
                            </Badge>
                          )}
                          {user.user_type === 'founder' && (
                            user.is_featured ? (
                              <Badge
                                variant="default"
                                className="h-10 cursor-pointer justify-center"
                                onClick={() => handleToggleFeatured(user.id, user.is_featured)}
                              >
                                <Star className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="h-10 cursor-pointer justify-center"
                                onClick={() => handleToggleFeatured(user.id, user.is_featured)}
                              >
                                <Star className="w-3 h-3 mr-1" />
                                Feature
                              </Badge>
                            )
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 self-start sm:max-w-sm lg:max-w-none">
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Preview"
                            onClick={() => setPreviewUser(user)}
                            className="h-10 justify-start"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            title="Edit profile"
                            onClick={() => setEditProfileUser(user)}
                            className="h-10 justify-start"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            title={user.is_flagged ? "Unflag" : "Flag"}
                            onClick={() => toggleFlagProfile(user.id, user.is_flagged)}
                            className={`h-10 justify-start ${user.is_flagged ? "text-destructive border-destructive/50 hover:bg-destructive/10" : ""}`}
                          >
                            <Flag className="w-4 h-4 mr-2" />
                            {user.is_flagged ? "Unflag" : "Flag"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            title="Manage subscription"
                            onClick={() => setSubscriptionDialogUser(user)}
                            className="h-10 justify-start"
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Pro
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 self-start sm:max-w-sm lg:max-w-none">
                          {status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                title="Approve"
                                onClick={() => approveUser(user.id)}
                                disabled={actionLoading === user.id}
                                className="h-10 justify-start"
                              >
                                <UserCheck className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                title="Deny"
                                onClick={() => setDenyDialogUser(user)}
                                disabled={actionLoading === user.id}
                                className="h-10 justify-start"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Deny
                              </Button>
                            </>
                          )}
                          {status === 'approved' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                title="Make admin"
                                onClick={() => makeAdmin(user.id)}
                                disabled={actionLoading === user.id}
                                className="h-10 justify-start"
                              >
                                <Crown className="w-4 h-4 mr-2" />
                                Admin
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                title="Revoke access"
                                onClick={() => revokeAccess(user.id)}
                                disabled={actionLoading === user.id}
                                className="h-10 justify-start"
                              >
                                <UserX className="w-4 h-4 mr-2" />
                                Revoke
                              </Button>
                            </>
                          )}
                          {status === 'admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              title="Revoke admin"
                              onClick={() => revokeAdmin(user.id)}
                              disabled={actionLoading === user.id}
                              className="h-10 justify-start text-destructive border-destructive/50 hover:bg-destructive/10"
                            >
                              <Crown className="w-4 h-4 mr-2" />
                              Revoke admin
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
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

      {/* Profile Review Mode */}
      <AdminReviewMode
        user={previewUser}
        open={!!previewUser}
        onOpenChange={(open) => !open && setPreviewUser(null)}
        actionDisabled={actionLoading === previewUser?.id}
        onApprove={async (id) => {
          await approveUser(id);
          setPreviewUser(null);
        }}
        onRequestEdits={(u) => {
          setPreviewUser(null);
          setEditSuggestionUser(u as any);
        }}
        onReject={(u) => {
          setPreviewUser(null);
          setDenyDialogUser(u as any);
        }}
      />
      

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

      {/* Direct Profile Editor */}
      {editProfileUser && (
        <AdminProfileEditor
          userId={editProfileUser.id}
          userType={editProfileUser.user_type}
          open={!!editProfileUser}
          onOpenChange={(open) => !open && setEditProfileUser(null)}
          onSaved={() => loadUsers()}
        />
      )}
      <Dialog open={!!denyDialogUser} onOpenChange={(open) => !open && setDenyDialogUser(null)}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-xl">Deny Profile</DialogTitle>
            <DialogDescription>
              Are you sure you want to deny {denyDialogUser?.name}'s application? They will be notified via email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rejection Reason</Label>
              <Textarea
                placeholder="e.g. Please provide your incorporation documents and resubmit."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="h-24 bg-zinc-900 border-zinc-800"
              />
              <p className="text-xs text-zinc-500">This reason will be included in the email sent to the user.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDenyDialogUser(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => denyDialogUser && denyUser(denyDialogUser.id)}
              disabled={actionLoading === denyDialogUser?.id || !rejectionReason.trim()}
            >
              <XCircle className="w-4 h-4 mr-2" /> Deny User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
