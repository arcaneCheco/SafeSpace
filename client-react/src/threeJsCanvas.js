import * as THREE from "three";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";
import { io } from "socket.io-client";
import Visuals from "./visuals";

export default function threeJsCanvas() {
  const canvas = document.querySelector("#canvas");
  const visuals = new Visuals(canvas);
  let myId = "";
  let updateInterval;
  let avatar = null;
  let isLoaded = false;
  // load model
  const loadModel = () => {
    visuals.gltfLoader.load("/models/CesiumMan/CesiumMan.gltf", (gltf) => {
      const mixer = new THREE.AnimationMixer(gltf.scene);
      const action = mixer.clipAction(gltf.animations[0]);
      // console.log(gltf);
      const mesh = gltf.scene.children[0];
      mesh.scale.set(8, 8, 8);
      // visuals.scene.add(mesh);
      avatar = { action, mesh, mixer };
      isLoaded = true;
      socket.emit("model loaded", isLoaded);
    });
  };
  loadModel();
  const users = {};
  const controlModes = {
    sphereUserControl: true,
    carControl: false,
  };

  const gui = new GUI();

  const map = {};
  document.onkeydown = document.onkeyup = (e) => {
    if (
      e.key === "ArrowUp" ||
      e.key === "ArrowRight" ||
      e.key === "ArrowDown" ||
      e.key === "ArrowLeft"
    )
      map[e.key] = e.type === "keydown";
  };

  /**
   * add socketIO
   */
  const socket = io("http://localhost:3001");

  socket.on("connect", () => {
    console.log("connect");
  });
  window.onbeforeunload = () => {
    for (const userId of Object.keys(users)) {
      delete users[userId];
    }
    socket.disconnect();
  };
  // socket.on("joined", (id, activeUsers) => {
  //   myId = id;
  //   for (const [userId, userData] of Object.entries(activeUsers)) {
  //     users[userId] = visuals.createSphereAvatar();
  //     users[userId].name = userData.username;
  //     users[userId].position.copy(userData.position);
  //     visuals.scene.add(users[userId]);
  //   }
  //   updateInterval = setInterval(() => {
  //     socket.emit("update", map, controlModes);
  //   }, 50);
  // });
  socket.on("call1", (message) => {
    console.log(message);
  });
  socket.on("joined", async (id, activeUsers) => {
    myId = id;
    console.log(avatar);
    for (const [userId, userData] of Object.entries(activeUsers)) {
      users[userId] = avatar.mesh;
      users[userId].name = userData.username;
      users[userId].position.copy(userData.position);
      visuals.scene.add(users[userId]);
    }
    updateInterval = setInterval(() => {
      socket.emit("update", map, controlModes);
    }, 50);
  });

  socket.on("add new user", (id, newUser) => {
    users[id] = visuals.createSphereAvatar();
    users[id].name = newUser.username;
    users[id].position.copy(newUser.position);
    visuals.scene.add(users[id]);
  });
  socket.on("update", (activeUsers) => {
    for (const [userId, userData] of Object.entries(activeUsers)) {
      if (users[userId]) {
        users[userId].position.copy(userData.position);
        users[userId].quaternion.copy(userData.quaternion);
      }
    }
  });

  socket.on("removePlayer", (id) => {
    visuals.scene.remove(visuals.scene.getObjectByName(users[id].name));
    // clearInterval(updateInterval);
    delete users[id];
  });

  // socket.on("active users ordered", (orderedUserList) => {
  //   console.log(orderedUserList);
  // });

  /**
   * Lights
   */
  const ambientLight = new THREE.AmbientLight();
  visuals.scene.add(ambientLight);

  window.addEventListener("resize", visuals.resize);

  /**
   * Camera
   */
  // Base camera
  visuals.camera.position.set(0, 12, 12);
  visuals.camera.lookAt(new THREE.Vector3(0, 2, -4));
  visuals.scene.add(visuals.camera);

  // car
  const carMesh = visuals.createCarMesh();
  // inital position
  carMesh.position.set(0, 0.2, 0);
  carMesh.quaternion.set(0, 0, 0, 1);
  visuals.scene.add(carMesh);
  // car wheels
  const wheels = visuals.createWheels();
  for (const wheelMesh of wheels) {
    visuals.scene.add(wheelMesh);
  }
  socket.on("update wheels", (wheelsState, carState) => {
    // console.log(carState.position);
    // console.log(map);
    carMesh.position.copy(carState.position);
    carMesh.quaternion.copy(carState.quaternion);
    for (let i = 0; i < wheelsState.length; i++) {
      wheels[i].position.copy(wheelsState[i].position);
      wheels[i].quaternion.copy(wheelsState[i].quaternion);
    }
  });

  /************ */
  let manualControl = false; // make this a click down event to enable orbit controls
  // document.onmousedown = () => (manualControl = true);
  // document.onmouseup = () => (manualControl = false);

  const clock = new THREE.Clock();
  let oldElapsedTime = 0;
  const tick = () => {
    const elapsedTime = clock.getElapsedTime();
    const deltaTime = elapsedTime - oldElapsedTime;
    oldElapsedTime = elapsedTime;

    // Update controls
    visuals.orbitControls.update();

    // update camera
    if (myId && users[myId] && !manualControl) {
      visuals.updateAvatarModeCamera(users[myId]);
    }
    //update animaations
    if (avatar && avatar.mixer) {
      avatar.mixer.update(deltaTime);
    }

    // Render
    visuals.renderer.render(visuals.scene, visuals.camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
  };
  tick();
}
