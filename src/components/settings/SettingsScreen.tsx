// src/components/settings/SettingsScreen.tsx

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
import { ArrowLeft, Shield, Zap, Lock, AlertTriangle, LogOut, Eye, Loader2 } from "lucide-react";

// Import sub-screens
import { HelpScreen } from "@/components/profile/HelpScreen";
import { PrivacyScreen } from "@/components/profile/privacyandsafety/PrivacyScreen";
import { ReportConcernScreen } from "@/components/profile/privacyandsafety/ReportConcernScreen";
import { PrivacyPolicyScreen } from "@/components/profile/privacyandsafety/PrivacyPolicyScreen";
import { TermsScreen } from "@/components/profile/privacyandsafety/TermsScreen";
import { SafetyCenterScreen } from "@/components/profile/privacyandsafety/SafetyCenterScreen";

interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  // State for sub-screens
  const [showPrivacyHub, setShowPrivacyHub] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showReportConcern, setShowReportConcern] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showSafetyCenter, setShowSafetyCenter] = useState(false);

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

      // 1. Get all user photos from the database to identify files in storage
      const { data: photos, error: photosError } = await supabase
        .from('user_photos')
        .select('photo_url')
        .eq('user_email', userEmail);
      if (photosError) throw photosError;

      // 2. If photos exist, delete them from the storage bucket
      if (photos && photos.length > 0) {
        const filePaths = photos.map(p => new URL(p.photo_url).pathname.split('/user-photos/')[1]);
        const { error: storageError } = await supabase.storage.from('user-photos').remove(filePaths);
        if (storageError) throw new Error(`Failed to delete photos from storage: ${storageError.message}`);
      }
      
      // 3. Delete all records from the user_photos table
      const { error: dbPhotosError } = await supabase.from('user_photos').delete().eq('user_email', userEmail);
      if (dbPhotosError) throw new Error(`Failed to clear photo records: ${dbPhotosError.message}`);
      
      // --- NEW: Delete all records from the user_interests table ---
      const { error: interestsError } = await supabase.from('user_interests').delete().eq('user_email', userEmail);
      if (interestsError) throw new Error(`Failed to clear interests: ${interestsError.message}`);

      // 4. Clear profile fields and set is_active to false
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          is_active: false,
          bio: null,
          height: null,
          hometown: null,
          phone_number: null,
          instagram_handle: null,
        })
        .eq('email', userEmail);
      if (profileError) throw new Error(`Failed to update profile: ${profileError.message}`);
      
      // 5. Deletion successful, log the user out
      handleLogout();

    } catch (error: any) {
      console.error("Failed to delete account:", error);
      setDeleteError(error.message || "An unexpected error occurred. Please try again.");
      setIsDeleting(false);
    }
  };


  // Navigation Router
  if (showHelp) return <HelpScreen onBack={() => setShowHelp(false)} />;
  if (showReportConcern) return <ReportConcernScreen onBack={() => { setShowReportConcern(false); setShowPrivacyHub(true); }} />;
  if (showPrivacyPolicy) return <PrivacyPolicyScreen onBack={() => { setShowPrivacyPolicy(false); setShowPrivacyHub(true); }} />;
  if (showTerms) return <TermsScreen onBack={() => { setShowTerms(false); setShowPrivacyHub(true); }} />;
  if (showSafetyCenter) return <SafetyCenterScreen onBack={() => setShowSafetyCenter(false)} />;
  if (showPrivacyHub) {
    return <PrivacyScreen
             onBack={() => setShowPrivacyHub(false)}
             onNavigateToReport={() => { setShowPrivacyHub(false); setShowReportConcern(true); }}
             onNavigateToPolicy={() => { setShowPrivacyHub(false); setShowPrivacyPolicy(true); }}
             onNavigateToTerms={() => { setShowPrivacyHub(false); setShowTerms(true); }}
             onNavigateToSafetyCenter={() => { setShowPrivacyHub(false); setShowSafetyCenter(true); }}
           />;
  }
  
  // --- Main Settings Menu ---
  return (
    <>
      <div className="h-full overflow-y-auto bg-background">
        <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-2">
              <Button variant="ghost" size="sm" onClick={onBack}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold gradient-text">Settings</h1>
            </div>
            <p className="text-sm text-muted-foreground ml-10">
              Manage your account, privacy, and support
            </p>
          </div>
        </div>
        <div className="p-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Account & Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={() => setShowPrivacyHub(true)}>
                <Shield className="h-4 w-4 mr-2" />
                Privacy & Safety
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setShowHelp(true)}>
                <Zap className="h-4 w-4 mr-2" />
                Help & Support
              </Button>
               <Button variant="outline" className="w-full justify-start" onClick={() => setShowSafetyCenter(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Safety Center
              </Button>
              <Separator />
              <Button variant="destructive" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center text-sm text-muted-foreground">
              <p>NIT Connect v1.0.0</p>
              <p className="mt-1">Made with ❤️ for NIT students</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* --- Delete Account Confirmation Dialog --- */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account data, including all photos and personal information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? 'Deleting...' : 'Yes, Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}