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

const force = 50;
const navigate = (map) => {
  const appliedForce = [0, 0, 0];
  if (map.ArrowUp) appliedForce[2] = appliedForce[2] - force;
  if (map.ArrowRight) appliedForce[0] = appliedForce[0] + force;
  if (map.ArrowDown) appliedForce[2] = appliedForce[2] + force;
  if (map.ArrowLeft) appliedForce[0] = appliedForce[0] - force;
  return new CANNON.Vec3(...appliedForce);
};
const deltaPosition = 0.1;
// const deltaRotation = 0.1;
const navigateThroughPosition = (map) => {
  const positionVector = [0, 0, 0];
  // const rotationVector = [0,0,0]
  if (map.ArrowUp) {
    positionVector[2] = positionVector[2] - deltaPosition;
    // positionVector[3]
  }
  if (map.ArrowRight) positionVector[0] = positionVector[0] + deltaPosition;
  if (map.ArrowDown) positionVector[2] = positionVector[2] + deltaPosition;
  if (map.ArrowLeft) positionVector[0] = positionVector[0] - deltaPosition;
  return positionVector;
  // return new CANNON.Vec3(...positionVector);
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
physics.wheelGroundContactMaterial = new CANNON.ContactMaterial(
  physics.wheelMaterial,
  physics.groundMaterial,
  {
    friction: 0.3,
    restitution: 0,
    contactEquationStiffness: 1000,
  }
);
physics.world.addContactMaterial(physics.wheelGroundContactMaterial);

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

/****car */
let carControls = false;
chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.3, 2));
chassisBody = new CANNON.Body({ mass: 150 });
chassisBody.addShape(chassisShape);
chassisBody.position.set(0, 0.2, 0);
chassisBody.angularVelocity.set(0, 0, 0); // initial velocity

const car = new CANNON.RaycastVehicle({
  chassisBody: chassisBody,
  indexRightAxis: 0, // x
  indexUpAxis: 1, // y
  indexForwardAxis: 2, // z
});

// wheel options
const options = {
  radius: 0.3,
  directionLocal: new CANNON.Vec3(0, -1, 0),
  suspensionStiffness: 45,
  suspensionRestLength: 0.4,
  frictionSlip: 5,
  dampingRelaxation: 2.3,
  dampingCompression: 4.5,
  maxSuspensionForce: 200000,
  rollInfluence: 0.01,
  axleLocal: new CANNON.Vec3(-1, 0, 0),
  chassisConnectionPointLocal: new CANNON.Vec3(1, 1, 0),
  maxSuspensionTravel: 0.25,
  customSlidingRotationalSpeed: -30,
  useCustomSlidingRotationalSpeed: true,
};

const axlewidth = 0.7;
options.chassisConnectionPointLocal.set(axlewidth, 0, -1);
car.addWheel(options);

options.chassisConnectionPointLocal.set(-axlewidth, 0, -1);
car.addWheel(options);

options.chassisConnectionPointLocal.set(axlewidth, 0, 1);
car.addWheel(options);

options.chassisConnectionPointLocal.set(-axlewidth, 0, 1);
car.addWheel(options);

car.addToWorld(physics.world);

// car wheels
const wheelBodies = [];
// wheelVisuals = [];
car.wheelInfos.forEach((wheel) => {
  const shape = new CANNON.Cylinder(
    wheel.radius,
    wheel.radius,
    wheel.radius / 2,
    20
  );
  const body = new CANNON.Body({ mass: 1, material: physics.wheelMaterial });
  const q = new CANNON.Quaternion();
  q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
  body.addShape(shape, new CANNON.Vec3(), q);
  wheelBodies.push(body);
  // wheel visual body
});

// update the wheels to match the physics
const updateWheels = () => {
  for (var i = 0; i < vehicle.wheelInfos.length; i++) {
    vehicle.updateWheelTransform(i);
    var t = vehicle.wheelInfos[i].worldTransform;
    // update wheel physics
    wheelBodies[i].position.copy(t.position);
    wheelBodies[i].quaternion.copy(t.quaternion);
  }
};
console.log(car.chassisBody.quaternion);

/********* */

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

  socket.on("update", (map) => {
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
    if (carControls) {
      updateWheels();
      socket.emit(
        "update wheels",
        wheelBodies.map((wheel) => ({
          position: wheel.position,
          quaternion: wheel.quaternion,
        }))
      );
    }
    socket.emit("update", activeUsers);
  }, 25);
});
