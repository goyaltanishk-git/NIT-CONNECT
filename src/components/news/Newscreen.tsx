
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Plus,
  Shield,
  Clock,
  GraduationCap,
  Sparkles,
  Heart,
  Globe,
  Building2,
  ArrowUpRight,
  Image as ImageIcon,
  ShieldCheck,
} from "lucide-react";
import { NewsAdminPanel } from "./NewsAdminPanel";
import { CreateNewsModal } from "./CreateNewsModal";
import { PendingNewsPage } from "./PendingNewsPage";

interface NewsItem {
  id: string;
  caption: string;
  image_url: string;
  college: string;
  college_name: string;
  user_email: string;
  first_name?: string;
  profile_photo?: string | null;
  created_at: string;
  scope: string;
}

type FeedTab = "college" | "global";

export default function NewsScreen() {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [collegeNews, setCollegeNews] = useState<NewsItem[]>([]);
  const [globalNews, setGlobalNews] = useState<NewsItem[]>([]);
  const [pendingNews, setPendingNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<FeedTab>("college");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showPendingPage, setShowPendingPage] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);

  // --------------------------------------------------
  // Check Admin
  // --------------------------------------------------
  const checkAdmin = async (): Promise<boolean> => {
    if (!user?.email) return false;

    const { data, error } = await (supabase as any).rpc("is_job_admin", {
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

    const { data, error } = await (supabase as any).rpc("get_news_feed_college", {
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

    const { data, error } = await (supabase as any).rpc("get_news_feed_global", {
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
      const { data, error } = await (supabase as any).rpc("get_my_pending_news", {
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

  const openStoryPreview = (item: NewsItem) => {
    setSelectedNews(item);
  };

  // --------------------------------------------------
  // Loading State
  // --------------------------------------------------
  if (loading) {
    return (
     <div className="flex items-center justify-center h-dvh bg-black px-6">
  <div className="max-w-sm text-center space-y-5 animate-fade-in">
    
    <div className="relative flex items-center justify-center w-24 h-24 mx-auto">
      <div className="loading-heart"></div>

      <div className="absolute inset-0 flex items-center justify-center">
        <Sparkles className="h-8 w-8 text-pink-500 animate-pulse" />
      </div>
    </div>

    <div className="space-y-3">
      <h3 className="text-3xl font-black tracking-tight text-white">
        Loading the feed.
      </h3>

      <p className="text-sm leading-6 text-white/55">
        Pulling the latest stories from your campus and the wider network.
      </p>
    </div>
  </div>
</div>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------
  return (
    <div className="relative flex min-h-full flex-col overflow-x-hidden bg-black text-white">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,_rgba(255,20,83,0.2),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(255,20,83,0.12),_transparent_28%),linear-gradient(180deg,_#090909_0%,_#000_100%)]" />
      <div className="absolute inset-0 -z-10 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:36px_36px]" />

      <div className="sticky top-0 z-40 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 py-4 md:px-6 md:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="space-y-3">
                <h1 className="max-w-2xl text-[clamp(2.4rem,8vw,5.2rem)] font-black leading-[0.92] tracking-[-0.06em]">
                  NIT NEWS
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-white/55 md:text-base">
                  Quick campus updates and stories worth opening first.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveTab("college")}
                  className={`inline-flex items-center gap-2 border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] transition-all ${
                    activeTab === "college"
                      ? "border-pink-500 bg-pink-500 text-black"
                      : "border-white/10 bg-white/5 text-white/65 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  My College
                </button>

                <button
                  onClick={() => setActiveTab("global")}
                  className={`inline-flex items-center gap-2 border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] transition-all ${
                    activeTab === "global"
                      ? "border-pink-500 bg-pink-500 text-black"
                      : "border-white/10 bg-white/5 text-white/65 hover:border-white/20 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Globe className="h-4 w-4" />
                  Global
                </button>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
              {isAdmin && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAdminPanel(true)}
                  className="h-11 w-11 border-pink-500/25 bg-pink-500/10 text-pink-300 hover:bg-pink-500/15"
                >
                  <Shield className="h-5 w-5" />
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => setShowPendingPage(true)}
                className="h-11 border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
              >
                <Clock className="mr-2 h-4 w-4 text-pink-300" />
                Pending
              </Button>

              <Button
                onClick={() => setShowCreateModal(true)}
                className="h-11 border border-pink-500/25 bg-pink-500 text-black hover:bg-pink-400"
              >
                <Plus className="mr-2 h-4 w-4" />
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-4 py-5 md:px-6 md:py-8">
          {currentFeed.length === 0 ? (
            <div className="grid min-h-[50vh] place-items-center border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
              <div className="max-w-sm space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center border border-pink-500/20 bg-pink-500/10">
                  <ImageIcon className="h-7 w-7 text-pink-300" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight">No stories yet.</h2>
                  <p className="text-sm leading-6 text-white/55">
                    Be the first to post something worth reading for your campus.
                  </p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="bg-pink-500 text-black hover:bg-pink-400">
                  <Plus className="mr-2 h-4 w-4" />
                  Create the first post
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5 pb-28">
              <div className="border-y border-white/10 py-3 text-[10px] uppercase tracking-[0.4em] text-white/30">
                {activeTab === "college" ? "Campus stream" : "Network stream"}
              </div>

              <div className="grid gap-5">
                {currentFeed.map((item, index) => (
                  <NewsCard
                    key={item.id}
                    item={item}
                    pending={false}
                    compact={index > 0}
                    lead={index === 0}
                    onClick={() => openStoryPreview(item)}
                    clickable
                  />
                ))}
              </div>
            </div>
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

      <Dialog
        open={Boolean(selectedNews)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedNews(null);
          }
        }}
      >
        <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-0.75rem)] max-w-2xl overflow-hidden border-white/10 bg-black/95 p-0 text-white sm:max-h-[88vh] sm:w-full sm:rounded-2xl">
          {selectedNews && (
            <div className="flex max-h-[calc(100dvh-1rem)] flex-col overflow-y-auto sm:max-h-[88vh]">
              <DialogHeader className="border-b border-white/10 px-5 py-4 text-left md:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-pink-300/80">Campus story</p>
                    <DialogTitle className="text-xl font-black tracking-tight md:text-2xl">
                      {selectedNews.caption.slice(0, 90)}
                    </DialogTitle>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-white/35">
                    <span className="border border-white/10 bg-white/[0.04] px-2.5 py-1">{selectedNews.scope || "post"}</span>
                    <span className="border border-white/10 bg-white/[0.04] px-2.5 py-1">{new Date(selectedNews.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </DialogHeader>

              <div className="border-b border-white/10 bg-white/[0.02]">
                {selectedNews.image_url ? (
                  <div className="max-h-[34dvh] w-full overflow-hidden bg-black sm:max-h-[420px]">
                    <img
                      src={selectedNews.image_url}
                      alt={selectedNews.caption}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex min-h-56 items-center justify-center bg-[linear-gradient(135deg,rgba(255,20,83,0.16),rgba(255,255,255,0.03))] p-6 text-center">
                    <div className="max-w-sm space-y-3">
                      <p className="text-[10px] uppercase tracking-[0.35em] text-pink-200/70">No image attached</p>
                      <h3 className="text-2xl font-black tracking-tight">Story-first, image-optional.</h3>
                      <p className="text-sm leading-6 text-white/60">This post reads cleanly even without a visual.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-5 p-5 md:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 rounded-none border border-pink-500/25 bg-black ring-0">
                        {selectedNews.profile_photo && <AvatarImage src={selectedNews.profile_photo} />}
                        <AvatarFallback className="rounded-none bg-black text-white">
                          {(selectedNews.first_name || selectedNews.user_email)[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-base font-semibold text-white">{selectedNews.first_name || selectedNews.user_email.split("@")[0]}</p>
                        <p className="flex items-center gap-1 text-xs uppercase tracking-[0.25em] text-white/35">
                          <GraduationCap className="h-3 w-3" />
                          {selectedNews.college || selectedNews.college_name || "Unknown College"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t border-white/10 pt-4">
                  <p className="whitespace-pre-wrap text-base leading-7 text-white/80 md:text-lg">
                    {selectedNews.caption}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --------------------------------------------------
// News Card Component
// --------------------------------------------------
function NewsCard({
  item,
  pending = false,
  compact = false,
  lead = false,
  clickable = false,
  onClick,
}: {
  item: NewsItem;
  pending?: boolean;
  compact?: boolean;
  lead?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}) {
  const authorLabel = item.first_name || item.user_email.split("@")[0];
  const collegeLabel = item.college || item.college_name || "Unknown College";

  return (
    <Card
      className={`overflow-hidden border ${lead ? "border-pink-500/25 bg-white/[0.04] shadow-[0_28px_90px_rgba(0,0,0,0.42)]" : "border-white/10 bg-white/[0.03]"} ${clickable ? "cursor-pointer transition-transform duration-200 active:scale-[0.99]" : ""}`}
      onClick={onClick}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <CardContent className={`${compact ? "p-4 md:p-5" : "p-0"}`}>
        <div className={`${compact ? "grid gap-4 md:grid-cols-[0.82fr_1.18fr]" : "grid gap-0"}`}>
          {item.image_url ? (
            <div className={`${compact ? "h-52 md:h-full" : "h-[420px] md:h-[520px]"} overflow-hidden border-b border-white/10 bg-black md:border-b-0 md:border-r md:border-white/10`}>
              <img
                src={item.image_url}
                alt={item.caption}
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
              />
            </div>
          ) : (
            <div className={`${compact ? "h-52" : "h-[420px] md:h-[520px]"} border-b border-white/10 bg-[linear-gradient(135deg,rgba(255,20,83,0.18),rgba(255,255,255,0.03))] p-5 md:p-6`}>
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-pink-200/80">
                  <ImageIcon className="h-3.5 w-3.5" />
                  No image attached
                </div>
                <div className="max-w-md space-y-3">
                  <h4 className="text-2xl font-black leading-tight md:text-4xl">Story-first, image-optional.</h4>
                  <p className="text-sm leading-6 text-white/60">This post reads cleanly even without a visual.</p>
                </div>
              </div>
            </div>
          )}

          <div className={`${compact ? "space-y-4" : "space-y-5 p-5 md:p-6"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 rounded-none border border-pink-500/25 bg-black ring-0">
                    {item.profile_photo && <AvatarImage src={item.profile_photo} />}
                    <AvatarFallback className="rounded-none bg-black text-white">{authorLabel[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-base font-semibold text-white">{authorLabel}</p>
                    <p className="flex items-center gap-1 text-xs uppercase tracking-[0.25em] text-white/35">
                      <GraduationCap className="h-3 w-3" />
                      {collegeLabel}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-white/35">
                  <span className="border border-white/10 bg-white/[0.04] px-2.5 py-1">{item.scope || "post"}</span>
                  <span className="border border-white/10 bg-white/[0.04] px-2.5 py-1">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {pending && (
                <Badge className="border border-yellow-500/25 bg-yellow-500/10 text-yellow-300">
                  <Clock className="mr-1 h-3 w-3" /> Pending
                </Badge>
              )}
            </div>

            <div className="space-y-3 border-t border-white/10 pt-4">
              <p className={`whitespace-pre-wrap ${compact ? "text-sm leading-6 text-white/70" : "text-base leading-7 text-white/80 md:text-lg"}`}>
                {item.caption}
              </p>

              <div className="flex items-center justify-end border-t border-white/10 pt-4">
                <ArrowUpRight className="h-4 w-4 text-pink-300" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
