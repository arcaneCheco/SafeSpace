import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";
import { io } from "socket.io-client";
import { aWonderfulWorld } from "./aWonderfulWorld";
// import Visuals from "./visuals"; commented out for dev Daniel

const threeJsCanvas = () => {
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

  socket.on("active users ordered", (orderedUserList) => {
    // console.log(orderedUserList);
  });
  /**
   * THREE JS STUFF
   */
  const canvas = document.querySelector("#canvas");

  const scene = new THREE.Scene();

  aWonderfulWorld(scene, canvas);
};

export { threeJsCanvas };
