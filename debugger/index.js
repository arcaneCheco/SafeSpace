import * as CANNON from "cannon-es";
import cannonDebugger from "cannon-es-debugger";
import Visuals from "./visuals";
import * as THREE from "three";
import Physics from "../server/physics";

const visuals = new Visuals(document.querySelector("#canvas"));

visuals.createGround();
const ambientLight = new THREE.AmbientLight();
visuals.scene.add(ambientLight);
visuals.camera.position.set(0, 12, 12);
visuals.camera.lookAt(new THREE.Vector3(0, 2, -4));
visuals.scene.add(visuals.camera);

let avatar = null;
let isLoaded = false;
// window.addEventListener("resize", visuals.resize);
// load model
const scale = 8;
const loadModel = () => {
  visuals.gltfLoader.load("/models/CesiumMan/CesiumMan.gltf", (gltf) => {
    // cesum man mesh size before scaling:
    // 1.140032197089109 1.5080219133341668 0.3135272997496078
    console.log(gltf);
    const mixer = new THREE.AnimationMixer(gltf.scene);
    const action = mixer.clipAction(gltf.animations[0]);
    const mesh = gltf.scene.children[0];
    console.log(mesh);
    // const box = new THREE.Box3().setFromObject(mesh);
    mesh.scale.set(scale, scale, scale);
    mesh.rotateZ(Math.PI);
    avatar = { action, mesh, mixer };
    visuals.scene.add(avatar.mesh);
    avatar.action.play();
    isLoaded = true;
  });
};
loadModel();

const landscape = () => {
  visuals.gltfLoader.load("/models/CesiumMan/3D-landscape/NatureGradientPack1.glb", (gltf) => {
    console.log(gltf, 'gltfff');
    const dims = new THREE.Box3().setFromObject(gltf.scene);
    console.log('dimensions:', dims.max.x - dims.min.x, dims.max.y - dims.min.y, dims.max.z - dims.min.z)
    gltf.scene.scale.set(24, 24, 24)
    visuals.scene.add(gltf.scene);
  },
    function (xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');

    },
    function (error) {
      console.log('An error happened');
    }
  );
}
landscape();


// const landShape = new THREE.Box3();
// console.log(landShape, 'laaaaand');
// landShape.setFromCenterAndSize(new THREE.Vector3(15, 15, 15), new THREE.Vector3(1, 1, 1));
// const landHelper = new THREE.Box3Helper(landShape, '#ffffff');
// visuals.scene.add(landHelper);



/******/

const physics = new Physics();
cannonDebugger(visuals.scene, physics.world.bodies);
physics.addBoxGround();

/******/
const cylShape = new CANNON.Cylinder(
  scale * 0.5,
  scale * 0.5,
  1.5080219133341668 * scale,
  12
);
const cylBody = new CANNON.Body({
  mass: 1,
  //   angularDamping: 0.9,
  fixedRotation: true,
  shape: cylShape,
  material: physics.userMaterial,
});
cylBody.position.x = -3;
cylBody.position.y = 10;
cylBody.position.z = -3;
physics.world.addBody(cylBody);
/******* */

const boxShape = new CANNON.Box(
  new CANNON.Vec3(
    (1.140032197089109 / 2) * scale * 0.35,
    (0.3135272997496078 / 2) * scale,
    (1.5080219133341668 / 2) * scale
  )
);
const boxBody = new CANNON.Body({
  mass: 2,
  angularDamping: 0.9,
  fixedRotation: true,
  shape: boxShape,
  material: physics.userMaterial,
});
boxBody.position.x = Math.sin((Math.random() - 0.5) * 2 * Math.PI) * 5;
boxBody.position.y = 20;
boxBody.position.z = Math.cos((Math.random() - 0.5) * 2 * Math.PI) * 5;
// boxBody.quaternion.setFromEuler(-Math.PI / 2, 0, Math.PI);
physics.world.addBody(boxBody);
const boxShap2 = new CANNON.Box(
  new CANNON.Vec3(
    (1.140032197089109 / 2) * scale * 0.35,
    (0.3135272997496078 / 2) * scale,
    (1.5080219133341668 / 2) * scale
  )
);
const boxBody2 = new CANNON.Body({
  mass: 2,
  angularDamping: 0.9,
  fixedRotation: true,
  shape: boxShape,
  material: physics.userMaterial,
});
boxBody2.position.x = Math.sin((Math.random() - 0.5) * 2 * Math.PI) * 5;
boxBody2.position.y = 20;
boxBody2.position.z = Math.cos((Math.random() - 0.5) * 2 * Math.PI) * 5;
// boxBody.quaternion.setFromEuler(-Math.PI / 2, 0, Math.PI);
physics.world.addBody(boxBody2);

/****navigation */
const map = {
  //   ArrowUp: false,
  //   ArrowDown: false,
  //   ArrowRight: false,
  //   ArrowLeft: false,
};
document.onkeydown = document.onkeyup = (e) => {
  if (
    e.key === "ArrowUp" ||
    e.key === "ArrowRight" ||
    e.key === "ArrowDown" ||
    e.key === "ArrowLeft"
  )
    map[e.key] = e.type === "keydown";
};
const navigateSphereAvatar = (map) => {
  const force = 250;
  const appliedForce = [0, 0, 0];
  if (map.ArrowUp) appliedForce[2] = appliedForce[2] - force;
  if (map.ArrowRight) appliedForce[0] = appliedForce[0] + force;
  if (map.ArrowDown) appliedForce[2] = appliedForce[2] + force;
  if (map.ArrowLeft) appliedForce[0] = appliedForce[0] - force;
  return new CANNON.Vec3(...appliedForce);
};
const stepDistance = (map) => {
  const force = 0.5;
  const appliedForce = [0, 0, 0];
  if (map.ArrowUp) appliedForce[2] = appliedForce[2] - force;
  if (map.ArrowRight) appliedForce[0] = appliedForce[0] - force;
  if (map.ArrowDown) appliedForce[2] = appliedForce[2] + force;
  if (map.ArrowLeft) appliedForce[0] = appliedForce[0] + force;
  return appliedForce;
};

const clock = new THREE.Clock();
let oldElapsedTime = 0;
const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - oldElapsedTime;
  oldElapsedTime = elapsedTime;
  visuals.orbitControls.update();
  if (isLoaded) {
    let appliedForce = navigateSphereAvatar(map);
    // console.log(appliedForce);
    cylBody.applyForce(appliedForce);
    avatar.mesh.position.copy({
      x: cylBody.position.x,
      y: cylBody.position.y - 1.5080219133341668 * scale * 0.5,
      z: cylBody.position.z,
    });
    if (map.ArrowUp || map.ArrowDown || map.ArrowLeft || map.ArrowRight) {
      avatar.mixer.update(deltaTime);
    }
    // cylBody.position.copy({
    //   x: avatar.mesh.position.x,
    //   y: avatar.mesh.position.y,
    //   z: avatar.mesh.position.z,
    // });
    // avatar.mesh.position.z += appliedForce[2];
  }
  physics.world.step(deltaTime);
  visuals.renderer.render(visuals.scene, visuals.camera);
  requestAnimationFrame(tick);
};
tick();
