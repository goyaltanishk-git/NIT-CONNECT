import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Heart, BriefcaseBusiness, Users, Check, Loader2 } from "lucide-react";
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
  interface Window { Cashfree: (config: { mode: string }) => any; }
}

function loadCashfreeScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("cashfree-script")) { resolve(true); return; }
    const s = document.createElement("script");
    s.id      = "cashfree-script";
    s.src     = "https://sdk.cashfree.com/js/v3/cashfree.js";
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function UpgradeModal({ open, onClose, userEmail, userName, onSuccess }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const isProcessingRef = useRef(false);
  const { toast } = useToast();

  const handleUpgrade = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setLoading(true);
    try {
      const scriptLoaded = await loadCashfreeScript();
      if (!scriptLoaded) throw new Error("Failed to load Cashfree checkout");

      // 1. Create order via our Vercel backend
      const orderRes = await fetch(`${BACKEND_URL}/api/create-cashfree-order`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ user_email: userEmail }),
      });

      if (!orderRes.ok) throw new Error("Failed to create payment order");
      const orderData = await orderRes.json();
      if (!orderData.payment_session_id) throw new Error("Invalid order response");

      // 2. Open Cashfree checkout modal
      const cashfree = window.Cashfree({ mode: "production" });
      await cashfree.checkout({
        paymentSessionId: orderData.payment_session_id,
        redirectTarget:   "_modal",
      });

      // 3. Verify with backend (backend calls Cashfree API — no client data trusted)
      const verifyRes = await fetch(`${BACKEND_URL}/api/verify-cashfree-payment`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ order_id: orderData.order_id, user_email: userEmail }),
      });

      const verifyData = await verifyRes.json();

      // User closed modal without paying — silently reset
      if (!verifyRes.ok && verifyData.error === "Payment not completed") {
        setLoading(false);
        isProcessingRef.current = false;
        return;
      }

      if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed");
      if (!verifyData.success) throw new Error("Verification rejected by server");

      toast({
        title: "Welcome to Premium!",
        description: "You now have unlimited swipes, 5 jobs/day, and 15 community joins.",
      });
      setLoading(false);
      isProcessingRef.current = false;
      onSuccess?.();
      onClose();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
      setLoading(false);
      isProcessingRef.current = false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto overflow-hidden border border-pink-500/20 bg-[#070709]/95 p-0 text-white shadow-[0_30px_80px_rgba(0,0,0,0.75)] backdrop-blur-xl">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-pink-500 to-transparent" />

        {/* Header */}
        <div className="border-b border-white/10 p-6">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-sm border border-pink-500/35 bg-pink-500/12">
            <Crown className="h-6 w-6 text-pink-400" />
          </div>
          <DialogTitle className="text-2xl font-bold uppercase tracking-[0.08em] text-white">Go Premium</DialogTitle>
          <p className="mt-2 text-sm text-white/55">Switch to premium access for higher daily limits.</p>
        </div>

        {/* Plans */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Current</p>
              <ul className="space-y-2 text-sm text-white/70">
                <li className="flex items-center gap-2"><Heart className="h-3.5 w-3.5 text-pink-400" />2 swipes/day</li>
                <li className="flex items-center gap-2"><BriefcaseBusiness className="h-3.5 w-3.5 text-cyan-400" />2 jobs/day</li>
                <li className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-violet-400" />5 communities</li>
              </ul>
            </div>

            <div className="relative rounded-lg border border-pink-500/35 bg-[#0b0b10] p-3">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-500/75 to-transparent" />
              <div className="mb-2 inline-flex rounded-full border border-pink-500/30 bg-pink-500/12 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-pink-200">
                Premium
              </div>
              <ul className="space-y-2 text-sm text-white">
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-pink-400" /><span>Unlimited swipes</span></li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-pink-400" /><span>5 jobs/day</span></li>
                <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-pink-400" /><span>15 communities</span></li>
              </ul>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3 text-center">
            <span className="text-3xl font-bold text-white">₹1</span>
            <span className="ml-1 text-sm text-white/45">/ month</span>
          </div>

          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="h-12 w-full rounded-md border border-pink-500/35 bg-pink-500 text-black font-semibold uppercase tracking-[0.16em] hover:bg-pink-400"
          >
            {loading ? (
              <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Processing...</span>
            ) : (
              <span className="flex items-center gap-2"><Crown className="h-4 w-4" />Upgrade now</span>
            )}
          </Button>

          <p className="text-center text-xs text-white/40">Secure Cashfree checkout. One-time payment. 7-day support for refund requests.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
