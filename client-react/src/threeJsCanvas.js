import * as THREE from "three";
import useStore from "./store";
import { io } from "socket.io-client";
import Visuals from "./visuals";
import { waitUntil } from "async-wait-until";

export default function threeJsCanvas() {
  /**
   * initialise threejs world
   **/
  const canvas = document.querySelector("#canvas");
  const visuals = new Visuals(canvas);

  /*
   * Misc
   */
  let myId = "";
  const controlModes = {
    sphereUserControl: true,
    carControl: false,
  };

  /**
   * establish socket connection
   */
  const socket = io("http://localhost:3001/physicsNamespace");

  socket.on("connect", () => {
    console.log("Welcome to Safe Space");
  });

  /**
   * load player model
   **/
  let isLoaded = false;
  waitUntil(() => visuals.avatar.isLoaded === true).then(() => {
    isLoaded = true;
    socket.emit("model loaded");
  });

  let hasJoined = false;
  socket.on("joined", (id, activeUsers) => {
    visuals.joiningUser(id, activeUsers);
    hasJoined = true;
  });

  socket.on("add new user", (id, newUser) => visuals.addNewUser(id, newUser));

  socket.on("update", (activeUsers) => {
    visuals.updateUserStates(activeUsers);
  });
  socket.on("new distances", (distances) => {
    let conn = [];
    for (const [webId, connState] of Object.entries(distances)) {
      if (webId && connState > 0) {
        conn.push(webId);
      }
    }
    let temp = useStore.getState().conn;
    if (temp.length !== conn.length) useStore.setState({ conn });
  });

  socket.on("removeUser", (id) => visuals.removeUser(id));

  /************ */
  let manualControl = false; // make this a click down event to enable orbit controls
  document.onmousedown = () => (manualControl = true);
  document.onmouseup = () => (manualControl = false);

  const clock = new THREE.Clock();
  let oldElapsedTime = 0;
  const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - oldElapsedTime;
    oldElapsedTime = elapsedTime;

    //
    hasJoined && socket.emit("update", visuals.map, controlModes, deltaTime);
    //

    // Update controls
    // visuals.orbitControls.update();

    // update camera
    visuals.hasEntered && visuals.updateThirdPersonViewPerspective();

    // udpate animation
    if (isLoaded && (visuals.map.ArrowUp || visuals.map.ArrowDown)) {
      visuals.avatar.mixer.update(deltaTime);
    }

    // Render
    visuals.renderer.render(visuals.scene, visuals.camera);

    if (!visuals.hasEntered) {
      visuals.welcomeAnimation(elapsedTime);
    }

    // Retrieve users distances for connectionGradients
    // console.log(users)

    // Call tick again on the next frame
    // window.requestAnimationFrame(tick);
  };

  // tick();

  setInterval(() => {
    // window.requestAnimationFrame(tick);
    tick();
  }, 50);
}

// // car
// const carMesh = visuals.createCarMesh();
// // inital position
// carMesh.position.set(0, 0.2, 0);
// carMesh.quaternion.set(0, 0, 0, 1);
// visuals.scene.add(carMesh);
// // car wheels
// const wheels = visuals.createWheels();
// for (const wheelMesh of wheels) {
//   visuals.scene.add(wheelMesh);
// }
// socket.on("update wheels", (wheelsState, carState) => {
//   // console.log(carState.position);
//   // console.log(map);
//   carMesh.position.copy(carState.position);
//   carMesh.quaternion.copy(carState.quaternion);
//   for (let i = 0; i < wheelsState.length; i++) {
//     wheels[i].position.copy(wheelsState[i].position);
//     wheels[i].quaternion.copy(wheelsState[i].quaternion);
//   }
// });

// socket.on("active users ordered", (orderedUserList) => {
//   console.log(orderedUserList);
// });
