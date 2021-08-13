"use strict";
const socket = io();
const playersContainer = document.querySelector(".players");
// helpers
const addPlayerToScreen = ({ username, socketId, }) => {
    if (!!document.getElementById(socketId))
        return;
    const newPlayer = `
  <div class="player" id="${socketId}">
    <div>${username}</div>
  </div>
  `;
    if (playersContainer)
        playersContainer.innerHTML += newPlayer;
};
const newPlayerConnected = () => {
    const username = prompt("what's your name?") || "";
    socket.emit("new player", username);
};
newPlayerConnected();
socket.on("new player", (activePlayers) => {
    activePlayers.map((player) => addPlayerToScreen(player));
});
socket.on("player disconnected", (socketId) => {
    const disconnectedPlayer = document.getElementById(socketId);
    disconnectedPlayer && disconnectedPlayer.remove();
});
let xChange = 0;
let yChange = 0;
const speed = 10;
const changePosition = (e) => {
    if (e.code === "ArrowDown") {
        yChange += speed;
    }
    else if (e.code === "ArrowRight")
        xChange += speed;
    else if (e.code === "ArrowUp")
        yChange -= speed;
    else if (e.code === "ArrowLeft")
        xChange -= speed;
    socket.emit("movePlayer", { xChange, yChange });
};
document.addEventListener("keydown", changePosition);
socket.on("movePlayer", ({ xChange, yChange, socketId, }) => {
    const player = document.getElementById(socketId);
    player &&
        (player.style.transform = `translate(${xChange}px, ${yChange}px)`);
});
