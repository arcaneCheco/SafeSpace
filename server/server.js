const express = require("express");
const socketIO = require("socket.io");
const CANNON = require("cannon-es");
const Physics = require("./physics");

const PORT = 3001;
const app = express();

const server = app.listen(PORT, () => {
  try {
    console.log(`server running at http://localhost:${PORT}`);
  } catch (err) {
    console.log(err);
  }
});

let activeUsers = {};
let userCount = 0;

// proximitiy alert and connection for webRTC
const distances = {};
const updateDistances = (userId) => {
  const userPosition = activeUsers[userId].position;
  const distanceToOtherUsers = {};
  for (const [id, data] of Object.entries(activeUsers)) {
    if (userId !== id) {
      distanceToOtherUsers[id] = Math.sqrt(
        [
          userPosition.x - data.position.x,
          userPosition.y - data.position.y,
          userPosition.z - data.position.z,
        ].reduce((mag, dir) => (mag += dir ** 2), 0)
      );
    }
  }
  return distanceToOtherUsers;
};
const sortedListOfUsers = (distanceToOtherUsers) => {
  // returns array of userId's sorted by dstance, ascending
  return Object.keys(distanceToOtherUsers).sort((a, b) => {
    return distanceToOtherUsers[a] - distanceToOtherUsers[b];
  });
};
const radiusConnected = 2 * 15;
const radiusDisconnected = 2 * 35;
const updateConnectionGradients = (distanceToOtherUsers) => {
  const connectionGradients = {};
  for (const [userId, distance] of Object.entries(distanceToOtherUsers)) {
    let gradient = 0;
    if (distance > radiusDisconnected) {
      gradient = 0;
    } else if (distance > radiusConnected) {
      gradient =
        1 -
        (distance - radiusConnected) / (radiusDisconnected - radiusConnected);
    } else {
      gradient = 1;
    }
    connectionGradients[userId] = gradient;
  }
  return connectionGradients;
};

const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

const physics = new Physics();

io.on("connection", (socket) => {
  console.log("a user connected : " + socket.id);
  activeUsers[socket.id] = {
    username: `User00` + userCount++,
    position: { x: 0, y: 0, z: 0 },
    quaternion: { x: 0, y: 0, z: 0, w: 0 },
    connectionGradients: {},
  };
  activeUsers[socket.id].bodyId = physics.createAndAddSphereAvatar(socket.id);
  activeUsers[socket.id].position = physics.userBodies[socket.id].position;

  //   activeUsers[socket.id].color =
  //     "#" + (Math.random() * 0xfffff * 1000000).toString(16).slice(0, 6);

  socket.emit("joined", socket.id, activeUsers);
  socket.broadcast.emit("add new user", socket.id, activeUsers[socket.id]);

  activeUsers[socket.id].bodyId = physics.createAndAddSphereAvatar(socket.id);

  socket.on("disconnect", () => {
    console.log("socket disconnected : " + socket.id);
    if (activeUsers && activeUsers[socket.id]) {
      console.log("deleting " + socket.id);
      delete distances[socket.id];
      for (const val of Object.values(distances)) {
        if (val[socket.id]) delete val[socket];
      }
      delete activeUsers[socket.id];
      physics.world.removeBody(physics.userBodies[socket.id]);
      delete physics.userBodies[socket.id];
      io.emit("removePlayer", socket.id);
    }
  });

  physics.addBoxGround();
  // create Car
  const chassisBody = physics.createCarChassis();
  const car = physics.createCar(chassisBody, 0.7);
  car.addToWorld(physics.world);
  const wheelBodies = physics.createWheelBodies(car);

  let carControl;
  socket.on("update", (map, controlModes) => {
    if (controlModes.carControl) {
      carControl = true;
      physics.carNavigation(car, map);
    } else {
      if (activeUsers[socket.id]) {
        const appliedForce = navigate(map);
        physics.userBodies[socket.id].applyForce(
          appliedForce,
          new CANNON.Vec3(0, 0, 0)
        );
        distances[socket.id] = updateDistances(socket.id);
        activeUsers[socket.id].connectionGradients = updateConnectionGradients(
          distances[socket.id]
        );
      }
    }
  });

  // send sorted list of usernames to client
  setInterval(() => {
    if (distances[socket.id]) {
      socket.emit(
        "active users ordered",
        sortedListOfUsers(distances[socket.id]).map((userId) => {
          if (activeUsers[userId]) {
            return activeUsers[userId].username;
          }
        })
      );
    }
  }, 1000);

  setInterval(() => {
    physics.world.step(0.025);
    Object.keys(activeUsers).forEach((user) => {
      activeUsers[user].position = physics.userBodies[user].position;
      activeUsers[user].quaternion = physics.userBodies[user].quaternion;
    });
    if (carControl) {
      physics.updateCarWheels(car, wheelBodies);
      socket.emit(
        "update wheels",
        wheelBodies.map((wheel) => ({
          position: wheel.position,
          quaternion: wheel.quaternion,
        })),
        {
          position: chassisBody.position,
          quaternion: chassisBody.quaternion,
        }
      );
    }
    socket.emit("update", activeUsers);
  }, 25);
});
