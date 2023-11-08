import type { State } from './State';

export interface SimulateFunction {
  simulate(deltaT: number, currState: State, prevState?: State): State
}

class LambdaSim implements SimulateFunction {
  readonly fn: (deltaT: number, currState: State, prevState?: State) => State;

  constructor(fn: (deltaT: number, currState: State, prevState?: State) => State) {
    this.fn = fn;
  }

  simulate(deltaT: number, currState: State, prevState?: State): State {
    return this.fn(deltaT, currState, prevState);
  }
}

export function createSimFunction(fn: (deltaT: number, currState: State, prevState?: State) => State): SimulateFunction {
  return new LambdaSim(fn);
}
