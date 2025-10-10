// src/components/profile/privacyandsafety/PrivacyScreen.tsx (Modified)

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, FileText, BookOpen, AlertTriangle, Shield } from "lucide-react";

interface PrivacyScreenProps {
  onBack: () => void;
  onNavigateToReport: () => void;
  onNavigateToPolicy: () => void;
  onNavigateToTerms: () => void;
  onNavigateToSafetyCenter: () => void;
}

export function PrivacyScreen({ 
  onBack, 
  onNavigateToReport, 
  onNavigateToPolicy, 
  onNavigateToTerms,
  onNavigateToSafetyCenter
}: PrivacyScreenProps) {

  return (
    <div className="max-w-lg mx-auto bg-background min-h-screen">
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold mx-auto">Privacy & Safety</h1>
        <div className="w-9"></div> {/* Spacer */}
      </div>

      <div className="p-6 space-y-6">
        {/* The "Activity Controls" Card has been removed from here. */}

        <Card>
          <CardHeader>
            <CardTitle>Safety & Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={onNavigateToSafetyCenter}>
              <Shield className="h-4 w-4 mr-2" />
              Safety Center & Tips
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={onNavigateToReport}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report a Concern
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Legal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="ghost" className="w-full justify-start" onClick={onNavigateToPolicy}>
              <FileText className="h-4 w-4 mr-2" />
              Privacy Policy
            </Button>
            <Separator />
            <Button variant="ghost" className="w-full justify-start" onClick={onNavigateToTerms}>
              <BookOpen className="h-4 w-4 mr-2" />
              Terms and Conditions
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}