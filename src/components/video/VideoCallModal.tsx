import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Phone, PhoneOff, VideoOff } from "lucide-react";
import { useVideoCall } from "@/hooks/useVideoCallDisabled";

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: {
    id: string;
    name: string;
    photos: string[];
  };
  incomingCall?: {
    callId: string;
    callerName: string;
    callerPhoto: string;
  };
}

export function VideoCallModal({ isOpen, onClose, targetUser, incomingCall }: VideoCallModalProps) {
  const {
    initiateCall,
    acceptCall,
    endCall,
  } = useVideoCall();

  if (!isOpen) return null;

  const handleEndCall = () => {
    endCall('disabled');
    onClose();
  };

  const handleAcceptCall = () => {
    if (incomingCall) {
      acceptCall(incomingCall.callId);
    }
  };

  const handleInitiateCall = () => {
    if (targetUser) {
      initiateCall(targetUser.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-gray-900 to-black border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="p-6 text-center text-white">
          <Avatar className="h-24 w-24 mx-auto mb-4">
            <AvatarImage src={targetUser?.photos[0] || incomingCall?.callerPhoto} />
            <AvatarFallback className="text-2xl">
              {(targetUser?.name || incomingCall?.callerName || '?')[0]}
            </AvatarFallback>
          </Avatar>
          <h3 className="text-2xl font-bold mb-2">
            {targetUser?.name || incomingCall?.callerName}
          </h3>
          <p className="text-lg text-gray-300 mb-4">
            Video calls coming soon!
          </p>
          <div className="bg-gray-800 rounded-lg p-8 mb-6">
            <VideoOff className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              Video calling feature is being developed
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              variant="outline"
              className="h-14 w-14 rounded-full border-white/20 text-white hover:bg-white/20"
              onClick={onClose}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            {incomingCall ? (
              <Button
                size="lg"
                className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600"
                onClick={handleAcceptCall}
                disabled
              >
                <Phone className="h-6 w-6" />
              </Button>
            ) : (
              <Button
                size="lg"
                className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600"
                onClick={handleInitiateCall}
                disabled
              >
                <Phone className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}