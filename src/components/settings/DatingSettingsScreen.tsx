import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Heart, Sparkles, ArrowLeft } from "lucide-react";
import {
  Shield,
  Zap,
  Lock,
  Eye,
  Loader2,
  Settings,
  EyeOff,
  Info,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile, FullProfile } from "@/hooks/useUserProfile";
import { encryptedStorage } from "@/utils/encryptedStorage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Import sub-screens
import { HelpScreen } from "@/components/profile/HelpScreen";
import { PrivacyScreen } from "@/components/profile/privacyandsafety/PrivacyScreen";
import { ReportConcernScreen } from "@/components/profile/privacyandsafety/ReportConcernScreen";
import { PrivacyPolicyScreen } from "@/components/profile/privacyandsafety/PrivacyPolicyScreen";
import { TermsScreen } from "@/components/profile/privacyandsafety/TermsScreen";
import { SafetyCenterScreen } from "@/components/profile/privacyandsafety/SafetyCenterScreen";

interface DatingSettingsScreenProps {
  onBack: () => void;
  profile?: FullProfile | null;
  onIncognitoToggle?: (enabled: boolean) => Promise<void>;
}

export function DatingSettingsScreen({
  onBack,
  profile: propProfile,
  onIncognitoToggle: propOnToggle,
}: DatingSettingsScreenProps) {
  const { profile: internalProfile, updateProfile } = useUserProfile();
  const profile = propProfile || internalProfile;

  const internalOnToggle = async (enabled: boolean) => {
    if (!updateProfile) return;
    await updateProfile({ incognito_mode: enabled });
  };

  const onIncognitoToggle = propOnToggle || internalOnToggle;

  const [showPrivacyHub, setShowPrivacyHub] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showReportConcern, setShowReportConcern] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showSafetyCenter, setShowSafetyCenter] = useState(false);

  const [isIncognitoLoading, setIsIncognitoLoading] = useState(false);
  const [isLeavingDating, setIsLeavingDating] = useState(false);
  const [showIncognitoDialog, setShowIncognitoDialog] = useState(false);
  const { toast } = useToast();

  const handleLeaveDating = async () => {
    const localUserRaw = encryptedStorage.get("current-user");
    const localUser = localUserRaw ? JSON.parse(localUserRaw) : null;
    const email = profile?.email || localUser?.email;

    if (!email || isLeavingDating) return;

    try {
      setIsLeavingDating(true);
      const { error } = await (supabase as any).rpc("leave_dating_mode", {
        p_email: email,
      });
      if (error) throw error;

      if (localUser) {
        localUser.is_dating = false;
        encryptedStorage.set("current-user", JSON.stringify(localUser));
      }

      toast({
        title: "Left dating mode",
        description: "You can rejoin anytime from Global Discovery.",
      });

      onBack();
    } catch (error) {
      toast({
        title: "Could not leave dating",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsLeavingDating(false);
    }
  };

  const handleIncognitoToggle = async (enabled: boolean) => {
    setIsIncognitoLoading(true);
    try {
      await onIncognitoToggle(enabled);
      toast({
        title: enabled ? "Incognito Mode Activated" : "Incognito Mode Deactivated",
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

  return (
    <>
      <div className="h-full overflow-y-auto bg-black text-white [&::-webkit-scrollbar]:hidden">
        {/* Enhanced Header with Glassmorphism */}
        <div className="glass border-b border-white/10 top-0 z-40">
          <div className="p-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="h-10 w-10 rounded-full hover:bg-white/10 -ml-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="relative">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 glass-light">
                  <Settings className="h-6 w-6 text-pink-500" />
                </div>
                <div className="absolute inset-0 bg-pink-500/20 rounded-2xl animate-pulse-glow"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text-animated">
                  Dating Settings
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

              {profile && profile.gender === "female" && (
                <Button
                  variant="ghost"
                  className="w-full justify-start glass-light border border-white/10 hover:bg-white/10 text-white interactive rounded-xl p-4 h-auto"
                  onClick={() => setShowIncognitoDialog(true)}
                >
                  {profile.incognito_mode ? (
                    <EyeOff className="h-5 w-5 mr-3 text-purple-400 flex-shrink-0" />
                  ) : (
                    <Eye className="h-5 w-5 mr-3 text-gray-400 flex-shrink-0" />
                  )}
                  <div className="text-left whitespace-normal break-words">
                    <p className="font-medium">Incognito Mode</p>
                    <p className="text-sm text-gray-400 leading-tight">
                      {profile.incognito_mode ? "Active" : "Inactive"} -
                      Browse anonymously
                    </p>
                  </div>
                </Button>
              )}

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

              <Separator className="bg-white/10" />

              <Button
                variant="ghost"
                className="w-full justify-start glass-light border border-white/10 hover:bg-white/10 text-white interactive rounded-xl p-4 h-auto"
                onClick={handleLeaveDating}
                disabled={isLeavingDating}
              >
                <Zap className="h-5 w-5 mr-3 flex-shrink-0" />
                <div className="text-left whitespace-normal break-words">
                  <p className="font-medium">Leave Dating</p>
                  <p className="text-sm text-gray-400">
                    Disable dating mode and clear likes, chats, and matches
                  </p>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* INCOGNITO MODE DIALOG */}
      <DatingSettingsIncognitoDialog
        open={showIncognitoDialog}
        onOpenChange={setShowIncognitoDialog}
        profile={profile}
        isLoading={isIncognitoLoading}
        onToggle={handleIncognitoToggle}
      />
    </>
  );
}

interface DatingSettingsIncognitoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: FullProfile | null | undefined;
  isLoading: boolean;
  onToggle: (enabled: boolean) => Promise<void>;
}

function DatingSettingsIncognitoDialog({
  open,
  onOpenChange,
  profile,
  isLoading,
  onToggle,
}: DatingSettingsIncognitoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              onCheckedChange={onToggle}
              disabled={isLoading}
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
            onClick={() => onOpenChange(false)}
            className="glass-light border border-white/10 hover:bg-white/10"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
