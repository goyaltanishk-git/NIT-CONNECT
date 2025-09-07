import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send, MoreVertical, Phone, Video, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  timestamp: string;
  isFromMe: boolean;
  type?: 'text' | 'image' | 'emoji';
}

interface User {
  id: string;
  name: string;
  photos: string[];
  isOnline?: boolean;
  lastSeen?: string;
}

interface IndividualChatProps {
  user: User;
  onBack: () => void;
}

export function IndividualChat({ user, onBack }: IndividualChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hey! Thanks for the match! 😊",
      timestamp: "2024-01-15T10:30:00Z",
      isFromMe: false
    },
    {
      id: "2", 
      text: "Hey there! Great to connect with you too! 🎉",
      timestamp: "2024-01-15T10:32:00Z",
      isFromMe: true
    },
    {
      id: "3",
      text: "I noticed you're into photography. That's amazing! I love taking photos around campus.",
      timestamp: "2024-01-15T10:35:00Z",
      isFromMe: false
    },
    {
      id: "4",
      text: "Really? That's so cool! I'd love to see some of your work. Maybe we could do a photo walk together sometime? 📸",
      timestamp: "2024-01-15T10:38:00Z",
      isFromMe: true
    },
    {
      id: "5",
      text: "That sounds amazing! I know some great spots around Kurukshetra that are perfect for golden hour shots.",
      timestamp: "2024-01-15T11:15:00Z",
      isFromMe: false
    }
  ]);
  
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      text: newMessage,
      timestamp: new Date().toISOString(),
      isFromMe: true
    };

    setMessages(prev => [...prev, message]);
    setNewMessage("");

    // Simulate typing indicator and response
    setTimeout(() => setIsTyping(true), 500);
    setTimeout(() => {
      setIsTyping(false);
      const responses = [
        "That sounds great! 😊",
        "I'm looking forward to it!",
        "Absolutely! When works for you?",
        "That would be amazing! 🎉",
        "Count me in! 💫"
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const response: Message = {
        id: (Date.now() + 1).toString(),
        text: randomResponse,
        timestamp: new Date().toISOString(),
        isFromMe: false
      };
      setMessages(prev => [...prev, response]);
    }, 2000);
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-background to-primary/5">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photos[0]} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            {user.isOnline && (
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
            )}
          </div>
          
          <div className="flex-1">
            <h2 className="font-semibold">{user.name}</h2>
            <p className="text-xs text-muted-foreground">
              {user.isOnline ? "Online now" : user.lastSeen || "Active recently"}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="ghost" size="sm">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Match notification */}
        <div className="flex justify-center">
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 px-4 py-2">
            <div className="flex items-center gap-2 text-sm text-primary">
              <Heart className="h-4 w-4" />
              <span>You matched with {user.name}!</span>
              <Heart className="h-4 w-4" />
            </div>
          </Card>
        </div>

        {messages.map((message, index) => {
          const showTime = index === 0 || 
            new Date(message.timestamp).getTime() - new Date(messages[index - 1].timestamp).getTime() > 300000; // 5 minutes

          return (
            <div key={message.id} className="space-y-1">
              {showTime && (
                <div className="flex justify-center">
                  <span className="text-xs text-muted-foreground px-3 py-1 bg-muted/50 rounded-full">
                    {formatMessageTime(message.timestamp)}
                  </span>
                </div>
              )}
              
              <div className={cn(
                "flex",
                message.isFromMe ? "justify-end" : "justify-start"
              )}>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 shadow-sm",
                  message.isFromMe 
                    ? "bg-primary text-primary-foreground ml-auto" 
                    : "bg-card border border-border"
                )}>
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl px-4 py-2 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-border p-4 bg-card">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${user.name}...`}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-background border-border rounded-full px-4"
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="rounded-full h-10 w-10 p-0 bg-gradient-to-r from-primary to-primary/80"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}