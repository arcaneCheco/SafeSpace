"use strict";
const express = require("express");
const socketIO = require("socket.io");
const PORT = 3000;
const app = express();
const server = app.listen(PORT, () => {
    try {
        console.log(`server running at http://localhost:${PORT}`);
    }
    catch (err) {
        console.log(err);
    }
});

function createUsersOnline() {
    const values = Object.values(activePlayers);
    const onlyWithUserNames = values.filter(u => u.username !== undefined);
    return onlyWithUserNames;
}

function closeProximity() {

};


app.use(express.static("../public"));
const io = socketIO(server);
const activePlayers = {};
io.on("connection", (socket) => {
    console.log(`made socket connection`);
    socket.on("new player", (username) => {
        console.log(`${username} joined the game`);
        activePlayers[socket.id] = { username, socketId: socket.id, xChange: 0, yChange: 0 };
        io.emit("new player", createUsersOnline());
    });
    socket.on("disconnect", () => {
        io.emit("player disconnected", socket.id);
        activePlayers[socket.id] && console.log(`${activePlayers[socket.id].username} has left the game.`);
        delete activePlayers[socket.id];
    });
    socket.on("movePlayer", (data) => {
        activePlayers[socket.id].xChange = data.xChange;
        activePlayers[socket.id].yChange = data.yChange;
        io.emit("movePlayer", { ...data, socketId: socket.id });
    });
});
