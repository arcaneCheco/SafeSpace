import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";
import * as CANNON from "cannon-es";

/**
 * add socketIO
 */
const socket = io("http://localhost:3001");
socket.on("connection", () => {
  console.log("new user entered the game");
});

const connectNewUser = () => {
  const username = prompt("what's your name?");
  socket.emit("new user", username);
};

/**
 * Debug
 */
const parameters = {
  force: 100,
};
const gui = new GUI();
gui.add(parameters, "force").min(0).max(1000).step(1);

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
  100
);
camera.position.set(0, 3, 3);
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

/**
 * Physics
 */
const world = new CANNON.World();
world.broadphase = new CANNON.SAPBroadphase(world);
world.gravity.set(0, -9.81, 0);
// world.allowSleep = true;
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

// floor mesh
const floorMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial()
);
floorMesh.receiveShadow = true;
floorMesh.rotation.x = -Math.PI * 0.5;
floorMesh.position.y = -0.5;
scene.add(floorMesh);

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
world.addBody(floorBody);

// user mesh
const userMesh = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshNormalMaterial()
);
// const userMesh = new THREE.Mesh(
//   new THREE.SphereGeometry(1),
//   new THREE.MeshNormalMaterial()
// );
userMesh.position.y = 1;
scene.add(userMesh);

// user body
const userBody = new CANNON.Body({
  mass: 1.0,
  position: new CANNON.Vec3(0, 3, 0),
  shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
  material: userMaterial,
});
// const userBody = new CANNON.Body({
//   mass: 1.0,
//   position: new CANNON.Vec3(0, 1, 0),
//   shape: new CANNON.Sphere(1),
//   material: userMaterial,
//   linearDamping: 0.6,
//   angularDamping: 0.6,
// });
userBody.position.copy(userMesh.position);
world.addBody(userBody);

// userBody.applyLocalForce(new CANNON.Vec3(150, 0, 0), new CANNON.Vec3(0, 0, 0));

/**
 * Animate
 */
const map = {};
const navigate = (event) => {
  const direction = event.key;
  map[direction] = event.type === "keydown";
  const force = parameters.force;
  for (const [key, value] of Object.entries(map)) {
    if (value && key === "ArrowUp") {
      userBody.applyForce(
        new CANNON.Vec3(0, 0, -force),
        new CANNON.Vec3(0, 0, 0)
      );
    }
    if (value && key === "ArrowRight") {
      userBody.applyForce(
        new CANNON.Vec3(force, 0, 0),
        new CANNON.Vec3(0, 0, 0)
      );
    }
    if (value && key === "ArrowDown") {
      userBody.applyForce(
        new CANNON.Vec3(0, 0, force),
        new CANNON.Vec3(0, 0, 0)
      );
    }
    if (value && key === "ArrowLeft") {
      userBody.applyForce(
        new CANNON.Vec3(-force, 0, 0),
        new CANNON.Vec3(0, 0, 0)
      );
    }
  }
};
document.onkeydown = document.onkeyup = navigate;

const clock = new THREE.Clock();
let oldElapsedTime = 0;
const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;

  // update Physics world
  world.step(1 / 60, deltaTime, 3);

  userMesh.position.copy(userBody.position);
  userMesh.quaternion.copy(userBody.quaternion);

  // Update controls
  controls.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};
tick();
