const express = require("express");
const socketIO = require("socket.io");
const physicsSockets = require("./physicsSockets");
const wrtc = require("wrtc");
const webrtcsocketlogic = require("./sockets/webrtcSockets");

const PORT = 3003;
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

physicsSockets(io);
webrtcsocketlogic(io);

