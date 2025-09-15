export function useVideoCall() {
  const initiateCall = async (receiverId: string) => {
    console.log('Video calls disabled - initiateCall:', receiverId);
    return null;
  };

  const acceptCall = async (callId: string) => {
    console.log('Video calls disabled - acceptCall:', callId);
  };

  const rejectCall = async (callId: string) => {
    console.log('Video calls disabled - rejectCall:', callId);
  };

  const endCall = async (callId: string) => {
    console.log('Video calls disabled - endCall:', callId);
  };

  return {
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    incomingCall: null,
    isCallActive: false,
    isConnecting: false,
  };
}