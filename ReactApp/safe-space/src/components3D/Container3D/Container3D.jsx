import React from "react";
import { io } from "socket.io-client"
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { Physics } from "@react-three/cannon";
import Box from "../Box";
import Plane from "../Plane";
import "./Container3D.css";
import Player from "../Player/Player";


const Container3D = () => {
  return (
    <div className="Container3D">
      <Canvas>
        <OrbitControls />
        <Stars />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 15, 10]} angle={0.3} />
        <Physics>
          <Box />
          <Player />
          <Plane />
        </Physics>
      </Canvas>
    </div>
  );
};

export default Container3D;
