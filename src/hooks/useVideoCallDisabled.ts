export function useVideoCall() {
  const initiateCall = async (receiverId: string) => {
    return null;
  };

  const acceptCall = async (callId: string) => {
  };

  const rejectCall = async (callId: string) => {
  };

  const endCall = async (callId: string) => {
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