// src/components/screens/LoginScreen.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/lib/auth";
import { Heart, Mail, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      await AuthService.generateOtp(email, generatedOtp, expiresAt);
      try {
        await fetch("http://localhost:3001/api/send-otp", {
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
      if (!otpVerified) throw new Error("OTP verification failed.");
      toast({ title: "OTP Verified ✓", description: "Loading your profile..." });
      
      let supabaseUser = null;
      const { data: authData } = await supabase.auth.signInWithOtp({
        email: email,
        options: { shouldCreateUser: true },
      });
      if (authData.user) supabaseUser = authData.user;

      const userProfile = await AuthService.getOrCreateUserProfile(email, supabaseUser?.id);
      
      if (supabaseUser && userProfile) {
        await AuthService.updateProfile(email, { 
          user_id: supabaseUser.id,
          last_active_at: new Date().toISOString()
        });
      }
      
      const isNewUser = !userProfile.first_name || userProfile.first_name === "User";
      if (isNewUser) {
        toast({
          title: "Welcome to NIT Connect! 🎉",
          description: "Please complete your profile to get started",
        });
      } else {
        toast({
          title: "Welcome back! 👋",
          description: `Logged in as ${userProfile.first_name} ${userProfile.last_name}`,
        });
      }

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
      localStorage.setItem("current-user", JSON.stringify(fakeUser));
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-blue-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-pink-500 to-blue-500 p-3 rounded-full">
              <Heart className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-blue-600 bg-clip-text text-transparent">
            NIT Connect
          </CardTitle>
          <CardDescription>
            {step === "email" 
              ? "Enter your NIT Kurukshetra email to get started" 
              : "Enter the OTP sent to your email"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input id="email" type="email" placeholder="your.name@nitkkr.ac.in" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending OTP..." : "Send OTP"}</Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={handleDemoMode} disabled={loading}><User className="w-4 h-4 mr-2" />Try Demo Mode</Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input id="otp" type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} className="text-center text-lg tracking-widest" required />
                <p className="text-sm text-gray-500 text-center">OTP sent to {email}</p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>{loading ? "Verifying..." : "Verify OTP"}</Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("email")} disabled={loading}>← Back to email</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}