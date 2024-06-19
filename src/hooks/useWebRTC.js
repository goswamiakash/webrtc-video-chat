import { useRef, useEffect, useState } from 'react';

const useWebRTC = (signalingUrl, roomId) => {
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const signalingSocket = new WebSocket(signalingUrl);

    const handleOffer = async (offer) => {
      if (!peerConnectionRef.current) {
        createPeerConnection();
      }
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      signalingSocket.send(JSON.stringify({ type: 'answer', answer }));
    };

    const handleAnswer = async (answer) => {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIceCandidate = (candidate) => {
      peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const createPeerConnection = () => {
      peerConnectionRef.current = new RTCPeerConnection();
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          signalingSocket.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
        }
      };
      peerConnectionRef.current.ontrack = (event) => {
        remoteStreamRef.current.srcObject = event.streams[0];
      };
      localStreamRef.current.getTracks().forEach((track) => {
        peerConnectionRef.current.addTrack(track, localStreamRef.current);
      });
    };

    signalingSocket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      switch (data.type) {
        case 'offer':
          handleOffer(data.offer);
          break;
        case 'answer':
          handleAnswer(data.answer);
          break;
        case 'candidate':
          handleIceCandidate(data.candidate);
          break;
        default:
          break;
      }
    };

    const startLocalStream = async () => {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setIsConnected(true);
    };

    startLocalStream();

    return () => {
      signalingSocket.close();
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [signalingUrl, roomId]);

  return { localStreamRef, remoteStreamRef, isConnected };
};

export default useWebRTC;
