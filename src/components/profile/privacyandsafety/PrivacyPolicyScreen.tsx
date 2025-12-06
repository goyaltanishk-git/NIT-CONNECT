import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface PrivacyPolicyScreenProps {
  onBack: () => void;
}

export function PrivacyPolicyScreen({ onBack }: PrivacyPolicyScreenProps) {
  return (
    <div className="h-full overflow-y-auto bg-black text-white [&::-webkit-scrollbar]:hidden">
      <div className="glass border-b border-white/10 sticky top-0 z-50 p-4 flex items-center">
        <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-white/10 text-white">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold mx-auto">Privacy Policy</h1>
        <div className="w-9"></div> {/* Spacer */}
      </div>

      <div className="p-6 space-y-4 text-gray-400 text-sm">
        <p className="text-xs">Last updated: October 10, 2025</p>
        <h2 className="text-xl font-semibold text-white pt-2">1. Introduction</h2>
        <p>Welcome to our application. We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.</p>
        
        <h2 className="text-xl font-semibold text-white pt-2">2. Information We Collect</h2>
        <p>We may collect information about you in a variety of ways. The information we may collect via the Application includes Personal Data (like your name, email, photos), Derivative Data (IP address, browser type), and Mobile Device Data (device ID, model).</p>
        
        <h2 className="text-xl font-semibold text-white pt-2">3. Use of Your Information</h2>
        <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the Application to create and manage your account, email you regarding your account, and increase the efficiency and operation of the Application.</p>
      </div>
    </div>
  );
}