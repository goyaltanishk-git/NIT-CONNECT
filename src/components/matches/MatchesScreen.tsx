import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Star, Clock, Loader2 } from "lucide-react";
import { MatchDetail } from "./MatchDetail";
import { useChat, ChatConversation } from "@/hooks/useChat"; // ✨ Import the hook and type
import { useAuth } from "@/hooks/useAuth";
// ✨ The local Match interface is no longer needed

export function MatchesScreen() {
  const [selectedMatch, setSelectedMatch] = useState<ChatConversation | null>(null);
  const { user: currentUser } = useAuth();
  // ✨ Use the hook to get live data
  const { conversations, loading } = useChat(currentUser);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  if (selectedMatch) {
    // ✨ Adapt the data structure for MatchDetail props
    const userForDetail = {
      id: selectedMatch.user.id,
      name: `${selectedMatch.user.first_name} ${selectedMatch.user.last_name}`,
      age: 21, // Note: age isn't in your ChatUser type, so you might need to add it or use a placeholder
      photos: selectedMatch.user.photos.sort((a, b) => a.photo_order - b.photo_order).map(p => p.photo_url),
      // bio, interests etc. would also need to be fetched or passed
    };
    
    return (
      <MatchDetail
        user={userForDetail}
        matchedAt={selectedMatch.created_at}
        onBack={() => setSelectedMatch(null)}
        onMessage={() => {
          // Here you would navigate to the chat screen, possibly with the match ID
          console.log("Navigate to chat for match:", selectedMatch.match_id);
          setSelectedMatch(null);
        }}
      />
    );
  }

  // ✨ Handle loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ✨ Handle empty state
  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="h-24 w-24 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mb-6">
          <Heart className="h-12 w-12 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-3">No matches yet</h2>
        <p className="text-muted-foreground mb-6">Start swiping to find your perfect match!</p>
        <Button className="bg-gradient-to-r from-primary to-primary/80">Start Discovering</Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-text">Matches</h1>
          <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-primary/5 text-primary">
            {conversations.length} matches
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Messages</h2>
        </div>
        <div className="space-y-2">
          {/* ✨ Map over the live conversations data */}
          {conversations.map((match) => (
            <Card 
              key={match.id} 
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-gradient-to-r hover:from-card hover:to-primary/5"
              onClick={() => setSelectedMatch(match)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={match.user.photos?.[0]?.photo_url} />
                      <AvatarFallback>{match.user.first_name[0]}</AvatarFallback>
                    </Avatar>
                    {match.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium truncate">{`${match.user.first_name} ${match.user.last_name}`}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {match.lastMessage 
                          ? formatTime(match.lastMessage.created_at)
                          : formatTime(match.created_at)
                        }
                      </div>
                    </div>
                    <p className={`text-sm truncate ${match.unreadCount > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                      {match.lastMessage?.content || "Say hello to your new match! 👋"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}