import * as Dynamics from './dynamics.js';
import * as Geometry from './geometry.js';
import * as Simulation from './simulate.js';
import Vector from './vector.js';

export class Animation {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.world = new Simulation.World(this.ctx, true);

        this.world.addBody(new Dynamics.StaticBody(
            new Vector(canvas.width/2, 0), 
            new Geometry.Box(canvas.width, 10, new Vector(0, 0))
        ));
        
        this.world.addBody(new Dynamics.StaticBody(
            new Vector(canvas.width/2, canvas.height), 
            new Geometry.Box(canvas.width, 10, new Vector(0, 0))
        ));
        
        this.world.addBody(new Dynamics.StaticBody(
            new Vector(0, canvas.height/2), 
            new Geometry.Box(10, canvas.height, new Vector(0, 0))
        ));
        
        this.world.addBody(new Dynamics.StaticBody(
            new Vector(canvas.width, canvas.height/2), 
            new Geometry.Box(10, canvas.height, new Vector(0, 0))
        ));

        this.world.addBody(new Dynamics.DynamicBody(
            new Vector(canvas.width/2, canvas.height/2),
            new Vector(0, 100),
            new Geometry.Circle(100),
            new Dynamics.Material(1)
        ));

        for(var i = 0; i < 20; i++) {
            const d = Math.min(canvas.width, canvas.height)/2;
            const [dx, dy] = [Math.random()*2*d-d, Math.random()*2*d-d];
            const v = 100;
            const [vx, vy] = [Math.random()*2*v-v, Math.random()*2*v-v];
            const r = 25 + Math.random() * 25;
            this.world.addBody(new Dynamics.DynamicBody(
                new Vector(canvas.width/2 + dx, canvas.height/2 + dy),
                new Vector(vx, vy),
                new Geometry.Circle(r),
                new Dynamics.Material(1)
            ));
        }
    }

    update(t) {
        if (t == undefined) t = performance.now();
        t /= 1000;  // scale time to seconds

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.world.update(t);
        this.world.render(t);
    }

    run(t) {
        this.update(t);
        requestAnimationFrame(t => this.run(t));
    }

}