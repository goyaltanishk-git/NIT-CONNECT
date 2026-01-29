import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Star, Clock, Loader2, Sparkles } from "lucide-react";
import { MatchDetail } from "./MatchDetail";
import { useChat, ChatConversation } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";

export function MatchesScreen() {
  const [selectedMatch, setSelectedMatch] = useState<ChatConversation | null>(null);
  const { user: currentUser } = useAuth();
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
    const userForDetail = {
      id: selectedMatch.user.id,
      name: `${selectedMatch.user.first_name} ${selectedMatch.user.last_name}`,
      age: 21,
      photos: selectedMatch.user.photos.sort((a, b) => a.photo_order - b.photo_order).map(p => p.photo_url),
    };
    
    return (
      <MatchDetail
        user={userForDetail}
        matchedAt={selectedMatch.created_at}
        onBack={() => setSelectedMatch(null)}
        onMessage={() => {
          setSelectedMatch(null);
        }}
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
              <Loader2 className="h-8 w-8 text-pink-500 animate-spin" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold gradient-text-animated">Loading matches...</h3>
            <p className="text-gray-400">Finding your connections</p>
          </div>
        </div>
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-black">
        <div className="relative mb-8 animate-fade-in">
          <div className="h-32 w-32 glass-light rounded-full flex items-center justify-center relative">
            <Heart className="h-16 w-16 text-pink-500/60 animate-heartbeat" />
            <div className="absolute inset-0 bg-pink-500/10 rounded-full animate-pulse-glow"></div>
          </div>
        </div>
        <div className="space-y-4 animate-slide-up">
          <h2 className="text-3xl font-bold gradient-text-animated">No matches yet</h2>
          <p className="text-gray-400 text-lg max-w-md leading-relaxed">
            Start swiping to find your perfect match!
          </p>
        </div>
        <Button className="btn-primary mt-8 px-8 py-3 text-lg interactive">
          <Sparkles className="h-5 w-5 mr-2" />
          Start Discovering
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black text-white">
      {/* Enhanced Header with Premium Styling */}
      <div className="glass border-b border-white/10 sticky top-0 z-40 animate-slide-up">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 animate-slide-in-left">
              <div className="relative">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 glass-light">
                  <Heart className="h-6 w-6 text-pink-500 animate-heartbeat" />
                </div>
                <div className="absolute inset-0 bg-pink-500/20 rounded-2xl animate-pulse-glow"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text-animated">Matches</h1>
                <p className="text-sm text-gray-400">Your connections</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border-pink-500/30 animate-bounce-in">
              {conversations.length} matches
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center gap-2 mb-6 animate-slide-in-left">
          <MessageCircle className="h-5 w-5 text-pink-400 animate-pulse" />
          <h2 className="font-semibold text-lg gradient-text">Messages</h2>
        </div>
        
        <div className="space-y-4">
          {conversations.map((match, index) => (
            <Card 
              key={match.id} 
              className={`glass-light border-white/10 transition-all duration-500 hover:scale-[1.02] card-hover animate-fade-in interactive stagger-${index + 1}`}
              onClick={() => setSelectedMatch(match)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16 ring-2 ring-pink-500/30 transition-all duration-300 hover:ring-pink-500/50">
                     <AvatarImage 
  src={match.user.photos?.[0]?.photo_url 
    ? match.user.photos[0].photo_url
    : undefined
  } 
/>
                      <AvatarFallback className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-300 font-semibold text-lg">
                        {match.user.first_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    {match.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full border-2 border-black animate-pulse-glow"></div>
                    )}
                    {/* Online indicator with enhanced animation */}
                    <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 rounded-full border-2 border-black animate-pulse">
                      <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-lg text-white truncate hover:text-pink-300 transition-colors duration-300">
                        {`${match.user.first_name} ${match.user.last_name}`}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 glass-light px-3 py-1 rounded-full border border-white/10">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {formatTime(match.lastMessage?.created_at || match.created_at)}
                        </span>
                        {match.unreadCount > 0 && (
                          <Badge className="h-6 w-6 p-0 flex items-center justify-center bg-gradient-to-r from-pink-500 to-pink-600 text-white text-xs animate-pulse-glow">
                            {match.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className={`text-sm truncate transition-colors duration-300 ${
                      match.unreadCount > 0 
                        ? 'font-medium text-white' 
                        : 'text-gray-400 hover:text-gray-300'
                    }`}>
                      {match.lastMessage?.content || "Matched! Say hello 💖"}
                    </p>

                    {/* Match quality indicator */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">Great match</span>
                    </div>
                  </div>

                  {/* Hover arrow indicator */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <MessageCircle className="h-5 w-5 text-pink-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Enhanced background effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-3/4 left-3/4 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
    </div>
  );
}