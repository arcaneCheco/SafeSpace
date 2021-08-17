import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";
import { io } from "socket.io-client"

const threeJsCanvas = () => {

  let myId = "";
  let updateInterval;
  const users = {};

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
  socket.on("joined", (id, activeUsers) => {
    myId = id;
    console.log(activeUsers);
    for (const [userId, userData] of Object.entries(activeUsers)) {
      users[userId] = new THREE.Mesh(
        new THREE.SphereGeometry(1),
        new THREE.MeshStandardMaterial({ color: 0xff0000 })
      );
      users[userId].name = userData.username;
      users[userId].position.copy(userData.position);
      scene.add(users[userId]);
    }
    updateInterval = setInterval(() => {
      socket.emit("update", map);
    }, 50);
  });
  socket.on("add new user", (id, newUser) => {
    users[id] = new THREE.Mesh(
      new THREE.SphereGeometry(1),
      new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );
    users[id].name = newUser.username;
    users[id].position.copy(newUser.position);
    scene.add(users[id]);
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
    console.log(scene);
    scene.remove(scene.getObjectByName(users[id].name));
    // clearInterval(updateInterval);
    delete users[id];
  });

  socket.on("active users ordered", (orderedUserList) => {
    console.log(orderedUserList);
  })
    /**
   * THREE JS STUFF
   */
  const canvas = document.querySelector("#canvas");

  const scene = new THREE.Scene();

  /**
   * Lights
   */
  const ambientLight = new THREE.AmbientLight();
  scene.add(ambientLight);

  /**
   * Sizes
   */
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  window.addEventListener("resize", () => {
    // Update sizes
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    // Update camera
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    // Update renderer
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  /**
   * Camera
   */
  // Base camera
  const camera = new THREE.PerspectiveCamera(
    75,
    sizes.width / sizes.height,
    0.1,
    1000
  );
  camera.position.set(0, 6, 6);
  scene.add(camera);

  // Controls
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;

  /**
   * Renderer
   */
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // ground
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  ground.rotateX(-Math.PI / 2);
  scene.add(ground);

  const tick = () => {
    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(tick);
  };
  tick();
}

export {threeJsCanvas}