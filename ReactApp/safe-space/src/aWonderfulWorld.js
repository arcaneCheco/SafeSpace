import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";

const aWonderfulWorld = (scene, canvas) => {
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
}

export {aWonderfulWorld as aWonderfulWorld}