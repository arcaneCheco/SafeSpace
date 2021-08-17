import React from 'react'
import { useBox } from '@react-three/cannon';


const Player = () => {
  const [ref, api] = useBox(() => ({ mass: 1, position: [0, 2, 0] }));
  return (
    <mesh
      onClick={() => {
        api.velocity.set(0, 2, 0);
      }}
      ref={ref}
      position={[2, -2, 0]}
    >
      <boxBufferGeometry attach="geometry" />
      <meshLambertMaterial attach="material" color="orange" />
    </mesh>
  );
}

export default Player
