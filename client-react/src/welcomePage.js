import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";
import gsap from "gsap";

const WelcomePage = () => {
  //   const gui = new GUI();
  const textureLoader = new THREE.TextureLoader();
  const matcapTexture = textureLoader.load("/textures/matcaps/5.png");

  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  };
  const canvas = document.querySelector("#welcomeCanvas");
  const mainPage = document.querySelector("#canvas");
  const renderer = new THREE.WebGLRenderer({
    canvas,
  });
  renderer.setSize(sizes.width, sizes.height);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    50,
    sizes.width / sizes.height,
    0.1,
    100
  );
  camera.position.z = 5;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  window.addEventListener("resize", () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const axesHelper = new THREE.AxesHelper();
  scene.add(axesHelper);

  //   const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
  //   const box = new THREE.Mesh(new THREE.BoxBufferGeometry(1, 1, 1), material);
  //   scene.add(box);
  const gui = new GUI();
  const pointLight = new THREE.PointLight(0xddd23b);
  const pointLightHelper = new THREE.PointLightHelper(pointLight);
  pointLight.position.set(0, 0, -4);
  pointLight.intensity = 3;
  scene.add(pointLight, pointLightHelper);
  const rectLight = new THREE.RectAreaLight(0x51a8dd, 2, 10, 10);
  rectLight.position.set(5, 5, 0);
  rectLight.lookAt(0, 0, 0);
  scene.add(rectLight);
  gui.add(rectLight, "intensity").min(0.1).max(10).step(0.001);
  console.log(rectLight);
  const parameters = {
    color: 0xffffff,
    lightUp: () => {
      gsap.to(rectLight, { duration: 2, intensity: 10 });
    },
    lightDown: () => {
      gsap.to(rectLight, { duration: 2, intensity: 0.5 });
    },
  };
  gui.add(parameters, "lightUp");
  gui.add(parameters, "lightDown");

  const group = new THREE.Group();
  scene.add(group);

  const fontLoader = new THREE.FontLoader();
  fontLoader.load("/fonts/ArkitechStencil_Regular.json", (font) => {
    const textGeometry = new THREE.TextGeometry("Welcome to Safe Space", {
      font,
      size: 0.3,
      height: 0.2,
      curveSegments: 6,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelOffset: 0,
      bevelSegments: 4,
    });
    textGeometry.center();
    // const textMaterial = new THREE.MeshMatcapMaterial();
    const textMaterial = new THREE.MeshStandardMaterial();
    textMaterial.matcap = matcapTexture;
    const text = new THREE.Mesh(textGeometry, textMaterial);
    // scene.add(text);
    group.add(text);
  });
  let enterText = null;
  fontLoader.load("/fonts/helvetiker_regular.typeface.json", (font) => {
    const textGeometry = new THREE.TextGeometry("Enter", {
      font,
      size: 0.5,
      height: 0.2,
      curveSegments: 6,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelOffset: 0,
      bevelSegments: 4,
    });
    textGeometry.center();
    const textMaterial = new THREE.MeshMatcapMaterial();
    textMaterial.matcap = matcapTexture;
    const text = new THREE.Mesh(textGeometry, textMaterial);
    text.position.y -= 1;
    console.log(text);
    enterText = text;
    // text.onC;
    // scene.add(enterText);
    // enterText.material.color.set("#ff0000");
    group.add(enterText);
  });
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  function onMouseClick(event) {
    if (enterText) {
      raycaster.setFromCamera(mouse, camera);
      let isIntersected = raycaster.intersectObject(enterText);
      if (isIntersected.length > 0) {
        console.log("Mesh clicked!");
        // mainPage.style.display = "block";
        outside = false;
        gsap.to(camera.position, { duration: 2, z: 15 });
      }
    }
  }
  window.addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = -(event.clientY / sizes.height) * 2 + 1;
  });
  window.addEventListener("click", onMouseClick, false);

  const clock = new THREE.Clock();
  let intersect = null;
  let outside = true;
  const animate = () => {
    const elapsedTime = clock.getElapsedTime();

    if (enterText) {
      group.rotation.z = Math.sin(Math.PI * elapsedTime * 0.25) * 0.075;
      raycaster.setFromCamera(mouse, camera);
      intersect = raycaster.intersectObject(enterText);
      //   console.log(intersect);
      if (intersect.length > 0) {
        console.log("hello");
        parameters.lightUp();
      } else {
        parameters.lightDown();
      }
    }
    if (outside) {
      camera.position.x = Math.sin(mouse.x * 0.1 * Math.PI) * 3;
      camera.position.z = Math.cos(mouse.x * 0.1 * Math.PI) * 3;
      camera.position.y = mouse.y * 1;
      enterText && camera.lookAt(enterText.position);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
  animate();
};

export default WelcomePage;
