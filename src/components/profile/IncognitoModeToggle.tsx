import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EyeOff, Eye, Shield, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthService } from "@/lib/auth";

interface IncognitoModeToggleProps {
  isIncognito: boolean;
  userGender: "male" | "female";
  onToggle: (enabled: boolean) => Promise<void>;
}

export function IncognitoModeToggle({ isIncognito, userGender, onToggle }: IncognitoModeToggleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Only show for female users
  if (userGender !== "female") {
    return null;
  }

  const handleToggle = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      await onToggle(enabled);
      
      toast({
        title: enabled ? "Incognito Mode Activated" : "Incognito Mode Deactivated",
        description: enabled 
          ? "Your identity is now hidden from others. You can still match and chat anonymously."
          : "Your profile is now visible to others with your real information.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update incognito mode. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isIncognito ? 'bg-purple-100' : 'bg-gray-100'}`}>
              {isIncognito ? (
                <EyeOff className="h-5 w-5 text-purple-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-600" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Incognito Mode
                <Badge variant={isIncognito ? "default" : "secondary"} className="text-xs">
                  {isIncognito ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
              <CardDescription>
                Browse and match anonymously while keeping all features
              </CardDescription>
            </div>
          </div>
          <Switch
            checked={isIncognito}
            onCheckedChange={handleToggle}
            disabled={isLoading}
            className="data-[state=checked]:bg-purple-600"
          />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="bg-white/60 rounded-lg p-3 border border-purple-100">
          <div className="flex items-start gap-2 mb-3">
            <Info className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">When Incognito Mode is active:</p>
              <ul className="space-y-1 text-xs">
                <li>• Your name appears as "Anonymous User" to others</li>
                <li>• Your photos are blurred or hidden from potential matches</li>
                <li>• You can still swipe, match, and chat normally</li>
                <li>• Other users won't see your real identity until you choose to reveal it</li>
                <li>• Your profile details (year, branch, etc.) remain hidden</li>
              </ul>
            </div>
          </div>
          
          {isIncognito && (
            <div className="flex items-center gap-2 p-2 bg-purple-100 rounded-md">
              <Shield className="h-4 w-4 text-purple-700" />
              <span className="text-xs font-medium text-purple-800">
                Your identity is protected. Others see you as "Anonymous User"
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}