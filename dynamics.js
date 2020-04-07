import Vector from './vector.js';
import { getManifold } from './geometry.js'

export class Material {
    constructor(restitution=1, friction=0, density=1) {
        this.restitution = restitution;
        this.friction = friction;
        this.density = density;
    }
}

export class Body {
    constructor(position, velocity, shape, material=new Material()) {
        this.position   = position;
        this.velocity   = velocity;
        this.shape      = shape;
        this.material   = material;
        this.collisionHandlers = [];
    
        this.shape.relocate(this.position);
        this.hitboxColor = 'magenta';
        this.velocityColor = 'blue';
    }

    get mass() {
        return this.material.density * this.shape.area;
    }

    get inv_mass() {
        if (this.mass == 0 || this.mass == Infinity) {
            return 0;
        }
        else {
            return 1 / this.mass;
        }
    }
    
    /**
     * @param {Vector} vector the vector to add to the current position.
     */
    translate(vector) {
        this.position = this.position.add(vector);
        this.shape.relocate(this.position);
    }

    /**
     * Update the position of this body.
     * @param {number} dt change in time.
     */
    update(dt=1) {
        this.translate(this.velocity.scale(dt));
    }

    /**
     * @param {(other: Body) => void } handler called after resloving a collision with another body.
     */
    addCollisionHandler(handler) {
        this.collisionHandlers.push(handler);
    }

    /**
     * Draws the hitbox and velocity vector onto the canvas.
     * @param {*} ctx the canvas drawing context.
     */
    trace(ctx) {
        // draw hitbox
        ctx.beginPath();
        this.shape.createPath(ctx);
        ctx.strokeStyle = this.hitboxColor;
        ctx.stroke();

        // draw velocity vector
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(this.position.x + this.velocity.x * 20, this.position.y + this.velocity.y * 20);
        ctx.strokeStyle = this.velocityColor;
        ctx.stroke();
    }

    /**
     * Renders the body onto the canvas.
     * @param {*} ctx the canvas drawing context.
     */
    draw(ctx) {
        return
    }
}

/**
 * A stationary body that does not react to collisions.
 */
export class StaticBody extends Body {
    constructor(position, shape, material=new Material()) {
        super(position, Vector.ZERO, shape, material);
    }

    get mass() {
        return Infinity;
    }
}

/**
 * A moving body that does not react to collisions.
 */
export class KinematicBody extends Body {
    constructor(position, velocity, shape, material=new Material()) {
        super(position, velocity, shape, material);
    }
}

/**
 * A body that reacts to forces and collisions with all bodies.
 */
export class DynamicBody extends Body {
    constructor(position, velocity, shape, material=new Material()) {
        super(position, velocity, shape, material);
        this.impulse = Vector.ZERO;
        this.force = Vector.ZERO;

        this.accelerationColor = 'green';
    }

    get acceleration() {
        return this.force.scale(this.inv_mass);
    }

    /**
     * @param {*} vector the force vector to apply.
     */
    addForce(vector) {
        this.force = this.force.add(vector);
    }

    /**
     * @param {*} vector the impulse vector to apply.
     */
    addImpulse(vector) {
        this.impulse = this.impulse.add(vector);
    }

    /**
     * Update the position of this body.
     * @param {number} dt change in time.
     */
    update(dt=1) {
        this.velocity = this.velocity.add(this.impulse.scale(this.inv_mass));
        this.velocity = this.velocity.add(this.acceleration.scale(dt));
        
        this.translate(this.velocity.scale(dt));

        this.impulse = Vector.ZERO;
        this.force = Vector.ZERO;
    }

    /**
     * Draws the hitbox, velocity vector, and acceleration vector onto the canvas.
     * @param {*} ctx the canvas drawing context.
     */
    trace(ctx) {
        super.trace(ctx);

        // draw acceleration vector
        ctx.beginPath();
        ctx.moveTo(this.position.x, this.position.y);
        ctx.lineTo(this.position.x + this.acceleration.x * 20, this.position.y + this.acceleration.y * 20);
        ctx.strokeStyle = this.accelerationColor;
        ctx.stroke();
    }
}

/**
 * An object that can detect and resolve collisions between bodies.
 */
export class Collision {
    constructor(a, b) {
        this.a = a, this.b = b;
    }

    /**
     * @return {boolean} whether a valid collision occured between the bodies.
     */
    detect() {
        // only dynamic bodies can collide
        if (! (this.a instanceof DynamicBody || this.b instanceof DynamicBody)) {
            return false;
        }

        // computes contact manifold
        if (this.manifold == undefined) {
            this.manifold = getManifold(this.a.shape, this.b.shape);
        }

        // returns whether there is penetration ;)
        return (this.manifold.magnitude > 0);
    }

    /**
     * Applies collision dynamics to the collided bodies using impulse resolution.
     * Calls any collision handlers associated with each body.
     */
    resolve() {
        if (! this.detect()) {
            return
        }
        // calculate relative velocity in terms of the collision direction
        const relativeVelocity = this.b.velocity.subtract(this.a.velocity)
        const collisionSpeed = relativeVelocity.dot(this.manifold.unit)

        // only resolve if bodies are approaching
        if (collisionSpeed > 0) {
            const e = Math.min(this.a.material.restitution, this.b.material.restitution);
            const j = ((1+e) * collisionSpeed) / (this.a.inv_mass + this.b.inv_mass);
            
            const impulse = this.manifold.unit.scale(j);

            // only add impulses to dynamic bodies
            if (this.a instanceof DynamicBody) {
                this.a.addImpulse(impulse);
            }
            if (this.b instanceof DynamicBody) {
                this.b.addImpulse(impulse.scale(-1));
            }

            // call collision handlers of both bodies
            this.a.collisionHandlers.forEach(f => f(this.b));
            this.b.collisionHandlers.forEach(f => f(this.a));
        }
    }
}

