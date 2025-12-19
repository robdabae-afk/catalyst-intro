import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send, Search, Users, User } from "lucide-react";
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

interface UserOption {
  id: string;
  name: string;
  email: string;
  user_type: string;
}

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

  const getRecipientIds = (): string[] => {
    switch (recipientType) {
      case "all":
        return users.map((u) => u.id);
      case "founders":
        return users.filter((u) => u.user_type === "founder").map((u) => u.id);
      case "investors":
        return users.filter((u) => u.user_type === "investor").map((u) => u.id);
      case "selected":
        return selectedUsers;
    }
  };

  const sendEmails = async () => {
    const recipientIds = getRecipientIds();

    if (recipientIds.length === 0) {
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

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-admin-notification", {
        body: {
          type: "custom",
          recipientIds,
          subject,
          message,
        },
      });

      if (error) throw error;

      toast({
        title: "Emails sent",
        description: `Successfully sent ${recipientIds.length} email(s).`,
      });

      // Reset form
      setSubject("");
      setMessage("");
      setSelectedUsers([]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error sending emails",
        description: error.message,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                />
              </div>

              {users.length > 0 && (
                <>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={selectAll}>
                      Select all
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearSelection}>
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
                            className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                            onClick={() => toggleUser(user.id)}
                          >
                            <Checkbox
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={() => toggleUser(user.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{user.name}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                {user.email}
                              </p>
                            </div>
                            <Badge variant="secondary" className="capitalize">
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
            />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Write your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[250px]"
            />
          </div>

          <Button
            onClick={sendEmails}
            disabled={sending || getRecipientCount() === 0}
            className="w-full"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send to {getRecipientCount()} recipient(s)
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
