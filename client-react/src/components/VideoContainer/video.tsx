import React, { useEffect, useRef, useState } from 'react';
import './video.css';

interface Props {
  stream: MediaStream;
  muted?: boolean;
  opacity: number;
  userConnectionGradients: {};
}

const Video = ({ stream, muted, opacity, userConnectionGradients }: Props) => {
  const ref = useRef<HTMLVideoElement>(null);
  // const [isMuted, setIsMuted] = useState<boolean>(false);

  // const ref = useRef(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
    if (muted) setIsMuted(muted);
  }, [])

  return (
    <div className='videoSingle' >
      <video
      style={{opacity: opacity}}
      className='videoTileSingle'
        ref={ref}
        muted={isMuted}
        autoPlay
      ></video>
    </div>
  );
}

export default Video;
