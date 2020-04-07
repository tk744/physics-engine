import * as Dynamics from './dynamics.js';
import * as Geometry from './geometry.js';
import * as Simulation from './simulate.js';
import Vector from './vector.js';

const canvas = document.getElementById('physicsCanvas');
const ctx = canvas.getContext('2d');

const world = new Simulation.World(ctx, true);

world.addBody(new Dynamics.StaticBody(
    new Vector(250, 0), 
    new Geometry.Box(500, 10, new Vector(0, 5))
));

world.addBody(new Dynamics.StaticBody(
    new Vector(250, 500), 
    new Geometry.Box(500, 10, new Vector(0, -5))
));

world.addBody(new Dynamics.StaticBody(
    new Vector(0, 250), 
    new Geometry.Box(10, 500, new Vector(5, 0))
));

world.addBody(new Dynamics.StaticBody(
    new Vector(500, 250), 
    new Geometry.Box(10, 500, new Vector(-5, 0))
));

world.addBody(new Dynamics.DynamicBody(
    new Vector(100, 100),
    new Vector(1, 1),
    new Geometry.Circle(50),
    new Dynamics.Material(1)
));

world.addBody(new Dynamics.DynamicBody(
    new Vector(400, 120),
    new Vector(-1, 2),
    new Geometry.Circle(30),
    new Dynamics.Material(1)
));

world.addBody(new Dynamics.DynamicBody(
    new Vector(200, 350),
    new Vector(1, 2),
    new Geometry.Circle(70),
    new Dynamics.Material(1)
));

world.run();