import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";

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

/*
//Physics
const world = new CANNON.World();
world.broadphase = new CANNON.SAPBroadphase(world);
world.gravity.set(0, -9.81, 0);
world.allowSleep = true;
const groundMaterial = new CANNON.Material("groundMaterial");
const userMaterial = new CANNON.Material("userMaterial");
const userGroundContactMaterial = new CANNON.ContactMaterial(
  userMaterial,
  groundMaterial,
  {
    friction: 0.3,
    restitution: 0.1,
    contactEquationStiffness: 1000,
  }
);
world.addContactMaterial(userGroundContactMaterial);


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
world.addBody(floorBody);

// user mesh
// box
// const userMesh = new THREE.Mesh(
//   new THREE.BoxGeometry(1, 1, 1),
//   new THREE.MeshNormalMaterial()
// );
// spehre
// const userMesh = new THREE.Mesh(
//   new THREE.SphereGeometry(1),
//   new THREE.MeshNormalMaterial()
// );
//
// userMesh.position.y = 1;
// scene.add(userMesh);

// user body
// box
// const userBody = new CANNON.Body({
//   mass: 1.0,
//   position: new CANNON.Vec3(0, 3, 0),
//   shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
//   material: userMaterial,
// });
// sphere
// const userBody = new CANNON.Body({
//   mass: 1.0,
//   position: new CANNON.Vec3(0, 1, 0),
//   shape: new CANNON.Sphere(1),
//   material: userMaterial,
//   linearDamping: 0.6,
//   angularDamping: 0.6,
// });
//
// userBody.position.copy(userMesh.position);
// world.addBody(userBody);

let userMesh = null;
let userBody = null;
const userGeometry = new THREE.BoxGeometry(1, 1, 1);
const userMeshMaterial = new THREE.MeshNormalMaterial();
const userShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));

const users = {};
const createUser = () => {
  const pos = [
    Math.sin((Math.random() - 0.5) * 2 * Math.PI) * 5,
    3,
    Math.cos((Math.random() - 0.5) * 2 * Math.PI) * 5,
  ];
  userMesh = new THREE.Mesh(userGeometry, userMeshMaterial);
  userMesh.position.set(...pos);
  scene.add(userMesh);
  userBody = new CANNON.Body({
    mass: 1.0,
    position: new CANNON.Vec3(...pos),
    shape: userShape,
    material: userMaterial,
  });
  userBody.position.copy(userMesh.position);
  world.addBody(userBody);
};

// userBody.applyLocalForce(new CANNON.Vec3(150, 0, 0), new CANNON.Vec3(0, 0, 0));
*/
