// src/components/profile/TermsScreen.tsx

import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface TermsScreenProps {
  onBack: () => void;
}

export function TermsScreen({ onBack }: TermsScreenProps) {
  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen">
       <div className="flex items-center p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold mx-auto">Terms and Conditions</h1>
        <div className="w-9"></div> {/* Spacer */}
      </div>

      <div className="p-6 space-y-4 text-muted-foreground">
        <p className="text-sm">Effective date: October 10, 2025</p>
        <h2 className="text-xl font-semibold text-foreground">1. Agreement to Terms</h2>
        <p>By using our Application, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the Application. We may modify the Terms at any time, in our sole discretion.</p>
        
        <h2 className="text-xl font-semibold text-foreground">2. User Accounts</h2>
        <p>You are responsible for safeguarding your account. You agree not to disclose your password to any third party and to take sole responsibility for any activities or actions under your account, whether or not you have authorized such activities or actions.</p>
        
        <h2 className="text-xl font-semibold text-foreground">3. User Conduct</h2>
        <p>You agree not to use the Service for any purpose that is illegal or prohibited by these Terms. You are responsible for all of your activity in connection with the Service.</p>
        {/* Add more sections as needed */}
      </div>
    </div>
  );
}