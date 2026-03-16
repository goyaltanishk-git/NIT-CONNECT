// src/components/screens/LoginScreen.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { encryptedStorage } from "@/utils/encryptedStorage";
import { AuthService } from "@/lib/auth";
import { Heart, Mail, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { syncAppSession } from '@/integrations/supabase/client';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0); 
  const { toast } = useToast();
  
  const nitkkrEmailRegex = /^[0-9]{8,10}@nitkkr\.ac\.in$/;
  const nithEmailRegex = /^(1[9]|2[0-8])[a-z]+\d+@nith\.ac\.in$/;
  const nitjsrEmailRegex = /^202[1-9]ug[a-zA-Z]{2}\d+@nitjsr\.ac\.in$/;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
if (!(nitkkrEmailRegex.test(email) || nithEmailRegex.test(email) || nitjsrEmailRegex.test(email))) {
        toast({ 
        title: "Invalid Email", 
        description: "Please use a valid NIT Kurukshetra, Hamirpur, or Jamshedpur email.", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("https://portfoliotrial-omega.vercel.app/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }), 
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || result.error || "Failed to send code.");
      }

      setStep("otp"); 
      setCountdown(60);
      toast({ 
        title: "OTP Sent", 
        description: "Check your college email for the secure code." 
      });
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Verify OTP using AuthService (uses RPC, so no RLS issues)
      const otpVerified = await AuthService.verifyOtp(email, otp);
      if (!otpVerified) throw new Error("Invalid or expired code.");

      // 2. Sync Session (Unlocks RLS for profile read)
      await syncAppSession(email);

      // 3. Get Profile (Returns null if brand new user)
      const userProfile = await AuthService.getOrCreateUserProfile(email);
      
      // 4. Update Storage intelligently based on whether profile exists
      if (userProfile) {
        // Returning user (active or inactive)
        encryptedStorage.set("current-user", JSON.stringify(userProfile));
      } else {
        // Brand new user -> Needs ID Verification
        encryptedStorage.set("current-user", JSON.stringify({ email, needsVerification: true }));
      }
      
      toast({ 
        title: "Login Successful", 
        description: userProfile ? "Welcome back!" : "Please verify your Student ID.",
      });

      // 5. Trigger AuthGuard update without reload
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        window.location.reload(); 
      }

    } catch (error: any) {
      console.error("Login Error:", error);
      toast({ 
        title: "Login Failed", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-dvh flex items-center justify-center bg-black p-4 relative overflow-hidden">
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-black via-gray-900/50 to-black pointer-events-none"></div>
      
      <Card className="w-full max-w-md glass border-white/10 shadow-2xl animate-fade-in relative overflow-hidden">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-4 rounded-full animate-heartbeat">
                <Heart className="h-10 w-10 text-white" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-pink-400 animate-pulse" />
              <Zap className="absolute -bottom-2 -left-2 w-5 h-5 text-purple-400 animate-bounce" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold gradient-text-animated text-white">NIT Connect</CardTitle>
          <CardDescription className="text-gray-300 text-lg">
            {step === "email" ? "Login with college email" : "Enter secure code"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-white font-medium">Email Address</Label>
                <div className="relative text-white">
                  <Mail className="absolute left-4 top-4 h-5 w-5 text-pink-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Enter NIT domain email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="pl-12 h-12 glass-light border-white/20 text-white" 
                    required 
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={loading || countdown > 0} 
                className="w-full h-12 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Sending...</span>
                  </div>
                ) : countdown > 0 ? (
                  <span>Resend in {countdown}s</span> 
                ) : (
                  "Send OTP"
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="otp" className="text-white font-medium">Enter OTP Code</Label>
                <div className="relative text-white">
                   <ShieldCheck className="absolute left-4 top-4 h-5 w-5 text-pink-400" />
                   <Input 
                    id="otp" 
                    type="text" 
                    placeholder="123456" 
                    maxLength={6}
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    className="pl-12 text-center text-2xl tracking-widest h-14 glass-light border-white/20 text-white font-mono" 
                    required 
                  />
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Sent to <span className="text-pink-400">{email}</span>
                </p>
              </div>
              
              <Button type="submit" disabled={loading} className="w-full h-12 bg-pink-600 hover:bg-pink-700 text-white">
                {loading ? "Verifying..." : "Verify & Login"}
              </Button>
              
              <button 
                type="button" 
                onClick={() => setStep("email")} 
                className="w-full text-sm text-gray-400 hover:text-white mt-2 transition-colors"
              >
                ← Back to email
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}