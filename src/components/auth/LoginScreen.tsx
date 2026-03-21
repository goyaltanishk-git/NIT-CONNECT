import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Heart, Wrench } from "lucide-react";

export function LoginScreen() {
  return (
    <div className="h-dvh flex items-center justify-center bg-black p-4 relative overflow-hidden">
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-black via-gray-900/50 to-black pointer-events-none"></div>
      
      <Card className="w-full max-w-md glass border-white/10 shadow-2xl animate-fade-in text-center">
        <CardHeader className="space-y-6 pb-6">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 p-4 rounded-full">
              <Heart className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-white">
            NIT Connect
          </CardTitle>
          <CardDescription className="text-gray-300 text-lg">
            We'll be back soon 💔
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <Wrench className="h-12 w-12 text-pink-400 animate-pulse" />
          </div>
          
          <p className="text-gray-300">
            Our app is currently under maintenance.
          </p>
          
          <p className="text-sm text-gray-400">
            We're working hard to improve your experience. Please check back later.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
