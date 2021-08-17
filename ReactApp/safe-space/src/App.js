import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "three/examples/jsm/libs/dat.gui.module";
import React, { Component, useEffect } from "react";
import ReactDOM from "react-dom";
import { client } from "./client";
import { io } from "socket.io-client";

const App = () => {
  useEffect(() => {
    client();
  }, []);

  return (
    <div>
      <canvas id="canvas"></canvas>
    </div>
  );
};

export default App;
