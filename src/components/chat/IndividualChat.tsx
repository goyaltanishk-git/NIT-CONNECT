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
import { ArrowLeft, Send, MoreVertical, Phone, Video, Heart, UserX, Flag, Blocks, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ChatMessage } from "@/hooks/useChat";
import { Profile } from "@/lib/auth";
import { ProfileDialog } from "@/components/profile/profileDialog";

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
  const [loading, setLoading] = useState(false);
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
    <div className="h-full flex flex-col bg-black text-white relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-black via-gray-900/50 to-black pointer-events-none"></div>

      {/* Enhanced Header with Thursday styling */}
      <div className="glass border-b border-white/10 p-4 shadow-2xl backdrop-blur-sm animate-fade-in">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack} 
            className="rounded-full hover:bg-pink-500/20 hover:scale-110 transition-all duration-300 interactive"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Button>
          
          <div className="relative">
            <Avatar className="h-12 w-12 ring-2 ring-pink-500/30 hover:ring-pink-500/60 transition-all duration-300">
              <AvatarImage src={user.photos[0]} />
              <AvatarFallback className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-300 font-semibold text-lg">
                {user.name[0]}
              </AvatarFallback>
            </Avatar>
            {user.isOnline && (
              <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-black rounded-full animate-pulse"></div>
            )}
          </div>
          
          <div className="flex-1">
            <h2 className="font-bold text-lg gradient-text-animated">{user.name}</h2>
            <p className="text-sm text-gray-400 flex items-center">
              {user.isOnline ? (
                <>
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  Online now
                </>
              ) : (
                user.lastSeen || "Active recently"
              )}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-full glass-light hover:bg-blue-500/20 hover:scale-110 transition-all duration-300 interactive"
            >
              <Phone className="h-5 w-5 text-blue-400" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="rounded-full glass-light hover:bg-green-500/20 hover:scale-110 transition-all duration-300 interactive"
            >
              <Video className="h-5 w-5 text-green-400" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full glass-light hover:bg-white/10 hover:scale-110 transition-all duration-300 interactive"
                >
                  <MoreVertical className="h-5 w-5 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 glass border-white/10 shadow-2xl">
                <DropdownMenuItem 
                  onSelect={() => setProfileDialogOpen(true)}
                  className="hover:bg-pink-500/20 text-white focus:bg-pink-500/20 focus:text-white"
                >
                  <Heart className="h-4 w-4 mr-2 text-pink-400" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsReportDialogOpen(true);
                  }}
                  className="hover:bg-orange-500/20 text-orange-400 focus:bg-orange-500/20 focus:text-orange-300"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Report User
                </DropdownMenuItem>

                {/* Report Dialog */}
                <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                  <DialogContent className="sm:max-w-[400px] glass border-white/10 shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="gradient-text-animated">Report {user.name}</DialogTitle>
                      <DialogDescription className="text-gray-300">
                        Please select a reason for reporting this user. Our team will review the report and take appropriate action.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-3 mt-4">
                      <select
                        className="w-full glass-light border-white/20 rounded-xl p-3 text-white bg-transparent focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-300"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      >
                        <option value="" className="bg-gray-900">Select reason</option>
                        {["Spam", "Fake profile", "Harassment", "Inappropriate content", "Other"].map((r) => (
                          <option key={r} value={r} className="bg-gray-900">
                            {r}
                          </option>
                        ))}
                      </select>

                      {reason === "Other" && (
                        <Input
                          placeholder="Enter custom reason"
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          className="glass-light border-white/20 text-white placeholder:text-gray-400 focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-300"
                        />
                      )}
                    </div>

                    <DialogFooter className="mt-6">
                      <Button
                        disabled={loading || !reason || (reason === "Other" && !customReason.trim())}
                        onClick={() => {
                          const finalReason = reason === "Other" ? customReason : reason;
                          handleReport(finalReason);
                        }}
                        className="w-full bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-400 hover:via-red-500 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 interactive"
                      >
                        {loading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Submitting...</span>
                          </div>
                        ) : (
                          "Submit Report"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  onClick={() => setShowUnmatchDialog(true)}
                  className="hover:bg-red-500/20 text-red-400 font-medium focus:bg-red-500/20 focus:text-red-300"
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
        <div className="flex justify-center animate-fade-in">
          <Card className="glass-light border-pink-500/30 px-6 py-3 shadow-lg animate-pulse-glow">
            <div className="flex items-center gap-3 text-sm">
              <Heart className="h-4 w-4 text-pink-400 animate-heartbeat" />
              <span className="gradient-text font-semibold">You matched with {user.name}!</span>
              <Heart className="h-4 w-4 text-pink-400 animate-heartbeat" />
              <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
            </div>
          </Card>
        </div>

        {messages.map((message) => {
          const isFromMe = message.sender === currentUser.email;

          return (
            <div key={`${message.sender}-${message.created_at}`} className="animate-fade-in">
              <div className={cn("flex", isFromMe ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 shadow-lg transition-all duration-300 hover:scale-[1.02]",
                  isFromMe 
                    ? "bg-gradient-to-r from-pink-500 via-pink-600 to-pink-700 text-white shadow-pink-500/30" 
                    : "glass-light border-white/10 text-white shadow-white/10"
                )}>
                  <p className="text-sm font-medium leading-relaxed">{message.content}</p>
                </div>
              </div>
            </div>
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-white/10 p-4 glass backdrop-blur-sm">
        <div className="flex gap-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${user.name}...`}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 glass-light border-white/20 rounded-full px-6 py-3 text-white placeholder:text-gray-400 focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-300"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="rounded-full h-12 w-12 p-0 bg-gradient-to-r from-pink-500 via-pink-600 to-pink-700 hover:from-pink-400 hover:via-pink-500 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 hover:scale-110 animate-pulse-glow interactive"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Unmatch Confirmation Dialog */}
      <AlertDialog open={showUnmatchDialog} onOpenChange={setShowUnmatchDialog}>
        <AlertDialogContent className="glass border-white/10 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 gradient-text-animated">
              <UserX className="h-5 w-5 text-red-500" />
              Unmatch with {user.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-gray-300">
              <p>Are you sure you want to unmatch with {user.name}?</p>
              <p className="text-sm text-gray-400">
                This action cannot be undone. Your conversation will be deleted and you won't be able to message each other anymore.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass-light border-white/20 text-white hover:bg-white/10 transition-all duration-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleUnmatch}
              className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-400 hover:via-red-500 hover:to-red-600 text-white transition-all duration-300 hover:scale-105 interactive"
            >
              Yes, Unmatch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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