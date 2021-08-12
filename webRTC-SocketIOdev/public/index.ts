const socket = io();

const playersContainer = document.querySelector(".players");

// helpers
const addPlayerToScreen = ({
  username,
  socketId,
}: Record<string, string>): void => {
  if (!!document.getElementById(socketId)) return;

  const newPlayer = `
  <div class="player" id="${socketId}">
    <div>${username}</div>
  </div>
  `;
  if (playersContainer) playersContainer.innerHTML += newPlayer;
};

const newPlayerConnected = (): void => {
  const username: string = prompt("what's your name?") || "";
  socket.emit("new player", username);
};
newPlayerConnected();

socket.on("new player", (activePlayers: Record<string, string>[]): void => {
  activePlayers.map((player) => addPlayerToScreen(player));
});

socket.on("player disconnected", (socketId: string) => {
  const disconnectedPlayer = document.getElementById(socketId);
  disconnectedPlayer && disconnectedPlayer.remove();
});

let xChange = 0;
let yChange = 0;
const speed = 10;
const changePosition = (e: KeyboardEvent) => {
  if (e.code === "ArrowDown") {
    yChange += speed;
  } else if (e.code === "ArrowRight") xChange += speed;
  else if (e.code === "ArrowUp") yChange -= speed;
  else if (e.code === "ArrowLeft") xChange -= speed;
  socket.emit("movePlayer", { xChange, yChange });
};
document.addEventListener("keydown", changePosition);

socket.on(
  "movePlayer",
  ({
    xChange,
    yChange,
    socketId,
  }: {
    xChange: number;
    yChange: number;
    socketId: string;
  }) => {
    const player = document.getElementById(socketId);
    player &&
      (player.style.transform = `translate(${xChange}px, ${yChange}px)`);
  }
);
