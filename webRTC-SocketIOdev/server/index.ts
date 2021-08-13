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

app.use(express.static("public"));

const io = socketIO(server);

let activePlayers: { [k: string]: string }[] = [];

io.on("connection", (socket: any) => {
  console.log(`made socket connection`);

  socket.on("new player", (username: string) => {
    console.log(`${username} joined the game`);
    activePlayers.push({ username, socketId: socket.id });
    io.emit("new player", activePlayers);
  });

  socket.on("disconnect", () => {
    activePlayers = activePlayers.filter((player) => {
      if (player.socketId === socket.id) {
        console.log(`${player.username} has left the game.`);
        io.emit("player disconnected", socket.id);
        return false;
      } else return true;
    });
  });

  socket.on("movePlayer", (data: Record<string, number>) => {
    io.emit("movePlayer", { ...data, socketId: socket.id });
  });
});
