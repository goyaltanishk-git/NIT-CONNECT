import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Heart,Sparkles } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import * as Sentry from "@sentry/react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Shield,
  Zap,
  Lock,
  AlertTriangle,
  LogOut,
  Eye,
  Loader2,
  Settings,
  EyeOff,
  Info,
  Bug,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile, FullProfile } from "@/hooks/useUserProfile";

// Import sub-screens
import { HelpScreen } from "@/components/profile/HelpScreen";
import { AboutScreen } from "@/components/profile/AboutScreen";
import { PrivacyScreen } from "@/components/profile/privacyandsafety/PrivacyScreen";
import { ReportConcernScreen } from "@/components/profile/privacyandsafety/ReportConcernScreen";
import { PrivacyPolicyScreen } from "@/components/profile/privacyandsafety/PrivacyPolicyScreen";
import { TermsScreen } from "@/components/profile/privacyandsafety/TermsScreen";
import { SafetyCenterScreen } from "@/components/profile/privacyandsafety/SafetyCenterScreen";
import { Section } from "../profile/privacyandsafety/Section";

import { useNavigate } from "react-router-dom";

interface SettingsScreenProps {
  onBack: () => void;
  profile?: FullProfile | null;
  onIncognitoToggle?: (enabled: boolean) => Promise<void>;
}

export function SettingsScreen({
  onBack,
  profile: propProfile,
  onIncognitoToggle: propOnToggle,
}: SettingsScreenProps) {
  
  const { profile: internalProfile, updateProfile } = useUserProfile();
  const profile = propProfile || internalProfile;

  const internalOnToggle = async (enabled: boolean) => {
    if (!updateProfile) return; 
    await updateProfile({ incognito_mode: enabled });
  };
  
  const onIncognitoToggle = propOnToggle || internalOnToggle;
  
  const navigate = useNavigate();
  const [showPrivacyHub, setShowPrivacyHub] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showReportConcern, setShowReportConcern] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showSafetyCenter, setShowSafetyCenter] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [isIncognitoLoading, setIsIncognitoLoading] = useState(false);
  const [showIncognitoDialog, setShowIncognitoDialog] = useState(false);
  const [isSentryTesting, setIsSentryTesting] = useState(false);
  const { toast } = useToast();

  const handleLogout = () => {
    AuthService.clearCurrentUser();
    window.location.reload();
  };

  const handleSentryTest = async () => {
    setIsSentryTesting(true);
    try {
      Sentry.captureException(
        new Error("Test error from Settings - Sentry integration check")
      );
      toast({
        title: "Test Error Sent",
        description: "Check your Sentry dashboard to verify error tracking is working.",
      });
    } finally {
      setIsSentryTesting(false);
    }
  };

  const handleIncognitoToggle = async (enabled: boolean) => {
    setIsIncognitoLoading(true);
    try {
      await onIncognitoToggle(enabled);
      toast({
        title: enabled
          ? "Incognito Mode Activated"
          : "Incognito Mode Deactivated",
        description: enabled
          ? "Your identity is now hidden."
          : "Your profile is now visible.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update incognito mode. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsIncognitoLoading(false);
    }
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
      setDeleteError(
        error.message || "An unexpected error occurred. Please try again."
      );
      setIsDeleting(false);
    }
  };

  if (showHelp) return <HelpScreen onBack={() => setShowHelp(false)} />;
  if (showAbout) return <AboutScreen onBack={() => setShowAbout(false)} />;
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
    return <SafetyCenterScreen  onBack={() => setShowSafetyCenter(false)}/>;
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

  return (
    <>
     
      <div className="h-full overflow-y-auto bg-black text-white [&::-webkit-scrollbar]:hidden">
<div className=" top-0 z-50 glass border-b border-white/10 p-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4 animate-slide-in-left">
              <div className="relative">
                <Heart className="h-10 w-10 text-pink-500 animate-heartbeat" />
                <div className="absolute inset-0 h-10 w-10 bg-pink-500/20 rounded-full animate-pulse-glow"></div>
              </div>
              
              <h1 className="text-2xl md:text-3xl font-bold gradient-text-animated whitespace-nowrap">
                NIT Connect
              </h1>
              
              <div className="flex space-x-1">
                <Sparkles className="h-6 w-6 text-purple-400 animate-pulse stagger-1" />
                <Sparkles className="h-4 w-4 text-pink-400 animate-pulse stagger-2" />
                <Sparkles className="h-5 w-5 text-blue-400 animate-pulse stagger-3" />
              </div>
            </div>
          </div>
        </div>
























        {/* Enhanced Header with Glassmorphism */}
        <div className="glass border-b border-white/10  top-0 z-40">
          <div className="p-6">
            <div className="flex items-center gap-3">
              {/* REMOVED: Back Button */}
               <button
    onClick={onBack}
    className="p-2 rounded-xl glass-light border border-white/10 hover:bg-white/10 transition"
  >
    <ArrowLeft className="h-5 w-5 text-white" />
  </button>
              
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
                <Shield className="h-5 w-5 mr-3 text-pink-400 flex-shrink-0" />
                <div className="text-left whitespace-normal break-words">
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
                <Zap className="h-5 w-5 mr-3 text-blue-400 flex-shrink-0" />
                <div className="text-left whitespace-normal break-words">
                  <p className="font-medium">Help & Support</p>
                  <p className="text-sm text-gray-400">
                    Get help and contact support
                  </p>
                </div>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start glass-light border border-white/10 hover:bg-white/10 text-white interactive rounded-xl p-4 h-auto"
                onClick={() => setShowAbout(true)}
              >
                <Info className="h-5 w-5 mr-3 text-purple-400 flex-shrink-0" />
                <div className="text-left whitespace-normal break-words">
                  <p className="font-medium">About App</p>
                  <p className="text-sm text-gray-400">
                    Learn more about NIT Connect
                  </p>
                </div>
              </Button>

            

<Button
                variant="ghost"
                className="w-full justify-start glass-light border border-white/10 hover:bg-white/10 text-white interactive rounded-xl p-4 h-auto"
                onClick={() => setShowSafetyCenter(true)}
              >
                <Eye className="h-5 w-5 mr-3 text-green-400 flex-shrink-0" />
                <div className="text-left whitespace-normal break-words">
                  <p className="font-medium">Safety Center</p>
                  <p className="text-sm text-gray-400">
                    Learn about safety features
                  </p>
                </div>
              </Button>

              <Button
                variant="ghost"
                className="w-full justify-start glass-light border border-yellow-500/30 hover:bg-yellow-500/10 text-yellow-400 hover:text-yellow-300 interactive rounded-xl p-4 h-auto"
                onClick={handleSentryTest}
                disabled={isSentryTesting}
              >
                <Bug className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="text-left whitespace-normal break-words">
                  <p className="font-medium">Test Error Tracking</p>
                  <p className="text-sm text-yellow-400/70">
                    {isSentryTesting ? "Sending test error..." : "Verify Sentry integration"}
                  </p>
                </div>
              </Button>

              <Separator className="bg-white/10" />

              <Button
                variant="ghost"
                className="w-full justify-start glass-light border border-red-500/30 hover:bg-red-500/20 text-red-400 hover:text-red-300 interactive rounded-xl p-4 h-auto"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="text-left whitespace-normal break-words">
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
                <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="text-left whitespace-normal break-words">
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

      {/* INCOGNITO MODE DIALOG */}
      <Dialog open={showIncognitoDialog} onOpenChange={setShowIncognitoDialog}>
        <DialogContent className="glass border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl gradient-text flex items-center gap-2">
              <EyeOff className="h-5 w-5" />
              Incognito Mode
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Browse and match anonymously while keeping all features.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 glass-light rounded-xl border border-white/10">
              <div className="text-left">
                <p className="font-medium text-white">Activate Incognito Mode</p>
                <p className="text-sm text-gray-400">
                  Your identity will be hidden from others.
                </p>
              </div>
              <Switch
                checked={Boolean(profile?.incognito_mode)}
                onCheckedChange={handleIncognitoToggle}
                disabled={isIncognitoLoading}
                className="data-[state=checked]:bg-pink-500"
              />
            </div>

            <div className="p-4 glass-light rounded-xl border border-white/10">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-300">
                  <p className="font-medium text-white mb-2">
                    When Incognito Mode is active:
                  </p>
                  <ul className="space-y-1.5 text-xs text-gray-400 list-disc list-inside">
                    <li>Your name appears as "Anonymous User" to others</li>
                    <li>Your photos are blurred or hidden from matches</li>
                    <li>You can still swipe, match, and chat normally</li>
                    <li>
                      Others won't see your real identity until you reveal it
                    </li>
                    <li>Your profile details (year, branch, etc.) are hidden</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowIncognitoDialog(false)}
              className="glass-light border border-white/10 hover:bg-white/10"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE ACCOUNT DIALOG */}
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

      {/* Background effects */}
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