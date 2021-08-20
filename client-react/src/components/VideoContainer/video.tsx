import React, { useEffect, useRef, useState } from 'react';
import './video.css';

interface Props {
  stream: MediaStream;
  muted?: boolean;
}

const Video = ({ stream, muted }: Props) => {
  const ref = useRef<HTMLVideoElement>(null);
  // const [isMuted, setIsMuted] = useState<boolean>(false);

  // const ref = useRef(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
    if (muted) setIsMuted(muted);
  })

  return (
    <div className='videoSingle' >
      <video
      className='videoTileSingle'
        ref={ref}
        muted={isMuted}
        autoPlay
      ></video>
    </div>
  );
}

export default Video;
