"use strict";
const express = require("express");
const socketIO = require("socket.io");
const PORT = 3000;
const app = express();
const server = app.listen(PORT, () => {
  try {
    console.log(`server running at http://localhost:${PORT}`);
  } catch (err) {
    console.log(err);
  }
});

function createUsersOnline() {
  const values = Object.values(activePlayers);
  const onlyWithUserNames = values.filter((u) => u.username !== undefined);
  return onlyWithUserNames;
}

function distanceBetweeen(user1, user2) {
  const distance = Math.sqrt(
    Math.pow(user1.xChange - user2.xChange, 2) +
      Math.pow(user1.yChange - user2.yChange, 2)
  );
  return distance;
}

function getDistances(socketIdentifier) {
  const onlineUsers = createUsersOnline();
  const allOtherUsers = onlineUsers.filter(
    (user) => user.socketId !== socketIdentifier
  );
  allOtherUsers.forEach((user) => {
    let distance = distanceBetweeen(user, activePlayers[socketIdentifier]);
    // may need to change next 2 lines as when 2 users have same name issues will arise
    activePlayers[socketIdentifier].distances[user.username] = distance;
    activePlayers[user.socketId].distances[activePlayers[socketIdentifier].username] = distance;
    //Opacity calculations
    const outer = 150;
    const inner = 75;
    if (distance < outer*2) { // users are within outer radius
      let opacityValue = 1 - ((distance - 2 * inner) / ((2 * outer) - (2 * inner)));
      if (distance < inner*2) { // users are within inner radius
        activePlayers[socketIdentifier].opacities[user.username] = 1;
        activePlayers[user.socketId].opacities[activePlayers[socketIdentifier].username] = 1;
      } else { // users are inbetween outer and inner radius
        activePlayers[socketIdentifier].opacities[user.username] = opacityValue;
        activePlayers[user.socketId].opacities[activePlayers[socketIdentifier].username] = opacityValue;
      }
    } else { // users are not within outer radius
      activePlayers[socketIdentifier].opacities[user.username] = 0;
      activePlayers[user.socketId].opacities[activePlayers[socketIdentifier].username] = 0;
    }
  });
}

app.use(express.static("../public"));
const io = socketIO(server);
const activePlayers = {};
io.on("connection", (socket) => {
  console.log(`made socket connection`);
  socket.on("new player", (username) => {
    console.log(`${username} joined the game`);
    activePlayers[socket.id] = {
      username,
      socketId: socket.id,
      xChange: 0,
      yChange: 0,
      distances: {},
      opacities: {},
    };
    io.emit("new player", createUsersOnline());
  });
  socket.on("disconnect", () => {
    io.emit("player disconnected", socket.id);
    activePlayers[socket.id] &&
      console.log(`${activePlayers[socket.id].username} has left the game.`);
    delete activePlayers[socket.id];
  });
  socket.on("movePlayer", (data) => {
    activePlayers[socket.id].xChange = data.xChange;
    activePlayers[socket.id].yChange = data.yChange;
    getDistances(socket.id);
    const usersOnline = createUsersOnline();
    console.log(usersOnline);
    io.emit("movePlayer", { ...data, socketId: socket.id });
  });
});
