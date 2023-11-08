import Plotly, { type SliderStep, type Layout, Data, PlotType } from 'plotly.js-dist';
import { Universe } from './Universe';

let animationId: number | null = null;

interface Visualizer {
  play(divId: string, type: PlotType): void;

  pause(): void;

  stop(): void;
}

class RealTimeVisualizer implements Visualizer {
  simulation: Simulation;
  divId: string = '';
  type: string | PlotType = '';
  readonly speeds = [0, 0.5, 1, 2, 4, 10, 100];
  playing: boolean = false;

  constructor(simulation: Simulation) {
    this.simulation = simulation;
  }

  play(divId: string, type: string | PlotType) {
    this.divId = divId;
    this.type = type;
    this.playing = true;

    const steps: Partial<SliderStep>[] = this.speeds.map((speed: number): Partial<SliderStep> => {
      return {
        label: speed.toString(),
        method: 'skip',
      };
    });
    const init_data: Data[] = this.simulation.universes.map((uni: Universe): Data => {
      return {
        x: uni.currState.bodies.map(body => body.position.x),
        y: uni.currState.bodies.map(body => body.position.y),
        z: uni.currState.bodies.map(body => body.position.z),
        type: type as PlotType,
        mode: 'markers',
        marker: {
          color: uni.color,
          sizemin: 6,
          size: uni.currState.bodies.map((body) => Math.min(10, body.mass))
        },
      }
    });

    const layout: Partial<Layout> = {
      paper_bgcolor: '#000000',
      plot_bgcolor: '#000000',
      font: {
        color: '#bfbfbf',
      },
      scene: {
        aspectmode: 'cube',
        xaxis: {
          showticklabels: false,
          tickmode: 'auto',
          nticks: 6,
          // range: [-1e13, 1e13],
          // autorange: false,
          color: 'rgba(255, 255, 255 , 0.6)',
        },
        yaxis: {
          showticklabels: false,
          tickmode: 'auto',
          nticks: 6,
          // range: [-1e13, 1e13],
          // autorange: false,
          // rangemode: 'normal',
          color: 'rgba(255, 255, 255 , 0.6)',
        },
          zaxis: {
          showticklabels: false,
          tickmode: 'auto',
          nticks: 5,
          // range: [-1e13, 1e13],
          // autorange: false,
          // rangemode: 'normal',
          color: 'rgba(255, 255, 255 , 0.6)',
        },
        bgcolor: '#000000',
      },
      uirevision: 'true',
      sliders: [{
        steps,
        active: 0,
      }],
    };

    Plotly.newPlot(
      divId,
      init_data,
      layout,
    );

    const framesPerSecond = 60;
    const timePerFrameMs = 1000 / framesPerSecond;
    if (animationId != null) return;
    let lastPaintTimestampMs = 0;
    let speed = 0

    const paint = (timestampMs: number) => {
      speed = this.speeds[parseInt(
        // @ts-ignore
        document.getElementById(divId)?.layout?.sliders[0].active,
      )];

      if (!this.playing) {
        return;
      }

      if (speed === 0
        || timestampMs - lastPaintTimestampMs < timePerFrameMs
        ) {
        animationId = requestAnimationFrame(paint);
        return;
      }
      lastPaintTimestampMs = timestampMs;

      const new_data = this.simulation.universes.map((uni: Universe) => {
        return {
          x: uni.currState.bodies.map(body => body.position.x),
          y: uni.currState.bodies.map(body => body.position.y),
          z: uni.currState.bodies.map(body => body.position.z),
          hovertext: uni.currState.bodies.map(body => body.label),
          color: uni.color,
          marker: {
            size: uni.currState.bodies.map((body) => Math.min(10, body.mass)),
          },
        }
      });

      // @ts-ignore
      Plotly.animate(
        divId,
        {
          data: new_data,
        },
        {
          transition: {
            duration: 0,
          },
          frame: {
            duration: 0,
            redraw: false,
          },
        },
      );

      animationId = requestAnimationFrame(paint);
    }

    // let lastSimTimestampsMs = performance.now();

    // let isTabActive;
    // window.onfocus = function () { 
    //   isTabActive = true; 
    // }; 
    // window.onblur = function () { 
    //   isTabActive = false; 
    // };

    let stepIntervalID: number = -1;

    const step = () => {
      if (!this.playing) {
        clearInterval(stepIntervalID);
        return;
      }

      // const currSimTimestampMs = performance.now();
      if (speed !== 0) {
        // lastSimTimestampsMs = currSimTimestampMs;
        
        // const duration = currSimTimestampMs - lastSimTimestampsMs;
        this.simulation.simulateStep(0.01 * speed);
        // lastSimTimestampsMs = currSimTimestampMs;
        console.log(`stepping ${Math.floor(performance.now() / 1000)}`)
      }
    }

    requestAnimationFrame(paint);
    stepIntervalID = window.setInterval(step, 10);
  }

  pause(): void {
    this.playing = false;
  }

  stop(): void {
    this.playing = false;
    Plotly.purge(this.divId);
    this.divId = '';
    this.type = '';
  }
}

export class Simulation {
  visualizer: Visualizer;
  universes: Universe[];

  constructor(universes: Universe | Universe[], visType: string) {
    this.universes = Array.isArray(universes) ? universes : [universes];
    this.visualizer = new RealTimeVisualizer(this);
  }

  simulateStep(deltaT: number) {
    this.universes.forEach((universe) => universe.simulateStep(deltaT))
  }

  play(type: string, divId: string) {
    this.visualizer.play(
      divId,
      // @ts-ignore
      type
    );
  }

  pause(): void {
    console.log("pausing");
    this.visualizer.pause();
  }

  stop(): void {
    this.visualizer.stop();
  }
}

// export class MultiSimulation {
//   visualizer: Visualizer;
//   universes: Universe[];

//   constructor(universes: Universe[], visType: string) {
//     this.universes = universes;
//     this.visualizer = new RealTimeVisualizer(this);
//   }

//   simulateStep(deltaT: number) {
//     this.universes.forEach((universe) => universe.simulateStep(deltaT))
//   }



//   play(type: string, divId: string) {
//     this.visualizer.visualize(
//       divId,
//       // @ts-ignore
//       type,
//       this,
//     );
//   }
// }