import * as Dynamics from './dynamics.js';
import * as Geometry from './geometry.js';
import Vector from './vector.js';

class Layer {
    constructor() {
        this.id = Layer.unique;
    }

    static get unique() {
        return 0; //todo
    }
}

export class World {
    constructor(ctx, debug=false) {
        this.ctx = ctx;
        this.debug = debug;

        this.staticBodies = [];
        this.kinematicBodies = [];
        this.dynamicBodies = [];
    }

    get allBodies() {
        return this.staticBodies.concat(this.kinematicBodies).concat(this.dynamicBodies);
    }

    /**
     * Add a new body to the world.
     * @param {Dynamics.Body} body
     */
    addBody(body) {
        if (body instanceof Dynamics.DynamicBody) {
            this.dynamicBodies.push(body);
        }
        else if (body instanceof Dynamics.StaticBody) {
            this.staticBodies.push(body);
        }
        else {
            this.kinematicBodies.push(body);
        }
    }

    /**
     * Collects all pairs of bodies that are close enough to collide.
     * Note that this list may have false positives but never false negatives.
     * @returns {Body[][]} a list of pairs of bodies that could potentially collide.
     */
    broadPhaseCollision() {
        const pairs = [];
        for (let i = 0; i < this.allBodies.length; i++) {
            for (let j = i+1; j < this.allBodies.length; j++) {
                const a = this.allBodies[i], b = this.allBodies[j];
                if (a instanceof Dynamics.DynamicBody || b instanceof Dynamics.DynamicBody) {
                    pairs.push([a, b]);
                }
            }
        }
        return pairs;
    }

    /**
     * Brute force resolves the collisions between all pairs of bodies in a list.
     * @param {Body[][]} bodyPairs
     */
    narrowPhaseCollision(bodyPairs) {
        bodyPairs.forEach(pair => {
            const a = pair[0], b = pair[1];
            const collision = new Dynamics.Collision(a, b);
            if (collision.detect()) {
                collision.resolve();
                console.log('COLLISION!')
            }
        });
    }

    /**
     * Detects and resolves every dynamic collision.
     */
    resolveCollisions() {
        this.narrowPhaseCollision(this.broadPhaseCollision());
    }

    /**
     * Steps the simulation time forward.
     * @param {Number} t still deciding what this means
     */
    step(t) {
        this.resolveCollisions();
        this.kinematicBodies.forEach(e => e.update());
        this.dynamicBodies.forEach(e => e.update());

        // gravity
      //  this.dynamicBodies.forEach(e => e.addForce(new Vector(0, 0.15).scale(e.mass)));
    }

    /**
     * Renders every body onto the cavnas using their `.draw()` method.
     * @param {Number} t still deciding what this means
     */
    render(t) {
        this.ctx.clearRect(0, 0, 500, 500);
        this.allBodies.forEach(e => {
            e.draw(this.ctx);
            if (this.debug) {
                e.trace(this.ctx);
            }
        });
    }

    run(t) {
        this.step(t);
        this.render(t);
        requestAnimationFrame(t => this.run(t));
    }
}