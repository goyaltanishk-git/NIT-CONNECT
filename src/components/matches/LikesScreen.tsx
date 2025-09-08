import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Star, Clock, Filter, Eye, EyeOff, Zap } from "lucide-react";
import { SAMPLE_PROFILES, Profile } from "@/data/sampleProfiles";

interface PendingLike {
  id: string;
  profile: Profile;
  timestamp: string;
  type: 'like' | 'superlike';
}

export function LikesScreen() {
  const [filter, setFilter] = useState<'all' | 'recent' | 'superlikes'>('all');
  const [showBlurred, setShowBlurred] = useState(true);
  
  // Simulate pending likes from sample profiles
  const [pendingLikes] = useState<PendingLike[]>([
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
    // Simulate liking back - in real app this would create a match
    console.log("Liked back:", likeId);
  };

  const handlePass = (likeId: string) => {
    // Simulate passing - remove from list
    console.log("Passed on:", likeId);
  };

  if (pendingLikes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="h-24 w-24 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mb-6">
          <Heart className="h-12 w-12 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-3">No likes yet</h2>
        <p className="text-muted-foreground mb-6">
          When someone likes your profile, they'll appear here!
        </p>
        <Button className="bg-gradient-to-r from-primary to-primary/80">
          Improve Your Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-bold gradient-text">Likes</h1>
            <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-primary/5 text-primary">
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
                className={filter === filterType ? "bg-primary" : ""}
              >
                {filterType === 'all' && 'All'}
                {filterType === 'recent' && 'Recent'}
                {filterType === 'superlikes' && '⭐ Super Likes'}
              </Button>
            ))}
          </div>

          {/* Premium upsell */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-primary">Get Premium</p>
                    <p className="text-xs text-muted-foreground">See who likes you without blur</p>
                  </div>
                </div>
                <Button size="sm" className="bg-gradient-to-r from-primary to-primary/80">
                  Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {getFilteredLikes().map((like) => (
            <Card 
              key={like.id} 
              className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-gradient-to-r hover:from-card hover:to-primary/5 relative overflow-hidden"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`${showBlurred ? 'blur-sm' : ''} transition-all duration-200`}>
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={like.profile.photos[0]?.url} />
                        <AvatarFallback>{like.profile.full_name[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                    {like.type === 'superlike' && (
                      <div className="absolute -top-1 -right-1 h-6 w-6 bg-gradient-to-br from-superlike to-superlike/80 rounded-full flex items-center justify-center">
                        <Star className="h-3 w-3 text-white fill-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`${showBlurred ? 'blur-sm' : ''} transition-all duration-200`}>
                        <p className="font-medium truncate">{like.profile.full_name}, {like.profile.age}</p>
                        <p className="text-sm text-muted-foreground">
                          Year {like.profile.year} • {like.profile.branch}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(like.timestamp)}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handlePass(like.id)}
                        className="flex-1"
                      >
                        Pass
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleLikeBack(like.id)}
                        className="flex-1 bg-gradient-to-r from-like to-like/80 hover:from-like/90 hover:to-like/70"
                      >
                        <Heart className="h-3 w-3 mr-1" />
                        Like Back
                      </Button>
                    </div>
                  </div>
                </div>

                {like.type === 'superlike' && (
                  <div className="mt-3 p-2 bg-gradient-to-r from-superlike/10 to-superlike/5 rounded-lg border border-superlike/20">
                    <p className="text-xs text-superlike font-medium flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      This person super liked you!
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