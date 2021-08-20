import * as THREE from "three";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";
import { io } from "socket.io-client";
import Visuals from "./visuals";
// import { SkeletonUtils } from "three-stdlib";
import { SkeletonUtils } from "three/examples/jsm/utils/SkeletonUtils";

export default function threeJsCanvas() {
  const canvas = document.querySelector("#canvas");
  const visuals = new Visuals(canvas);
  let myId = "";
  let updateInterval;
  let avatar = null;
  let isLoaded = false;
  const users = {};
  const controlModes = {
    sphereUserControl: true,
    carControl: false,
  };
  // let isLoaded = false;
  window.addEventListener("resize", () => {
    visuals.windowWidth = window.innerWidth;
    visuals.windowHeight = window.innerHeight;

    // Update camera
    visuals.camera.aspect = visuals.windowWidth / visuals.windowHeight;
    visuals.camera.updateProjectionMatrix();

    // Update renderer
    visuals.renderer.setSize(visuals.windowWidth, visuals.windowHeight);
    visuals.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });
  // load model
  const loadModel = () => {
    visuals.gltfLoader.load("/models/CesiumMan/CesiumMan.gltf", (gltf) => {
      // // cesum man mesh size before scaling:
      // // 1.140032197089109 1.5080219133341668 0.3135272997496078
      // const mixer = new THREE.AnimationMixer(gltf.scene);
      // const action = mixer.clipAction(gltf.animations[0]);
      // action.play();
      // const mesh = gltf.scene.children[0];
      // // const box = new THREE.Box3().setFromObject(mesh);
      // mesh.scale.set(4, 4, 4);
      // mesh.rotateZ(Math.PI);

      // avatar = { action, mesh, mixer };
      //
      isLoaded = true;
      avatar = {
        mesh: gltf.scene.children[0],
        mixer: new THREE.AnimationMixer(gltf.scene),
      };
      avatar.action = avatar.mixer.clipAction(gltf.animations[0]);
      avatar.mesh.scale.set(4, 4, 4);
      avatar.mesh.rotateZ(Math.PI);
      avatar.action.play();
      socket.emit("model loaded");
    });
  };
  loadModel();

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

  socket.on("joined", (id, activeUsers) => {
    myId = id;
    for (const [userId, userData] of Object.entries(activeUsers)) {
      if (userId === myId) {
        users[userId] = avatar.mesh;
      } else {
        const newMesh = SkeletonUtils.clone(avatar.mesh);
        users[userId] = newMesh;
      }
      users[userId].name = userData.username;
      users[userId].position.copy(userData.position);
      visuals.scene.add(users[userId]);
    }
    updateInterval = setInterval(() => {
      socket.emit("update", map, controlModes);
    }, 50);
  });

  socket.on("add new user", (id, newUser) => {
    const newMesh = SkeletonUtils.clone(avatar.mesh);
    users[id] = newMesh;
    users[id].name = newUser.username;
    users[id].position.copy(newUser.position);
    visuals.scene.add(users[id]);
  });
  socket.on("update", (activeUsers) => {
    for (const [userId, userData] of Object.entries(activeUsers)) {
      if (users[userId]) {
        users[userId].position.copy(userData.position);
        // users[userId].quaternion.copy(userData.quaternion);
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
  document.onmousedown = () => (manualControl = true);
  document.onmouseup = () => (manualControl = false);

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
    if (
      isLoaded &&
      (map.ArrowUp || map.ArrowDown || map.ArrowLeft || map.ArrowRight)
    ) {
      avatar.mixer.update(deltaTime);
    }

    // Render
    visuals.renderer.render(visuals.scene, visuals.camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
  };
  tick();
}
