import { Force } from './Force';
import { State } from './State';
import type { CelestialBody } from './CelestialBody';
import { Vector3 } from 'three';
import type { SimulateFunction } from './SimulateFunction';

export class Gravity implements Force {
  readonly G: number;

  constructor(G: number = 6.674e-11) {
    this.G = G;
  }

  getForces(bodies: CelestialBody[]): Vector3[] {
    let n = bodies.length;
    let ans: Vector3[] = [];
    for (let i = 0; i < n; i++) {
      ans.push(new Vector3(0, 0, 0));
    }
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let currForce = this.calcNewtonian(bodies[i], bodies[j]);
        ans[i].add(currForce);
        ans[j].sub(currForce);
      }
    }
    return ans;
  }

  calcNewtonian(a: CelestialBody, b: CelestialBody): Vector3 {
    let distSq = a.position.distanceToSquared(b.position);
    let forceVal = (this.G * a.mass * b.mass) / distSq;
    return b.position
      .clone()
      .sub(a.position)
      .normalize()
      .multiplyScalar(forceVal);
  }
}

export class CentripetalForce implements Force {
  center: Vector3;

  constructor(center: Vector3 = new Vector3(0, 0, 0)) {
    this.center = center;
  }

  getForces(bodies: CelestialBody[]): Vector3[] {
    // TODO: mv^2/r sin or cos thetha?
    return bodies.map(body => {
      const directionVector = this.center.clone().sub(body.position);
      return directionVector.setLength((body.mass * body.velocity.lengthSq()) / directionVector.length())
    });
  }
}

export class CombinedForce implements Force {
  forces: Force[];

  constructor(forces: Force[]) {
    this.forces = forces;
  }

  getForces(bodies: CelestialBody[]): Vector3[] {
    const forceVal: Vector3[] = bodies.map(() => new Vector3(0, 0, 0));
    this.forces.forEach(force => {
      force.getForces(bodies).forEach((val, index) => forceVal[index].add(val));
    })
    return forceVal;
  }
}

export class VerletSim implements SimulateFunction {
  forceCalculator: Force;
  prevDeltaT: number | undefined = undefined;

  constructor(forceCalculator: Force) {
    this.forceCalculator = forceCalculator;
  }

  private fromOneState(currState: State, deltaT: number, forces: Vector3[]): State {
    let updatedBodies: CelestialBody[] = currState.bodies.map((body, index) => {
      const currAccel = forces[index].divideScalar(body.mass);
      const newPos = currAccel
        .clone()
        .multiplyScalar(deltaT / 2)
        .add(body.velocity)
        .multiplyScalar(deltaT)
        .add(body.position);
      return body.clone(newPos, this.verletVel(body.position, newPos, deltaT), currAccel);
    });

    this.prevDeltaT = deltaT;
    return new State(updatedBodies);
  }

  simulate(deltaT: number, currState: State, prevState?: State): State {
    if (deltaT <= 0) {
      return currState.clone();
    }

    let forces = this.forceCalculator.getForces(currState.bodies);
    if (forces.length !== currState.bodies.length) {
      console.error(`forces length !== number of bodies`);
      return currState.clone();
    }

    if (prevState === undefined) {
      return this.fromOneState(currState, deltaT, forces);
    }

    let updatedBodies: CelestialBody[] = currState.bodies.map((body, index) => {
      const currAccel = forces[index].divideScalar(body.mass);
      const newPos = this.verletPos(prevState.bodies[index].position, body.position, currAccel, deltaT);
      return body.clone(newPos, this.verletVel(body.position, newPos, deltaT), currAccel);
    })

    this.prevDeltaT = deltaT;
    return new State(updatedBodies);
  }

  verletPos(oldPos: Vector3, currPos: Vector3, currAccel: Vector3, deltaT: number): Vector3 {
    const prevDT = this.prevDeltaT === undefined ? deltaT : this.prevDeltaT;

    return currAccel
      .clone()
      .multiplyScalar((prevDT + deltaT) / 2)
      .add(currPos.clone().sub(oldPos).divideScalar(prevDT))
      .multiplyScalar(deltaT)
      .add(currPos);
  }

  verletVel(currPos: Vector3, newPos: Vector3, deltaT: number): Vector3 {
    return newPos
      .clone()
      .sub(currPos)
      .divideScalar(deltaT);
  }
}

export class VelocityVerletSim implements SimulateFunction {
  forceCalculator: Force;

  constructor(forceCalculator: Force) {
    this.forceCalculator = forceCalculator;
  }

  simulate(deltaT: number, currState: State, prevState?: State): State {
    if (deltaT <= 0) {
      return currState.clone();
    }
    let n = currState.bodies.length;
    let updatedBodies: CelestialBody[] = [];
    for (let i = 0; i < n; i++) {
      let currBody = currState.bodies[i].clone();
      currBody.position = this.calcNewPos(
        currBody.position, currBody.velocity, currBody.acceleration, deltaT,
      );
      updatedBodies.push(currBody);
    }
    let newForces = this.forceCalculator.getForces(updatedBodies);
    let newState = new State(updatedBodies.map((currBody: CelestialBody, index: number, _: any) => {
      let newAccel = newForces[index]
        .divideScalar(currBody.mass);
      currBody.velocity
        .add(
          currBody
            .acceleration
            .add(newAccel)
            .multiplyScalar(deltaT / 2),
        );
      currBody.acceleration = newAccel;
      return currBody;
    }));
    return newState;
  }

  calcNewPos(currPos: Vector3, currVel: Vector3, currAccel: Vector3, deltaT: number): Vector3 {
    return currPos.clone()
      .add(currVel.clone()
        .multiplyScalar(deltaT))
      .add(currAccel.clone()
        .multiplyScalar(deltaT * deltaT * 0.5));
  }
}

export class ExplicitEulerSim implements SimulateFunction {
  force: Force;

  constructor(force: Force) {
    this.force = force;
  }

  simulate(deltaT: number, currState: State, prevState?: State | undefined): State {
    const newForces = this.force.getForces(currState.bodies);
    const updatedBodies = currState.bodies.map((body, index) => {
      return body.clone(
        this.rateUpdate(body.position, body.velocity, deltaT),
        this.rateUpdate(body.velocity, body.acceleration, deltaT),
        newForces[index].clone().divideScalar(body.mass)
      )
    });

    return new State(updatedBodies);
  }

  private rateUpdate(prev: Vector3, rate: Vector3, deltaT: number) {
    return rate
      .clone()
      .multiplyScalar(deltaT)
      .add(prev);
  }
}

export class SemiImplicitEulerSim implements SimulateFunction {
  force: Force;

  constructor(force: Force) {
    this.force = force;
  }

  simulate(deltaT: number, currState: State, prevState?: State | undefined): State {
    const newForces = this.force.getForces(currState.bodies);
    const updatedBodies = currState.bodies.map((body, index) => {
      const newVel = this.rateUpdate(body.velocity, body.acceleration, deltaT);
      return body.clone(
        this.rateUpdate(body.position, newVel, deltaT),
        newVel,
        newForces[index].clone().divideScalar(body.mass)
      )
    });

    return new State(updatedBodies);
  }

  private rateUpdate(prev: Vector3, rate: Vector3, deltaT: number) {
    return rate
      .clone()
      .multiplyScalar(deltaT)
      .add(prev);
  }
}

export class RungeKuttaSim implements SimulateFunction {
  simulate(deltaT: number, currState: State, prevState?: State | undefined): State {
    return new State([]);
  }
}

// export function createVerletSim(forceCalculator: Forces): SimulateFunction {
//   return new VerletSim(forceCalculator);
// }

export function createVelocityVerletSim(forceCalculator: Force): SimulateFunction {
  return new VelocityVerletSim(forceCalculator);
}

// export function createCircular(): Forces {
//   return new CircularForce();
// }

export function createGravity(G: number): Force {
  return new Gravity(G);
}
