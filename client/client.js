import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";

let myId = "";
let updateInterval;
const users = {};

/**
 * UI
 */

/******************* */

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
    users[userId] = new THREE.Mesh(
      new THREE.SphereGeometry(1),
      new THREE.MeshStandardMaterial({
        color: userData.color,
      })
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

// socket.on("active users ordered", (orderedUserList) => {
//   console.log(orderedUserList);
// });

//
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
camera.position.set(0, 12, 12);
camera.lookAt(new THREE.Vector3(0, 2, -4));
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

// car
const carGeometry = new THREE.BoxGeometry(2, 0.6, 4); // double chasis shape
const carMaterial = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  side: THREE.DoubleSide,
});
const carMesh = new THREE.Mesh(carGeometry, carMaterial);
// inital position
carMesh.position.set(0, 0.2, 0);
carMesh.quaternion.set(0, 0, 0, 1);
scene.add(carMesh);
// car wheels
const wheels = [];
for (let i = 0; i < 4; i++) {
  const wheelRadius = 0.3;
  const wheelGeometry = new THREE.CylinderGeometry(
    wheelRadius,
    wheelRadius,
    0.4,
    32
  );
  const wheelMaterial = new THREE.MeshPhongMaterial({
    color: 0xd0901d,
    emissive: 0xaa0000,
    side: THREE.DoubleSide,
    flatShading: true,
  });
  const wheelMesh = new THREE.Mesh(wheelGeometry, wheelMaterial);
  wheelMesh.geometry.rotateZ(Math.PI / 2);
  wheels.push(wheelMesh);
  scene.add(wheelMesh);
}
socket.on("update wheels", (wheelsState, index) => {
  wheels[i].position.copy(wheelsState[i].position);
  wheels[i].quaternion.copy(wheelsState[i].quaternion);
});

/************ */

const clock = new THREE.Clock();
const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // update camera
  if (myId && users[myId]) {
    let offset = new THREE.Vector3(
      users[myId].position.x + 2,
      users[myId].position.y + 20,
      users[myId].position.z + 20
    );
    camera.position.lerp(offset, 0.2);
    camera.position.copy(offset);
    camera.lookAt(users[myId].position);
  }

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};
tick();

/*
//Physics


// floor body
const floorOrientation = floorMesh.quaternion;
const floorBody = new CANNON.Body({
  mass: 0, // mass = 0 makes the body static
  material: groundMaterial,
  shape: new CANNON.Plane(),
  quaternion: new CANNON.Quaternion(
    floorOrientation._x,
    floorOrientation._y,
    floorOrientation._z,
    floorOrientation._w
  ),
});
// floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5);
floorBody.position.copy(floorMesh.position);
*/
