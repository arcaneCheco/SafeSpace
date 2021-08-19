const express = require("express");
const socketIO = require("socket.io");
const wrtc = require("webrtc");
const webrtcsocketlogic = require("./sockets/wrtc.sockets");


const PORT = 3002;
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

webrtcsocketlogic(io);

////////////

