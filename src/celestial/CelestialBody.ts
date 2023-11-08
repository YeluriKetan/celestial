import { Vector3 } from 'three';

export class CelestialBody {
  readonly label: string;
  readonly mass: number; // mean mass
  position: Vector3; // ICRF
  velocity: Vector3; // ICRF
  acceleration: Vector3; // ICRF

  constructor(
    label: string,
    mass: number,
    position: Vector3,
    velocity: Vector3,
    acceleration: Vector3
  ) {
    this.label = label;
    this.mass = mass;
    this.position = position;
    this.velocity = velocity;
    this.acceleration = acceleration;
  }

  clone(position?: Vector3,
    velocity?: Vector3,
    acceleration?: Vector3
  ): CelestialBody {
    return new CelestialBody(
      this.label,
      this.mass,
      position === undefined ? this.position.clone() : position,
      velocity === undefined ? this.velocity.clone() : velocity,
      acceleration === undefined ? this.acceleration.clone() : acceleration);
  }
}

export function createCelestialBody(id: string, mass: number, position: Vector3, velocity: Vector3, acceleration: Vector3): CelestialBody {
  return new CelestialBody(id, mass, position, velocity, acceleration);
}

export function createVector3(x: number, y: number, z: number): Vector3 {
  return new Vector3(x, y, z);
}
