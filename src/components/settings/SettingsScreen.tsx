// src/components/settings/SettingsScreen.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Shield, Zap, Lock, AlertTriangle, LogOut, Eye } from "lucide-react";
import { AuthService } from "@/lib/auth"; // Import the AuthService here

// Import all necessary sub-screens
import { HelpScreen } from "@/components/profile/HelpScreen";
import { PrivacyScreen } from "@/components/profile/privacyandsafety/PrivacyScreen";
import { ReportConcernScreen } from "@/components/profile/privacyandsafety/ReportConcernScreen";
import { PrivacyPolicyScreen } from "@/components/profile/privacyandsafety/PrivacyPolicyScreen";
import { TermsScreen } from "@/components/profile/privacyandsafety/TermsScreen";
import { SafetyCenterScreen } from "@/components/profile/privacyandsafety/SafetyCenterScreen";

// The onLogout prop is no longer needed
interface SettingsScreenProps {
  onBack: () => void;
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  // State for managing sub-screens (remains the same)
  const [showPrivacyHub, setShowPrivacyHub] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showReportConcern, setShowReportConcern] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showSafetyCenter, setShowSafetyCenter] = useState(false);

  // --- FIX: Logout logic is now inside this component ---
  const handleLogout = () => {
    AuthService.clearCurrentUser();
    window.location.reload();
  };

  // --- Navigation Router (remains the same) ---
  if (showHelp) {
    return <HelpScreen onBack={() => setShowHelp(false)} />;
  }
  if (showReportConcern) {
    return <ReportConcernScreen onBack={() => { setShowReportConcern(false); setShowPrivacyHub(true); }} />;
  }
  if (showPrivacyPolicy) {
    return <PrivacyPolicyScreen onBack={() => { setShowPrivacyPolicy(false); setShowPrivacyHub(true); }} />;
  }
  if (showTerms) {
    return <TermsScreen onBack={() => { setShowTerms(false); setShowPrivacyHub(true); }} />;
  }
  if (showSafetyCenter) {
    return <SafetyCenterScreen onBack={() => setShowSafetyCenter(false)} />;
  }
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
            {/* The Logout button now calls the local handleLogout function */}
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => alert("Delete Account functionality not implemented.")}
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
  );
}