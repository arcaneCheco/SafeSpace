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



/*****************/

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

/**
 * PHYSICS
 */
// sphereAvatar
const createUserAvatar = (id) => {
  const sphereShape = new CANNON.Sphere(1);
  // const sphereShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
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
// sphereUser navigation
const force = 50;
const navigate = (map) => {
  const appliedForce = [0, 0, 0];
  if (map.ArrowUp) appliedForce[2] = appliedForce[2] - force;
  if (map.ArrowRight) appliedForce[0] = appliedForce[0] + force;
  if (map.ArrowDown) appliedForce[2] = appliedForce[2] + force;
  if (map.ArrowLeft) appliedForce[0] = appliedForce[0] - force;
  return new CANNON.Vec3(...appliedForce);
};
// const deltaPosition = 0.1;
// const navigateThroughPosition = (map) => {
//   const positionVector = [0, 0, 0];
//   if (map.ArrowUp) {
//     positionVector[2] = positionVector[2] - deltaPosition;
//   }
//   if (map.ArrowRight) positionVector[0] = positionVector[0] + deltaPosition;
//   if (map.ArrowDown) positionVector[2] = positionVector[2] + deltaPosition;
//   if (map.ArrowLeft) positionVector[0] = positionVector[0] - deltaPosition;
//   return positionVector;
// };

// car navigation
const carNavigation = (map) => {
  if (!map.ArrowUp && !map.ArrowDown && !map.ArrowRight && !map.ArrowLeft) {
    car.setBrake(10, 2);
    car.setBrake(10, 3);
  }
  const engineForce = 800;
  const maxSteerVal = 0.3;
  if (map.ArrowUp) {
    car.applyEngineForce(engineForce, 2);
    car.applyEngineForce(engineForce, 3);
  } else {
    car.applyEngineForce(0, 2);
    car.applyEngineForce(0, 3);
  }
  if (map.ArrowDown) {
    car.applyEngineForce(-engineForce, 2);
    car.applyEngineForce(-engineForce, 3);
  }
  if (map.ArrowRight) {
    car.setSteeringValue(maxSteerVal, 2);
    car.setSteeringValue(maxSteerVal, 3);
  } else {
    car.setSteeringValue(0, 2);
    car.setSteeringValue(0, 3);
  }
  if (map.ArrowLeft) {
    car.setSteeringValue(-maxSteerVal, 2);
    car.setSteeringValue(-maxSteerVal, 3);
  }
  // forward
  // car.applyEngineForce(map.ArrowUp ? -engineForce : 0, 2);
  // car.applyEngineForce(map.ArrowUp ? -engineForce : 0, 3);
  // // backward
  // car.applyEngineForce(map.ArrowDown ? engineForce : 0, 2);
  // car.applyEngineForce(map.ArrowDown ? engineForce : 0, 3);
  // // right
  // car.setSteeringValue(map.ArrowRight ? -maxSteerVal : 0, 2);
  // car.setSteeringValue(map.ArrowRight ? -maxSteerVal : 0, 3);
  // // left
  // car.setSteeringValue(map.ArrowLeft ? maxSteerVal : 0, 2);
  // car.setSteeringValue(map.ArrowLeft ? maxSteerVal : 0, 3);
};

const physics = {
  world: new CANNON.World(),
  userBodies: {},
  groundMaterial: new CANNON.Material("groundMaterial"),
  userMaterial: new CANNON.Material("userMaterial"),
  wheelMaterial: new CANNON.Material("wheelMaterial"),
  createUserAvatar: createUserAvatar,
};
physics.world.broadphase = new CANNON.SAPBroadphase(physics.world);
physics.world.gravity.set(0, -9.81, 0);
physics.world.allowSleep = true;

physics.groundMaterial.friction = 0.15;
physics.groundMaterial.restitution = 0.25;
physics.userMaterial.friction = 0.15;
physics.userMaterial.restitution = 0.25;
wheelGroundContactMaterial = new CANNON.ContactMaterial(
  physics.wheelMaterial,
  physics.groundMaterial,
  {
    friction: 0.3,
    restitution: 0,
    contactEquationStiffness: 1000,
  }
);
// physics.world.defaultContactMaterial.friction = 0;
physics.world.addContactMaterial(wheelGroundContactMaterial);

// const userGroundContactMaterial = new CANNON.ContactMaterial(
//   physics.userMaterial,
//   physics.groundMaterial,
//   {
//     friction: 0,
//     restitution: 0.1,
//     contactEquationStiffness: 1000,
//   }
// );
// physics.world.addContactMaterial(userGroundContactMaterial);

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

  activeUsers[socket.id].color =
    "#" + (Math.random() * 0xfffff * 1000000).toString(16).slice(0, 6);

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

  let carControl;
  socket.on("update", (map, controlModes) => {
    if (controlModes.carControl) {
      carControl = true;
      carNavigation(map);
    } else {
      if (activeUsers[socket.id]) {
        const appliedForce = navigate(map);
        physics.userBodies[socket.id].applyForce(
          appliedForce,
          new CANNON.Vec3(0, 0, 0)
        );
        // const positionVector = navigateThroughPosition(map);
        // physics.userBodies[socket.id].position.x += positionVector[0];
        // physics.userBodies[socket.id].position.y += positionVector[1];
        // physics.userBodies[socket.id].position.z += positionVector[2];
        distances[socket.id] = updateDistances(socket.id);
        activeUsers[socket.id].connectionGradients = updateConnectionGradients(
          distances[socket.id]
        );
      }
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
    if (carControl) {
      updateWheels();
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
