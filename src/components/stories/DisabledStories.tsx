import { Card, CardContent } from "@/components/ui/card";
import { Camera, Clock } from "lucide-react";

export function DisabledStoriesCarousel() {
  return (
    <div className="px-4 py-2">
      <div className="flex gap-3 overflow-x-auto scrollbar-hide">
        {/* Add Your Story */}
        <div className="flex-shrink-0">
          <Card className="w-16 h-16 border-2 border-dashed border-muted-foreground/30">
            <CardContent className="p-0 flex items-center justify-center h-full">
              <div className="text-center">
                <Camera className="h-5 w-5 mx-auto text-muted-foreground/50 mb-1" />
              </div>
            </CardContent>
          </Card>
          <p className="text-xs text-center mt-1 text-muted-foreground/70">Add Story</p>
        </div>

        {/* Coming Soon Stories */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-shrink-0">
            <Card className="w-16 h-16 bg-muted/30">
              <CardContent className="p-0 flex items-center justify-center h-full">
                <Clock className="h-4 w-4 text-muted-foreground/50" />
              </CardContent>
            </Card>
            <p className="text-xs text-center mt-1 text-muted-foreground/70">Soon</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DisabledAddStoryModal() {
  return null;
}

export function DisabledStoryViewer() {
  return null;
}

export { DisabledStoriesCarousel as StoriesCarousel };
export { DisabledAddStoryModal as AddStoryModal };
export { DisabledStoryViewer as StoryViewer };