import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";

export default class Visuals {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    // this.sizes = {
    //   width: window.innerWidth,
    //   height: window.innerHeight,
    // };
    // this.sizes = () => ({
    //   width: window.innerWidth,
    //   height: window.innerHeight,
    // });
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;
    this.fov = 75;
    this.aspect = this.windowWidth / this.windowHeight;
    this.near = 0.1;
    this.far = 1000;
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      this.aspect,
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
  }
  configRenderer() {
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(this.windowWidth, this.windowHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  resize() {
    // Update sizes
    this.windowWidth = window.innerWidth;
    this.windowHeight = window.innerHeight;

    // Update camera
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();

    // Update renderer
    this.renderer.setSize(this.windowWidth, this.windowHeight);
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
  updateAvatarModeCamera(target) {
    let offset = new THREE.Vector3(
      target.position.x + 2,
      target.position.y + 20,
      target.position.z + 20
    );
    // this.camera.position.lerp(offset, 0.2);
    this.camera.position.copy(offset);
    this.camera.lookAt(target.position);
    // this.camera.lookAt(target.position.applyQuaternion(target.quaternion));
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
