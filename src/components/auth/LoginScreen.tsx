import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Mail } from "lucide-react";

function generateOTP(length = 6) {
  return Math.floor(100000 + Math.random() * 900000).toString().slice(0, length);
}

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast(); 

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.endsWith('@nitkkr.ac.in')) {
      toast({
        title: "Invalid Email",
        description: "Please use your NIT Kurukshetra email address (@nitkkr.ac.in)",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const generatedOtp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

      const { error } = await supabase.from("email_otps").insert({
        email,
        otp: generatedOtp,
        expires_at: expiresAt
      });

      if (error) throw error;

      // Send the OTP via your email API (e.g. Resend or SendGrid)
    await fetch('http://localhost:3001/api/send-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, otp: generatedOtp }),
});

      setStep("otp");

      toast({
        title: "OTP Sent",
        description: "Check your email for the OTP"
      });

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
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
      const { data, error } = await supabase
        .from("email_otps")
        .select("*")
        .eq("email", email)
        .eq("otp", otp)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      const record = data?.[0];
      const now = new Date();

      if (!record || new Date(record.expires_at) < now) {
        toast({
          title: "Invalid or Expired OTP",
          description: "Please try again",
          variant: "destructive"
        });
        return;
      }

      // Simulate logged in user
      const fakeUser = {
        id: 'user-' + Date.now(),
        email,
        created_at: new Date().toISOString(),
        role: 'authenticated'
      };

      localStorage.setItem('temp-user', JSON.stringify(fakeUser));
      window.location.reload();

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "OTP verification failed",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
              <Heart className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            NIT Connect
          </CardTitle>
          <CardDescription className="text-base">
            Find your perfect match at NIT Kurukshetra
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">College Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <Label htmlFor="otp">Enter OTP sent to {email}</Label>
              <Input
                id="otp"
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="6-digit OTP"
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
            </form>
          )}

          {/* Optional Demo Mode */}
          <Button 
            type="button"
            variant="outline" 
            className="w-full mt-4 border-primary/20 hover:bg-primary/5"
            onClick={() => {
              const fakeUser = {
                id: 'temp-user-' + Date.now(),
                email: 'temp@nitkkr.ac.in',
                created_at: new Date().toISOString(),
                role: 'authenticated'
              };
              localStorage.setItem('temp-user', JSON.stringify(fakeUser));
              window.location.reload();
            }}
          >
            🚀 Skip (Demo Mode)
          </Button>

          <div className="mt-6 text-xs text-center text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
            <br />
            Must be 18+ and a current student/alumni of NIT Kurukshetra.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
