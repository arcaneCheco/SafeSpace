import React from 'react'
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from '@react-three/drei';
import { Physics } from '@react-three/cannon';
import Box from './Box';
import Plane from './Plane';

const Container3D = () => {
  return (
    <Canvas>
      <OrbitControls />
      <Stars />
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 15, 10]} angle={0.3} />
      <Physics>
        <Box />
        <Plane />
      </Physics>
    </Canvas>
  );
}

export default Container3D