import React, { useEffect, useRef } from 'react';

const RemoteVideo = ({ stream }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return <video ref={videoRef} autoPlay />;
};

export default RemoteVideo;
