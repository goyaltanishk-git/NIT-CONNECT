import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/lib/auth";
import { Heart, Mail, User } from "lucide-react";


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

  // Step 1: Send OTP (keeping existing authentication)
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

      // Store OTP in Supabase
      await AuthService.generateOtp(email, generatedOtp, expiresAt);

      // Send OTP via backend (email API)
      try {
        await fetch("http://localhost:3001/api/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: generatedOtp }),
        });
      } catch (emailError) {
        console.warn("Email service not available:", emailError);
        // In demo mode, show the OTP in console for testing
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

  // Step 2: Verify OTP & Enhanced Profile Handling
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Verify OTP first
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
      localStorage.setItem("current-user", JSON.stringify(userProfile));
      localStorage.setItem("user-login-time", new Date().toISOString());

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

  // Step 3: Enhanced Demo Mode with Profile Creation
  const handleDemoMode = async () => {
    setLoading(true);

    try {
      const demoEmail = `demo.user.${Date.now()}@nitkkr.ac.in`;

      // Create demo profile with more complete data
      const demoProfile = {
        email: demoEmail,
        first_name: "Demo",
        last_name: "User",
        year_of_study: "2",
        branch: "Computer Science",
        hometown: "Demo City",
        bio: "This is a demo account for testing purposes.",
        gender: "other",
        is_verified: false,
        is_active: true,
        created_at: new Date().toISOString(),
      };

      try {
        // Try to create profile in database
        const user = await AuthService.getOrCreateUserProfile(demoEmail);

        // Update with demo data
        const updatedUser = await AuthService.updateProfile(demoEmail, demoProfile);

        await AuthService.updateLastActive(demoEmail);
        localStorage.removeItem("temp-user");

        toast({
          title: "Demo Mode Active",
          description: "Welcome to NIT Connect Demo!",
        });
      } catch (error) {
        console.error("Demo mode database error:", error);

        // Fallback to local storage demo
        const fakeUser = {
          id: "temp-user-" + Date.now(),
          ...demoProfile,
          role: "authenticated",
        };

        localStorage.setItem("temp-user", JSON.stringify(fakeUser));
        localStorage.setItem("current-user", JSON.stringify(fakeUser));

        toast({
          title: "Demo Mode (Local)",
          description: "Using local storage for demo",
        });
      }

      window.location.reload();
    } catch (error) {
      console.error("Demo mode error:", error);
      toast({
        title: "Demo Error",
        description: "Could not initialize demo mode",
        variant: "destructive",
      });
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
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.name@nitkkr.ac.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleDemoMode}
                disabled={loading}
              >
                <User className="w-4 h-4 mr-2" />
                Try Demo Mode
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                  required
                />
                <p className="text-sm text-gray-500 text-center">
                  OTP sent to {email}
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
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