import { useEffect, useRef, useState, useCallback } from 'react';
import { socket } from '../lib/socket';

interface PeerConnection {
    id: string; // socketId of the remote peer
    pc: RTCPeerConnection;
    stream?: MediaStream;
}

export function useVoiceChat(myId: string | undefined, players: { id: string, name: string }[]) {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const [isMuted, setIsMuted] = useState(false);
    const [isJoined, setIsJoined] = useState(false);

    // Check if player is speaking (simple volume detection could happen here later)

    // Store peer connections in ref to avoid re-renders causing connection drops
    const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);

    // ICE Servers (Standard public STUN servers)
    const rtcConfig = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
        ]
    };

    const joinVoice = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            setLocalStream(stream);
            localStreamRef.current = stream;
            setIsJoined(true);

            // Initiate connections to all existing players
            // Excluding myself and bots (if they had different IDs format, but assuming socket IDs)
            players.forEach(p => {
                if (p.id !== myId && !p.id.startsWith('bot-')) { // Basic bot filtering if needed
                    createPeer(p.id, true);
                }
            });

        } catch (err) {
            console.error("Failed to access microphone:", err);
            alert("Could not access microphone.");
        }
    };

    const leaveVoice = () => {
        localStreamRef.current?.getTracks().forEach(track => track.stop());
        setLocalStream(null);
        localStreamRef.current = null;

        peersRef.current.forEach(pc => pc.close());
        peersRef.current.clear();
        setRemoteStreams(new Map());
        setIsJoined(false);
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const createPeer = (targetId: string, initiator: boolean) => {
        if (peersRef.current.has(targetId)) return peersRef.current.get(targetId)!;

        const pc = new RTCPeerConnection(rtcConfig);
        peersRef.current.set(targetId, pc);

        // Add local stream tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('signal', {
                    targetId,
                    signalData: { type: 'candidate', candidate: event.candidate }
                });
            }
        };

        // Handle remote stream
        pc.ontrack = (event) => {
            setRemoteStreams(prev => {
                const newMap = new Map(prev);
                newMap.set(targetId, event.streams[0]);
                return newMap;
            });
        };

        // Negotiate
        if (initiator) {
            pc.createOffer()
                .then(offer => pc.setLocalDescription(offer))
                .then(() => {
                    socket.emit('signal', {
                        targetId,
                        signalData: { type: 'offer', sdp: pc.localDescription }
                    });
                })
                .catch(err => console.error("Error creating offer:", err));
        }

        return pc;
    };

    const handleSignal = useCallback(async ({ senderId, signalData }: { senderId: string, signalData: any }) => {
        if (!localStreamRef.current && !isJoined) return; // Ignore if not in voice chat

        let pc = peersRef.current.get(senderId);
        if (!pc) {
            pc = createPeer(senderId, false);
        }

        try {
            if (signalData.type === 'offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('signal', {
                    targetId: senderId,
                    signalData: { type: 'answer', sdp: pc.localDescription }
                });
            } else if (signalData.type === 'answer') {
                await pc.setRemoteDescription(new RTCSessionDescription(signalData.sdp));
            } else if (signalData.type === 'candidate') {
                await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
            }
        } catch (err) {
            console.error("Signalling error:", err);
        }
    }, [isJoined]); // Re-create if joined status changes? Actually depends on ref mostly.

    useEffect(() => {
        socket.on('signal', handleSignal);
        return () => {
            socket.off('signal', handleSignal);
        };
    }, [handleSignal]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            leaveVoice();
        };
    }, []);

    return {
        joinVoice,
        leaveVoice,
        toggleMute,
        isMuted,
        isJoined,
        remoteStreams
    };
}
