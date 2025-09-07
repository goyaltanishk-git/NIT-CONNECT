import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Star, Clock, Filter, TrendingUp } from "lucide-react";
import { MatchDetail } from "./MatchDetail";

interface Match {
  id: string;
  user: {
    id: string;
    name: string;
    age: number;
    photos: string[];
    bio?: string;
    interests?: string[];
    year?: number;
    branch?: string;
    hometown?: string;
    prompts?: { question: string; answer: string }[];
  };
  matchedAt: string;
  lastMessage?: {
    text: string;
    timestamp: string;
  };
  unread?: boolean;
}

export function MatchesScreen() {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [filter, setFilter] = useState<'all' | 'recent' | 'unread'>('all');
  const [matches] = useState<Match[]>([
    {
      id: "1",
      user: {
        id: "1",
        name: "Priya Sharma",
        age: 20,
        photos: [
          "https://images.unsplash.com/photo-1494790108755-2616c64d5057?w=400&h=600&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop&crop=face"
        ],
        bio: "Computer Science student who loves coding, coffee, and deep conversations. Always up for exploring new places around Kurukshetra!",
        interests: ["coding", "coffee", "photography", "travel", "books"],
        year: 3,
        branch: "Computer Science",
        hometown: "Delhi",
        prompts: [
          { question: "My ideal Sunday involves...", answer: "Coding a passion project while sipping artisan coffee, then exploring hidden cafes in Kurukshetra with someone special." }
        ]
      },
      matchedAt: "2024-01-15T10:30:00Z",
      lastMessage: {
        text: "Hey! Thanks for the like 😊",
        timestamp: "2024-01-15T11:15:00Z"
      },
      unread: true
    },
    {
      id: "2", 
      user: {
        id: "3",
        name: "Sneha Patel",
        age: 19,
        photos: [
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=600&fit=crop&crop=face"
        ],
        bio: "Electrical Engineering student passionate about sustainable technology and making the world greener.",
        interests: ["sustainability", "dance", "food", "technology"],
        year: 2,
        branch: "Electrical Engineering",
        hometown: "Ahmedabad"
      },
      matchedAt: "2024-01-14T15:45:00Z",
      lastMessage: {
        text: "Would love to grab coffee sometime!",
        timestamp: "2024-01-14T16:20:00Z"
      },
      unread: false
    },
    {
      id: "3",
      user: {
        id: "4", 
        name: "Rahul Mishra",
        age: 22,
        photos: [
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop&crop=face",
          "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=600&fit=crop&crop=face"
        ],
        bio: "Final year Civil Engineering student who loves building things - both structures and meaningful relationships.",
        interests: ["architecture", "guitar", "cricket", "photography"],
        year: 4,
        branch: "Civil Engineering",
        hometown: "Lucknow"
      },
      matchedAt: "2024-01-13T20:10:00Z",
      unread: false
    }
  ]);

  const recentMatches = matches.filter(match => {
    const matchDate = new Date(match.matchedAt);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    return matchDate > twoDaysAgo;
  });

  const olderMatches = matches.filter(match => {
    const matchDate = new Date(match.matchedAt);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    return matchDate <= twoDaysAgo;
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const getFilteredMatches = () => {
    switch (filter) {
      case 'recent':
        return recentMatches;
      case 'unread':
        return matches.filter(match => match.unread);
      default:
        return matches;
    }
  };

  if (selectedMatch) {
    return (
      <MatchDetail
        user={selectedMatch.user}
        matchedAt={selectedMatch.matchedAt}
        onBack={() => setSelectedMatch(null)}
        onMessage={() => {
          // Navigate to chat
          setSelectedMatch(null);
        }}
      />
    );
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="h-24 w-24 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mb-6">
          <Heart className="h-12 w-12 text-primary-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-3">No matches yet</h2>
        <p className="text-muted-foreground mb-6">
          Start swiping to find your perfect match!
        </p>
        <Button className="bg-gradient-to-r from-primary to-primary/80">
          Start Discovering
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
            <h1 className="text-2xl font-bold gradient-text">Matches</h1>
            <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-primary/5 text-primary">
              {matches.length} matches
            </Badge>
          </div>
          
          {/* Filter buttons */}
          <div className="flex gap-2">
            {(['all', 'recent', 'unread'] as const).map((filterType) => (
              <Button
                key={filterType}
                variant={filter === filterType ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(filterType)}
                className={filter === filterType ? "bg-primary" : ""}
              >
                {filterType === 'all' && 'All'}
                {filterType === 'recent' && 'New'}
                {filterType === 'unread' && 'Unread'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Recent Matches */}
        {recentMatches.length > 0 && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-primary">New Matches</h2>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {recentMatches.map((match) => (
                <Card 
                  key={match.id} 
                  className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 hover:bg-gradient-to-br hover:from-card hover:to-primary/5"
                  onClick={() => setSelectedMatch(match)}
                >
                  <CardContent className="p-3 text-center">
                    <Avatar className="h-16 w-16 mx-auto mb-2">
                      <AvatarImage src={match.user.photos[0]} />
                      <AvatarFallback>{match.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium truncate">{match.user.name}</p>
                    <p className="text-xs text-muted-foreground">{match.user.age}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Messages</h2>
          </div>
          <div className="space-y-2">
            {getFilteredMatches().map((match) => (
              <Card 
                key={match.id} 
                className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-gradient-to-r hover:from-card hover:to-primary/5"
                onClick={() => setSelectedMatch(match)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={match.user.photos[0]} />
                        <AvatarFallback>{match.user.name[0]}</AvatarFallback>
                      </Avatar>
                      {match.unread && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium truncate">{match.user.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {match.lastMessage 
                            ? formatTime(match.lastMessage.timestamp)
                            : formatTime(match.matchedAt)
                          }
                        </div>
                      </div>
                      <p className={`text-sm truncate ${match.unread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                        {match.lastMessage?.text || "Say hello to your new match! 👋"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}