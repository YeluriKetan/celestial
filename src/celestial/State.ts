import type { CelestialBody } from './CelestialBody';

export class State {
  readonly bodies: CelestialBody[];

  constructor(bodies: CelestialBody[]) {
    this.bodies = bodies;
  }

  clone(): State {
    return new State(this.bodies.map((body) => body.clone()))
  }
}

export function createState(bodies: CelestialBody[]): State {
  return new State(bodies);
}
