const CANNON = require("cannon-es");

class Physics {
  constructor() {
    this.world = new CANNON.World();
    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.gravity.set(0, -9.81, 0);
    // this.world.allowSleep = true;
    this.userBodies = {};
    // this.world.defaultContactMaterial.friction = 0;
    this.groundMaterial = new CANNON.Material("groundMaterial");
    this.groundMaterial.friction = 0.15;
    this.groundMaterial.restitution = 0.25;
    this.userMaterial = new CANNON.Material("userMaterial");
    this.userMaterial.friction = 0.15;
    this.userMaterial.restitution = 0.25;
    this.wheelMaterial = new CANNON.Material("wheelMaterial");
    this.wheelGroundContactMaterial = new CANNON.ContactMaterial(
      this.wheelMaterial,
      this.groundMaterial,
      {
        friction: 0.3,
        restitution: 0,
        contactEquationStiffness: 1000,
      }
    );
    this.world.addContactMaterial(this.wheelGroundContactMaterial);
  }
  createAndAddSphereAvatar(id) {
    const sphereShape = new CANNON.Sphere(1);
    const sphereBody = new CANNON.Body({
      mass: 1,
      material: this.userMaterial,
      angularDamping: 0.9,
    });
    sphereBody.addShape(sphereShape);
    sphereBody.position.x = Math.sin((Math.random() - 0.5) * 2 * Math.PI) * 5;
    sphereBody.position.y = 5;
    sphereBody.position.z = Math.cos((Math.random() - 0.5) * 2 * Math.PI) * 5;
    this.world.addBody(sphereBody);
    this.userBodies[id] = sphereBody;
    return sphereBody.id;
  }
  createAndAddBoxAvatar(id) {
    // const trans = new CANNON.Transform({ position: new CANNON.Vec3(4, 0, 0) });
    const boxShape = new CANNON.Box(
      new CANNON.Vec3(
        (1.140032197089109 / 2) * 8,
        (1.5080219133341668 / 2) * 8,
        (0.3135272997496078 / 2) * 8
      )
    );
    const boxBody = new CANNON.Body({
      mass: 1,
      material: this.userMaterial,
      angularDamping: 0.9,
      fixedRotation: true,
      shape: boxShape,
    });
    // boxBody.addShape(boxShape);
    boxBody.position.x = Math.sin((Math.random() - 0.5) * 2 * Math.PI) * 5;
    boxBody.position.y = 10;
    boxBody.position.z = Math.cos((Math.random() - 0.5) * 2 * Math.PI) * 5;
    this.world.addBody(boxBody);
    this.userBodies[id] = boxBody;
    return boxBody.id;
  }
  createAndAddCylAvatar(id) {
    const cylShape = new CANNON.Cylinder(0.7, 0.7, 1.5080219133341668 * 4, 6);
    const cylBody = new CANNON.Body({
      mass: 1,
      material: this.userMaterial,
      // angularDamping: 0.9,
      fixedRotation: true,
      shape: cylShape,
    });
    // boxBody.addShape(boxShape);
    cylBody.position.x = Math.sin((Math.random() - 0.5) * 2 * Math.PI) * 5;
    cylBody.position.y = 10;
    cylBody.position.z = Math.cos((Math.random() - 0.5) * 2 * Math.PI) * 5;
    this.world.addBody(cylBody);
    this.userBodies[id] = cylBody;
    return cylBody.id;
  }
  sphereUserControls(map) {
    const force = 50;
    const appliedForce = [0, 0, 0];
    if (map.ArrowUp) appliedForce[2] = appliedForce[2] - force;
    if (map.ArrowRight) appliedForce[0] = appliedForce[0] + force;
    if (map.ArrowDown) appliedForce[2] = appliedForce[2] + force;
    if (map.ArrowLeft) appliedForce[0] = appliedForce[0] - force;
    return new CANNON.Vec3(...appliedForce);
  }
  addBoxGround() {
    const groundShape = new CANNON.Box(new CANNON.Vec3(50, 1, 50));
    const groundBody = new CANNON.Body({
      mass: 0,
      material: this.groundMaterial,
    });
    groundBody.addShape(groundShape);
    groundBody.position.x = 0;
    groundBody.position.y = -1;
    groundBody.position.z = 0;
    this.world.addBody(groundBody);
  }
  createCarChassis() {
    const chassisShape = new CANNON.Box(new CANNON.Vec3(1, 0.3, 2));
    const chassisBody = new CANNON.Body({ mass: 150 });
    chassisBody.addShape(chassisShape);
    chassisBody.position.set(0, 0.2, 0);
    chassisBody.angularVelocity.set(0, 0, 0); // initial velocity
    return chassisBody;
  }
  createCar(chassisBody, axlewidth) {
    const car = new CANNON.RaycastVehicle({
      chassisBody,
      indexRightAxis: 0, // x
      indexUpAxis: 1, // y
      indexForwardAxis: 2, // z
    });
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
    options.chassisConnectionPointLocal.set(axlewidth, 0, -1);
    car.addWheel(options);
    options.chassisConnectionPointLocal.set(-axlewidth, 0, -1);
    car.addWheel(options);
    options.chassisConnectionPointLocal.set(axlewidth, 0, 1);
    car.addWheel(options);
    options.chassisConnectionPointLocal.set(-axlewidth, 0, 1);
    car.addWheel(options);
    return car;
  }
  createWheelBodies(car) {
    const wheelBodies = [];
    car.wheelInfos.forEach((wheel) => {
      const shape = new CANNON.Cylinder(
        wheel.radius,
        wheel.radius,
        wheel.radius / 2,
        20
      );
      const body = new CANNON.Body({ mass: 1, material: this.wheelMaterial });
      const q = new CANNON.Quaternion();
      // q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
      body.addShape(shape, new CANNON.Vec3(), q);
      wheelBodies.push(body);
    });
    return wheelBodies;
  }
  updateCarWheels(car, wheelBodies) {
    for (let i = 0; i < car.wheelInfos.length; i++) {
      car.updateWheelTransform(i);
      const t = car.wheelInfos[i].worldTransform;
      // update wheel physics
      wheelBodies[i].position.copy(t.position);
      wheelBodies[i].quaternion.copy(t.quaternion);
    }
  }
  carNavigation(car, map) {
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
  }
  navigateSphereAvatar(map) {
    const force = 250;
    const appliedForce = [0, 0, 0];
    if (map.ArrowUp) appliedForce[2] = appliedForce[2] - force;
    if (map.ArrowRight) appliedForce[0] = appliedForce[0] + force;
    if (map.ArrowDown) appliedForce[2] = appliedForce[2] + force;
    if (map.ArrowLeft) appliedForce[0] = appliedForce[0] - force;
    return new CANNON.Vec3(...appliedForce);
  }
  turnAvatar(map) {
    let direction = [0, 0, 0];
    // if (map.ArrowUp) direction[2] = 1;
    // if (map.ArrowRight) direction[0] = 1;
    // if (map.ArrowDown) direction[2] = -1;
    // if (map.ArrowLeft) direction[0] = -1;
    // if (map.ArrowUp) direction[1] += 1;
    if (map.ArrowRight) direction[1] += 1;
    if (map.ArrowDown) direction[1] += 2;
    if (map.ArrowLeft) direction[1] += 3;
    return direction;
  }
}
module.exports = Physics;
// const physics = new Physics();
// console.log(physics.world);
// const car = physics.createCar(0.7);
// car.addToWorld(physics.world);
// let wheels = physics.createWheelBodies(car);
// console.log(wheels);
//
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
