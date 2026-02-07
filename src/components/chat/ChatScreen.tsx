import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Sparkles } from "lucide-react";
import { IndividualChat } from "./IndividualChat";
import { useChat, ChatConversation } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";

// Keeping the prop interface so your parent component doesn't break, gtgt
// even though we aren't using the button anymore.
interface ChatScreenProps {
  onNavigateToDiscovery?: () => void; 
    setischatopen: (value: boolean) => void; 
}

export function ChatScreen({ onNavigateToDiscovery,setischatopen }: ChatScreenProps) {
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
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
  
  if (selectedConversation && currentUser) {
    const cleanLastName = (selectedConversation.user.last_name && selectedConversation.user.last_name.toLowerCase() !== "null") 
      ? ` ${selectedConversation.user.last_name}` 
      : "";
    const chatUser = {
      id: selectedConversation.user.id,
match_id: selectedConversation.match_id, //
     name: `${selectedConversation.user.first_name}${cleanLastName}`.trim(),
      photos: selectedConversation.user.photos?.map(p => p.photo_url) || [],
      lastSeen: selectedConversation.user.last_active_at,
      bio: selectedConversation.user.bio,
      year_of_study: selectedConversation.user.year_of_study,
      branch: selectedConversation.user.branch,
      hometown: selectedConversation.user.hometown,
      college: selectedConversation.user.college,
    };
    
    return (
      <IndividualChat 
        user={chatUser}
        messages={messages}
        currentUser={currentUser}
        onBack={()=> {setSelectedConversation(null);setischatopen(false)}}
        onSendMessage={sendMessage}
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

  // Empty State - Button Removed
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
        {/* Button removed from here */}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black text-white">
       <div className="glass h-[12%] border-b border-white/10 sticky top-0 z-40 animate-slide-up
       flex flex-column  items-center">
        <div className="p-6"> 
          <div className="flex items-center gap-4 animate-slide-in-left"> 
            <div className="relative">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 glass-light">
                <MessageCircle className="h-6 w-6 text-pink-500 animate-pulse" />
              </div>
              <div className="absolute inset-0 bg-pink-500/20 rounded-2xl animate-pulse-glow"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text-animated">Messages</h1>
              <p className="text-sm text-gray-400">{conversations.length} conversations</p>
            </div>
            <div className="flex space-x-1 ml-auto">
              <Sparkles className="h-5 w-5 text-purple-400 animate-pulse stagger-1" />
              <Sparkles className="h-3 w-3 text-pink-400 animate-pulse stagger-2" />
              <Sparkles className="h-4 w-4 text-blue-400 animate-pulse stagger-3" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {conversations.map((conversation, index) => (
          <Card 
            key={conversation.match_id} 
            className={`glass-light border-white/10 transition-all duration-500 hover:scale-[1.02] card-hover animate-fade-in interactive stagger-${index + 1}`}
            onClick={()=>{setSelectedConversation(conversation);setischatopen(true)}}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-5">
                <div className="relative">
                  <Avatar className="h-16 w-16 ring-2 ring-pink-500/30 transition-all duration-300 hover:ring-pink-500/50">
                    <AvatarImage 
  src={conversation.user.photos?.[0]?.photo_url 
    ? conversation.user.photos[0].photo_url
    : undefined
  } 
/>
                    <AvatarFallback className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-300 font-semibold text-3xl">
                      {conversation.user.first_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full border-2 border-black animate-pulse-glow"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                   <h3 className="font-bold text-xl text-white truncate hover:text-pink-300 transition-colors duration-300">
  {conversation.user.first_name} 
  {conversation.user.last_name && conversation.user.last_name.toLowerCase() !== "null" 
    ? ` ${conversation.user.last_name}` 
    : ""}
</h3> 
                    <div className="flex items-center gap-3">
                      {conversation.unreadCount > 0 && (
                        <Badge className="h-7 w-7 p-0 flex items-center justify-center bg-gradient-to-r from-pink-500 to-pink-600 text-white text-xs animate-pulse-glow">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-2">
                    {conversation.lastMessage?.sender === currentUser?.email && (
                      <Send className="h-5 w-5 text-pink-400" />
                    )}
                    <p className={`text-base truncate flex-1 transition-colors duration-300 ${
                      conversation.unreadCount > 0 
                        ? 'font-medium text-white' 
                        : 'text-gray-400 hover:text-gray-300'
                    }`}>
                      {conversation.lastMessage?.content || "Matched! Say hi. 💖"}
                    </p>
                  </div>
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-110">
                  <MessageCircle className="h-6 w-6 text-pink-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}  
      </div>

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-3/4 left-3/4 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
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