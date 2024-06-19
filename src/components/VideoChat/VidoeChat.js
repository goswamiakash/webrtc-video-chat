import React from 'react';
import useWebRTC from '../../hooks/useWebRTC';
import LocalVideo from './LocalVideo';
import RemoteVideo from './RemoteVideo';

const VideoChat = ({ signalingUrl, roomId }) => {
  const { localStreamRef, remoteStreamRef, isConnected } = useWebRTC(signalingUrl, roomId);

  if (!isConnected) {
    return <div>Connecting...</div>;
  }

  return (
    <div>
      <h2>Video Chat Room: {roomId}</h2>
      <div>
        <LocalVideo stream={localStreamRef.current} />
        <RemoteVideo stream={remoteStreamRef.current} />
      </div>
    </div>
  );
};

export default VideoChat;
