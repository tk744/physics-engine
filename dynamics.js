import Vector from './vector.js';
import { Shape, Manifold } from './collision.js';

class RigidBody {
    constructor(shape, position) {
        this.position = position;
        this.shape = shape;
        this.density = 1;
        this.friction = 0;
        this.restitution = 1; // defines elasticity from 0-1.
    }

    set x(x) {
        this.position.x = x;
        this.moveShape();
    }

    get x() {
        return this.position.x;
    }

    set y(y) {
        this.position.y = y;
        this.moveShape();
    }

    get y() {
        return this.position.y;
    }

    set shape(shape) {
        this._shape = shape;
        this.moveShape();
    }

    get shape() {
        return this._shape;
    }

    get mass() {
        return this.density * this.shape.area;
    }

    get inv_mass() {
        if (this.mass == 0 || this.mass == Infinity) {
            return 0;
        }
        return 1 / this.mass;
    }

    moveShape() {
        this._shape = this.shape.translate(this.position);
    }

    /*  Use this method only if you do not need the resulting Manifold */
    intersects(other) {
        const manifold = new Manifold(this, other)
        return manifold.collision;
    }
}

export class StaticBody extends RigidBody {
    constructor(shape, position) {
        super(shape, position)
    }

    get mass() {
        return Infinity;
    }

    get velocity() {
        return Vector.ZERO;
    }
}

export class KinematicBody extends RigidBody {
    constructor(shape, position, velocity) {
        super(shape, position);
        this.velocity = velocity;
    }

    update() {
        this.position = this.position.add(this.velocity);
        this.moveShape();
    }

    get momentum() {
        return this.mass * this.velocity;
    }
}

export class DynamicBody extends KinematicBody {
    constructor(shape, position, velocity) {
        super(shape, position, velocity);
        this.force = Vector.ZERO;
        this.persistentForce = Vector.ZERO;
        this.impulse = Vector.ZERO;
        this.impulseCorrection = Vector.ZERO;

        this.lifetimeCollisions = 0;
    }

    get acceleration() {
        return this.force.add(this.persistentForce).scale(this.inv_mass)
    }

    update() {
        if (this.impulse.magnitude > 0) {
            this.velocity = this.velocity.add(this.impulse.scale(this.inv_mass));
            this.impulse = Vector.ZERO;
        }

        if (this.acceleration.magnitude > 0) {
            this.velocity = this.velocity.add(this.acceleration)
            this.force = Vector.ZERO;
        }

        this.position = this.position.add(this.velocity);
        this.position = this.position.add(this.impulseCorrection)
        this.moveShape();

       // this.applyForce(this.velocity.scale(-1)); // <-- drag force
       // this.applyForce(new Vector(0, 300));       // <-- gravity force
    }

    applyForce(force, persistent=false) {
        if (persistent) {
            this.persistentForce = this.persistentForce.add(force)
        }
        else {
            this.force = this.force.add(force);
        }
    }

    impulseResolution(other, manifold=undefined) {
        if (manifold == undefined) {
            manifold = new Manifold(this.shape, other.shape);
        }

        if (manifold.collision) {
            // calculate relative velocity in terms of the collision direction
            const relativeVelocity = other.velocity.subtract(this.velocity)
            const collisionSpeed = relativeVelocity.dot(manifold.normal)

            // only resolve if bodies are approaching
            if (collisionSpeed >= 0) {
                const e = Math.min(this.restitution, other.restitution);
                const j = ((1+e) * collisionSpeed) / (this.inv_mass + other.inv_mass);
                
                const impulse = manifold.normal.scale(j);
                this.impulse = this.impulse.add(impulse)

                const correctionPercent = 0.2;
                const slop = 0.01;
                this.impulseCorrection = manifold.normal.scale(Math.max(manifold.penetration - slop, 0) * correctionPercent * this.inv_mass / (this.inv_mass + other.inv_mass))

                this.lifetimeCollisions++;
            }
        }
    }
}