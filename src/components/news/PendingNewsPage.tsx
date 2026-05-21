
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, GraduationCap } from "lucide-react";

interface NewsItem {
  id: string;
  caption: string;
  image_url: string;
  college_name: string;
  user_email: string;
  first_name?: string;
  profile_photo?: string | null;
  created_at: string;
}

interface PendingNewsPageProps {
  pendingNews: NewsItem[];
  onClose: () => void;
}

export function PendingNewsPage({
  pendingNews,
  onClose,
}: PendingNewsPageProps) {
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-white/10 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div>
              <h2 className="text-2xl font-bold text-yellow-400">
                My Pending News
              </h2>
              <p className="text-sm text-gray-400">
                Waiting for admin approval
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-6 pb-10">
          {pendingNews.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              No pending news submissions.
            </div>
          ) : (
            pendingNews.map((item) => (
              <Card
                key={item.id}
                className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden rounded-2xl shadow-xl"
              >
                {/* Author */}
                <CardContent className="p-4 pb-3">
                  <div className="flex items-center gap-3">
                      <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Requested on{" "}
            {new Date(item.created_at).toLocaleString()}
          </p>

        </div>

                      
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 ml-auto">
                      <Clock className="h-3 w-3 mr-1" /> Waiting for Admin Approval
                    </Badge>
                  
                  </div>
                </CardContent>

                {/* Image */}
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.caption}
                    className="w-full max-h-[600px] object-cover"
                  />
                )}

                {/* Caption */}
                <CardContent className="p-4">
                  <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {item.caption}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

