import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Heart, Search, Filter } from "lucide-react";
import { IndividualChat } from "./IndividualChat";

interface Conversation {
  id: string;
  user: {
    id: string;
    name: string;
    photos: string[];
    isOnline?: boolean;
  };
  lastMessage: {
    text: string;
    timestamp: string;
    isFromMe: boolean;
  };
  unreadCount: number;
}

export function ChatScreen() {
  const [selectedUser, setSelectedUser] = useState<Conversation['user'] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations] = useState<Conversation[]>([
    {
      id: "1",
      user: {
        id: "1",
        name: "Priya Sharma",
        photos: ["https://images.unsplash.com/photo-1494790108755-2616c64d5057?w=400&h=600&fit=crop&crop=face"],
        isOnline: true
      },
      lastMessage: {
        text: "That sounds amazing! I'd love to join you for that photography walk 📸",
        timestamp: "2024-01-15T11:15:00Z",
        isFromMe: false
      },
      unreadCount: 2
    },
    {
      id: "2",
      user: {
        id: "3", 
        name: "Sneha Patel",
        photos: ["https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face"],
        isOnline: false
      },
      lastMessage: {
        text: "Thanks for the coffee recommendation! ☕",
        timestamp: "2024-01-14T16:20:00Z",
        isFromMe: true
      },
      unreadCount: 0
    },
    {
      id: "3",
      user: {
        id: "4",
        name: "Rahul Mishra", 
        photos: ["https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face"],
        isOnline: true
      },
      lastMessage: {
        text: "The sunset from the hostel terrace was incredible yesterday!",
        timestamp: "2024-01-13T18:45:00Z",
        isFromMe: false
      },
      unreadCount: 1
    }
  ]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h`;
    return `${Math.floor(diffInHours / 24)}d`;
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedUser) {
    return (
      <IndividualChat 
        user={selectedUser} 
        onBack={() => setSelectedUser(null)} 
      />
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
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold">Messages</h1>
          <Button variant="ghost" size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search bar */}
        <div className="relative">
          <Input 
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-muted/50 border-border/50 focus:border-primary/50"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0">
            <Filter className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          {filteredConversations.map((conversation) => (
            <Card 
              key={conversation.id} 
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-gradient-to-r hover:from-card hover:to-primary/5"
              onClick={() => setSelectedUser(conversation.user)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={conversation.user.photos[0]} />
                      <AvatarFallback>{conversation.user.name[0]}</AvatarFallback>
                    </Avatar>
                    {conversation.user.isOnline && (
                      <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-background rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold truncate">{conversation.user.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatTime(conversation.lastMessage.timestamp)}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <Badge className="h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {conversation.lastMessage.isFromMe && (
                        <div className="text-primary">
                          <Send className="h-3 w-3" />
                        </div>
                      )}
                      <p className={`text-sm truncate flex-1 ${
                        conversation.unreadCount > 0 
                          ? 'font-medium text-foreground' 
                          : 'text-muted-foreground'
                      }`}>
                        {conversation.lastMessage.text}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Match suggestions */}
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-primary">New Matches</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            You have 3 new matches waiting to chat!
          </p>
          <Button 
            variant="outline" 
            className="w-full border-primary/20 text-primary hover:bg-primary/5"
          >
            View All Matches
          </Button>
        </div>
      </div>
    </div>
  );
}