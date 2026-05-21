// src/components/auth/LoginScreen.tsx
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Sparkles, Loader2, Mail, KeyRound } from "lucide-react";
import { AuthService } from "@/lib/auth";
import { encryptedStorage } from "@/utils/encryptedStorage";
import { syncAppSession } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ─── BACKEND URL ──────────────────────────────────────────────────────────────
const BACKEND_URL = "https://portfoliotrial-omega.vercel.app";

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  TEMPORARY TEST MODE — FOR RAZORPAY REVIEW ONLY
//     All OTPs are hardcoded to "123456".
//     razorpay@test.com is explicitly allowed past email validation.
//     To restore production behaviour:
//       1. Set TEMP_TEST_MODE = false
//       2. Uncomment the PRODUCTION email validation block below
//       3. The OTP will be sent via the real send-otp backend again
// ─────────────────────────────────────────────────────────────────────────────
const TEMP_TEST_MODE = true;
const TEST_OTP       = "123456";

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTION — Allowed college email domains
// ─────────────────────────────────────────────────────────────────────────────
// const ALLOWED_DOMAINS = [
//   "nitkkr.ac.in",
//   "nith.ac.in",
//   "mnit.ac.in",
//   "nitjsr.ac.in",
// ];
// function isAllowedEmail(email: string): boolean {
//   const domain = email.split("@")[1]?.toLowerCase();
//   return !!domain && ALLOWED_DOMAINS.includes(domain);
// }
// ─────────────────────────────────────────────────────────────────────────────

// TEMPORARY — allow NIT college domains + razorpay test account
function isAllowedEmail(email: string): boolean {
  const lower = email.toLowerCase().trim();

  // Explicit test account for Razorpay review
  if (lower === "razorpay@test.com") return true;

  // Normal college domains
  const domain = lower.split("@")[1];
  return (
    domain === "nitkkr.ac.in" ||
    domain === "nith.ac.in"   ||
    domain === "mnit.ac.in"   ||
    domain === "nitjsr.ac.in"
  );
}

export function LoginScreen() {
  const [step, setStep]         = useState<"email" | "otp">("email");
  const [email, setEmail]       = useState("");
  const [otp, setOtp]           = useState("");
  const [loading, setLoading]   = useState(false);
  const { toast } = useToast();

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      toast({ title: "Enter your email", variant: "destructive" });
      return;
    }
    if (!isAllowedEmail(trimmed)) {
      toast({
        title: "Invalid email",
        description: "Please use your college email (e.g. you@nitkkr.ac.in)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (TEMP_TEST_MODE) {
        // ── TEMPORARY: no backend call at all — OTP check is purely local ────
        // No Supabase insert, no email sent. Just move to OTP step.
        toast({ title: "OTP sent!", description: `Check your inbox at ${trimmed}` });
        // ─────────────────────────────────────────────────────────────────────
      } else {
        // ── PRODUCTION: call the Vercel backend to email a real OTP ──────────
        // const res = await fetch(`${BACKEND_URL}/api/send-otp`, {
        //   method:  "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body:    JSON.stringify({ email: trimmed }),
        // });
        // const data = await res.json();
        // if (!res.ok) {
        //   throw new Error(data.message || "Failed to send OTP");
        // }
        // toast({ title: "OTP sent!", description: `Check your inbox at ${trimmed}` });
        // ─────────────────────────────────────────────────────────────────────
      }

      setEmail(trimmed);
      setStep("otp");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      toast({ title: "Enter the OTP", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (TEMP_TEST_MODE) {
        // ── TEMPORARY: local check only — no Supabase RPC call ───────────────
        if (otp.trim() !== TEST_OTP) {
          throw new Error("Wrong OTP. Use 123456");
        }
        // ─────────────────────────────────────────────────────────────────────
      } else {
        // ── PRODUCTION: verify via Supabase RPC ──────────────────────────────
        // const valid = await AuthService.verifyOtp(email, otp.trim());
        // if (!valid) throw new Error("Invalid or expired OTP");
        // ─────────────────────────────────────────────────────────────────────
      }

      // Sync session so RLS policies know who this is (needed for both modes)
      await syncAppSession(email);

      // Get or create the user profile
      const profile = await AuthService.getOrCreateUserProfile(email);

      if (profile) {
        encryptedStorage.set("current-user", JSON.stringify(profile));
      } else {
        // New user — store email so the verification / setup flow can use it
        encryptedStorage.set("current-user", JSON.stringify({ email }));
      }

      // Reload — AuthGuard picks up the session and routes correctly
      window.location.reload();
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
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

      <Card className="w-full max-w-md glass border-white/10 shadow-2xl animate-fade-in">
        <CardHeader className="space-y-4 pb-4 text-center">
          <div className="flex justify-center">
            <div className="relative">
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-4 rounded-full">
                <Heart className="h-10 w-10 text-white animate-heartbeat" />
              </div>
              <div className="absolute inset-0 bg-pink-500/20 rounded-full animate-pulse-glow" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <CardTitle className="text-3xl font-bold gradient-text-animated">NIT Connect</CardTitle>
            <Sparkles className="h-5 w-5 text-purple-400 animate-pulse" />
          </div>
          <CardDescription className="text-gray-300">
            {step === "email"
              ? "Sign in with your college email"
              : `Enter the OTP sent to ${email}`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 px-6 pb-8">
          {step === "email" ? (
            <>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="you@nitkkr.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-pink-500/50"
                  autoFocus
                />
              </div>
              <Button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                  </span>
                ) : "Send OTP"}
              </Button>
            </>
          ) : (
            <>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-pink-500/50 tracking-widest text-center text-xl"
                  autoFocus
                />
              </div>
              <Button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 6}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                  </span>
                ) : "Verify & Sign In"}
              </Button>
              <button
                onClick={() => { setStep("email"); setOtp(""); }}
                className="w-full text-sm text-gray-400 hover:text-white transition-colors text-center"
              >
                ← Change email
              </button>
            </>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
