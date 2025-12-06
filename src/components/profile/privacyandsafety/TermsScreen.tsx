import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface TermsScreenProps {
  onBack: () => void;
}

export function TermsScreen({ onBack }: TermsScreenProps) {
  return (
    <div className="h-full overflow-y-auto bg-black text-white [&::-webkit-scrollbar]:hidden">
       <div className="glass border-b border-white/10 sticky top-0 z-50 p-4 flex items-center">
        <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-white/10 text-white">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold mx-auto">Terms and Conditions</h1>
        <div className="w-9"></div> {/* Spacer */}
      </div>

      <div className="p-6 space-y-4 text-gray-400">
        <p className="text-sm">Effective date: October 10, 2025</p>
        <h2 className="text-xl font-semibold text-white">1. Agreement to Terms</h2>
        <p>By using our Application, you agree to be bound by these Terms. If you do not agree to these Terms, do not use the Application. We may modify the Terms at any time, in our sole discretion.</p>
        
        <h2 className="text-xl font-semibold text-white">2. User Accounts</h2>
        <p>You are responsible for safeguarding your account. You agree not to disclose your password to any third party and to take sole responsibility for any activities or actions under your account, whether or not you have authorized such activities or actions.</p>
        
        <h2 className="text-xl font-semibold text-white">3. User Conduct</h2>
        <p>You agree not to use the Service for any purpose that is illegal or prohibited by these Terms. You are responsible for all of your activity in connection with the Service.</p>
        {/* Add more sections as needed */}
      </div>
    </div>
  );
}