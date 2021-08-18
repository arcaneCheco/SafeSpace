import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";
import Visuals from "./visuals";

let myId = "";
let updateInterval;
const users = {};
const controlModes = {
  sphereUserControl: false,
  carControl: true,
};

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
        color: 0xff0000,
      })
    );
    users[userId].name = userData.username;
    users[userId].position.copy(userData.position);
    scene.add(users[userId]);
  }
  updateInterval = setInterval(() => {
    socket.emit("update", map, controlModes);
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

//**three.js */
const canvas = document.querySelector("#canvas");
const visuals = new Visuals(canvas);
console.log(visuals);
//

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
visuals.scene.add(camera);

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
// carMesh.position.set(0, 0.2, 0);
// carMesh.quaternion.set(0, 0, 0, 1);
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
let manualControl = true; // make this a click down event to enable orbit controls
// document.onmousedown = () => (manualControl = true);
// document.onmouseup = () => (manualControl = false);

const clock = new THREE.Clock();
const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  // Update controls
  controls.update();

  // update camera
  if (myId && users[myId] && !manualControl) {
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
