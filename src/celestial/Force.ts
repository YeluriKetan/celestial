import type { Vector3 } from 'three';
import type { CelestialBody } from './CelestialBody';

export interface Force {
  getForces(bodies: CelestialBody[]): Vector3[]
}

class LambdaForce implements Force {
  readonly fn: (bodies: CelestialBody[]) => Vector3[];

  constructor(fn: (bodies: CelestialBody[]) => Vector3[]) {
    this.fn = fn;
  }

  getForces(bodies: CelestialBody[]): Vector3[] {
    return this.fn(bodies);
  }
}

export function createForce(fn: (bodies: CelestialBody[]) => Vector3[]): Force {
  return new LambdaForce(fn);
}
