
import './App.css';
import { CentripetalForce, ExplicitEulerSim, Gravity, SemiImplicitEulerSim, Simulation, VelocityVerletSim, VerletSim, createCelestialBody, createGravity, createState, createVector3, createVelocityVerletSim } from './celestial';
import { Universe } from './celestial/Universe';

function run(divId: string) {
  let g = 1;

  let force = createGravity(g);
  let sim = createVelocityVerletSim(force);

  let a = createCelestialBody(
    "a",
    1,
    createVector3(-0.97000436, 0.24308753, 0),
  createVector3(0.466203685, 0.43236573, 0),
  createVector3(0, 0, 0)
  );

  let b = createCelestialBody(
    "b",
    1,
  createVector3(0.97000436, -0.24308753, 0),
  createVector3(0.466203685, 0.43236573, 0),
  createVector3(0, 0, 0)
  );

  let c = createCelestialBody(
    "c",
    1,
  createVector3(0, 0, 0),
  createVector3(-2 * 0.466203685, -2 * 0.43236573, 0),
  createVector3(0, 0, 0)
  );

  let state = createState([a, b, c]);

  let universe: Universe = new Universe(undefined, state, 'rgba(112, 185, 177, 1)', sim);
  let universe2: Universe = new Universe(undefined, state.clone(), 'rgba(254, 209, 106, 1)', new VerletSim(force));
  let universe3: Universe = new Universe(undefined, state.clone(), 'rgba(254, 120, 116, 1)', new ExplicitEulerSim(force));
  let universe4: Universe = new Universe(undefined, state.clone(), 'rgba(255, 245, 224, 1)', new SemiImplicitEulerSim(force));
  let simulation = new Simulation([universe, universe2, universe3, universe4], "a");

  simulation.play("scatter", divId);
}

function App() {

  return (
      <div style={ {overflow: 'hidden', width: '100vw', height: "100vh", backgroundColor: 'black'}}>
    <div className='container' style={ {width: '1400px', height: "800px", backgroundColor: 'black'}}>
      <div id="demo-canvas" style={ { width: "100%", height: "100%"}} ref={() => run("demo-canvas")}>
      </div>
    </div>
      </div>
  );
}

export default App;
