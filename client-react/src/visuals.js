import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { SkeletonUtils } from "three/examples/jsm/utils/SkeletonUtils";

export default class Visuals {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.userMeshes = {};
    this.avatar = {};
    this.avatarAnimation = {};
    this.mixers = {};
    this.userId = "";
    this.map = {};
    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    this.fov = 75;
    this.near = 0.1;
    this.far = 1000;
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      this.sizes.width / this.sizes.height,
      this.near,
      this.far
    );
    this.orbitControls = new OrbitControls(this.camera, this.canvas);
    this.orbitControls.enableDamping = true;
    this.renderer = new THREE.WebGLRenderer({ canvas });
    this.configRenderer();
    this.createGround();
    this.setDRACOLoader();
    this.setGLTFLoader();
    this.loadAvatar();
    this.scene.add(this.camera);
    this.cameraIsInitialized = false;
    ////////////
    window.addEventListener("resize", () => this.resize());
    document.onkeydown = document.onkeyup = (e) => this.keyboardControls(e);
  }
  // updateThirdPersonViewPerspective()
  initializeCamera() {
    this.goal = new THREE.Object3D();
    // this.goal.add(this.userMeshes[this.userId]);
    this.userMeshes[this.userId].add(this.goal);
    this.goal.position.set(0.5, 6, 3);
    this.temp = new THREE.Vector3();
  }
  updateThirdPersonViewPerspective() {
    if (!this.carmeraIsInitialized) {
      if (this.userMeshes[this.userId]) {
        this.initializeCamera();
        this.carmeraIsInitialized = true;
      } else {
        return;
      }
    } else {
      this.temp.setFromMatrixPosition(this.goal.matrixWorld);
      this.camera.position.lerp(this.temp, 0.2);
      this.camera.lookAt(this.userMeshes[this.userId].position);
    }
  }
  updateAvatarModeCamera(target) {
    let offset = new THREE.Vector3(
      target.position.x + 2,
      target.position.y + 20,
      target.position.z + 20
    );
    this.camera.position.copy(offset);
    this.camera.lookAt(target.position);
  }
  joiningUser(id, activeUsers) {
    this.userId = id;
    for (const [userId, userData] of Object.entries(activeUsers)) {
      if (userId === this.userId) {
        this.userMeshes[userId] = this.avatar.mesh;
        console.log('here', this.userMeshes[userId])
      } else {
        this.userMeshes[userId] = SkeletonUtils.clone(this.avatar.mesh);
        this.userMeshes[userId].mixer = new THREE.AnimationMixer(this.userMeshes[userId]);
        this.userMeshes[userId].action = this.userMeshes[userId].mixer.clipAction(this.avatarAnimation)
        this.userMeshes[userId].action.play();
        // this.userMeshes[userId].mixer = this.avatar.mixer;
        console.log('not here ', this.userMeshes[userId])
      }
      this.userMeshes[userId].name = userData.username;
      this.userMeshes[userId].position.copy(userData.position);
      this.scene.add(this.userMeshes[userId]);
    }
    // console.log(this.userMeshes);
  }
  removeUser(id) {
    this.scene.remove(this.scene.getObjectByName(this.userMeshes[id].name));
    delete this.userMeshes[id];
  }
  keyboardControls(e) {
    if (
      e.key === "ArrowUp" ||
      e.key === "ArrowRight" ||
      e.key === "ArrowDown" ||
      e.key === "ArrowLeft"
    )
      this.map[e.key] = e.type === "keydown";
    // console.log(this.map);
  }
  resize() {
    // Update sizes
    this.sizes.width = window.innerWidth;
    this.sizes.height = window.innerHeight;
    // Update camera
    this.camera.aspect = this.sizes.width / this.sizes.height;
    this.camera.updateProjectionMatrix();
    // Update renderer
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  updateUserStates(activeUsers) {
    for (const [userId, userData] of Object.entries(activeUsers)) {
      if (this.userMeshes[userId]) {
        this.userMeshes[userId].position.copy(userData.position);
        this.userMeshes[userId].quaternion.copy(userData.quaternion);
        this.userMeshes[userId].animationStatus = userData.animationStatus;
        // add animation status and loop through visuals.usermeshes
        // this.userMeshes[userId].mixer.update();
        // console.log('here', this.userMeshes[userId])
      }
    }
  }

  // updateAnimationStates(activeUsers, deltaTime) {
  //   for (const [userId, userData] of Object.entries(activeUsers)) {
  //     if (this.userMeshes[userId]) {
  //       this.userMeshes[userId].mixer.update(deltaTime);
  //     }
  //   }
  // }
  // updateThirdPersonViewPerspective()
  // updateThirdPersonViewPerspective() {
  //   if (this.userMeshes[this.userId]) {
  //     this.temp.setFromMatrixPosition(this.goal.matrixWorld);
  //     this.camera.position.lerp(this.temp, 0.2);
  //     this.camera.lookAt(this.userMeshes[this.userId].position);
  //   }
  // }
  updateAvatarModeCamera(target) {
    let offset = new THREE.Vector3(
      target.position.x + 2,
      target.position.y + 20,
      target.position.z + 20
    );
    this.camera.position.copy(offset);
    this.camera.lookAt(target.position);
  }

  addNewUser(id, userData) {
    let clone = SkeletonUtils.clone(this.avatar.mesh)
    this.userMeshes[id] = clone;
    this.scene.add(clone);
    this.userMeshes[id].name = userData.username;
    this.userMeshes[id].position.copy(userData.position);
    this.userMeshes[id].mixer = new THREE.AnimationMixer(clone);
    this.userMeshes[id].action = this.userMeshes[id].mixer.clipAction(this.avatarAnimation)
    this.userMeshes[id].action.play();
  }

  loadAvatar() {
    this.gltfLoader.load("/models/CesiumMan/CesiumMan.gltf", (gltf) => {
      this.avatarAnimation = gltf.animations[0];
      this.avatar.mesh = gltf.scene.children[0];
      this.avatar.mixer = new THREE.AnimationMixer(gltf.scene);
      this.avatar.mesh.mixer = this.avatar.mixer;
      this.avatar.action = this.avatar.mixer.clipAction(this.avatarAnimation);
      this.avatar.mesh.scale.set(4, 4, 4);
      this.avatar.mesh.rotateZ(Math.PI);
      this.avatar.action.play();
      this.avatar.isLoaded = true;
    });
  }
  configRenderer() {
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  setDRACOLoader() {
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath("/draco/");
  }
  setGLTFLoader() {
    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
  }
  createGround() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({ color: 0x222222 })
    );
    ground.rotateX(-Math.PI / 2);
    this.scene.add(ground);
  }
  createCarMesh() {
    const carGeometry = new THREE.BoxGeometry(2, 0.6, 4); // double chasis shape
    const carMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      side: THREE.DoubleSide,
    });
    const carMesh = new THREE.Mesh(carGeometry, carMaterial);
    return carMesh;
  }
  createWheels() {
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
    }
    return wheels;
  }
  createSphereAvatar() {
    return new THREE.Mesh(
      new THREE.SphereGeometry(1),
      new THREE.MeshStandardMaterial({
        color: 0xff0000,
      })
    );
  }
}
