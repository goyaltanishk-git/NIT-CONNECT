import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Camera, Image, Video, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AddStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoryAdded: () => void;
  userId: string;
}

export function AddStoryModal({ isOpen, onClose, onStoryAdded, userId }: AddStoryModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please select an image (JPEG, PNG, GIF) or video (MP4, WebM) file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadStory = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `stories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('story-media')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('story-media')
        .getPublicUrl(filePath);

      // Create story record
      const { error: insertError } = await supabase
        .from('user_stories')
        .insert({
          user_id: userId,
          media_url: publicUrl,
          media_type: selectedFile.type.startsWith('image/') ? 'image' : 'video',
          caption: caption.trim() || null,
        });

      if (insertError) throw insertError;

      toast({
        title: "Story posted! 🎉",
        description: "Your story is now live for 24 hours.",
      });

      // Reset form
      setSelectedFile(null);
      setCaption("");
      setPreview(null);
      onStoryAdded();

    } catch (error) {
      console.error('Error uploading story:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your story. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCameraCapture = () => {
    // In a real app, you'd open the camera
    // For now, we'll just trigger the file input
    fileInputRef.current?.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg font-semibold">Add to Your Story</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedFile ? (
            <div className="space-y-4">
              {/* File Selection Options */}
              <div className="grid grid-cols-3 gap-3">
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={handleCameraCapture}
                >
                  <Camera className="h-6 w-6" />
                  <span className="text-xs">Camera</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image className="h-6 w-6" />
                  <span className="text-xs">Photo</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Video className="h-6 w-6" />
                  <span className="text-xs">Video</span>
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Or drag and drop a file</p>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-dashed"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden">
                {selectedFile.type.startsWith('image/') ? (
                  <img 
                    src={preview || ''} 
                    alt="Story preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video 
                    src={preview || ''} 
                    className="w-full h-full object-cover"
                    controls
                  />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="caption">Caption (optional)</Label>
                <Textarea
                  id="caption"
                  placeholder="Add a caption to your story..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={200}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {caption.length}/200
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                  }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={uploadStory}
                  disabled={uploading}
                  className="flex-1 bg-gradient-to-r from-primary to-primary/80"
                >
                  {uploading ? "Posting..." : "Share Story"}
                </Button>
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center">
            Your story will be visible for 24 hours and then automatically deleted.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}