import { SimulateFunction } from "./SimulateFunction";
import { State } from "./State";

export class Universe {
  prevState: State | undefined;
  currState: State;
  color: string | string[];
  simFunc: SimulateFunction;

  constructor(prevState: State | undefined, currState: State, color: string | string[], simFunc: SimulateFunction) {
    this.prevState = prevState;
    this.currState = currState;
    this.color = color;
    this.simFunc = simFunc;
  }

  simulateStep(deltaT: number) {
    const newState = this.simFunc.simulate(deltaT, this.currState, this.prevState);
    this.prevState = this.currState;
    this.currState = newState;
  }

  clone(): Universe {
    return new Universe(
      this.prevState === undefined ? undefined : this.prevState.clone(),
      this.currState.clone(),
      this.color,
      this.simFunc);
  }
}