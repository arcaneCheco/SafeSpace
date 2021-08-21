import React, { useEffect } from "react";
import threeJsCanvas from "./threeJsCanvas";
import Signalling from "./components/VideoContainer/signalling";


const App = () => {

  useEffect(() => {
    threeJsCanvas();
  }, []);

  // let distances = useDistancesStore(state => state.distances)
  // setDistance = useDistancesStore(state => state.setDistancers)
  // setDistances(updates)

  // usedistancesStore.subscribe(
  //   (prev, next) => (distances = next)
  // );


  return (
    <div>
      <Signalling />
      <canvas id="canvas"></canvas>
    </div>
  );
};

export default App;
