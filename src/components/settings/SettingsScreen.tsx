import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Shield,
  Zap,
  Lock,
  AlertTriangle,
  LogOut,
  Eye,
  Loader2,
  Settings,
} from "lucide-react";

// Import sub-screens
import { HelpScreen } from "@/components/profile/HelpScreen";
import { PrivacyScreen } from "@/components/profile/privacyandsafety/PrivacyScreen";
import { ReportConcernScreen } from "@/components/profile/privacyandsafety/ReportConcernScreen";
import { PrivacyPolicyScreen } from "@/components/profile/privacyandsafety/PrivacyPolicyScreen";
import { TermsScreen } from "@/components/profile/privacyandsafety/TermsScreen";
import { SafetyCenterScreen } from "@/components/profile/privacyandsafety/SafetyCenterScreen";

// 🆕 Import Hero Demo
import { useNavigate } from "react-router-dom";

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  // State for sub-screens
  const navigate = useNavigate();
  const [showPrivacyHub, setShowPrivacyHub] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showReportConcern, setShowReportConcern] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showSafetyCenter, setShowSafetyCenter] = useState(false);

  // 🆕 Hero component toggle

  // State for delete confirmation dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleLogout = () => {
    AuthService.clearCurrentUser();
    window.location.reload();
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const user = AuthService.getCurrentUser();
      if (!user?.email) throw new Error("Could not find user to delete.");
      const userEmail = user.email;

      const { data: photos, error: photosError } = await supabase
        .from("user_photos")
        .select("photo_url")
        .eq("user_email", userEmail);
      if (photosError) throw photosError;

      if (photos && photos.length > 0) {
        const filePaths = photos.map(
          (p) => new URL(p.photo_url).pathname.split("/user-photos/")[1]
        );
        const { error: storageError } = await supabase.storage
          .from("user-photos")
          .remove(filePaths);
        if (storageError)
          throw new Error(
            `Failed to delete photos from storage: ${storageError.message}`
          );
      }

      const { error: dbPhotosError } = await supabase
        .from("user_photos")
        .delete()
        .eq("user_email", userEmail);
      if (dbPhotosError)
        throw new Error(`Failed to clear photo records: ${dbPhotosError.message}`);

      const { error: interestsError } = await supabase
        .from("user_interests")
        .delete()
        .eq("user_email", userEmail);
      if (interestsError)
        throw new Error(`Failed to clear interests: ${interestsError.message}`);

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          is_active: false,
          bio: null,
          height: null,
          hometown: null,
          phone_number: null,
          instagram_handle: null,
        })
        .eq("email", userEmail);
      if (profileError)
        throw new Error(`Failed to update profile: ${profileError.message}`);

      handleLogout();
    } catch (error: any) {
      console.error("Failed to delete account:", error);
      setDeleteError(
        error.message || "An unexpected error occurred. Please try again."
      );
      setIsDeleting(false);
    }
  };

  // Navigation Router
  if (showHelp) return <HelpScreen onBack={() => setShowHelp(false)} />;
  if (showReportConcern)
    return (
      <ReportConcernScreen
        onBack={() => {
          setShowReportConcern(false);
          setShowPrivacyHub(true);
        }}
      />
    );
  if (showPrivacyPolicy)
    return (
      <PrivacyPolicyScreen
        onBack={() => {
          setShowPrivacyPolicy(false);
          setShowPrivacyHub(true);
        }}
      />
    );
  if (showTerms)
    return (
      <TermsScreen
        onBack={() => {
          setShowTerms(false);
          setShowPrivacyHub(true);
        }}
      />
    );
  if (showSafetyCenter)
    return <SafetyCenterScreen onBack={() => setShowSafetyCenter(false)} />;
  if (showPrivacyHub)
    return (
      <PrivacyScreen
        onBack={() => setShowPrivacyHub(false)}
        onNavigateToReport={() => {
          setShowPrivacyHub(false);
          setShowReportConcern(true);
        }}
        onNavigateToPolicy={() => {
          setShowPrivacyHub(false);
          setShowPrivacyPolicy(true);
        }}
        onNavigateToTerms={() => {
          setShowPrivacyHub(false);
          setShowTerms(true);
        }}
        onNavigateToSafetyCenter={() => {
          setShowPrivacyHub(false);
          setShowSafetyCenter(true);
        }}
      />
    );

  // 🆕 Show Horizon Hero Demo directly here
  
  // --- Main Settings Menu ---
  return (
    <>
      <div className="h-full overflow-y-auto bg-black text-white">
        {/* Enhanced Header with Glassmorphism */}
        <div className="glass border-b border-white/10 sticky top-0 z-40">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="glass-light hover:bg-white/10 interactive rounded-full p-2"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 glass-light">
                    <Settings className="h-6 w-6 text-pink-500" />
                  </div>
                  <div className="absolute inset-0 bg-pink-500/20 rounded-2xl animate-pulse-glow"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold gradient-text-animated">
                    Settings
                  </h1>
                  <p className="text-sm text-gray-400">
                    Manage your account and privacy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <Card className="glass-light border-white/10">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-3 text-white">
                <Lock className="h-6 w-6 text-pink-400" />
                Account & Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="ghost"
                className="w-full justify-start glass-light border border-white/10 hover:bg-white/10 text-white interactive rounded-xl p-4 h-auto"
                onClick={() => setShowPrivacyHub(true)}
              >
                <Shield className="h-5 w-5 mr-3 text-pink-400" />
                <div className="text-left">
                  <p className="font-medium">Privacy & Safety</p>
                  <p className="text-sm text-gray-400">
                    Control your privacy settings
                  </p>
                </div>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start glass-light border border-white/10 hover:bg-white/10 text-white interactive rounded-xl p-4 h-auto"
                onClick={() => setShowHelp(true)}
              >
                <Zap className="h-5 w-5 mr-3 text-blue-400" />
                <div className="text-left">
                  <p className="font-medium">Help & Support</p>
                  <p className="text-sm text-gray-400">
                    Get help and contact support
                  </p>
                </div>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start glass-light border border-white/10 hover:bg-white/10 text-white interactive rounded-xl p-4 h-auto"
                onClick={() => setShowSafetyCenter(true)}
              >
                <Eye className="h-5 w-5 mr-3 text-green-400" />
                <div className="text-left">
                  <p className="font-medium">Safety Center</p>
                  <p className="text-sm text-gray-400">
                    Learn about safety features
                  </p>
                </div>
              </Button>

              {/* 🆕 NEW HERO TEST BUTTON */}
              <Button
                variant="ghost"
                className="w-full justify-start glass-light border border-white/10 hover:bg-white/10 text-white interactive rounded-xl p-4 h-auto"
                onClick={() => navigate("/temp")}
              >
                <Zap className="h-5 w-5 mr-3 text-yellow-400" />
                <div className="text-left">
                  <p className="font-medium">Test Hero Component</p>
                  <p className="text-sm text-gray-400">
                    Preview Horizon Hero animation
                  </p>
                </div>
              </Button>

              <Separator className="bg-white/10" />

              <Button
                variant="ghost"
                className="w-full justify-start glass-light border border-red-500/30 hover:bg-red-500/20 text-red-400 hover:text-red-300 interactive rounded-xl p-4 h-auto"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Logout</p>
                  <p className="text-sm text-red-400/70">
                    Sign out of your account
                  </p>
                </div>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start glass-light border border-red-500/30 hover:bg-red-500/20 text-red-400 hover:text-red-300 interactive rounded-xl p-4 h-auto"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <AlertTriangle className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-red-400/70">
                    Permanently delete your account
                  </p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="glass border-white/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl gradient-text">
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300 text-base leading-relaxed">
              This action cannot be undone. This will permanently delete your
              account data, including all photos and personal information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
              <p className="text-sm text-red-300">{deleteError}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              className="glass-light border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
            >
              {isDeleting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isDeleting ? "Deleting..." : "Yes, Delete Account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>
    </>
  );
}
