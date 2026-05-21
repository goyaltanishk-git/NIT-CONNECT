// src/components/news/NewsAdminPanel.tsx

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Shield,
  Clock,
  GraduationCap,
  Check,
  X,
  Sparkles,
} from "lucide-react";

interface PendingNewsItem {
  id: string;
  caption: string;
  image_url: string | null;
  created_at: string;
  user_email: string;
  first_name: string | null;
  college: string | null;
  profile_photo: string | null;
  scope:string
}

interface NewsAdminPanelProps {
  onClose: () => void;
}

export function NewsAdminPanel({ onClose }: NewsAdminPanelProps) {
  const [news, setNews] = useState<PendingNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // --------------------------------------------------------
  // Fetch Pending News
  // --------------------------------------------------------
  const fetchPendingNews = async () => {
    setLoading(true);

    const { data, error } = await supabase.rpc("get_pending_news_for_admin");
    console.log(data);

    if (error) {
      console.error("Error fetching pending news:", error);
      setNews([]);
    } else {
      setNews((data as PendingNewsItem[]) || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPendingNews();
  }, []);

  // --------------------------------------------------------
  // Approve News
  // --------------------------------------------------------
  const handleApprove = async (id: string,email:string) => {
    setProcessingId(id);

    const { error } = await supabase.rpc("approve_news_post", {
      p_news_id: id,
      p_email:email
    });

    if (error) {
      console.error("Approve error:", error);
      alert("Failed to approve news");
    } else {
      await fetchPendingNews();
    }

    setProcessingId(null);
  };

  // --------------------------------------------------------
  // Reject News
  // --------------------------------------------------------
  const handleReject = async (id: string,email:string) => {
    setProcessingId(id);

    const { error } = await supabase.rpc("reject_news_post", {
      p_news_id: id,
      p_email:email
    });

    if (error) {
      console.error("Reject error:", error);
      alert("Failed to reject news");
    } else {
      await fetchPendingNews();
    }

    setProcessingId(null);
  };

  // --------------------------------------------------------
  // Loading State
  // --------------------------------------------------------
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Sparkles className="h-10 w-10 text-pink-500 animate-pulse mx-auto" />
          <p className="text-gray-400">Loading pending news...</p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------
  // Main UI
  // --------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 bg-black text-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-md border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-pink-500" />
            <div>
              <h1 className="text-xl font-bold">News Approval Panel</h1>
              <p className="text-sm text-gray-400">
                {news.length} pending submissions
              </p>
            </div>
          </div>

          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6 pb-10">
        {news.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            No pending news submissions.
          </div>
        ) : (
          news.map((item) => (
            <Card
              key={item.id}
              className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden"
            >
              {/* Author Info */}
              <CardContent className="p-4 pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 ring-2 ring-pink-500/30">
                    {item.profile_photo && (
                      <AvatarImage src={item.profile_photo} />
                    )}
                    <AvatarFallback>
                      {(item.first_name || item.user_email || "U")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {item.first_name ||
                        item.user_email?.split("@")[0] ||
                        "Unknown User"}
                    </p>

                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" />
                      {item.college_name}
                    </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                    
                      {item.scope || "Unknown College"} scope
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>

              {/* Caption */}
              {item.caption && (
                <div className="px-4 pb-3">
                  <p className="text-gray-200 whitespace-pre-wrap">
                    {item.caption}
                  </p>
                </div>
              )}

              {/* Image */}
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt="News"
                  className="w-full max-h-[500px] object-cover"
                />
              )}

              {/* Status Badge */}
              <CardContent className="p-4 pt-3">
                <div className="flex items-center gap-2 mb-4 text-yellow-400 text-sm">
                  <Clock className="h-4 w-4" />
                  Pending Approval
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApprove(item.id,item.user_email)}
                    disabled={processingId === item.id}
                    className="flex-1 bg-green-600 hover:bg-green-500"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {processingId === item.id ? "Processing..." : "Approve"}
                  </Button>

                  <Button
                    onClick={() => handleReject(item.id,item.user_email)}
                    disabled={processingId === item.id}
                    variant="destructive"
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {processingId === item.id ? "Processing..." : "Reject"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}