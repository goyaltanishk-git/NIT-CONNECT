// src/components/auth/LoginScreen.tsx
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Sparkles, Loader2, Mail, KeyRound } from "lucide-react";
import { AuthService } from "@/lib/auth";
import { encryptedStorage } from "@/utils/encryptedStorage";
import { syncAppSession } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const BACKEND_URL = "https://portfoliotrial-omega.vercel.app";

const ALLOWED_DOMAINS = [
  "nitkkr.ac.in",
  "nith.ac.in",
  "mnit.ac.in",
  "nitjsr.ac.in",
];

function isAllowedEmail(email: string): boolean {
  const domain = email.toLowerCase().trim().split("@")[1];
  return !!domain && ALLOWED_DOMAINS.includes(domain);
}

export function LoginScreen() {
  const [step, setStep]         = useState<"email" | "otp">("email");
  const [email, setEmail]       = useState("");
  const [otp, setOtp]           = useState("");
  const [loading, setLoading]   = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [lastRequestedEmail, setLastRequestedEmail] = useState("");
  const { toast } = useToast();
  const stepProgress = step === "email" ? 1 : 2;

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = window.setInterval(() => {
      setResendCooldown((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCooldown]);

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

    if (resendCooldown > 0 && trimmed === lastRequestedEmail) {
      toast({
        title: "Please wait",
        description: `You can request another code in ${resendCooldown} seconds.`,
        variant: "destructive",
      });
      return;
    }

    if (step === "otp" && resendCooldown > 0) {
      toast({
        title: "Please wait",
        description: `You can resend the OTP in ${resendCooldown} seconds.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/send-otp`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
            const waitSeconds = Number(String(data.message || "").match(/(\d+)/)?.[1] || 30);
            setResendCooldown(Number.isFinite(waitSeconds) ? waitSeconds : 30);
        }

        throw new Error(data.message || "Failed to send OTP");
      }

      toast({ title: "OTP sent!", description: `Check your inbox at ${trimmed}` });
      setEmail(trimmed);
      setLastRequestedEmail(trimmed);
      setStep("otp");
        setResendCooldown(30);
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
      const valid = await AuthService.verifyOtp(email, otp.trim());
      if (!valid) throw new Error("Invalid or expired OTP");

      // Sync session so RLS policies know who this is
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
    <div className="relative min-h-dvh overflow-hidden bg-black text-white">
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

      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,_rgba(255,20,83,0.22),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(255,20,83,0.16),_transparent_34%),linear-gradient(135deg,_#050505_0%,_#0b0b0b_45%,_#000_100%)]" />
      <div className="absolute inset-0 -z-10 auth-noise" />
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4 py-4 md:px-6 md:py-6">
        <header className="flex items-center justify-between border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl md:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center border border-pink-500/30 bg-pink-500/15">
              <Heart className="h-5 w-5 text-pink-400" />
            </div>
            <div>
              <p className="auth-display text-xl leading-none text-white md:text-2xl">NIT CONNECT</p>
              <p className="auth-body text-[10px] uppercase tracking-[0.35em] text-white/45 md:text-xs">verified campus network</p>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div className="h-px w-16 bg-white/15" />
            <div className="flex items-center gap-2 rounded-full border border-pink-500/25 bg-pink-500/10 px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-pink-200">
              <Sparkles className="h-3.5 w-3.5" />
              Student only
            </div>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center py-4 lg:py-6">
          <section className="flex w-full items-center justify-center">
            <Card className="relative w-full overflow-hidden border border-pink-500/25 bg-black/85 text-white shadow-[0_0_0_1px_rgba(255,20,83,0.2),0_30px_80px_rgba(0,0,0,0.7)] backdrop-blur-2xl lg:max-w-[540px]">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-pink-500 to-transparent" />
              <div className="absolute right-4 top-4 h-24 w-24 rounded-full border border-pink-500/15 bg-pink-500/8 blur-2xl" />

              <CardHeader className="space-y-5 border-b border-white/10 px-6 pb-6 pt-6 md:px-8 md:pt-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-2">
                    <CardTitle className="auth-display text-4xl leading-none text-white md:text-5xl">
                      {step === "email" ? "ENTER EMAIL" : "ENTER CODE"}
                    </CardTitle>
                    <CardDescription className="auth-body max-w-sm text-sm leading-6 text-white/55 md:text-base">
                      {step === "email"
                        ? "Enter your college email to request a one-time code."
                        : `Enter the 6-digit code sent to ${email}.`}
                    </CardDescription>
                  </div>

                  <div className="text-right">
                    <p className="auth-body text-[10px] uppercase tracking-[0.35em] text-white/35">Progress</p>
                    <div className="mt-2 flex items-center gap-2">
                      {[1, 2].map((item) => (
                        <div
                          key={item}
                          className={`h-2 w-10 ${item <= stepProgress ? "bg-pink-500" : "bg-white/10"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 px-6 py-6 md:px-8 md:py-8">
                {step === "email" ? (
                  <>
                    <div className="space-y-3">
                      <label className="auth-body text-xs uppercase tracking-[0.3em] text-white/45">College email</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pink-400" />
                        <Input
                          type="email"
                          placeholder="you@nitkkr.ac.in"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                          className="h-14 border border-white/10 bg-white/[0.04] pl-11 text-white placeholder:text-white/28 focus:border-pink-500/60 focus:ring-0"
                          autoFocus
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="group h-14 w-full border border-pink-500/30 bg-pink-500 text-black hover:bg-pink-400"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2 font-semibold uppercase tracking-[0.25em]">
                          <Loader2 className="h-4 w-4 animate-spin" /> Sending
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 font-semibold uppercase tracking-[0.25em]">
                          Send OTP
                        </span>
                      )}
                    </Button>

                    <p className="auth-body text-center text-sm text-white/40">
                      Use your verified college email only. Outsiders will be blocked.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="space-y-3">
                      <label className="auth-body text-xs uppercase tracking-[0.3em] text-white/45">One-time code</label>
                      <div className="relative">
                        <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pink-400" />
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="6-digit OTP"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                          className="h-14 border border-white/10 bg-white/[0.04] pl-11 text-center text-xl tracking-[0.6em] text-white placeholder:tracking-normal placeholder:text-white/28 focus:border-pink-500/60 focus:ring-0"
                          autoFocus
                        />
                      </div>
                    </div>

                    <Button
                      onClick={handleVerifyOtp}
                      disabled={loading || otp.length < 6}
                      className="group h-14 w-full border border-pink-500/30 bg-pink-500 text-black hover:bg-pink-400"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2 font-semibold uppercase tracking-[0.25em]">
                          <Loader2 className="h-4 w-4 animate-spin" /> Verifying
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 font-semibold uppercase tracking-[0.25em]">
                          Verify & Sign In
                          <Heart className="h-4 w-4 transition-transform group-hover:scale-110" />
                        </span>
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading || resendCooldown > 0}
                      className="auth-body w-full text-sm text-white/50 transition-colors hover:text-pink-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : "Resend OTP"}
                    </button>

                    <button
                      onClick={() => { setStep("email"); setOtp(""); }}
                      className="auth-body w-full text-sm text-white/45 transition-colors hover:text-pink-300"
                    >
                      ← Change email
                    </button>
                  </>
                )}
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
