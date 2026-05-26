import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Heart, ShieldCheck, ScrollText, CheckCircle2 } from "lucide-react";

interface ConsentScreenProps {
  userEmail: string;
  onComplete: () => void;
}

export function ConsentScreen({ userEmail, onComplete }: ConsentScreenProps) {
  const [accepted, setAccepted] = useState(false);

  const handleSubmit = () => {
    if (accepted) {
      onComplete();
    }
  };

  return (
    <div className="h-dvh flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-black via-gray-900/50 to-black pointer-events-none" />
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-pink-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <Card className="w-full max-w-2xl glass border-white/10 shadow-2xl animate-fade-in text-white overflow-hidden max-h-[95vh] flex flex-col">
        <CardHeader className="space-y-3 pb-2 text-center shrink-0">
          <div className="flex justify-center">
            <div className="relative">
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-4 rounded-full">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
              <div className="absolute inset-0 bg-pink-500/20 rounded-full animate-pulse-glow" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <CardTitle className="text-2xl font-bold gradient-text-animated">Legal & Safety Agreement</CardTitle>
          </div>
          <CardDescription className="text-gray-300">
            Please review our policies to finalize your account creation.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 px-6 pb-6 overflow-y-auto flex-1 pr-4 mr-1 scrollbar-thin scrollbar-thumb-pink-500/20">
          {/* Scrollable Terms & Conditions */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-pink-400 font-semibold text-sm">
              <ScrollText className="h-4 w-4" />
              <span>Terms & Conditions</span>
            </div>
            <div className="h-32 overflow-y-auto bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-gray-400 space-y-2 select-text">
              <p className="font-bold text-gray-300">1. Welcome to NIT Connect</p>
              <p>NIT Connect is a platform designed to connect students across select National Institutes of Technology. By accessing our platform, you agree to comply with these Terms of Service.</p>
              <p className="font-bold text-gray-300">2. Age Requirement</p>
              <p>You must be at least 16 years of age to register and use dating features or any other services on NIT Connect. Minors under 16 are strictly prohibited from signing up.</p>
              <p className="font-bold text-gray-300">3. Behavior & Community Standards</p>
              <p>Users must treat others with respect. Harassment, abuse, catfishing, stalking, hate speech, or sharing offensive content will result in immediate and permanent account deactivation.</p>
              <p className="font-bold text-gray-300">4. Verification Requirement</p>
              <p>To ensure campus safety, we require verification via ID cards. Providing false or forged verification documents is illegal and will be reported to college authorities.</p>
            </div>
          </div>

          {/* Scrollable Privacy Policy */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-pink-400 font-semibold text-sm">
              <ShieldCheck className="h-4 w-4" />
              <span>Privacy Policy</span>
            </div>
            <div className="h-32 overflow-y-auto bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-gray-400 space-y-2 select-text">
              <p className="font-bold text-gray-300">1. Information We Collect</p>
              <p>We collect your college email address, profile description, hometown, height, gender preferences, and uploaded photos. This data is used exclusively to facilitate dating and community features.</p>
              <p className="font-bold text-gray-300">2. GDPR & Indian DPDP Act Compliance</p>
              <p>We store your data securely in Supabase with strict row-level security (RLS). We do not share, lease, or sell your personal details to third-party advertisers.</p>
              <p className="font-bold text-gray-300">3. Consent & Data Deletion</p>
              <p>By using the app, you consent to the processing of your data. You may request account deactivation and deletion of all profile data, photos, and messages at any time from your Profile Settings.</p>
              <p className="font-bold text-gray-300">4. Location and Security</p>
              <p>We process location coordinates locally or through encrypted database calls. Your exact coordinates are never shown to other users.</p>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-start space-x-3 bg-white/5 p-4 rounded-xl border border-white/10 select-none">
            <Checkbox
              id="accepted"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(!!checked)}
              className="mt-1 border-white/20 data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="accepted"
                className="text-sm font-medium text-gray-200 cursor-pointer hover:text-white transition-colors"
              >
                I agree to the Terms & Conditions and Privacy Policy, and certify that I am at least 16 years old.
              </Label>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!accepted}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl mt-2 flex items-center justify-center gap-2 select-none shadow-lg hover:shadow-pink-500/10 transition-all duration-300"
          >
            <CheckCircle2 className="h-5 w-5" />
            Accept & Enter NIT Connect
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
