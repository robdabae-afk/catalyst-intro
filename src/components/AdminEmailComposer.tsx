import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send, Search, Users, User, AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface UserOption {
  id: string;
  name: string;
  email: string;
  user_type: string;
}

interface SendProgress {
  current: number;
  total: number;
  currentEmail: string;
  successCount: number;
  failedCount: number;
  failedEmails: string[];
}

const DELAY_BETWEEN_EMAILS_MS = 4000; // 4 seconds

export const AdminEmailComposer = () => {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [recipientType, setRecipientType] = useState<"all" | "founders" | "investors" | "selected">("selected");
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [progress, setProgress] = useState<SendProgress | null>(null);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Warn user before leaving page during send
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (sending) {
        e.preventDefault();
        e.returnValue = "Emails are still being sent. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sending]);

  const loadUsers = async () => {
    if (users.length > 0) return;

    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, user_type")
        .order("name");

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading users",
        description: error.message,
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAll = () => {
    setSelectedUsers(filteredUsers.map((u) => u.id));
  };

  const clearSelection = () => {
    setSelectedUsers([]);
  };

  const getRecipientCount = () => {
    switch (recipientType) {
      case "all":
        return users.length;
      case "founders":
        return users.filter((u) => u.user_type === "founder").length;
      case "investors":
        return users.filter((u) => u.user_type === "investor").length;
      case "selected":
        return selectedUsers.length;
    }
  };

  const getRecipientsWithEmails = (): UserOption[] => {
    switch (recipientType) {
      case "all":
        return users;
      case "founders":
        return users.filter((u) => u.user_type === "founder");
      case "investors":
        return users.filter((u) => u.user_type === "investor");
      case "selected":
        return users.filter((u) => selectedUsers.includes(u.id));
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const sendSingleEmail = async (recipientId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("send-admin-notification", {
        body: {
          type: "custom",
          recipientIds: [recipientId],
          subject,
          message,
        },
      });

      if (error) {
        console.error(`Error sending email to ${recipientId}:`, error);
        return false;
      }

      if (data?.error) {
        console.error(`Error in response for ${recipientId}:`, data.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Exception sending email to ${recipientId}:`, error);
      return false;
    }
  };

  const sendEmails = async () => {
    // For bulk sends, ensure users are loaded first
    let currentUsers = users;
    if (recipientType !== "selected" && users.length === 0) {
      setLoadingUsers(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, email, user_type")
          .order("name");

        if (error) throw error;
        setUsers(data || []);
        currentUsers = data || [];

        if (!data || data.length === 0) {
          toast({
            variant: "destructive",
            title: "No users found",
            description: "There are no users in the system to send emails to.",
          });
          setLoadingUsers(false);
          return;
        }
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error loading users",
          description: error.message,
        });
        setLoadingUsers(false);
        return;
      }
      setLoadingUsers(false);
    }

    // Get recipients based on current users state
    let recipients: UserOption[];
    if (recipientType === "selected") {
      recipients = currentUsers.filter((u) => selectedUsers.includes(u.id));
    } else if (recipientType === "all") {
      recipients = currentUsers;
    } else if (recipientType === "founders") {
      recipients = currentUsers.filter((u) => u.user_type === "founder");
    } else {
      recipients = currentUsers.filter((u) => u.user_type === "investor");
    }

    if (recipients.length === 0) {
      toast({
        variant: "destructive",
        title: "No recipients",
        description: "Please select at least one recipient.",
      });
      return;
    }

    if (!subject.trim() || !message.trim()) {
      toast({
        variant: "destructive",
        title: "Missing content",
        description: "Please enter both subject and message.",
      });
      return;
    }

    // Start sending process
    setSending(true);
    abortControllerRef.current = new AbortController();

    const progressState: SendProgress = {
      current: 0,
      total: recipients.length,
      currentEmail: "",
      successCount: 0,
      failedCount: 0,
      failedEmails: [],
    };
    setProgress(progressState);

    try {
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];

        // Update progress before sending
        progressState.current = i + 1;
        progressState.currentEmail = recipient.email;
        setProgress({ ...progressState });

        console.log(`Sending email ${i + 1}/${recipients.length} to ${recipient.email}`);

        // Send the email
        const success = await sendSingleEmail(recipient.id);

        if (success) {
          progressState.successCount++;
          console.log(`Successfully sent to ${recipient.email}`);
        } else {
          progressState.failedCount++;
          progressState.failedEmails.push(recipient.email);
          console.error(`Failed to send to ${recipient.email}`);
        }

        setProgress({ ...progressState });

        // Wait 15 seconds before sending the next email (unless it's the last one)
        if (i < recipients.length - 1) {
          console.log(`Waiting ${DELAY_BETWEEN_EMAILS_MS / 1000} seconds before next email...`);
          await sleep(DELAY_BETWEEN_EMAILS_MS);
        }
      }

      // Show final result
      if (progressState.failedCount > 0) {
        toast({
          variant: "default",
          title: "Emails partially sent",
          description: `Sent ${progressState.successCount} email(s), ${progressState.failedCount} failed.`,
        });

        // Log failed emails
        console.error("Failed emails:", progressState.failedEmails);
      } else {
        toast({
          title: "All emails sent",
          description: `Successfully sent ${progressState.successCount} email(s).`,
        });
      }

      // Reset form on success
      if (progressState.failedCount === 0) {
        setSubject("");
        setMessage("");
        setSelectedUsers([]);
      }
    } catch (error: any) {
      console.error("Error in email sending loop:", error);
      toast({
        variant: "destructive",
        title: "Error sending emails",
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setSending(false);
      setProgress(null);
      abortControllerRef.current = null;
    }
  };

  const progressPercentage = progress
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Leave Warning Dialog */}
      <AlertDialog open={showLeaveWarning} onOpenChange={setShowLeaveWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Emails Still Sending
            </AlertDialogTitle>
            <AlertDialogDescription>
              Emails are still being sent. If you leave now, the remaining emails will not be sent.
              Are you sure you want to stop?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Sending</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                abortControllerRef.current?.abort();
                setSending(false);
                setProgress(null);
              }}
            >
              Stop Sending
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recipients Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Recipients
          </CardTitle>
          <CardDescription>Choose who will receive this email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Send to</Label>
            <Select
              value={recipientType}
              onValueChange={(value: "all" | "founders" | "investors" | "selected") => {
                setRecipientType(value);
                if (value !== "selected") {
                  loadUsers();
                }
              }}
              disabled={sending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="selected">Selected users</SelectItem>
                <SelectItem value="all">All users</SelectItem>
                <SelectItem value="founders">All founders</SelectItem>
                <SelectItem value="investors">All investors</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recipientType === "selected" && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={loadUsers}
                  className="pl-9"
                  disabled={sending}
                />
              </div>

              {users.length > 0 && (
                <>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll} disabled={sending}>
                      Select all
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearSelection} disabled={sending}>
                      Clear
                    </Button>
                  </div>

                  <ScrollArea className="h-[300px] border rounded-md p-2">
                    {loadingUsers ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            className={`flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer ${sending ? 'opacity-50 pointer-events-none' : ''}`}
                            onClick={() => !sending && toggleUser(user.id)}
                          >
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={() => !sending && toggleUser(user.id)}
                              disabled={sending}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{user.name}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                            <Badge variant="secondary" className="capitalize mt-1 text-black bg-white hover:bg-gray-100">
                              {user.user_type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </>
              )}
            </>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>{getRecipientCount()} recipient(s) selected</span>
          </div>
        </CardContent>
      </Card>

      {/* Compose Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Compose Email
          </CardTitle>
          <CardDescription>Write your message to send</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="Email subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={sending}
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Write your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[200px]"
              disabled={sending}
            />
          </div>

          {/* Progress Section */}
          {progress && (
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  Sending email {progress.current} of {progress.total}...
                </span>
                <span className="text-muted-foreground">{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground truncate">
                Currently sending to: {progress.currentEmail}
              </p>
              <div className="flex gap-4 text-xs">
                <span className="text-green-600">
                  ✓ Sent: {progress.successCount}
                </span>
                {progress.failedCount > 0 && (
                  <span className="text-destructive">
                    ✗ Failed: {progress.failedCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                ⏱ 15 second delay between emails to avoid rate limits
              </p>
            </div>
          )}

          <Button
            onClick={sendEmails}
            disabled={sending || loadingUsers || getRecipientCount() === 0}
            className="w-full"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Sending... (Do not close this page)
              </>
            ) : loadingUsers ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Loading users...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send to {getRecipientCount()} recipient(s)
              </>
            )}
          </Button>

          {getRecipientCount() > 1 && !sending && (
            <p className="text-xs text-muted-foreground text-center">
              Emails will be sent one at a time with 15 second delays.
              Estimated time: ~{Math.ceil((getRecipientCount() - 1) * 15 / 60)} minute(s)
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
