import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { X, ChevronLeft, ChevronRight, Heart, Send } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  caption?: string;
  created_at: string;
  user: {
    full_name: string;
    photos: string[];
  };
  is_viewed?: boolean;
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  onStoryView: (storyId: string) => void;
  currentUserId: string;
}

export function StoryViewer({ 
  stories, 
  initialIndex, 
  onClose, 
  onStoryView, 
  currentUserId 
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [message, setMessage] = useState("");
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentStory = stories[currentIndex];
  const STORY_DURATION = 5000; // 5 seconds per story

  useEffect(() => {
    if (currentStory && !currentStory.is_viewed) {
      onStoryView(currentStory.id);
    }
  }, [currentStory, onStoryView]);

  useEffect(() => {
    if (!isPaused) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            nextStory();
            return 0;
          }
          return prev + (100 / (STORY_DURATION / 100));
        });
      }, 100);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPaused, currentIndex]);

  const nextStory = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const previousStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const screenWidth = window.innerWidth;
    
    if (touch.clientX < screenWidth / 2) {
      previousStory();
    } else {
      nextStory();
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const storyTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - storyTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      // Here you would send the message to the story owner
      console.log('Sending message:', message, 'to user:', currentStory.user_id);
      setMessage("");
      // You could show a toast or some feedback here
    }
  };

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress bars */}
      <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
        {stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ 
                width: index < currentIndex ? '100%' : 
                       index === currentIndex ? `${progress}%` : '0%' 
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex items-center justify-between z-10 mt-6">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-white">
            <AvatarImage src={currentStory.user.photos[0]} />
            <AvatarFallback>{currentStory.user.full_name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-white font-semibold">{currentStory.user.full_name}</p>
            <p className="text-white/70 text-sm">{formatTimeAgo(currentStory.created_at)}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose}
          className="text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Story Content */}
      <div 
        className="relative w-full h-full flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onMouseDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          if (x < rect.width / 2) {
            previousStory();
          } else {
            nextStory();
          }
        }}
      >
        {currentStory.media_type === 'image' ? (
          <img 
            src={currentStory.media_url} 
            alt="Story"
            className="max-w-full max-h-full object-contain"
            onLoad={() => setProgress(0)}
          />
        ) : (
          <video
            ref={videoRef}
            src={currentStory.media_url}
            className="max-w-full max-h-full object-contain"
            autoPlay
            muted
            onLoadedData={() => setProgress(0)}
            onPlay={() => setIsPaused(false)}
            onPause={() => setIsPaused(true)}
          />
        )}

        {/* Navigation areas (invisible) */}
        <div className="absolute left-0 top-0 w-1/2 h-full z-10" />
        <div className="absolute right-0 top-0 w-1/2 h-full z-10" />
      </div>

      {/* Caption */}
      {currentStory.caption && (
        <div className="absolute bottom-20 left-4 right-4 z-10">
          <p className="text-white text-center bg-black/50 px-4 py-2 rounded-full">
            {currentStory.caption}
          </p>
        </div>
      )}

      {/* Message Input (only for other users' stories) */}
      {currentStory.user_id !== currentUserId && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 z-10">
          <Input
            placeholder="Send message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/70"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button 
            size="sm" 
            variant="ghost"
            onClick={handleSendMessage}
            className="text-white hover:bg-white/20"
          >
            <Heart className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost"
            onClick={handleSendMessage}
            className="text-white hover:bg-white/20"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Navigation arrows (desktop) */}
      <div className="hidden md:block">
        {currentIndex > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
            onClick={previousStory}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
        )}
        {currentIndex < stories.length - 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
            onClick={nextStory}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  );
}