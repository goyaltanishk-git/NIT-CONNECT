// src/components/profile/privacyandsafety/PrivacyPolicyScreen.tsx

import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface PrivacyPolicyScreenProps {
  onBack: () => void;
}

export function PrivacyPolicyScreen({ onBack }: PrivacyPolicyScreenProps) {
  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen">
      <div className="flex items-center p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        {/* The back button is here */}
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold mx-auto">Privacy Policy</h1>
        <div className="w-9"></div> {/* Spacer */}
      </div>

      <div className="p-6 space-y-4 text-muted-foreground text-sm">
        <p className="text-xs">Last updated: October 10, 2025</p>
        <h2 className="text-xl font-semibold text-foreground pt-2">1. Introduction</h2>
        <p>Welcome to our application. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.</p>
        
        <h2 className="text-xl font-semibold text-foreground pt-2">2. Information We Collect</h2>
        <p>We may collect information about you in a variety of ways. The information we may collect via the Application includes Personal Data (like your name, email, photos), Derivative Data (IP address, browser type), and Mobile Device Data (device ID, model).</p>
        
        <h2 className="text-xl font-semibold text-foreground pt-2">3. Use of Your Information</h2>
        <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Application to create and manage your account, email you regarding your account, and increase the efficiency and operation of the Application.</p>
      </div>
    </div>
  );
}