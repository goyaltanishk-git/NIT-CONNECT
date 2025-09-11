import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Mail } from "lucide-react";

export function LoginScreen() {
  const [email, setEmail] = useState("");
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
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      if (error) throw error;

      toast({
        title: "Check your email!",
        description: "We've sent you a login link. Click it to sign in."
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend OTP. Please try again.",
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
              {authStep === 'email' ? (
                <Heart className="h-8 w-8 text-primary-foreground" />
              ) : (
                <Shield className="h-8 w-8 text-primary-foreground" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            NIT Connect
          </CardTitle>
          <CardDescription className="text-base">
            {authStep === 'email' 
              ? "Find your perfect match at NIT Kurukshetra"
              : "Enter the verification code sent to your email"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              disabled={loading}
            >
              {loading ? "Sending..." : "Continue with Email"}
            </Button>
            
            {/* Temporary bypass button */}
            <Button 
              type="button"
              variant="outline" 
              className="w-full border-primary/20 hover:bg-primary/5"
              onClick={() => {
                // Simulate logged in user by setting a fake session
                const fakeUser = {
                  id: 'temp-user-' + Date.now(),
                  email: 'temp@nitkkr.ac.in',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  aud: 'authenticated',
                  role: 'authenticated'
                };
                localStorage.setItem('temp-user', JSON.stringify(fakeUser));
                window.location.reload();
              }}
            >
              🚀 Skip Email (Demo Mode)
            </Button>
          </form>
          <div className="mt-6 text-xs text-center text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
            <br />
            Must be 18+ and a current student/alumni of NIT Kurukshetra.
            {authStep === 'otp' && (
              <>
                <br />
                <span className="text-primary">Check your spam folder if you don't see the email.</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
