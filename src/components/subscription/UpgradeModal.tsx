import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Heart, BriefcaseBusiness, Users, Check, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Same backend URL used everywhere else in the app
const BACKEND_URL = "https://portfoliotrial-omega.vercel.app";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  userEmail: string;
  userName?: string;
  onSuccess?: () => void;
}

declare global {
  interface Window { Razorpay: any; }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) { resolve(true); return; }
    const s = document.createElement("script");
    s.id      = "razorpay-script";
    s.src     = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function UpgradeModal({ open, onClose, userEmail, userName, onSuccess }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error("Failed to load Razorpay checkout");

      // 1. Create order via our Vercel backend
      const orderRes = await fetch(`${BACKEND_URL}/api/create-razorpay-order`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ user_email: userEmail }),
      });

      if (!orderRes.ok) throw new Error("Failed to create payment order");
      const orderData = await orderRes.json();
      if (!orderData.order_id) throw new Error("Invalid order response");

      // 2. Open Razorpay checkout
      const options = {
        key:         orderData.key_id,
        amount:      orderData.amount,
        currency:    orderData.currency,
        name:        "NIT Connect Premium",
        description: "1 Month Premium Access",
        order_id:    orderData.order_id,
        prefill:     { email: userEmail, name: userName || "" },
        theme:       { color: "#ec4899" },

        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            // 3. Verify payment via our Vercel backend
            const verifyRes = await fetch(`${BACKEND_URL}/api/verify-razorpay-payment`, {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                user_email:          userEmail,
              }),
            });

            if (!verifyRes.ok) throw new Error("Payment verification failed");
            const verifyData = await verifyRes.json();
            if (!verifyData.success) throw new Error("Verification rejected by server");

            toast({
              title: "Welcome to Premium!",
              description: "You now have unlimited swipes, 5 jobs/day, and 15 community joins.",
            });
            onSuccess?.();
            onClose();
          } catch (e: any) {
            toast({ title: "Verification failed", description: e.message, variant: "destructive" });
          }
        },

        modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-gray-950 border border-white/10 text-white max-w-sm mx-auto p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-pink-600 via-purple-600 to-blue-600 p-6 text-center">
          <Crown className="h-12 w-12 text-yellow-300 mx-auto mb-2" />
          <DialogTitle className="text-2xl font-bold text-white">Go Premium</DialogTitle>
          <p className="text-white/80 text-sm mt-1">Unlock the full NIT Connect experience</p>
        </div>

        {/* Plans comparison */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {/* Free */}
            <div className="rounded-xl border border-white/10 p-3 bg-white/5">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Free</p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2"><Heart className="h-3 w-3 text-pink-400" /> 2 swipes / day</li>
                <li className="flex items-center gap-2"><BriefcaseBusiness className="h-3 w-3 text-cyan-400" /> 2 jobs / day</li>
                <li className="flex items-center gap-2"><Users className="h-3 w-3 text-purple-400" /> 5 communities</li>
              </ul>
            </div>

            {/* Premium */}
            <div className="rounded-xl border border-pink-500/50 p-3 bg-gradient-to-br from-pink-950/50 to-purple-950/50 relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">BEST</span>
              </div>
              <p className="text-xs font-semibold text-pink-400 uppercase mb-3">Premium</p>
              <ul className="space-y-2 text-sm text-white">
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-400" /><span>Unlimited swipes</span></li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-400" /><span>5 jobs / day</span></li>
                <li className="flex items-center gap-2"><Check className="h-3 w-3 text-green-400" /><span>15 communities</span></li>
              </ul>
            </div>
          </div>

          {/* Price */}
          <div className="text-center">
            <span className="text-3xl font-bold text-white">₹199</span>
            <span className="text-gray-400 text-sm"> / month</span>
          </div>

          {/* CTA */}
          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl text-base"
          >
            {loading ? (
              <span className="flex items-center gap-2"><Zap className="h-4 w-4 animate-spin" /> Processing...</span>
            ) : (
              <span className="flex items-center gap-2"><Crown className="h-4 w-4" /> Upgrade Now</span>
            )}
          </Button>

          <p className="text-center text-xs text-gray-500">Secure payment via Razorpay · Auto-renew after 30 days</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
