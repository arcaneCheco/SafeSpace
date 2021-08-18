import React, { useEffect } from "react";
// import { threeJsCanvas } from "./threeJsCanvas";
import VideoContainer from "./components/VideoContainer/VideoContainer";

const App = () => {
  // useEffect(() => {
  //   threeJsCanvas();
  // }, []);

  return (
    <div>
      <VideoContainer />
      <canvas id="canvas"></canvas>
    </div>
  );
};

export default App;
