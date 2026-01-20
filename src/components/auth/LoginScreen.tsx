// src/components/screens/LoginScreen.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { encryptedStorage } from "@/utils/encryptedStorage";
import { AuthService } from "@/lib/auth";
import { Heart, Mail, Sparkles, Zap, ShieldCheck } from "lucide-react";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const nitkkrEmailRegex = /^[0-9]{8,10}@nitkkr\.ac\.in$/;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nitkkrEmailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please use your NIT Kurukshetra email address (@nitkkr.ac.in)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // SECURITY FIX: We send ONLY the email. 
      // The server generates and saves the OTP privately.
      const response = await fetch("https://portfoliotrial-omega.vercel.app/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }), 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send security code.");
      }

      setStep("otp");
      toast({
        title: "OTP Sent",
        description: "Check your college email for the secure login code.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const otpVerified = await AuthService.verifyOtp(email, otp);
      if (!otpVerified) {
        throw new Error("Invalid OTP code.");
      }

      toast({
        title: "Verified ✓",
        description: "Loading your profile...",
      });

      const userProfile = await AuthService.getOrCreateUserProfile(email);
      await AuthService.updateLastActive(email);

      // Securely store the session
      encryptedStorage.set("current-user", JSON.stringify(userProfile));
      encryptedStorage.set("user-login-time", new Date().toISOString());

      window.location.reload();
    } catch (error) {
      toast({ 
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-dvh flex items-center justify-center bg-black p-4 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-pink-500/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-black via-gray-900/50 to-black pointer-events-none"></div>

      <Card className="w-full max-w-md glass border-white/10 shadow-2xl animate-fade-in relative overflow-hidden">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-4 rounded-full animate-heartbeat">
                <Heart className="h-10 w-10 text-white" />
              </div>
              <div className="absolute inset-0 bg-pink-500/50 rounded-full blur-xl animate-pulse-glow"></div>
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-pink-400 animate-pulse" />
              <Zap className="absolute -bottom-2 -left-2 w-5 h-5 text-purple-400 animate-bounce" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold gradient-text-animated">
            NIT Connect
          </CardTitle>
          <CardDescription className="text-gray-300 text-lg">
            {step === "email" 
              ? "Enter your college email to get started" 
              : "Enter the code sent to your email"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-white font-medium">College Email</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 h-5 w-5 text-pink-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="00000000@nitkkr.ac.in" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="pl-12 h-12 glass-light border-white/20 text-white placeholder:text-gray-500 focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-300" 
                    required 
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-pink-500 via-pink-600 to-pink-700 hover:from-pink-400 hover:via-pink-500 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-pulse-glow interactive" 
                disabled={loading}
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="otp" className="text-white font-medium">Enter Code</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-4 top-4 h-5 w-5 text-pink-400" />
                  <Input 
                    id="otp" 
                    type="text" 
                    placeholder="123456" 
                    value={otp} 
                    onChange={(e) => setOtp(e.target.value)} 
                    maxLength={6} 
                    className="pl-12 text-center text-2xl tracking-widest h-14 glass-light border-white/20 text-white focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-300 font-mono" 
                    required 
                  />
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Sent to <span className="text-pink-400">{email}</span>
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-pink-500 via-pink-600 to-pink-700 hover:from-pink-400 hover:via-pink-500 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-pulse-glow interactive" 
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify & Login"}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full h-10 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300" 
                onClick={() => setStep("email")} 
                disabled={loading}
              >
                ← Back to email
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}