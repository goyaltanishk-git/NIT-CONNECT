import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Search, Loader2, Heart, Sparkles, Clock } from "lucide-react";
import { IndividualChat } from "./IndividualChat";
import { useChat, ChatConversation } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { getDisplayBio,getDisplayDetails,getDisplayName,getDisplayPhotos,shouldDisplayAnonymously } from "@/utils/incognitoUtils";

export function ChatScreen() {
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { user: currentUser } = useAuth();
  const { 
    conversations, 
    messages, 
    fetchMessages, 
    sendMessage, 
    unmatch,
    clearCurrentChat, 
    loading 
  } = useChat(currentUser);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.match_id);
    }

    return () => {
      clearCurrentChat();
    }
  }, [selectedConversation, fetchMessages, clearCurrentChat]);

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation) return;
    await sendMessage(selectedConversation.match_id, content);
  };
  
  const handleUnmatch = async () => {
    if (!selectedConversation) return;
    await unmatch(selectedConversation.match_id);
    setSelectedConversation(null);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${Math.floor(diffInHours / 24)}d`;
  };

  const filteredConversations = conversations.filter(conversation =>
    `${conversation.user.first_name} ${conversation.user.last_name}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  if (selectedConversation && currentUser) {
    const chatUser = {
      id: selectedConversation.user.id,
      name: selectedConversation.user.first_name,
      photos: selectedConversation.user.photos?.map(p => p.photo_url) || [],
      lastSeen: selectedConversation.user.last_active_at,
      bio: selectedConversation.user.bio,
      year_of_study: selectedConversation.user.year_of_study,
      branch: selectedConversation.user.branch,
      hometown: selectedConversation.user.hometown,
    };
    
    return (
      <IndividualChat 
        user={chatUser}
        messages={messages}
        currentUser={currentUser}
        onBack={() => setSelectedConversation(null)}
        onSendMessage={handleSendMessage}
        onUnmatch={handleUnmatch}
      />
    );
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="relative">
            <div className="loading-heart mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <MessageCircle className="h-8 w-8 text-pink-500 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold gradient-text-animated">Loading conversations...</h3>
            <p className="text-gray-400">Getting your messages ready</p>
          </div>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-black">
        <div className="relative mb-8 animate-fade-in">
          <div className="h-32 w-32 glass-light rounded-full flex items-center justify-center relative">
            <MessageCircle className="h-16 w-16 text-pink-500/60 animate-pulse" />
            <div className="absolute inset-0 bg-pink-500/10 rounded-full animate-pulse-glow"></div>
          </div>
        </div>
        <div className="space-y-4 animate-slide-up">
          <h2 className="text-3xl font-bold gradient-text-animated">No conversations yet</h2>
          <p className="text-gray-400 text-lg max-w-md leading-relaxed">
            Start matching with people to begin conversations!
          </p>
        </div>
        <Button className="btn-primary mt-8 px-8 py-3 text-lg interactive">
          <Heart className="h-5 w-5 mr-2" />
          Find Matches
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black text-white">
      {/* Enhanced Header with Premium Glassmorphism */}
      <div className="glass border-b border-white/10 sticky top-0 z-40 animate-slide-up">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6 animate-slide-in-left">
            <div className="relative">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 glass-light">
                <MessageCircle className="h-6 w-6 text-pink-500 animate-pulse" />
              </div>
              <div className="absolute inset-0 bg-pink-500/20 rounded-2xl animate-pulse-glow"></div>
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text-animated">Messages</h1>
              <p className="text-sm text-gray-400">{conversations.length} conversations</p>
            </div>
            <div className="flex space-x-1 ml-auto">
              <Sparkles className="h-5 w-5 text-purple-400 animate-pulse stagger-1" />
              <Sparkles className="h-3 w-3 text-pink-400 animate-pulse stagger-2" />
              <Sparkles className="h-4 w-4 text-blue-400 animate-pulse stagger-3" />
            </div>
          </div>
          
          <div className="relative animate-slide-in-right">
            <Input 
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 glass-light border-white/20 bg-transparent text-white placeholder:text-gray-400 focus:border-pink-500/50 rounded-full transition-all duration-300 hover:border-pink-500/30"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 transition-colors duration-300" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {filteredConversations.map((conversation, index) => (
          <Card 
            key={conversation.id} 
            className={`glass-light border-white/10 transition-all duration-500 hover:scale-[1.02] card-hover animate-fade-in interactive stagger-${index + 1}`}
            onClick={() => setSelectedConversation(conversation)}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16 ring-2 ring-pink-500/30 transition-all duration-300 hover:ring-pink-500/50">
                    <AvatarImage src={conversation.user.photos?.[0]?.photo_url} />
                    <AvatarFallback className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-300 font-semibold text-lg">
                      {conversation.user.first_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {/* Enhanced online indicator */}
                  <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-black animate-pulse">
                    <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-lg text-white truncate hover:text-pink-300 transition-colors duration-300">
                      {`${conversation.user.first_name} ${conversation.user.last_name}`}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 glass-light px-3 py-1 rounded-full border border-white/10">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatTime(conversation.lastMessage?.created_at || conversation.created_at)}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <Badge className="h-6 w-6 p-0 flex items-center justify-center bg-gradient-to-r from-pink-500 to-pink-600 text-white text-xs animate-pulse-glow">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-2">
                    {conversation.lastMessage?.sender === currentUser?.email && (
                      <Send className="h-4 w-4 text-pink-400" />
                    )}
                    <p className={`text-sm truncate flex-1 transition-colors duration-300 ${
                      conversation.unreadCount > 0 
                        ? 'font-medium text-white' 
                        : 'text-gray-400 hover:text-gray-300'
                    }`}>
                      {conversation.lastMessage?.content || "Matched! Say hi. 💖"}
                    </p>
                  </div>

                  {/* Enhanced message preview with typing indicator */}
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-1 h-1 bg-pink-400 rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-pink-400 rounded-full animate-bounce stagger-1"></div>
                      <div className="w-1 h-1 bg-pink-400 rounded-full animate-bounce stagger-2"></div>
                    </div>
                    <span className="text-xs text-gray-500">Active now</span>
                  </div>
                </div>

                {/* Enhanced hover indicator */}
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                  <MessageCircle className="h-5 w-5 text-pink-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced background effects with more particles */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-3/4 left-3/4 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Floating message bubbles */}
        {Array.from({ length: 8 }).map((_, i) => (
          <MessageCircle
            key={i}
            className="absolute w-3 h-3 text-pink-500/10 animate-float"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}