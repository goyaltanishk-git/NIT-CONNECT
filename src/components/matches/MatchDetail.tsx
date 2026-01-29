import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle, Heart, Star, MapPin, GraduationCap, Calendar, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  age: number;
  photos: string[];
  bio?: string;
  interests?: string[];
  year?: number;
  branch?: string;
  hometown?: string;
}

interface MatchDetailProps {
  user: User;
  matchedAt: string;
  onBack: () => void;
  onMessage: () => void;
}

export function MatchDetail({ user, matchedAt, onBack, onMessage }: MatchDetailProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const formatMatchTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    return `${diffInDays} days ago`;
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-background to-primary/5">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h2 className="font-semibold">Match Details</h2>
            <p className="text-xs text-muted-foreground">
              Matched {formatMatchTime(matchedAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Match celebration */}
        <div className="p-6 text-center bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
          <div className="flex justify-center items-center gap-2 mb-3">
            <Heart className="h-6 w-6 text-primary animate-pulse" />
            <h3 className="text-xl font-bold gradient-text">It's a Match!</h3>
            <Heart className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">
            You and {user.name} liked each other
          </p>
        </div>

        {/* Profile photos */}
        <div className="p-4">
          <div className="relative">
           {/* ✅ Replace the style around line 63 */}
<div className="aspect-[3/4] bg-cover bg-center rounded-xl shadow-lg" 
     style={{ 
       backgroundImage: `url(${user.photos[currentPhotoIndex]})` 
     }}>
              {user.photos.length > 1 && (
                <>
                  <div className="absolute top-2 left-2 right-2 flex gap-1">
                    {user.photos.map((_, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex-1 h-1 rounded-full",
                          index === currentPhotoIndex ? "bg-white" : "bg-white/30"
                        )}
                      />
                    ))}
                  </div>
                  <button
                    className="absolute left-0 top-0 w-1/2 h-full"
                    onClick={() => setCurrentPhotoIndex(Math.max(0, currentPhotoIndex - 1))}
                  />
                  <button
                    className="absolute right-0 top-0 w-1/2 h-full"
                    onClick={() => setCurrentPhotoIndex(Math.min(user.photos.length - 1, currentPhotoIndex + 1))}
                  />
                </>
              )}
            </div>
            
            {/* Photo counter */}
            {user.photos.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Camera className="h-3 w-3" />
                {currentPhotoIndex + 1} / {user.photos.length}
              </div>
            )}
          </div>
        </div>

        {/* Profile info */}
        <div className="p-4 space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-2xl font-bold">{user.name}, {user.age}</h2>
                  {user.year && user.branch && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <GraduationCap className="h-4 w-4" />
                      <span>Year {user.year} • {user.branch}</span>
                    </div>
                  )}
                  {user.hometown && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-4 w-4" />
                      <span>{user.hometown}</span>
                    </div>
                  )}
                </div>
                <Badge className="bg-gradient-to-r from-primary to-primary/80">
                  Match
                </Badge>
              </div>

              {user.bio && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {user.bio}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="capitalize">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 bg-card border-t border-border">
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 border-primary/20 text-primary hover:bg-primary/5"
            onClick={onBack}
          >
            Keep Looking
          </Button>
          <Button 
            className="flex-1 bg-gradient-to-r from-primary to-primary/80"
            onClick={onMessage}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Send Message
          </Button>
        </div>
      </div>
    </div>
  );
}