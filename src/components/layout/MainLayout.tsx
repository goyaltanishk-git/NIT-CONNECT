import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, User, Flame, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { DiscoveryScreen } from "@/components/discovery/DiscoveryScreen";
import { MatchesScreen } from "@/components/matches/MatchesScreen";
import { ChatScreen } from "@/components/chat/ChatScreen";
import { ProfileScreen } from "@/components/profile/ProfileScreen";

type Tab = 'discover' | 'matches' | 'chat' | 'profile';

export function MainLayout() {
  const [activeTab, setActiveTab] = useState<Tab>('discover');

  const tabs = [
    { id: 'discover' as Tab, icon: Flame, label: 'Discover' },
    { id: 'matches' as Tab, icon: Heart, label: 'Matches' },
    { id: 'chat' as Tab, icon: MessageCircle, label: 'Chat' },
    { id: 'profile' as Tab, icon: User, label: 'Profile' }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto border-x border-border">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">NIT Connect</h1>
        <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/10">
          <Settings className="h-5 w-5" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {activeTab === 'discover' && <DiscoveryScreen />}
        {activeTab === 'matches' && <MatchesScreen />}
        {activeTab === 'chat' && <ChatScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-card border-t border-border p-2">
        <div className="flex justify-around">
          {tabs.map(({ id, icon: Icon, label }) => (
            <Button
              key={id}
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-2 px-3",
                activeTab === id 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{label}</span>
            </Button>
          ))}
        </div>
      </nav>
    </div>
  );
}