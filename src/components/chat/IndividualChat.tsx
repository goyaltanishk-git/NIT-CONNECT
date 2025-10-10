import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,DialogDescription } from "@/components/ui/dialog"
import { supabase } from "@/integrations/supabase/client";
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
import { ArrowLeft, Send, MoreVertical, Phone, Video, Heart, UserX, Flag, Blocks } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@/hooks/useChat";
import { Profile } from "@/lib/auth";
import { ProfileDialog } from "@/components/profile/profileDialog"; // ✨ Import the new component

// ✨ Updated interface to include all the details for the profile dialog
interface User {
  id: string;
  name: string;
  photos: string[];
  isOnline?: boolean;
  lastSeen?: string;
  bio?: string | null;
  year_of_study?: string | null;
  branch?: string | null;
  hometown?: string | null;
}

interface IndividualChatProps {
  user: User;
  messages: ChatMessage[];
  currentUser: Profile;
  onBack: () => void;
  onSendMessage: (content: string) => void;
  onUnmatch: () => void;
}

export function IndividualChat({ user, messages, currentUser, onBack, onSendMessage, onUnmatch }: IndividualChatProps) {
  const [newMessage, setNewMessage] = useState("");
  const [showUnmatchDialog, setShowUnmatchDialog] = useState(false);
  const [isProfileDialogOpen, setProfileDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false); // ✨ Add state for the dialog
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [reason, setReason] = useState("");
const [customReason, setCustomReason] = useState("");

  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    onSendMessage(newMessage);
    setNewMessage("");
  };

  const handleUnmatch = () => {
    onUnmatch();
  };

 
 const handleReport = async (finalReason: string) => {
  setLoading(true);
  console.log('DONE');
  console.log(currentUser.email);
  console.log(user.id);

  try {
    await supabase.from("reports").insert(
      {
        reporter_id: currentUser.email,
        reported_user_id: user.id,
        reason: finalReason,
        created_at: new Date().toISOString(),
      },
    );

    toast({
      title: "Report submitted",
      description: `You reported ${user.name} for "${finalReason}". We'll review their profile.`,
    });
 handleUnmatch();
    setIsReportDialogOpen(false);
    setReason("");
    setCustomReason("");
  } catch (err) {
    console.log(err);
    toast({ title: "Failed to submit report", variant: "destructive" });
  } finally {
    setLoading(false);
  }
};


  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-background to-primary/5">
      {/* Enhanced Header */}
      <div className="bg-card border-b border-border p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-primary/10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={user.photos[0]} />
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                {user.name[0]}
              </AvatarFallback>
            </Avatar>
            {user.isOnline && (
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
            )}
          </div>
          
          <div className="flex-1">
            <h2 className="font-semibold">{user.name}</h2>
            <p className="text-xs text-muted-foreground">
              {user.isOnline ? "Online now" : user.lastSeen || "Active recently"}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="hover:bg-primary/10">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-primary/10">
              <Video className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {/* ✨ Add onSelect handler to open the dialog */}
                <DropdownMenuItem 
                  onSelect={() => setProfileDialogOpen(true)}
                  className="hover:bg-primary/10"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
             <DropdownMenuItem
   onClick={(e) => {
    e.preventDefault();
    e.stopPropagation(); // <-- stop dropdown from closing
    setIsReportDialogOpen(true);
  }}
  className="hover:bg-orange-50 text-orange-600"
>
  <Flag className="h-4 w-4 mr-2" />
  Report User
</DropdownMenuItem>

{/* Report Dialog */}
<Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
  <DialogContent className="sm:max-w-[400px]">
    <DialogHeader>
      <DialogTitle>Report {user.name}</DialogTitle>
      <DialogDescription>
        Please select a reason for reporting this user. Our team will review the report and take appropriate action.
      </DialogDescription>
    </DialogHeader>

    <div className="flex flex-col gap-2 mt-4">
      <select
        className="w-full border rounded p-2"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      >
        <option value="">Select reason</option>
        {["Spam", "Fake profile", "Harassment", "Inappropriate content", "Other"].map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      {reason === "Other" && (
        <Input
          placeholder="Enter custom reason"
          value={customReason}
          onChange={(e) => setCustomReason(e.target.value)}
        />
      )}
    </div>

    <DialogFooter className="mt-4">
      <Button
        disabled={loading || !reason || (reason === "Other" && !customReason.trim())}
        onClick={() => {
          const finalReason = reason === "Other" ? customReason : reason;
          handleReport(finalReason);
        }}
        className="w-full"
      >
        {loading ? "Submitting..." : "Submit Report"}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


       
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowUnmatchDialog(true)}
                  className="hover:bg-red-50 text-red-600 font-medium"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Unmatch
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex justify-center">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 px-4 py-2 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-primary">
              <Heart className="h-4 w-4" />
              <span>You matched with {user.name}!</span>
              <Heart className="h-4 w-4" />
            </div>
          </Card>
        </div>

        {messages.map((message) => {
          const isFromMe = message.sender === currentUser.email;

          return (
             <div key={`${message.sender}-${message.created_at}`}>
              <div className={cn("flex", isFromMe ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2",
                  isFromMe 
                    ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground" 
                    : "bg-card border"
                )}>
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            </div>
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-border p-4 bg-card backdrop-blur-sm">
        <div className="flex gap-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${user.name}...`}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-background border-border rounded-full px-4 focus:ring-2 focus:ring-primary/20"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="rounded-full h-10 w-10 p-0 bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg transition-all duration-300 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Unmatch Confirmation Dialog */}
      <AlertDialog open={showUnmatchDialog} onOpenChange={setShowUnmatchDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserX className="h-5 w-5 text-red-500" />
              Unmatch with {user.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to unmatch with {user.name}?</p>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. Your conversation will be deleted and you won't be able to message each other anymore.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUnmatch}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Yes, Unmatch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✨ Add the Profile Dialog component here */}
      <ProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        user={{
          name: user.name,
          photos: user.photos,
          bio: user.bio,
          year_of_study: user.year_of_study,
          branch: user.branch,
          hometown: user.hometown,
        }}
      />
    </div>
  );
}