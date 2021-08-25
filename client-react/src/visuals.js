import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// import { GUI } from "three/examples/jsm/libs/dat.gui.module";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { SkeletonUtils } from "three/examples/jsm/utils/SkeletonUtils";
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
    this.hasEnteredBuffer = false;
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
    console.log(this.scene);
    this.orbitControls = new OrbitControls(this.camera, this.canvas);
    // this.orbitControls.enableDamping = true;
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
    ///welcome screen stuff
    this.raycaster = new THREE.Raycaster();
    this.fontLoader = new THREE.FontLoader();
    this.welcomeLights = new THREE.Group();
    this.welcomeText = new THREE.Group();
    this.welcomeText.rotateX(Math.PI / 6);
    // this.welcomeText.rotateY(Math.PI / 18);
    this.welcomeText.position.set(0, 185, 350);
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
    this.otherFogStuff();
    this.addSun();
  }
  otherFogStuff() {
    this.scene.background = new THREE.Color(0xe899ca);
    this.scene.fog = new THREE.Fog(0xc5945f, 1, 600);
  }
  welcomeAnimation(elapsedTime) {
    if (this.enterText) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersect = this.raycaster.intersectObject(this.enterText);
      if (this.scene.getObjectByName("welcomeRectLight")) {
        if (intersect.length > 0) {
          gsap.to(this.scene.getObjectByName("welcomeRectLight"), {
            duration: 2,
            intensity: 10,
          });
        } else {
          gsap.to(this.scene.getObjectByName("welcomeRectLight"), {
            duration: 2,
            intensity: 0,
          });
        }
      }
      this.welcomeText.rotation.z =
        Math.sin(Math.PI * elapsedTime * 0.25) * 0.075;
      this.welcomeText.rotation.y =
        Math.sin(Math.PI * elapsedTime * 0.1) * 0.075;
      if (this.hasEnteredBuffer) {
        this.camera.position.x = Math.sin(this.mouse.x * 0.5 * Math.PI) * 3 + 0;
        this.camera.position.z =
          Math.cos(this.mouse.x * 0.5 * Math.PI) * 3 + 370;
        this.camera.position.y = this.mouse.y * 1 + 165;
      }
    }
  }
  createWelcomeScreen() {
    this.camera.rotation.set(Math.PI / 6, 0, 0);
    this.camera.position.set(0, 165, 370);
    this.camera.updateProjectionMatrix();
    this.setWelcomeLight();
    this.createText("Welcome to", 1.5, 0, 0);
    this.createText("Safe Space", 4, -8, 0);
    this.createText("Enter", 3, -18, 0);
  }
  enterClickHandler() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    let isIntersected = this.raycaster.intersectObject(this.enterText);
    if (isIntersected.length > 0) {
      console.log("Mesh clicked!");

      this.hasEnteredBuffer = true;
      setTimeout(() => {
        this.hasEntered = true;
      }, 150);
      this.updateThirdPersonViewPerspective();
      this.scene.remove(this.welcomeLights);
      gsap.to(this.scene.getObjectByName("sunLight"), {
        duration: 5,
        intensity: 3,
      });
    }
  }
  setWelcomeLight() {
    const pointLight = new THREE.PointLight(0xa8d8b9);
    pointLight.position.set(28, 188, 359);
    pointLight.intensity = 3;
    pointLight.name = "welcomePointLight";
    this.welcomeLights.add(pointLight);
    const rectLight = new THREE.RectAreaLight(0xf05e1c, 5, 30, 30);
    rectLight.name = "welcomeRectLight";
    rectLight.position.set(0, 160, 365);
    rectLight.lookAt(new THREE.Vector3(0, 185, 350));
    this.welcomeLights.add(rectLight);
  }
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
  addSun() {
    const pointLight = new THREE.SpotLight(0xe17539);
    pointLight.position.set(890, 755, 890);
    pointLight.name = "sunLight";
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 1024; // default
    pointLight.shadow.mapSize.height = 1024; // default
    pointLight.shadow.camera.near = 1000; // default
    pointLight.shadow.camera.far = 2000; // default
    pointLight.intensity = 0;
    pointLight.angle = 0.286;
    pointLight.penumbra = 1;
    this.scene.add(pointLight);
  }
  addAmbientLight() {
    const ambientLight = new THREE.AmbientLight();
    ambientLight.name = "ambientLight";
    ambientLight.intensity = 0;
    this.scene.add(ambientLight);
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
        // this.enterText.material.emissive = new THREE.Color(0xff0000);
      }
    });
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
  addGridHelper() {
    const helper = new THREE.GridHelper();
    this.scene.add(helper);
  }
  joiningUser(id, activeUsers) {
    this.userId = id;
    for (const [userId, userData] of Object.entries(activeUsers)) {
      if (userId === this.userId) {
        this.userMeshes[userId] = this.avatar.mesh;
      } else {
        this.userMeshes[userId] = SkeletonUtils.clone(this.avatar.mesh);
        this.userMeshes[userId].mixer = new THREE.AnimationMixer(
          this.userMeshes[userId]
        );
        this.userMeshes[userId].mixer.timeScale = 2;
        this.userMeshes[userId].action = this.userMeshes[
          userId
        ].mixer.clipAction(this.avatarAnimation);
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
    let clone = SkeletonUtils.clone(this.avatar.mesh);
    this.userMeshes[id] = clone;
    this.scene.add(clone);
    this.userMeshes[id].name = userData.username;
    this.userMeshes[id].position.copy(userData.position);
    this.userMeshes[id].mixer = new THREE.AnimationMixer(clone);
    this.userMeshes[id].mixer.timeScale = 2;
    this.userMeshes[id].action = this.userMeshes[id].mixer.clipAction(
      this.avatarAnimation
    );
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
      "/models/3D-landscape/NatureGradientPack1.glb",
      (gltf) => {
        console.log(gltf, "gltfff");
        gltf.scene.children.forEach((childObj) => {
          childObj.name !== "Plane" && (childObj.castShadow = true);
        });
        gltf.scene.castShadow = true;
        gltf.scene.children[6].receiveShadow = true;
        gltf.scene.scale.set(17, 17, 17);
        gltf.scene.children[6].scale.set(100, 100, 100);
        gltf.scene.children[6].position.y += 0.001;
        gltf.scene.children[6].material.roughness = 1;
        this.scene.add(gltf.scene);
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
