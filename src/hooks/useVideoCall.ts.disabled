import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface VideoCallState {
  isInCall: boolean;
  isConnecting: boolean;
  callId: string | null;
  remoteUserId: string | null;
  remoteUserName: string | null;
  callDuration: number;
  isMuted: boolean;
  isVideoOff: boolean;
}

export function useVideoCall() {
  const [callState, setCallState] = useState<VideoCallState>({
    isInCall: false,
    isConnecting: false,
    callId: null,
    remoteUserId: null,
    remoteUserName: null,
    callDuration: 0,
    isMuted: false,
    isVideoOff: false,
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();

  // Initialize WebRTC
  const initializeWebRTC = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnectionRef.current = peerConnection;
      return peerConnection;
    } catch (error) {
      console.error('Error initializing WebRTC:', error);
      toast({
        title: "Camera/Microphone Error",
        description: "Please allow camera and microphone access to make video calls.",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  // Start call timer
  const startCallTimer = useCallback(() => {
    callTimerRef.current = setInterval(() => {
      setCallState(prev => ({
        ...prev,
        callDuration: prev.callDuration + 1,
      }));
    }, 1000);
  }, []);

  // Stop call timer
  const stopCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  }, []);

  // Initiate call
  const initiateCall = useCallback(async (targetUserId: string, targetUserName: string) => {
    try {
      setCallState(prev => ({
        ...prev,
        isConnecting: true,
        remoteUserId: targetUserId,
        remoteUserName: targetUserName,
      }));

      // Initialize WebRTC
      const peerConnection = await initializeWebRTC();

      // Create call record in database
      const { data: callData, error } = await supabase
        .from('video_calls')
        .insert({
          receiver_id: targetUserId,
          call_status: 'calling',
        })
        .select()
        .single();

      if (error) throw error;

      setCallState(prev => ({
        ...prev,
        callId: callData.id,
      }));

      // Create offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer through Supabase realtime (simplified for demo)
      // In production, you'd use a proper signaling server
      toast({
        title: "Calling...",
        description: `Calling ${targetUserName}`,
      });

      // Simulate call timeout after 30 seconds
      setTimeout(() => {
        if (callState.isConnecting && !callState.isInCall) {
          endCall();
          toast({
            title: "Call Missed",
            description: `${targetUserName} didn't answer`,
          });
        }
      }, 30000);

    } catch (error) {
      console.error('Error initiating call:', error);
      setCallState(prev => ({
        ...prev,
        isConnecting: false,
      }));
    }
  }, [initializeWebRTC, callState.isConnecting, callState.isInCall, toast]);

  // Accept call
  const acceptCall = useCallback(async (callId: string) => {
    try {
      const peerConnection = await initializeWebRTC();

      setCallState(prev => ({
        ...prev,
        isInCall: true,
        isConnecting: false,
        callId,
        callDuration: 0,
      }));

      // Update call status in database
      await supabase
        .from('video_calls')
        .update({ call_status: 'accepted' })
        .eq('id', callId);

      startCallTimer();

      toast({
        title: "Call Connected",
        description: "You're now in a video call",
      });

    } catch (error) {
      console.error('Error accepting call:', error);
    }
  }, [initializeWebRTC, startCallTimer, toast]);

  // End call
  const endCall = useCallback(async () => {
    try {
      // Stop media streams
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }

      // Close peer connection
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }

      // Stop timer
      stopCallTimer();

      // Update call record
      if (callState.callId) {
        await supabase
          .from('video_calls')
          .update({
            call_status: 'ended',
            ended_at: new Date().toISOString(),
            duration_seconds: callState.callDuration,
          })
          .eq('id', callState.callId);
      }

      setCallState({
        isInCall: false,
        isConnecting: false,
        callId: null,
        remoteUserId: null,
        remoteUserName: null,
        callDuration: 0,
        isMuted: false,
        isVideoOff: false,
      });

      toast({
        title: "Call Ended",
        description: "Video call has been ended",
      });

    } catch (error) {
      console.error('Error ending call:', error);
    }
  }, [callState.callId, callState.callDuration, stopCallTimer, toast]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState(prev => ({
          ...prev,
          isMuted: !audioTrack.enabled,
        }));
      }
    }
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState(prev => ({
          ...prev,
          isVideoOff: !videoTrack.enabled,
        }));
      }
    }
  }, []);

  // Format call duration
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    callState,
    localVideoRef,
    remoteVideoRef,
    initiateCall,
    acceptCall,
    endCall,
    toggleMute,
    toggleVideo,
    formatDuration,
  };
}