import Vector from './vector.js';
import { StaticBody, DynamicBody } from './dynamics.js';
import { Shape, Circle, Rect, Manifold } from './collision.js';

const canvas = document.getElementById('physicsCanvas');
const ctx = canvas.getContext('2d');

const random = (min, max) => {
    return Math.random() * (max - min) + min;
}

class Ball extends DynamicBody {
    constructor(maxRadius, maxVelocity) {
        const randomRad = () => { return Math.random() * maxRadius }
        const randomPos = () => { return Math.random() * (500 - 2*maxRadius) + maxRadius }
        const randomVel = () => { return Math.random() * (2*maxVelocity) - maxVelocity }

        const shape = new Circle(randomRad())
        const position = new Vector(randomPos(), randomPos())
        const velocity = new Vector(randomVel(), randomVel())
        super(shape, position, velocity)

        this.color = 'black'
    }

    update() {
        super.update();

        // handling wall collisions
        if (this.shape.x - this.shape.r < 0) {
            this.x = this.shape.r;
            this.velocity.x *= this.restitution * Math.sign(this.velocity.x) < 0 ? -1 : 1;
        }
        else if (this.shape.x + this.shape.r > canvas.width) {
            this.x = canvas.width - this.shape.r;
            this.velocity.x *= this.restitution * Math.sign(this.velocity.x) > 0 ? -1 : 1;
        }
        if (this.shape.y - this.shape.r < 0) {
            this.y = this.shape.r;
            this.velocity.y *= this.restitution * Math.sign(this.velocity.y) < 0 ? -1 : 1;
        }
        else if (this.shape.y + this.shape.r > canvas.height) {
            this.y = canvas.width - this.shape.r;
            this.velocity.y *= this.restitution * Math.sign(this.velocity.y) > 0 ? -1 : 1;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.shape.x, this.shape.y, this.shape.r, 0, 2*Math.PI);
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.stroke();
    }
}

class Box extends DynamicBody {
    constructor(size, maxVelocity) {
        const randomLen = () => { return Math.random() *  size/2 + size/2 }
        const randomPos = () => { return Math.random() *  (500 - 2*size) + size }
        const randomVel = () => { return Math.random() *  (2*maxVelocity) - maxVelocity }

        const shape = new Rect(randomLen(), randomLen())
        const position = new Vector(randomPos(), randomPos())
        const velocity = new Vector(randomVel(), randomVel())
        super(shape, position, velocity)

        this.color = 'black'
    }

    update() {
        super.update();

        // handling wall collisions
        if (this.shape.min.x < 0) {
            this.x = this.shape.w/2;
            this.velocity.x *= this.restitution * Math.sign(this.velocity.x) < 0 ? -1 : 1;
        }
        else if (this.shape.max.x > canvas.width) {
            this.x = canvas.width - this.shape.w/2;
            this.velocity.x *= this.restitution * Math.sign(this.velocity.x) > 0 ? -1 : 1;
        }
        if (this.shape.min.y < 0) {
            this.y = this.shape.h/2;
            this.velocity.y *= this.restitution * Math.sign(this.velocity.y) < 0 ? -1 : 1;
        }
        else if (this.shape.max.y > canvas.height) {
            this.y = canvas.height - this.shape.h/2;
            this.velocity.y *= this.restitution * Math.sign(this.velocity.y) > 0 ? -1 : 1;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.rect(this.shape.min.x, this.shape.min.y, this.shape.w, this.shape.h);
        ctx.fillStyle = this.color;
        ctx.strokeStyle = this.color;
        ctx.stroke();
    }
}

const demo1 = () => {
    const balls = 20;
    const boxes = 15;

    const sBodies = [], dBodies = [];

    for(let i = 0; i < balls; i++) {
        dBodies.push(new Ball(25, 1))
    }
    for(let i = 0; i < boxes; i++) {
        dBodies.push(new Box(50, 1))
    }

    const obstacle = new StaticBody(new Rect(50, 200), new Vector(250, 250));
    obstacle.impulseResolution = () => { return; }
    obstacle.draw = () => {
        ctx.fillStyle = 'black';
        ctx.fillRect(obstacle.shape.min.x, obstacle.shape.min.y, obstacle.shape.w, obstacle.shape.h); 
    }
    sBodies.push(obstacle)

    const allBodies = dBodies.concat(sBodies);
    console.log(allBodies)

  //  dBodies.map(e => e.applyForce(new Vector(0, 400), true))

    const collisionHandler = () => {
        for (let i = 0; i < dBodies.length; i++) {
            const a = dBodies[i];
            a.color = 'blue';

            for (let j = 0; j < allBodies.length; j++) {
                if (i == j) { continue; }

                const b = allBodies[j]
                const m = new Manifold(a.shape, b.shape);

                if (m.collision) {
                    // resolve collision
                    a.color = 'red';
                    a.impulseResolution(b);

                    // draw collision vector
                    ctx.moveTo(a.shape.x, a.shape.y)
                    ctx.lineTo(a.shape.x + m.normal.x * 20 * m.penetration, a.shape.y + m.normal.y * 20 * m.penetration)
                    
                    ctx.stroke()
                }
            }
        }
    }

    const run = (t) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        collisionHandler();
        dBodies.map(e => { e.update(); });
        allBodies.map(e => { e.draw(); });
        requestAnimationFrame(run);
    }

    run();

}

const demo2 = () => {
    const dBodies = [
        new Box(200, new Vector(200, 200), new Vector(1, 1)),
        new Ball(200, new Vector(130, 380), new Vector(-1, -1))
    ]

    const collisionHandler = () => {
        for (let i = 0; i < dBodies.length; i++) {
            const a = dBodies[i];
            a.color = 'green';

            for (let j = 0; j < allBodies.length; j++) {
                const b = allBodies[j];
                if (i == j) { continue; }

                const m = new Manifold(a.shape, b.shape);

                if (m.collision) {
                    // resolve collision
                    a.color = 'red';
                    a.impulseResolution(b, m);

                    // draw collision vector
                    ctx.strokeStyle = 'magenta'
                    ctx.moveTo(a.shape.x, a.shape.y)
                    ctx.lineTo(a.shape.x + m.normal.x*100, a.shape.y + 100*m.normal.y)
                    ctx.stroke()
                }
            }
        }
    }

    const run = (t) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        collisionHandler();
        dBodies.map(e => { e.draw(); });
       // requestAnimationFrame(run);
    }

    run();


}

demo1()