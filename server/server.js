const express = require("express");
const socketIO = require("socket.io");
const physicsSockets = require("./physicsSockets");
const wrtc = require("wrtc");
const webrtcsocketlogic = require("./sockets/wrtc.sockets");

// console.log(wrtc);

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

physicsSockets(io);

//10.10.22.47
webrtcsocketlogic(io);

////////////

