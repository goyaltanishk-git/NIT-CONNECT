import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, Sparkles, X, Filter } from "lucide-react";
import { useLikes } from "@/hooks/useLikes";
import { UserProfileDialog, Profile } from "../profile/UserProfileDialog";

export function LikesScreenIntegrated({ onNavigateToDiscovery }: { onNavigateToDiscovery?: () => void }) {
  const { pendingLikes, loading, handleLikeBack, handlePass } = useLikes();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const getFilteredLikes = () => {
    return pendingLikes.filter(like => 
      like.interaction_type === 'like'
    );
  };
  
  const totalLikesCount = getFilteredLikes().length;

  const handleLikeBackClick = async (likeId: string, targetUserId: string) => {
    await handleLikeBack(likeId, targetUserId);
  };

  const handlePassClick = async (likeId: string) => {
    await handlePass(likeId);
  };

  const handleProfileClick = (profile: Profile | undefined) => {
    if (profile) {
      setSelectedProfile(profile);
      setIsDialogOpen(true);
    } else {
      console.error("Profile is undefined");
    }
  };

  const handleDialogLikeBack = (profileId: string) => {
    const like = pendingLikes.find(l => l.profile?.user_id === profileId);
    if (like) {
      handleLikeBackClick(like.target_user_id, like.user_id);
      setIsDialogOpen(false);
      setSelectedProfile(null);
    }
  };

  const handleDialogPass = (profileId: string) => {
    const like = pendingLikes.find(l => l.profile?.user_id === profileId);
    if (like) {
      handlePassClick(like.user_id);
      setIsDialogOpen(false);
      setSelectedProfile(null);
    }
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

  if (pendingLikes.filter(l => l.interaction_type === 'like').length === 0) {
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
    <>
      <div className="h-full overflow-y-auto bg-black text-white [&::-webkit-scrollbar]:hidden">
        
        {/* Minimal "Likes You" Header */}
        {/* UPDATED: Increased pb-2 to pb-6 for more gap */}
        <div className="px-4 pt-2 pb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold gradient-text-animated">Likes You</h1>
          
          <Badge className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border-pink-500/30 px-3 py-1 rounded-full">
            <Heart className="h-3.5 w-3.5 mr-1.5 animate-heartbeat" />
            {totalLikesCount}
          </Badge>
        </div>

        {/* Content Area */}
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {getFilteredLikes().map((like, index) => (
              <Card 
                key={`like-${like.id || index}`}
                onClick={() => handleProfileClick(like.profile)}
                className="glass-light border-white/10 transition-all duration-300 hover:scale-[1.02] card-hover animate-fade-in cursor-pointer flex flex-col overflow-hidden rounded-2xl"
              >
                <CardContent className="p-0 flex flex-col h-full overflow-hidden rounded-2xl">
                  
                  {/* Name at the top */}
                  <div className="p-2 text-center">
                    <p className="font-bold text-lg text-white truncate">
                      {(like.profile?.first_name || 'Unknown').split(' ')[0]}
                    </p>
                  </div>

                  {/* Image */}
                  <div className="relative w-full aspect-square bg-gray-800 flex items-center justify-center overflow-hidden">
                    {like.profile?.photos?.[0]?.photo_url ? (
                      <img
                        src={like.profile.photos[0].photo_url}
                        alt={like.profile?.first_name || 'Profile'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Avatar className="h-full w-full rounded-none">
                        <AvatarFallback className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 text-pink-300 text-6xl rounded-none">
                          {like.profile?.first_name?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>

                  {/* "Liked You" text at the bottom */}
                  <div className="p-2 text-center mt-auto">
                    <p className="flex items-center justify-center text-xs font-medium text-pink-400">
                      <Heart className="w-3 h-3 mr-1 fill-pink-400" />
                      Liked You
                    </p>
                  </div>
                  
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

      <UserProfileDialog
        profile={selectedProfile}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedProfile(null);
        }}
        onLikeBack={handleDialogLikeBack}
        onPass={handleDialogPass}
        showActionButtons={true}
      />
    </>
  );
}