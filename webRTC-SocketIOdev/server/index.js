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

function distanceBetweeen(user1, user2) {
    const distance = Math.sqrt(Math.pow((user1.xChange - user2.xChange),2) + Math.pow((user1.yChange - user2.yChange),2))
    console.log(distance)
    return distance;
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
        activePlayers[socket.id] = { username, socketId: socket.id, xChange: 0, yChange:0 };
        console.log(activePlayers)
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
        const usersOnline = createUsersOnline();
        usersOnline.length === 2 && distanceBetweeen(usersOnline[0], usersOnline[1])
        console.log(usersOnline)
        io.emit("movePlayer", { ...data, socketId: socket.id });
    });
});
