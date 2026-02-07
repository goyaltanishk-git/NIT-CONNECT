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
// 🆕 Added Lock icon
import { ArrowLeft, Send, MoreVertical, Phone, Video, Heart, UserX, Flag, Blocks, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@/hooks/useChat";
import { Profile } from "@/lib/auth";
// 🆕 Import the new dialog and its Profile type
import { UserProfileDialog, Profile as UserProfileType } from "@/components/profile/UserProfileDialog"; 

// This is the simple user prop passed from the parent
interface User {
  id: string;
  name: string;
  photos: string[];
  isOnline?: boolean;
  match_id: string;
  lastSeen?: string;
  bio?: string | null;
  year_of_study?: string | null;
  branch?: string | null;
  hometown?: string | null;
  college:string
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
  const [loading, setLoading] = useState(false); 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
const [loadingProfile, setLoadingProfile] = useState(false); // Add this if missing
  const { toast } = useToast();
  const [profileForDialog, setProfileForDialog] = useState<UserProfileType | null>(null);

  const handleOpenProfile = async () => {
    setProfileDialogOpen(true);
    setLoadingProfile(true);

    try {
      // 1. Show basic info immediately (mapped correctly to Profile type)
      const basicProfile: any = {
        user_id: user.id,
        email: user.match_id,
        first_name: user.name.split(' ')[0],
        last_name: user.name.split(' ').slice(1).join(' '),
        full_name: user.name,
        // Map string[] photos to the object structure UserProfileDialog expects
        photos: user.photos.map((url, i) => ({
          photo_id: `temp-${i}`,
          photo_url: url,
          photo_order: i,
          is_primary: i === 0
        })),
        bio: user.bio || 'Loading details...',
        college: user.college,
        year_of_study: user.year_of_study,
        branch: user.branch,
        hometown: user.hometown,
        interests: [],
        gender: 'male', // Defaults required by type
        interested_in: 'female',
        is_verified: false
      };
      
      setProfileForDialog(basicProfile);

      // 2. Fetch the REAL full data from DB
      const { data, error } = await supabase.rpc('get_full_profile_details', { 
        p_email: user.match_id 
      });

      if (error) throw error;

      if (data) {
        // ✅ FIX: Map the DB response to use 'photo_url' instead of 'url'
        const fetchedPhotos = (data as any).photos?.map((p: any, i: number) => ({
          photo_id: p.photo_id || `db-${i}`,
          // The DB returns 'url', but UI needs 'photo_url'
          photo_url: p.url || p.photo_url, 
          photo_order: p.order ?? p.photo_order ?? i,
          is_primary: p.is_primary ?? (i === 0)
        }));

        setProfileForDialog({
          ...basicProfile,
          ...data,
          // Use the fixed photos, or fall back to basic ones
          photos: fetchedPhotos || basicProfile.photos,
          interests: (data as any).interests || []
        } as any);
      }
    } catch (err) {
      
    } finally {
      setLoadingProfile(false);
    }
  };
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
    toast({ title: "Failed to submit report", variant: "destructive" });
  } finally {
    setLoading(false);
  }
};


  // ⛔️ formatMessageTime function removed

  // 🆕 Create the complex Profile object that UserProfileDialog expects
 
  return (
    <div className="  h-full flex flex-col bg-gradient-to-b from-background to-primary/5">
      {/* Enhanced Header */}
      {/* Increased padding from p-6 to p-8 */}
      <div className="bg-card border-b border-border p-5 shadow-sm backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="hover:bg-primary/10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          {/* 🆕 Made Avatar clickable */}
          <button 
            className="relative interactive" 
            onClick={() => setProfileDialogOpen(true)}
          >
            {/* 🆕 Increased Avatar size */}
            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
              <AvatarImage 
  src={user.photos[0] 
    ? user.photos[0] 
    : undefined
  } 
/>
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                {user.name[0]}
              </AvatarFallback>
            </Avatar>
            {user.isOnline && (
              <div className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 border-2 border-background rounded-full"></div>
            )}
          </button>
          
          <div className="flex-1">
            {/* 🆕 Made Name clickable */}
            <h2 
  className="font-bold text-xl cursor-pointer hover:text-primary/80 transition-colors"
 onClick={handleOpenProfile}
>
  {/* Filter out string variants of null from user.name if they exist */}
  {user.name.toLowerCase().includes("null") ? user.name.split(' ')[0] : user.name}
</h2>
            {/* ⛔️ Removed user.lastSeen and online status text */}
          </div>
          
          <div className="flex gap-2">
            {/* ⛔️ Phone and Video buttons removed */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem 
                  onClick={handleOpenProfile}
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
          {/* Updated Match Card */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 px-4 py-2 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-primary">
              <Lock className="h-4 w-4" />
              <span>All chats are encrypted</span>
              <Lock className="h-4 w-4" />
            </div>
          </Card>
        </div>

        {/* Updated key to use index */}
        {messages.map((message) => {
  const isFromMe = message.sender === currentUser.email;
  
  // Create a unique key string based on your Primary Key (sender + reciever + created_at)
  const compositeKey = `${message.sender}-${message.reciever}-${message.created_at}`;

  return (
    <div key={compositeKey}>
      <div className={cn("flex", isFromMe ? "justify-end" : "justify-start")}>
        <div className={cn(
          "max-w-[80%] rounded-xl px-4 py-1", 
          isFromMe 
            ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground" 
            : "bg-card border"
        )}>
          <p className="text-l">{message.content}</p>
        </div>
      </div>
    </div>
  );
})}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {/* Increased padding on container */}
      <div className="border-t border-border p-4 pb-8 bg-card backdrop-blur-sm">
        <div className="flex gap-3">
          <Input
  value={newMessage}
  onChange={(e) => setNewMessage(e.target.value)}
  placeholder={`Message ${user.name}...`}
  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
  // Update text-m to text-base (which is 16px)
  className="flex-1 bg-background border-border rounded-full px-4 h-10 text-base focus:ring-2 focus:ring-primary/20"
/>
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            // Increased size
            className="rounded-full h-8 w-8 p-0 bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg transition-all duration-300 disabled:opacity-50"
          >
            {/* Increased icon size */}
            <Send className="h-7 w-7" />
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

      {/* 🆕 Use the new UserProfileDialog */}
      <UserProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
        profile={profileForDialog}
        showActionButtons={false} // Make sure no "Like Back" buttons appear
      />
    </div>
  );
}