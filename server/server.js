const express = require("express");
const socketIO = require("socket.io");
const CANNON = require("cannon-es");

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

const force = 100;
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

/**************** */

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
    }
  });

  setInterval(() => {
    physics.world.step(0.025);
    Object.keys(activeUsers).forEach((user) => {
      activeUsers[user].position = physics.userBodies[user].position;
      activeUsers[user].quaternion = physics.userBodies[user].quaternion;
      // activeUsers[user].position = {
      //   x: physics.userBodies[user].position.x,
      //   y: physics.userBodies[user].position.y,
      //   z: physics.userBodies[user].position.z,
      // };
      // activeUsers[user].quaternion = {
      //   x: physics.userBodies[user].quaternion.x,
      //   y: physics.userBodies[user].quaternion.y,
      //   z: physics.userBodies[user].quaternion.z,
      //   w: physics.userBodies[user].quaternion.w,
      // };
    });
    socket.emit("update", activeUsers);
  }, 25);
});
