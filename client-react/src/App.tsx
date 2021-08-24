import React, { useEffect } from "react";
import threeJsCanvas from "./threeJsCanvas";
import Signalling from "./components/VideoContainer/signalling";
import WelcomePage from "./welcomePage";

const App = () => {
  useEffect(() => {
    threeJsCanvas();
    // WelcomePage();
  }, []);

  return (
    <div>
      {/* <Signalling /> */}
      {/* <canvas id="welcomeCanvas"></canvas> */}
      <canvas id="canvas"></canvas>
    </div>
  );
};

export default App;
