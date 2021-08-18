import React, { useEffect, useRef, useState } from 'react';
import Styled from 'styled-components';


const ContainerStyled = Styled.div`
   position: relative;
   display: inline-block;
   width: 240px;
   height: 240px;
   margin: 5px;
`;

const VideoContainerStyled = Styled.video`
   width: 240px;
   height: 240px;
   background-color: black;
`;

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
    <ContainerStyled>
      <VideoContainerStyled
        ref={ref}
        muted={isMuted}
        autoPlay
      ></VideoContainerStyled>
    </ContainerStyled>
  );
}

export default Video;
