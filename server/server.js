const express = require("express");
const socketIO = require("socket.io");
const physicsSockets = require("./physicsSockets");
const wrtc = require("wrtc");
const webrtcsocketlogic = require("./sockets/webrtcSockets");

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

// const wrtcSocket = require("./wrtc.sockets.js")
// class IOClass {
//   constructor(io) {
//     this.io = io
//     this.wrtcSocket = wrtcSocket(io)
//   }

// }
// const myIOClass = new IOClass(io)
// io.on("connection", (socket) => {
//   myIOClass
// })

physicsSockets(io);
webrtcsocketlogic(io);
