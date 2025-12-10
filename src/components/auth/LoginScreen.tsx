// src/components/screens/LoginScreen.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { encryptedStorage } from "@/utils/encryptedStorage";

import { AuthService } from "@/lib/auth";
import { Heart, Mail, User, Sparkles, Zap } from "lucide-react";


function generateOTP(length = 6) {
  return Math.floor(100000 + Math.random() * 900000)
    .toString()
    .slice(0, length);
}

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.endsWith("@nitkkr.ac.in")) {
      toast({
        title: "Invalid Email",
        description: "Please use your NIT Kurukshetra email address (@nitkkr.ac.in)",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const generatedOtp = generateOTP();
      console.log(generatedOtp);
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      await AuthService.generateOtp(email, generatedOtp, expiresAt);
      try {
        await fetch("https://portfoliotrial-omega.vercel.app/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: generatedOtp }),
        });
      } catch (emailError) {
        console.warn("Email service not available:", emailError);
        console.log("Demo OTP for", email, ":", generatedOtp);
      }
      setStep("otp");
      toast({
        title: "OTP Sent",
        description: "Check your email for the OTP (or console in demo mode)",
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
        throw new Error("OTP verification failed.");
      }

      toast({
        title: "OTP Verified ✓",
        description: "Loading your profile...",
      });

      

      // Step 3: Get or create user profile with enhanced handling
      const userProfile = await AuthService.getOrCreateUserProfile(email);

      // Step 4: Update profile with Supabase user ID if available
    
      // Step 6: Show appropriate welcome message based on profile status
      
      // Step 7: Update last active and redirect
      await AuthService.updateLastActive(email);

      // Save complete profile information to localStorage
      encryptedStorage.set("current-user", userProfile);
encryptedStorage.set("user-login-time", new Date().toISOString());


      // Redirect user or reload the page
      window.location.reload();
    } catch (error) {
      console.error("Login error:", error);
      toast({ 
        title: "Error",
        description: error instanceof Error ? error.message : "Login failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoMode = async () => {
    setLoading(true);
    try {
      const demoEmail = `demo.user.${Date.now()}@nitkkr.ac.in`;

      // This call now works because the second argument is optional in auth.ts
      await AuthService.getOrCreateUserProfile(demoEmail);

      // CORRECTED: 'gender' is now a valid type ("male" or "female")
      const demoProfile = {
        first_name: "Demo",
        last_name: "User",
        year_of_study: "2",
        branch: "Computer Science",
        hometown: "Demo City",
        bio: "This is a demo account for testing purposes.",
        gender: "male" as const, // Use a valid gender and assert as const
        interested_in: "female" as const,
        is_verified: false,
        is_active: true,
      };

      await AuthService.updateProfile(demoEmail, demoProfile);
      
      toast({
        title: "Demo Mode Active",
        description: "Welcome to NIT Connect Demo!",
      });

      window.location.reload();
    } catch (error) {
      console.error("Demo mode error:", error);
      // Fallback to local storage if DB operations fail
      const fakeUser = {
        id: "temp-user-" + Date.now(),
        email: `demo.user.${Date.now()}@nitkkr.ac.in`,
        role: "authenticated",
      };
      encryptedStorage.set("current-user", JSON.stringify(fakeUser));
      toast({
        title: "Demo Mode (Offline)",
        description: "Using local storage for demo",
      });
      window.location.reload();
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

      {/* Background gradient overlay */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-black via-gray-900/50 to-black pointer-events-none"></div>

      <Card className="w-full max-w-md glass border-white/10 shadow-2xl animate-fade-in">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-4 rounded-full animate-heartbeat">
                <Heart className="h-10 w-10 text-white" />
              </div>
              <div className="absolute inset-0 bg-pink-500/50 rounded-full blur-xl animate-pulse-glow"></div>
              {/* Floating sparkles */}
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-pink-400 animate-pulse" />
              <Zap className="absolute -bottom-2 -left-2 w-5 h-5 text-purple-400 animate-bounce" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold gradient-text-animated">
            NIT Connect
          </CardTitle>
          <CardDescription className="text-gray-300 text-lg">
            {step === "email" 
              ? "Enter your NIT Kurukshetra email to get started" 
              : "Enter the OTP sent to your email"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-white font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 h-5 w-5 text-pink-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your.name@nitkkr.ac.in" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="pl-12 h-12 glass-light border-white/20 text-white placeholder:text-gray-400 focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-300" 
                    required 
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-pink-500 via-pink-600 to-pink-700 hover:from-pink-400 hover:via-pink-500 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-pulse-glow interactive" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Sending OTP...</span>
                  </div>
                ) : (
                  "Send OTP"
                )}
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-black px-4 text-gray-400 font-medium">Or</span>
                </div>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full h-12 glass-light border-white/20 text-white hover:bg-white/10 hover:border-pink-500/50 rounded-xl transition-all duration-300 hover:scale-105 interactive" 
                onClick={handleDemoMode} 
                disabled={loading}
              >
                <User className="w-5 h-5 mr-3 text-pink-400" />
                Try Demo Mode
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="otp" className="text-white font-medium">Enter OTP</Label>
                <Input 
                  id="otp" 
                  type="text" 
                  placeholder="123456" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  maxLength={6} 
                  className="text-center text-2xl tracking-widest h-16 glass-light border-white/20 text-white placeholder:text-gray-400 focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-300 font-mono" 
                  required 
                />
                <p className="text-sm text-gray-400 text-center font-medium">
                  OTP sent to <span className="text-pink-400">{email}</span>
                </p>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-pink-500 via-pink-600 to-pink-700 hover:from-pink-400 hover:via-pink-500 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 animate-pulse-glow interactive" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Verifying...</span>
                  </div>
                ) : (
                  "Verify OTP"
                )}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full h-12 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 hover:scale-105 interactive" 
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