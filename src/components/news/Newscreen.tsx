
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Shield,
  Clock,
  GraduationCap,
  Sparkles,
  Globe,
  Building2,
  Users
} from "lucide-react";
import { NewsAdminPanel } from "./NewsAdminPanel";
import { CreateNewsModal } from "./CreateNewsModal";
import { PendingNewsPage } from "./PendingNewsPage";

interface NewsItem {
  id: string;
  caption: string;
  image_url: string;
  college: string;
  user_email: string;
  first_name?: string;
  profile_photo?: string | null;
  created_at: string;
  scope: string;
}

type FeedTab = "college" | "global";

export default function NewsScreen() {
  const { user } = useAuth();

  const [collegeNews, setCollegeNews] = useState<NewsItem[]>([]);
  const [globalNews, setGlobalNews] = useState<NewsItem[]>([]);
  const [pendingNews, setPendingNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<FeedTab>("college");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showPendingPage, setShowPendingPage] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);

  // --------------------------------------------------
  // Check Admin
  // --------------------------------------------------
  const checkAdmin = async (): Promise<boolean> => {
    if (!user?.email) return false;

    const { data, error } = await supabase.rpc("is_job_admin", {
      p_email: user.email,
    });

    if (error) {
      console.error("Error checking admin:", error.message);
      setIsAdmin(false);
      return false;
    }

    const result = data ?? false;
    setIsAdmin(result);
    return result;
  };

  // --------------------------------------------------
  // Fetch College News
  // --------------------------------------------------
  const fetchCollegeNews = async () => {
    if (!user?.email) return;

    const { data, error } = await supabase.rpc("get_news_feed_college", {
      p_email: user.email,
    });

    if (error) {
      console.error("Error fetching college news:", error);
      return;
    }

    setCollegeNews((data as NewsItem[]) || []);
  };

  // --------------------------------------------------
  // Fetch Global News
  // --------------------------------------------------
  const fetchGlobalNews = async () => {
    if (!user?.email) return;

    const { data, error } = await supabase.rpc("get_news_feed_global", {
      p_email: user.email,
    });

    if (error) {
      console.error("Error fetching global news:", error);
      return;
    }

    setGlobalNews((data as NewsItem[]) || []);
  };

  // --------------------------------------------------
  // Fetch Pending News
  // --------------------------------------------------
  const fetchPendingNews = async () => {
    if (!user?.email) return;

    try {
      const { data, error } = await supabase.rpc("get_my_pending_news", {
        p_email: user.email,
      });

      if (error) {
        console.error("Error fetching pending news:", error);
        return;
      }

      setPendingNews((data as NewsItem[]) || []);
    } catch (err) {
      console.error("Unexpected error fetching pending news:", err);
    }
  };

  // --------------------------------------------------
  // Refresh Everything (Best Approach)
  // Preload both feeds so tab switching is instant.
  // --------------------------------------------------
  const refreshAll = async () => {
    if (!user?.email) return;

    setLoading(true);

    try {
      await Promise.all([
        fetchPendingNews(),
        checkAdmin(),
        fetchCollegeNews(),
        fetchGlobalNews(),
      ]);
    } catch (err) {
      console.error("Unexpected error during refresh:", err);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Initial Load
  // --------------------------------------------------
  useEffect(() => {
    if (!user?.email) return;
    refreshAll(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // --------------------------------------------------
  // Current Feed (No refetch on tab switch)
  // --------------------------------------------------
  const currentFeed =
    activeTab === "college" ? collegeNews : globalNews;

  // --------------------------------------------------
  // Loading State
  // --------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-black">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="relative">
            <div className="loading-heart mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Users className="h-8 w-8 text-pink-500 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              LOADING NEWS...
            </h3>
            <p className="text-gray-400">Getting your news feed ready</p>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div className="h-screen overflow-hidden bg-black text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                Campus News
              </h1>
              <p className="text-sm text-gray-400">
                Latest updates from your colleges
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap justify-end">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAdminPanel(true)}
                  className="border-pink-500/30 text-pink-400"
                >
                  <Shield className="h-5 w-5" />
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => setShowPendingPage(true)}
                className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              >
                <Clock className="h-4 w-4 mr-2" />
                Approval Pending ({pendingNews.length})
              </Button>

              <Button
                size="icon"
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-pink-600 to-purple-600"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex bg-white/5 rounded-full p-1 border border-white/10">
            <button
              onClick={() => setActiveTab("college")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === "college"
                  ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Building2 className="h-4 w-4" />
              My College
            </button>

            <button
              onClick={() => setActiveTab("global")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === "global"
                  ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Globe className="h-4 w-4" />
              Global
            </button>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
        <div className="max-w-2xl mx-auto space-y-6 pb-28">
          {currentFeed.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              No news available yet.
            </div>
          ) : (
            currentFeed.map((item) => (
              <NewsCard key={item.id} item={item} pending={false} />
            ))
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateNewsModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            refreshAll(); // Refresh both feeds after creating news
          }}
        />
      )}

      {/* Admin Panel */}
      {showAdminPanel && (
        <NewsAdminPanel
          onClose={() => {
            setShowAdminPanel(false);
            refreshAll(); // Refresh both feeds after admin actions
          }}
        />
      )}

      {/* Pending News Page */}
      {showPendingPage && (
        <PendingNewsPage
          pendingNews={pendingNews}
          onClose={() => {
            setShowPendingPage(false);
            fetchPendingNews(); // Only pending list needs refresh
          }}
        />
      )}
    </div>
  );
}

// --------------------------------------------------
// News Card Component
// --------------------------------------------------
function NewsCard({
  item,
  pending = false,
}: {
  item: NewsItem;
  pending?: boolean;
}) {
  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden rounded-2xl shadow-xl">
      {/* Author */}
      <CardContent className="p-4 pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-11 w-11 ring-2 ring-pink-500/30">
            {item.profile_photo && <AvatarImage src={item.profile_photo} />}
            <AvatarFallback>
              {(item.first_name || "U")[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">
              {item.first_name || item.user_email.split("@")[0]}
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              {item.college || "Unknown College"}
            </p>
          </div>

          {pending && (
            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              <Clock className="h-3 w-3 mr-1" /> Pending
            </Badge>
          )}
        </div>
      </CardContent>
      {/* Image */}
      {item.image_url && (
         <div className="w-full h-[450px] bg-black overflow-hidden">
    <img
      src={item.image_url}
      alt={item.caption}
      className="w-full h-full object-cover"
    />
  </div>
      )}

      {/* Caption */}
      <CardContent className="p-4">
        <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
          {item.caption}
        </p>
      </CardContent>
    </Card>
  );
}
