import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ScrollText, CheckCircle2 } from "lucide-react";

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
    <div className="relative min-h-dvh flex items-center justify-center bg-black p-4 relative overflow-hidden select-none">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');

        .auth-display {
          font-family: 'Bebas Neue', sans-serif;
          letter-spacing: 0.04em;
        }

        .auth-body {
          font-family: 'IBM Plex Sans', sans-serif;
        }

        .auth-noise::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle at 1px 1px, rgba(255, 20, 83, 0.16) 1px, transparent 0);
          background-size: 22px 22px;
          opacity: 0.22;
          pointer-events: none;
          mask-image: linear-gradient(to bottom, rgba(0,0,0,0.65), transparent 78%);
        }
      `}</style>

      {/* Ambient background gradients and noise pattern matching LoginScreen */}
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,_rgba(255,20,83,0.22),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(255,20,83,0.16),_transparent_34%),linear-gradient(135deg,_#050505_0%,_#0b0b0b_45%,_#000_100%)]" />
      <div className="absolute inset-0 -z-10 auth-noise animate-fade-in" />

      {/* Main card matching LoginScreen glassmorphic specs */}
      <Card className="relative w-full max-w-2xl overflow-hidden border border-pink-500/25 bg-black/85 text-white shadow-[0_0_0_1px_rgba(255,20,83,0.2),0_30px_80px_rgba(0,0,0,0.7)] backdrop-blur-2xl flex flex-col max-h-[92vh] animate-fade-in">
        {/* Highlight top line */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent" />
        <div className="absolute right-4 top-4 h-24 w-24 rounded-full border border-pink-500/15 bg-pink-500/8 blur-2xl pointer-events-none" />

        <CardHeader className="space-y-4 pb-4 pt-6 text-center shrink-0 border-b border-white/10 px-6 md:px-8">
          <div className="flex justify-center">
            {/* Box-framed Shield Icon matching Login header boxes */}
            <div className="flex h-14 w-14 items-center justify-center border border-pink-500/30 bg-pink-500/15">
              <ShieldCheck className="h-6 w-6 text-pink-400 animate-pulse" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="auth-display text-4xl leading-none text-white md:text-5xl">
              LEGAL & SAFETY AGREEMENT
            </CardTitle>
            <CardDescription className="auth-body max-w-sm text-sm leading-6 text-white/55 md:text-base mx-auto mt-2">
              Please review our policies to finalize your account creation.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 px-6 py-6 md:px-8 md:py-6 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-pink-500/25 select-text">
          {/* Terms & Conditions */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-pink-400 font-semibold text-xs uppercase tracking-wider auth-body">
              <ScrollText className="h-4 w-4" />
              <span>Terms & Conditions</span>
            </div>
            <div className="h-32 overflow-y-auto bg-white/[0.03] border border-white/10 rounded-lg p-3 text-xs text-white/55 space-y-2 select-text auth-body">
              <p className="font-bold text-white text-sm">1. Welcome to NIT Connect</p>
              <p>NIT Connect is a platform designed to connect students across select National Institutes of Technology. By accessing our platform, you agree to comply with these Terms of Service.</p>
              <p className="font-bold text-white text-sm">2. Age Requirement</p>
              <p>You must be at least 16 years of age to register and use dating features or any other services on NIT Connect. Minors under 16 are strictly prohibited from signing up.</p>
              <p className="font-bold text-white text-sm">3. Behavior & Community Standards</p>
              <p>Users must treat others with respect. Harassment, abuse, catfishing, stalking, hate speech, or sharing offensive content will result in immediate and permanent account deactivation.</p>
              <p className="font-bold text-white text-sm">4. Verification Requirement</p>
              <p>To ensure campus safety, we require verification via ID cards. Providing false or forged verification documents is illegal and will be reported to college authorities.</p>
            </div>
          </div>

          {/* Privacy Policy */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-pink-400 font-semibold text-xs uppercase tracking-wider auth-body">
              <ShieldCheck className="h-4 w-4" />
              <span>Privacy Policy</span>
            </div>
            <div className="h-32 overflow-y-auto bg-white/[0.03] border border-white/10 rounded-lg p-3 text-xs text-white/55 space-y-2 select-text auth-body">
              <p className="font-bold text-white text-sm">1. Information We Collect</p>
              <p>We collect your college email address, profile description, hometown, height, gender preferences, and uploaded photos. This data is used exclusively to facilitate dating and community features.</p>
              <p className="font-bold text-white text-sm">2. GDPR & Indian DPDP Act Compliance</p>
              <p>We store your data securely in Supabase with strict row-level security (RLS). We do not share, lease, or sell your personal details to third-party advertisers.</p>
              <p className="font-bold text-white text-sm">3. Consent & Data Deletion</p>
              <p>By using the app, you consent to the processing of your data. You may request account deactivation and deletion of all profile data, photos, and messages at any time from your Profile Settings.</p>
              <p className="font-bold text-white text-sm">4. Location and Security</p>
              <p>We process location coordinates locally or through encrypted database calls. Your exact coordinates are never shown to other users.</p>
            </div>
          </div>

          {/* Agreement Checkbox Container */}
          <div className="flex items-start space-x-3 bg-white/[0.03] p-4 rounded-xl border border-white/10 select-none auth-body">
            <Checkbox
              id="accepted"
              checked={accepted}
              onCheckedChange={(checked) => setAccepted(!!checked)}
              className="mt-1 border-white/20 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500 text-black"
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="accepted"
                className="text-sm font-medium text-white/70 cursor-pointer hover:text-white transition-colors leading-relaxed"
              >
                I agree to the Terms & Conditions and Privacy Policy, and certify that I am at least 16 years old.
              </Label>
            </div>
          </div>

          {/* Accept and Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!accepted}
            className="group h-14 w-full border border-pink-500/30 bg-pink-500 text-black hover:bg-pink-400 font-bold uppercase tracking-[0.16em] auth-body disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300"
          >
            <CheckCircle2 className="h-5 w-5 mr-1" />
            Accept & Enter NIT Connect
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
