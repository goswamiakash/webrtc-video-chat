import React, { useRef, useEffect } from 'react';

const ScreenShare = ({ signalingUrl, roomId }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const signalingRef = useRef(null);

  useEffect(() => {
    const startScreenShare = async () => {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        localVideoRef.current.srcObject = stream;

        const peerConnection = new RTCPeerConnection();
        peerConnectionRef.current = peerConnection;

        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        peerConnection.ontrack = event => {
          remoteVideoRef.current.srcObject = event.streams[0];
        };

        signalingRef.current = new WebSocket(signalingUrl);

        signalingRef.current.onmessage = async message => {
          try {
            const data = JSON.parse(message.data);

            if (data.offer) {
              await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
              const answer = await peerConnection.createAnswer();
              await peerConnection.setLocalDescription(answer);
              signalingRef.current.send(JSON.stringify({ answer }));
            }

            if (data.answer) {
              await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            }

            if (data.candidate) {
              await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
          } catch (error) {
            console.error('Error parsing message:', message.data, error);
          }
        };

        peerConnection.onicecandidate = event => {
          if (event.candidate) {
            signalingRef.current.send(JSON.stringify({ candidate: event.candidate }));
          }
        };

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        signalingRef.current.onopen = () => {
          signalingRef.current.send(JSON.stringify({ offer, roomId }));
        };
      } catch (error) {
        console.error('Error sharing screen:', error);
      }
    };

    startScreenShare();

    return () => {
      if (signalingRef.current) {
        signalingRef.current.close();
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [signalingUrl, roomId]);

  return (
    <div>
      <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '300px' }} />
      <video ref={remoteVideoRef} autoPlay playsInline style={{ width: '300px' }} />
    </div>
  );
};

export default ScreenShare;
