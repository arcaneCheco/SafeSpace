import React, { useEffect } from "react";
import threeJsCanvas from "./threeJsCanvas";
import Signalling from "./components/VideoContainer/signalling";


const App = () => {

  useEffect(() => {
    threeJsCanvas();
  }, []);

  return (
    <div>
      <Signalling />
      <canvas id="canvas"></canvas>
    </div>
  );
};

export default App;
