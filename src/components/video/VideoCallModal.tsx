import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2 } from "lucide-react";
import { useVideoCall } from "@/hooks/useVideoCall";

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
    callState,
    localVideoRef,
    remoteVideoRef,
    initiateCall,
    acceptCall,
    endCall,
    toggleMute,
    toggleVideo,
    formatDuration,
  } = useVideoCall();

  if (!isOpen) return null;

  const handleEndCall = () => {
    endCall();
    onClose();
  };

  const handleAcceptCall = () => {
    if (incomingCall) {
      acceptCall(incomingCall.callId);
    }
  };

  const handleInitiateCall = () => {
    if (targetUser) {
      initiateCall(targetUser.id, targetUser.name);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[600px] bg-gradient-to-br from-gray-900 to-black border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent p-4">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={targetUser?.photos[0] || incomingCall?.callerPhoto} />
                <AvatarFallback>
                  {(targetUser?.name || incomingCall?.callerName || '?')[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">
                  {targetUser?.name || incomingCall?.callerName}
                </h3>
                <p className="text-sm text-gray-300">
                  {callState.isInCall 
                    ? formatDuration(callState.callDuration)
                    : callState.isConnecting 
                    ? 'Connecting...'
                    : incomingCall 
                    ? 'Incoming call'
                    : 'Ready to call'
                  }
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Video Area */}
        <div className="relative h-full">
          {/* Remote Video (Main) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          
          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-20 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            {callState.isVideoOff && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOff className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>

          {/* Call Status Overlay */}
          {!callState.isInCall && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center text-white">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage src={targetUser?.photos[0] || incomingCall?.callerPhoto} />
                  <AvatarFallback className="text-2xl">
                    {(targetUser?.name || incomingCall?.callerName || '?')[0]}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-2xl font-bold mb-2">
                  {targetUser?.name || incomingCall?.callerName}
                </h3>
                <p className="text-lg text-gray-300">
                  {callState.isConnecting 
                    ? 'Calling...'
                    : incomingCall 
                    ? 'Incoming video call'
                    : 'Ready to start call'
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="flex items-center justify-center gap-4">
            {/* Incoming Call Controls */}
            {incomingCall && !callState.isInCall && (
              <>
                <Button
                  size="lg"
                  variant="destructive"
                  className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600"
                  onClick={handleEndCall}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
                <Button
                  size="lg"
                  className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600"
                  onClick={handleAcceptCall}
                >
                  <Phone className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Outgoing Call Controls */}
            {targetUser && !callState.isInCall && !callState.isConnecting && (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 w-14 rounded-full border-white/20 text-white hover:bg-white/20"
                  onClick={onClose}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
                <Button
                  size="lg"
                  className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600"
                  onClick={handleInitiateCall}
                >
                  <Phone className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* In-Call Controls */}
            {(callState.isInCall || callState.isConnecting) && (
              <>
                <Button
                  size="lg"
                  variant="outline"
                  className={`h-12 w-12 rounded-full border-white/20 text-white hover:bg-white/20 ${
                    callState.isMuted ? 'bg-red-500/20 border-red-500' : ''
                  }`}
                  onClick={toggleMute}
                >
                  {callState.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  className={`h-12 w-12 rounded-full border-white/20 text-white hover:bg-white/20 ${
                    callState.isVideoOff ? 'bg-red-500/20 border-red-500' : ''
                  }`}
                  onClick={toggleVideo}
                >
                  {callState.isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </Button>

                <Button
                  size="lg"
                  variant="destructive"
                  className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600"
                  onClick={handleEndCall}
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}