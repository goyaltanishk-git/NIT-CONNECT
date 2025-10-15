import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Star, Clock, Sparkles, X, Filter, Users } from "lucide-react";
import { useLikes } from "@/hooks/useLikes";
import { getDisplayName } from "@/utils/incognitoUtils";

export function LikesScreenIntegrated({ onNavigateToDiscovery }: { onNavigateToDiscovery?: () => void }) {
  const [filter, setFilter] = useState<'all' | 'recent' | 'superlikes'>('all');
  const { pendingLikes, loading, handleLikeBack, handlePass } = useLikes();
  
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "Unknown";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getFilteredLikes = () => {
    switch (filter) {
      case 'recent':
        return pendingLikes.filter(like => {
          if (!like.created_at) return false;
          const likeDate = new Date(like.created_at);
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          return likeDate > oneDayAgo;
        });
      case 'superlikes':
        return pendingLikes.filter(like => like.interaction_type === 'superlike');
      default:
        return pendingLikes.filter(like => 
          like.interaction_type === 'like' || like.interaction_type === 'superlike'
        );
    }
  };
  

  const handleLikeBackClick = async (likeId: string, targetUserId: string) => {
    await handleLikeBack(likeId, targetUserId);
  };

  const handlePassClick = async (likeId: string) => {
    await handlePass(likeId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="relative">
            <div className="loading-heart mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Heart className="h-8 w-8 text-pink-500 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold gradient-text-animated">Loading your likes...</h3>
            <p className="text-gray-400">Finding people who like you</p>
          </div>
        </div>
      </div>
    );
  }

  if (pendingLikes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-black">
        <div className="relative mb-8 animate-fade-in">
          <div className="h-32 w-32 glass-light rounded-full flex items-center justify-center relative">
            <Heart className="h-16 w-16 text-pink-500/60 animate-heartbeat" />
            <div className="absolute inset-0 bg-pink-500/10 rounded-full animate-pulse-glow"></div>
          </div>
        </div>
        <div className="space-y-4 animate-slide-up">
          <h2 className="text-3xl font-bold gradient-text-animated">No likes yet</h2>
          <p className="text-gray-400 text-lg max-w-md leading-relaxed">
            When someone likes your profile, they'll appear here! Keep swiping to increase your chances.
          </p>
        </div>
        <Button 
          className="btn-primary mt-8 px-8 py-3 text-lg interactive"
          onClick={onNavigateToDiscovery}
        >
          <Sparkles className="h-5 w-5 mr-2" />
          Start Discovering
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-black text-white">
      {/* Enhanced Header with Glassmorphism */}
      <div className="glass border-b border-white/10 sticky top-0 z-40">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 glass-light">
                  <Heart className="h-6 w-6 text-pink-500 animate-heartbeat" />
                </div>
                <div className="absolute inset-0 bg-pink-500/20 rounded-2xl animate-pulse-glow"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text-animated">Likes</h1>
                <p className="text-sm text-gray-400">People who like you</p>
              </div>
            </div>
            
            <Badge className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border-pink-500/30 px-4 py-2 rounded-full">
              <Heart className="h-4 w-4 mr-2 animate-heartbeat" />
              {pendingLikes.filter(l => l.interaction_type === 'like' || l.interaction_type === 'superlike').length} people
            </Badge>
          </div>
          
          {/* Enhanced Filter buttons */}
          <div className="flex gap-3">
            {([['all', 'All'], ['recent', 'Recent'], ['superlikes', '⭐ Super']] as const).map(([filterType, label]) => (
              <Button
                key={filterType}
                variant="ghost"
                size="sm"
                onClick={() => setFilter(filterType)}
                className={`rounded-full px-6 py-2 transition-all duration-300 interactive ${
                  filter === filterType 
                    ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg animate-pulse-glow" 
                    : "glass-light hover:bg-white/10 text-gray-300 hover:text-white"
                }`}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {getFilteredLikes().map((like) => (
            <Card 
              key={like.id} 
              className="glass-light border-white/10 transition-all duration-300 hover:scale-[1.02] card-hover animate-fade-in"
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-20 w-20 ring-2 ring-pink-500/30">
                      <AvatarImage src={like.profile?.photos[0]?.url} />
                      <AvatarFallback className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-300 font-semibold text-lg">
                        {like.profile?.first_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {like.interaction_type === 'superlike' && (
                      <div className="absolute -top-2 -right-2 h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg animate-pulse-glow">
                        <Star className="h-4 w-4 text-white fill-white" />
                      </div>
                    )}
                    {/* Online indicator */}
                    <div className="absolute bottom-1 right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-black animate-pulse"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-xl text-white truncate">
                          {like.profile?.first_name}
                        </p>
                        <p className="text-sm text-gray-400 font-medium">
                          Year {like.profile?.year_of_study} • {like.profile?.branch}
                        </p>
                        {like.profile?.hometown && (
                          <p className="text-xs text-gray-500">From {like.profile.hometown}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 glass-light px-3 py-2 rounded-full border border-white/10">
                        <Clock className="h-3 w-3" />
                        {formatTime(like.created_at)}
                      </div>
                    </div>
                    
                    <div className="flex gap-4 mt-4">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handlePassClick(like.user_id)}
                        className="flex-1 glass-light border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-400 transition-all duration-300 interactive rounded-full"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Pass
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleLikeBackClick(like.target_user_id, like.user_id)}
                        className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-400 hover:to-pink-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 interactive rounded-full animate-pulse-glow"
                      >
                        <Heart className="h-4 w-4 mr-2 animate-heartbeat" />
                        Like Back
                      </Button>
                    </div>
                  </div>
                </div>

                {like.interaction_type === 'superlike' && (
                  <div className="mt-6 p-4 glass-light rounded-2xl border border-blue-500/20">
                    <p className="text-sm text-blue-300 font-medium flex items-center gap-3">
                      <Star className="h-5 w-5 fill-current animate-pulse" />
                      This person super liked you! They really want to connect.
                    </p>
                  </div>
                )}

                {/* Bio preview */}
                {like.profile?.bio && (
                  <div className="mt-4 p-4 glass-light rounded-xl border border-white/10">
                    <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">
                      "{like.profile.bio.substring(0, 100)}{like.profile.bio.length > 100 ? '...' : ''}"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Background effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>
    </div>
  );
}