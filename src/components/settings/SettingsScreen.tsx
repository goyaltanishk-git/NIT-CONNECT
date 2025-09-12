import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  Bell, 
  Shield, 
  Eye, 
  Heart, 
  MapPin, 
  Users, 
  Smartphone, 
  Moon, 
  Sun,
  Volume2,
  Lock,
  UserCheck,
  AlertTriangle
} from "lucide-react";

interface SettingsScreenProps {
  onBack: () => void;
}

interface SettingsState {
  pushNotifications: boolean;
  matchNotifications: boolean;
  messageNotifications: boolean;
  likeNotifications: boolean;
  showAge: boolean;
  showDistance: boolean;
  onlineStatus: boolean;
  readReceipts: boolean;
  ageRange: number[];
  maxDistance: number;
  showMe: "men" | "women" | "everyone";
  darkMode: boolean;
  soundEffects: boolean;
  hapticFeedback: boolean;
  photoVerification: boolean;
  hideFromContacts: boolean;
  incognitoMode: boolean;
}

interface SettingItem {
  key: keyof SettingsState;
  label: string;
  description: string;
  type: string;
}

interface SettingsSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SettingItem[];
}

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const [settings, setSettings] = useState<SettingsState>({
    // Notifications
    pushNotifications: true,
    matchNotifications: true,
    messageNotifications: true,
    likeNotifications: false,
    
    // Privacy & Safety
    showAge: true,
    showDistance: true,
    onlineStatus: true,
    readReceipts: true,
    
    // Discovery
    ageRange: [18, 25],
    maxDistance: 50,
    showMe: "everyone" as const,
    
    // App Preferences
    darkMode: false,
    soundEffects: true,
    hapticFeedback: true,
    
    // Safety
    photoVerification: false,
    hideFromContacts: false,
    incognitoMode: false
  });

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // Save to localStorage
    localStorage.setItem('dating-app-settings', JSON.stringify({ ...settings, [key]: value }));
  };

  const settingsSections: SettingsSection[] = [
    {
      title: "Notifications",
      icon: Bell,
      items: [
        {
          key: "pushNotifications",
          label: "Push Notifications",
          description: "Receive notifications on your device",
          type: "switch"
        },
        {
          key: "matchNotifications",
          label: "New Matches",
          description: "Get notified when you have a new match",
          type: "switch"
        },
        {
          key: "messageNotifications",
          label: "Messages",
          description: "Get notified about new messages",
          type: "switch"
        },
        {
          key: "likeNotifications",
          label: "Likes",
          description: "Get notified when someone likes you",
          type: "switch"
        }
      ]
    },
    {
      title: "Privacy & Safety",
      icon: Shield,
      items: [
        {
          key: "showAge",
          label: "Show My Age",
          description: "Display your age on your profile",
          type: "switch"
        },
        {
          key: "showDistance",
          label: "Show Distance",
          description: "Show how far away you are from others",
          type: "switch"
        },
        {
          key: "onlineStatus",
          label: "Online Status",
          description: "Let others see when you're active",
          type: "switch"
        },
        {
          key: "readReceipts",
          label: "Read Receipts",
          description: "Show when you've read messages",
          type: "switch"
        },
        {
          key: "photoVerification",
          label: "Photo Verification",
          description: "Verify your photos for added trust",
          type: "switch"
        },
        {
          key: "hideFromContacts",
          label: "Hide from Contacts",
          description: "Don't show your profile to phone contacts",
          type: "switch"
        },
        {
          key: "incognitoMode",
          label: "Incognito Mode",
          description: "Browse privately without being seen",
          type: "switch"
        }
      ]
    },
    {
      title: "Discovery Preferences",
      icon: Users,
      items: [
        {
          key: "ageRange",
          label: "Age Range",
          description: `${settings.ageRange[0]} - ${settings.ageRange[1]} years old`,
          type: "slider"
        },
        {
          key: "maxDistance",
          label: "Maximum Distance",
          description: `Up to ${settings.maxDistance} km away`,
          type: "distance"
        },
        {
          key: "showMe",
          label: "Show Me",
          description: "Who you want to see",
          type: "select"
        }
      ]
    },
    {
      title: "App Preferences",
      icon: Smartphone,
      items: [
        {
          key: "darkMode",
          label: "Dark Mode",
          description: "Use dark theme",
          type: "switch"
        },
        {
          key: "soundEffects",
          label: "Sound Effects",
          description: "Play sounds for app interactions",
          type: "switch"
        },
        {
          key: "hapticFeedback",
          label: "Haptic Feedback",
          description: "Feel vibrations for interactions",
          type: "switch"
        }
      ]
    }
  ];

  const renderSettingControl = (item: SettingItem) => {
    switch (item.type) {
      case "switch":
        return (
          <Switch
            checked={settings[item.key] as boolean}
            onCheckedChange={(checked) => updateSetting(item.key, checked as SettingsState[typeof item.key])}
          />
        );
      
      case "slider":
        return (
          <div className="w-full space-y-2">
            <Slider
              value={settings.ageRange}
              onValueChange={(value) => updateSetting("ageRange", value)}
              max={50}
              min={18}
              step={1}
              className="w-full"
            />
          </div>
        );
      
      case "distance":
        return (
          <div className="w-full space-y-2">
            <Slider
              value={[settings.maxDistance]}
              onValueChange={(value) => updateSetting("maxDistance", value[0])}
              max={100}
              min={1}
              step={1}
              className="w-full"
            />
          </div>
        );
      
      case "select":
        return (
          <Select value={settings.showMe} onValueChange={(value: "men" | "women" | "everyone") => updateSetting("showMe", value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="men">Men</SelectItem>
              <SelectItem value="women">Women</SelectItem>
              <SelectItem value="everyone">Everyone</SelectItem>
            </SelectContent>
          </Select>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold gradient-text">Settings</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-10">
            Customize your dating experience
          </p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {settingsSections.map((section) => (
          <Card key={section.title}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <section.icon className="h-5 w-5 text-primary" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {section.items.map((item, index) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">{item.label}</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    </div>
                    <div className="ml-4">
                      {renderSettingControl(item)}
                    </div>
                  </div>
                  {index < section.items.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <UserCheck className="h-4 w-4 mr-2" />
              Verify Account
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Eye className="h-4 w-4 mr-2" />
              Privacy Policy
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Shield className="h-4 w-4 mr-2" />
              Safety Center
            </Button>
            <Separator />
            <Button 
              variant="outline" 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <Card>
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            <p>NIT Connect v1.0.0</p>
            <p className="mt-1">Made with ❤️ for NIT students</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}