import React, { useEffect, useRef, useState } from "react";
import "./video.css";

interface Props {
  stream: MediaStream;
  opacity: number;
}

const Video = ({ stream, opacity }: Props) => {
  const ref = useRef<HTMLVideoElement>(null);
  // const [isMuted, setIsMuted] = useState<boolean>(false);

  // const ref = useRef(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, []);

  return (
    <div className="videoSingle">
      <video
        style={{ opacity: opacity }}
        className="videoTileSingle"
        ref={ref}
        muted={false}
        autoPlay
      ></video>
    </div>
  );
};

export default Video;
