// src/components/screens/LoginScreen.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { encryptedStorage } from "@/utils/encryptedStorage";

import { AuthService } from "@/lib/auth";
import { Heart, Mail, User, Sparkles, Zap, AlertCircle } from "lucide-react";


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
    // Logic is currently disabled via button state
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Logic is currently disabled via button state
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
        
        {/* Maintenance Indicator Bar */}
        <div className="bg-pink-600/20 border-b border-pink-500/30 py-2 px-4 flex items-center justify-center gap-2">
           <AlertCircle className="h-4 w-4 text-pink-400 animate-pulse" />
           <span className="text-[10px] md:text-xs font-semibold text-pink-200 tracking-wider uppercase">
             Service Alert: System Maintenance
           </span>
        </div>

        <CardHeader className="text-center space-y-4 pb-8 pt-6">
          <div className="flex justify-center mb-4">
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
              ? "Enter your NIT Kurukshetra email to get started" 
              : "Enter the OTP sent to your email"
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          
          {/* Maintenance Message Box */}
          <div className="p-4 rounded-xl glass-light border border-pink-500/20 bg-pink-500/5 animate-pulse-glow">
            <div className="flex gap-3 items-start">
              <AlertCircle className="h-5 w-5 text-pink-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-pink-400">Maintenance Update</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  We are having some maintenance issues. Please try again later.
                </p>
              </div>
            </div>
          </div>

          {step === "email" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-white font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 h-5 w-5 text-pink-400" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="Enter nitkkr domain mail id" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="pl-12 h-12 glass-light border-white/20 text-white placeholder:text-gray-400 focus:border-pink-500 focus:ring-pink-500/20 transition-all duration-300" 
                    required 
                    disabled={true}
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-gray-800 text-gray-400 font-semibold rounded-xl shadow-lg cursor-not-allowed" 
                disabled={true}
              >
                Send OTP (Disabled)
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
                  disabled={true}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-gray-800 text-gray-400 font-semibold rounded-xl shadow-lg cursor-not-allowed" 
                disabled={true}
              >
                Verify OTP (Disabled)
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full h-12 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300" 
                onClick={() => setStep("email")}
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