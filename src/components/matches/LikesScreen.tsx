import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Star, Clock, Sparkles } from "lucide-react";
import { LikesScreenIntegrated } from "./LikesScreenIntegrated";
import { useAuth } from "@/hooks/useAuth";
import { SAMPLE_PROFILES, Profile } from "@/data/sampleProfiles";
import { useToast } from "@/hooks/use-toast";

interface PendingLike {
  id: string;
  profile: Profile;
  timestamp: string;
  type: 'like' | 'superlike';
}

export function LikesScreen() {
  const { user, loading: authLoading } = useAuth();
  
  // If user is authenticated, use backend integration
  if (user && !authLoading) {
    return <LikesScreenIntegrated />;
  }
  
  // Fallback to demo mode with sample data
  return <LikesScreenDemo />;
}

function LikesScreenDemo() {
  const [filter, setFilter] = useState<'all' | 'recent' | 'superlikes'>('all');
  const { toast } = useToast();
  
  // Simulate pending likes from sample profiles
  const [pendingLikes, setPendingLikes] = useState<PendingLike[]>([
    {
      id: "1",
      profile: SAMPLE_PROFILES[0],
      timestamp: "2024-01-15T10:30:00Z",
      type: "like"
    },
    {
      id: "2", 
      profile: SAMPLE_PROFILES[2],
      timestamp: "2024-01-15T09:45:00Z",
      type: "superlike"
    },
    {
      id: "3",
      profile: SAMPLE_PROFILES[4],
      timestamp: "2024-01-14T18:20:00Z",
      type: "like"
    },
    {
      id: "4",
      profile: SAMPLE_PROFILES[6],
      timestamp: "2024-01-14T15:30:00Z",
      type: "like"
    },
    {
      id: "5",
      profile: SAMPLE_PROFILES[8],
      timestamp: "2024-01-13T21:10:00Z",
      type: "superlike"
    }
  ]);

  const formatTime = (timestamp: string) => {
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
          const likeDate = new Date(like.timestamp);
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          return likeDate > oneDayAgo;
        });
      case 'superlikes':
        return pendingLikes.filter(like => like.type === 'superlike');
      default:
        return pendingLikes;
    }
  };

  const handleLikeBack = (likeId: string) => {
    const like = pendingLikes.find(l => l.id === likeId);
    if (!like) return;

    // Remove from pending likes
    setPendingLikes(prev => prev.filter(l => l.id !== likeId));
    
    // Show match notification
    toast({
      title: "It's a Match! 🎉",
      description: `You and ${like.profile.full_name} liked each other! Start chatting now.`,
    });

    // Simulate match creation - in real app this would be saved to database
    const tempUser = localStorage.getItem('temp-user');
    if (tempUser) {
      const userData = JSON.parse(tempUser);
      const matches = userData.matches || [];
      matches.push({
        id: Date.now().toString(),
        profile: like.profile,
        matchedAt: new Date().toISOString(),
        type: 'mutual_like'
      });
      userData.matches = matches;
      localStorage.setItem('temp-user', JSON.stringify(userData));
    }

    console.log("✅ Match created with:", like.profile.full_name);
  };

  const handlePass = (likeId: string) => {
    const like = pendingLikes.find(l => l.id === likeId);
    if (!like) return;

    // Remove from pending likes
    setPendingLikes(prev => prev.filter(l => l.id !== likeId));
    
    toast({
      title: "Profile passed",
      description: `You passed on ${like.profile.full_name}.`,
    });

    console.log("❌ Passed on:", like.profile.full_name);
  };

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
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-b border-border/50 backdrop-blur-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Likes</h1>
            <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-primary/5 text-primary border border-primary/20">
              <Heart className="h-3 w-3 mr-1" />
              {pendingLikes.length} people like you
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
                    <div className="transition-all duration-200">
                      <Avatar className="h-16 w-16 ring-2 ring-primary/20">
                        <AvatarImage src={like.profile.photos[0]?.url} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                          {like.profile.full_name[0]}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    {like.type === 'superlike' && (
                      <div className="absolute -top-1 -right-1 h-7 w-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                        <Star className="h-4 w-4 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="transition-all duration-200">
                        <p className="font-semibold text-lg truncate">{like.profile.full_name}, {like.profile.age}</p>
                        <p className="text-sm text-muted-foreground">
                          Year {like.profile.year} • {like.profile.branch}
                        </p>
                        {like.profile.hometown && (
                          <p className="text-xs text-muted-foreground">From {like.profile.hometown}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded-full">
                        <Clock className="h-3 w-3" />
                        {formatTime(like.timestamp)}
                      </div>
                    </div>
                    
                    <div className="flex gap-3 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePass(like.id)}
                        className="flex-1 border-red-500/30 text-red-600 hover:bg-red-50 hover:border-red-500 transition-all duration-300"
                      >
                        Pass
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleLikeBack(like.id)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        Like Back
                      </Button>
                    </div>
                  </div>
                </div>

                {like.type === 'superlike' && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-blue-500/10 to-blue-600/5 rounded-lg border border-blue-500/20">
                    <p className="text-sm text-blue-700 font-medium flex items-center gap-2">
                      <Star className="h-4 w-4 fill-current" />
                      This person super liked you! They really want to connect.
                    </p>
                  </div>
                )}

                {/* Bio preview */}
                {like.profile.bio && (
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