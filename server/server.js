const express = require("express");
const socketIO = require("socket.io");
const wrtc = require("wrtc");
const physicsSockets = require("./physicsSockets");
const webrtcsocketlogic = require("./sockets/webrtcSockets");
const uuidv1 = require('uuid/v1');

const PORT = 3001;
const app = express();

const server = app.listen(PORT, () => {
  try {
    console.log(`server running at http://localhost:${PORT}`);
  } catch (err) {
    console.log(err);
  }
});

const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});



let userId = uuidv1();

const physicsIO = io.of("/physicsNamespace");
const webRTCIO = io.of("/webRTCNamespace");

physicsSockets(physicsIO);

//10.10.22.47
webrtcsocketlogic(webRTCIO);
