const express = require("express");
const socketIO = require("socket.io");
const CANNON = require("cannon-es");
const wrtc = require("webrtc");

const PORT = 3002;
const app = express();

const server = app.listen(PORT, () => {
  try {
    console.log(`server running at http://localhost:${PORT}`);
  } catch (err) {
    console.log(err);
  }
});

/******** WebRTC STUN SERVER *********/

const pc_config = {
  "iceServers": [
    // {
    //   urls: 'stun:[STUN_IP]:[PORT]',
    //   'credentials': '[YOR CREDENTIALS]',
    //   'username': '[USERNAME]'
    // },
    {
      urls: 'stun:stun.l.google.com:19302'
    }
  ]
}


/*****************/

let activeUsers = {};
/**
 activeUsers:
 {
   "socketId": {
    username: `User006`
    position: { x: 0, y: 0, z: 0 },
    quaternion: { x: 0, y: 0, z: 0, w: 0 },
    bodyId: physics.userBodies[socketId].id
   }
 }
 */
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

/**
 * PHYSICS
 */
const createUserAvatar = (id) => {
  const sphereShape = new CANNON.Sphere(1);
  const sphereBody = new CANNON.Body({
    mass: 1,
    material: physics.userMaterial,
    angularDamping: 0.9,
  });
  sphereBody.addShape(sphereShape);
  sphereBody.position.x = Math.sin((Math.random() - 0.5) * 2 * Math.PI) * 5;
  sphereBody.position.y = 5;
  (sphereBody.position.z = Math.cos((Math.random() - 0.5) * 2 * Math.PI) * 5),
    physics.world.addBody(sphereBody);

  physics.userBodies[id] = sphereBody;

  return sphereBody.id;
};

const force = 50;
const navigate = (map) => {
  const appliedForce = [0, 0, 0];
  if (map.ArrowUp) appliedForce[2] = appliedForce[2] - force;
  if (map.ArrowRight) appliedForce[0] = appliedForce[0] + force;
  if (map.ArrowDown) appliedForce[2] = appliedForce[2] + force;
  if (map.ArrowLeft) appliedForce[0] = appliedForce[0] - force;
  return new CANNON.Vec3(...appliedForce);
};

const physics = {
  world: new CANNON.World(),
  userBodies: {},
  groundMaterial: new CANNON.Material("groundMaterial"),
  userMaterial: new CANNON.Material("userMaterial"),
  createUserAvatar: createUserAvatar,
};
physics.world.gravity.set(0, -9.81, 0);

physics.groundMaterial.friction = 0.15;
physics.groundMaterial.restitution = 0.25;
physics.userMaterial.friction = 0.15;
physics.userMaterial.restitution = 0.25;

const groundShape = new CANNON.Box(new CANNON.Vec3(50, 1, 50));
const groundBody = new CANNON.Body({
  mass: 0,
  material: this.groundMaterial,
});
groundBody.addShape(groundShape);
groundBody.position.x = 0;
groundBody.position.y = -1;
groundBody.position.z = 0;
physics.world.addBody(groundBody);

/******** SOCKET IO *********/

const io = socketIO(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("a user connected : " + socket.id);
  activeUsers[socket.id] = {
    username: `User00` + userCount++,
    position: { x: 0, y: 0, z: 0 },
    quaternion: { x: 0, y: 0, z: 0, w: 0 },
    connectionGradients: {},
  };
  activeUsers[socket.id].bodyId = physics.createUserAvatar(socket.id);
  activeUsers[socket.id].position = physics.userBodies[socket.id].position;

  socket.emit("joined", socket.id, activeUsers);
  socket.broadcast.emit("add new user", socket.id, activeUsers[socket.id]);

  activeUsers[socket.id].bodyId = physics.createUserAvatar(socket.id);

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

  socket.on("update", (map) => {
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
  });
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
    socket.emit("update", activeUsers);
  }, 25);
});
