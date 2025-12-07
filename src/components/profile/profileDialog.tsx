import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { 
  Camera, 
  MapPin, 
  GraduationCap, 
  User, 
  Ruler, 
  Calendar,
  Heart,
  MessageCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserProfile {
  name: string;
  photos: string[];
  bio?: string | null;
  year_of_study?: string | null;
  branch?: string | null;
  hometown?: string | null;
  gender?: string | null;
  height?: string | null;
}

interface ProfileDialogProps {
  user: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileDialog({ user, isOpen, onClose }: ProfileDialogProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev < user.photos.length - 1 ? prev + 1 : 0
    );
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev > 0 ? prev - 1 : user.photos.length - 1
    );
  };

  const goToPhoto = (index: number) => {
    setCurrentPhotoIndex(index);
  };

  // Reset photo index when dialog opens or user changes
  useState(() => {
    setCurrentPhotoIndex(0);
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] p-0 border-0 bg-gradient-to-br from-background via-background to-primary/5 overflow-y-auto">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {user.name}'s Profile
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {/* Enhanced Photo Gallery */}
          <div className="p-6 pb-4">
            <div className="relative group">
              <div
                className="aspect-[3/4] bg-cover bg-center rounded-2xl shadow-2xl bg-muted overflow-hidden border-4 border-white/20 backdrop-blur-sm"
                style={{ 
                  backgroundImage: user.photos[currentPhotoIndex] 
                    ? `url(${user.photos[currentPhotoIndex]})` 
                    : 'none' 
                }}
              >
                {/* Photo Navigation Indicators */}
                {user.photos.length > 1 && (
                  <div className="absolute top-4 left-4 right-4 flex gap-2 z-10">
                    {user.photos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToPhoto(index)}
                        className={cn(
                          "flex-1 h-1.5 rounded-full transition-all duration-300",
                          index === currentPhotoIndex 
                            ? "bg-white shadow-lg" 
                            : "bg-white/40 hover:bg-white/60"
                        )}
                      />
                    ))}
                  </div>
                )}

                {/* Navigation Buttons */}
                {user.photos.length > 1 && (
                  <>
                    <button
                      className="absolute left-0 top-0 w-1/2 h-full z-20 flex items-center justify-start pl-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={prevPhoto}
                    >
                      <div className="bg-black/20 hover:bg-black/40 rounded-full p-2 backdrop-blur-sm transition-all">
                        <ChevronLeft className="h-6 w-6 text-white" />
                      </div>
                    </button>
                    <button
                      className="absolute right-0 top-0 w-1/2 h-full z-20 flex items-center justify-end pr-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={nextPhoto}
                    >
                      <div className="bg-black/20 hover:bg-black/40 rounded-full p-2 backdrop-blur-sm transition-all">
                        <ChevronRight className="h-6 w-6 text-white" />
                      </div>
                    </button>
                  </>
                )}

                {/* Photo Counter */}
                {user.photos.length > 1 && (
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-sm">
                    <Camera className="h-4 w-4" />
                    {currentPhotoIndex + 1} / {user.photos.length}
                  </div>
                )}

                {/* Gradient Overlay for better text readability */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
            </div>
          </div>

          {/* Enhanced Profile Information */}
          <div className="px-6 pb-6 space-y-6">
            {/* Name and Basic Info */}
            <Card className="border-0 bg-gradient-to-r from-primary/5 to-primary/10 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-3xl font-bold text-foreground mb-2">{user.name}</h2>
                    
                    {/* Personal Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {user.gender && (
                        <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                          <User className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Gender</p>
                            <p className="font-medium capitalize">{user.gender}</p>
                          </div>
                        </div>
                      )}
                      
                      {user.height && (
                        <div className="flex items-center gap-3 p-3 bg-background/50 rounded-lg">
                          <Ruler className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Height</p>
                            <p className="font-medium">{user.height}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Education Information */}
            {(user.year_of_study || user.branch) && (
              <Card className="border border-primary/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Education</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {user.year_of_study && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Year of Study:</span>
                        <Badge variant="secondary" className="font-medium">
                          Year {user.year_of_study}
                        </Badge>
                      </div>
                    )}
                    
                    {user.branch && (
                      <div className="flex items-center gap-3">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Branch:</span>
                        <Badge variant="outline" className="font-medium">
                          {user.branch}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location Information */}
            {user.hometown && (
              <Card className="border border-primary/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">Location</h3>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">From:</span>
                    <Badge variant="outline" className="font-medium">
                      {user.hometown}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bio Section */}
            {user.bio && (
              <Card className="border border-primary/20 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Info className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold">About Me</h3>
                  </div>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-lg border-l-4 border-primary/30">
                    {user.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg transition-all duration-300"
                size="lg"
              >
                <Heart className="h-4 w-4 mr-2" />
                Like
              </Button>
              
              <Button 
                variant="outline" 
                className="flex-1 border-primary/20 hover:bg-primary/5 transition-all duration-300"
                size="lg"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
              
              <Button 
                variant="ghost" 
                size="lg"
                className="px-4 hover:bg-primary/10 transition-all duration-300"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}