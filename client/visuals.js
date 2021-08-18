import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";

export default class Visuals {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    this.fov = 75;
    this.aspect = this.sizes.width / this.sizes.height;
    this.near = 0.1;
    this.far = 1000;
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      this.aspect,
      this.near,
      this.far
    );
    this.orbitControls = new OrbitControls(this.camera, this.canvas);
    this.controls.enableDamping = true;
    this.renderer = new THREE.WebGLRenderer({ canvas });
    this.configRenderer();
  }
  configRenderer() {
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(ths.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
  resize() {
    // Update sizes
    this.sizes.width = window.innerWidth;
    this.sizes.height = window.innerHeight;

    // Update camera
    this.camera.aspect = sizes.width / sizes.height;
    this.camera.updateProjectionMatrix();

    // Update renderer
    this.renderer.setSize(sizes.width, sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }
}
