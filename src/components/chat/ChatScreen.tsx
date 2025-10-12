import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Search, Loader2 } from "lucide-react";
import { IndividualChat } from "./IndividualChat";
import { useChat, ChatConversation } from "@/hooks/useChat"; // ✨ Import hook and types
import { useAuth } from "@/hooks/useAuth"; // ✨ Import auth hook to get current user
import { getDisplayBio,getDisplayDetails,getDisplayName,getDisplayPhotos,shouldDisplayAnonymously } from "@/utils/incognitoUtils";

export function ChatScreen() {
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { user: currentUser } = useAuth();
  // ✨ Instantiate hooks to get data and functions
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
    // When a conversation is selected, fetch its messages
    if (selectedConversation) {
      fetchMessages(selectedConversation.match_id);
    }

    // Cleanup subscription when unselecting
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
    setSelectedConversation(null); // Go back to the list
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
    // Adapt data structure for the component
  
     
      
     

  



   const chatUser = {
    id: selectedConversation.user.id,
    name: selectedConversation.user.first_name,
    photos: selectedConversation.user.photos?.map(p => p.photo_url) || [],
    lastSeen: selectedConversation.user.last_active_at,
    // ✨ Pass the new data through
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
  
  // ✨ Loading state
  if (loading) {
     return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="h-24 w-24 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mb-6">
          <MessageCircle className="h-12 w-12 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-3">No conversations yet</h2>
        <p className="text-muted-foreground mb-6">
          Start matching with people to begin conversations!
        </p>
        <Button className="bg-gradient-to-r from-primary to-primary/80">
          Find Matches
        </Button>
      </div>
    );
  }

 return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border/50">
        <h1 className="text-2xl font-bold mb-3">Messages</h1>
        <div className="relative">
          <Input 
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredConversations.map((conversation) => (
          <Card 
            key={conversation.id} 
            className="cursor-pointer hover:shadow-md transition-all duration-200"
            onClick={() => setSelectedConversation(conversation)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={conversation.user.photos?.[0]?.photo_url} />
                  <AvatarFallback>{conversation.user.first_name[0]}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold truncate">{`${conversation.user.first_name} ${conversation.user.last_name}`}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTime(conversation.lastMessage?.created_at || conversation.created_at)}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-primary text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {conversation.lastMessage?.sender === currentUser?.email && (
                      <Send className="h-3 w-3 text-primary" />
                    )}
                    <p className={`text-sm truncate flex-1 ${conversation.unreadCount > 0 ? 'font-medium' : 'text-muted-foreground'}`}>
                      {conversation.lastMessage?.content || "Matched! Say hi."}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}