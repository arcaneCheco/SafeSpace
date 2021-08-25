import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { SkeletonUtils } from "three/examples/jsm/utils/SkeletonUtils";
import { RectAreaLightHelper } from "three/examples/jsm/helpers/RectAreaLightHelper.js";
import gsap from "gsap";

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
    this.hasEntered = false;
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
    // this.createGround();
    this.setDRACOLoader();
    this.setGLTFLoader();
    this.loadAvatar();
    this.textureLoader = new THREE.TextureLoader();
    this.loadLandscape();
    this.scene.add(this.camera);
    this.cameraIsInitialized = false;
    window.addEventListener("resize", () => this.resize());
    document.onkeydown = document.onkeyup = (e) => this.keyboardControls(e);
    this.gui = new GUI();
    this.addGUIcontrol();
    ///welcome screen stuff
    this.raycaster = new THREE.Raycaster();
    this.fontLoader = new THREE.FontLoader();
    this.welcomeLights = new THREE.Group();
    this.welcomeText = new THREE.Group();
    this.welcomeText.rotateX(-Math.PI / 4);
    this.welcomeText.position.set(0, 75, 25);
    this.scene.add(this.welcomeLights, this.welcomeText);
    this.mouse = new THREE.Vector2();
    this.enterText = null;
    window.addEventListener("mousemove", (event) => {
      this.mouse.x = (event.clientX / this.sizes.width) * 2 - 1;
      this.mouse.y = -(event.clientY / this.sizes.height) * 2 + 1;
    });
    window.addEventListener("click", this.enterClickHandler.bind(this), false);
    this.createWelcomeScreen();
    ////////
  }
  createWelcomeScreen() {
    this.camera.position.set(0, 100, 50);
    this.setWelcomeLight();
    this.createText("Welcome", 2, 0, -5);
    this.createText("to", 2, -5, -4);
    this.createText("SafeSpace", 4, -10, -3);
    this.createText("Enter", 2, -15, 0);
  }
  enterClickHandler() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    let isIntersected = this.raycaster.intersectObject(this.enterText);
    if (isIntersected.length > 0) {
      console.log("Mesh clicked!");
      this.hasEntered = true;
      // this.scene.
    }
  }
  createText(text, size, offsetY, offsetZ) {
    this.fontLoader.load("/fonts/ArkitechStencil_Regular.json", (font) => {
      const textGeometry = new THREE.TextGeometry(text, {
        font,
        size: size,
        height: 0.2,
        curveSegments: 6,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.02,
        bevelOffset: 0,
        bevelSegments: 4,
      });

      textGeometry.center();
      const textMaterial = new THREE.MeshStandardMaterial();
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(2, 2 + offsetY, 2 + offsetZ);
      console.log(textMesh);
      this.welcomeText.add(textMesh);
      if (text === "Enter") {
        this.enterText = textMesh;
      }
    });
  }
  setWelcomeLight() {
    const pointLight = new THREE.PointLight(0xddd23b);
    const pointLightHelper = new THREE.PointLightHelper(pointLight);
    pointLight.position.set(0, 25, 0);
    pointLight.intensity = 3;
    this.welcomeLights.add(pointLight, pointLightHelper);
    const rectLight = new THREE.RectAreaLight(0x51a8dd, 2, 10, 10);
    rectLight.position.set(5, 5, 0);
    rectLight.lookAt(0, 0, 0);
    const rectLightHelper = new RectAreaLightHelper(rectLight);
    this.welcomeLights.add(rectLight, rectLightHelper);
    this.gui.add(rectLight, "intensity").min(0.1).max(10).step(0.001);
  }
  addGUIcontrol() {
    this.gui.add(this.camera.position, "x").min(-50).max(50).step(0.1);
    this.gui.add(this.camera.position, "y").min(-50).max(250).step(0.1);
    this.gui.add(this.camera.position, "z").min(-50).max(50).step(0.1);
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
      } else {
        this.userMeshes[userId] = SkeletonUtils.clone(this.avatar.mesh);
        this.userMeshes[userId].mixer = new THREE.AnimationMixer(this.userMeshes[userId]);
        this.userMeshes[userId].mixer.timeScale = 2;
        this.userMeshes[userId].action = this.userMeshes[userId].mixer.clipAction(this.avatarAnimation)
        this.userMeshes[userId].action.play();
      }
      this.userMeshes[userId].name = userData.username;
      this.userMeshes[userId].position.copy(userData.position);
      this.scene.add(this.userMeshes[userId]);
    }
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
    this.userMeshes[id].mixer.timeScale = 2;
    this.userMeshes[id].action = this.userMeshes[id].mixer.clipAction(this.avatarAnimation)
    this.userMeshes[id].action.play();
  }

  loadAvatar() {
    this.gltfLoader.load("/models/CesiumMan/CesiumMan.gltf", (gltf) => {
      this.avatarAnimation = gltf.animations[0];
      this.avatar.mesh = gltf.scene.children[0];
      this.avatar.mixer = new THREE.AnimationMixer(gltf.scene);
      this.avatar.mixer.timeScale = 2;
      this.avatar.mesh.mixer = this.avatar.mixer;
      this.avatar.action = this.avatar.mixer.clipAction(this.avatarAnimation);
      this.avatar.mesh.scale.set(4, 4, 4);
      this.avatar.mesh.rotateZ(Math.PI);
      this.avatar.action.play();
      this.avatar.isLoaded = true;
    });
  }
  loadLandscape() {
    this.gltfLoader.load(
      "/models/3D-landscape/NatureGradientPack2.glb",
      (gltf) => {
        console.log(gltf, "gltfff");
        gltf.scene.scale.set(17, 17, 17);
        gltf.scene.children[6].position.y += 0.001;
        this.scene.add(gltf.scene);
      },
      function (xhr) {
        console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
      },
      function (error) {
        console.log("An error happened");
      }
    );
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
