import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Star, Clock, Sparkles } from "lucide-react";
import { useLikes } from "@/hooks/useLikes";

export function LikesScreenIntegrated() {
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
  console.log(getFilteredLikes());

  const handleLikeBackClick = async (likeId: string, targetUserId: string) => {
    await handleLikeBack(likeId, targetUserId);
  };

  const handlePassClick = async (likeId: string) => {
    await handlePass(likeId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-background to-primary/5">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your likes...</p>
        </div>
      </div>
    );
  }

  if (pendingLikes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gradient-to-br from-background to-primary/5">
        <div className="h-32 w-32 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-6">
          <Heart className="h-16 w-16 text-primary/60" />
        </div>
        <h2 className="text-3xl font-bold mb-4 gradient-text">No likes yet</h2>
        <p className="text-muted-foreground mb-8 text-center max-w-md">
          When someone likes your profile, they'll appear here! Keep swiping to increase your chances.
        </p>
        <Button className="bg-gradient-to-r from-primary to-primary/80">
          <Sparkles className="h-4 w-4 mr-2" />
          Improve Your Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-border/50 backdrop-blur-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Likes</h1>
            <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20">
              <Heart className="h-3 w-3 mr-1" />
              {pendingLikes.filter(l => l.interaction_type === 'like' || l.interaction_type === 'superlike').length} people like you
            </Badge>
          </div>
          
          {/* Filter buttons */}
          <div className="flex gap-2 mb-3">
            {(['all', 'recent', 'superlikes'] as const).map((filterType) => (
              <Button
                key={filterType}
                variant={filter === filterType ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filterType)}
                className={filter === filterType ? "bg-primary shadow-lg" : "hover:bg-primary/10"}
              >
                {filterType === 'all' && 'All'}
                {filterType === 'recent' && 'Recent'}
                {filterType === 'superlikes' && '⭐ Super Likes'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {getFilteredLikes().map((like) => (
            <Card 
              key={like.id} 
              className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-gradient-to-r hover:from-card hover:to-primary/5 relative overflow-hidden border-2 hover:border-primary/20"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                      <AvatarImage src={like.profile?.photos[0]?.url} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                        {like.profile?.first_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {like.interaction_type === 'superlike' && (
                      <div className="absolute -top-1 -right-1 h-7 w-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <Star className="h-4 w-4 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-lg truncate">
                          {like.profile?.first_name} {like.profile?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Year {like.profile?.year_of_study} • {like.profile?.branch}
                        </p>
                        {like.profile?.hometown && (
                          <p className="text-xs text-muted-foreground">From {like.profile.hometown}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-full">
                        <Clock className="h-3 w-3" />
                        {formatTime(like.created_at)}
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePassClick(like.user_id)}
                        className="flex-1 border-red-500/30 text-red-600 hover:bg-red-50 hover:border-red-500 transition-all duration-300"
                      >
                        Pass
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleLikeBackClick(like.target_user_id, like.user_id)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        Like Back
                      </Button>
                    </div>
                  </div>
                </div>

                {like.interaction_type === 'superlike' && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-blue-500/10 to-blue-600/5 rounded-lg border border-blue-500/20">
                    <p className="text-sm text-blue-700 font-medium flex items-center gap-2">
                      <Star className="h-4 w-4 fill-current" />
                      This person super liked you! They really want to connect.
                    </p>
                  </div>
                )}

                {/* Bio preview */}
                {like.profile?.bio && (
                  <div className="mt-3 p-2 bg-muted/20 rounded-lg">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      "{like.profile.bio.substring(0, 100)}{like.profile.bio.length > 100 ? '...' : ''}"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}