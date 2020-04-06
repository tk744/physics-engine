import Vector from "./vector.js";

const clamp = (x, min, max) => {
    if (x < min){
        x = min;
    }
    else if (x > max) {
        x = max;
    }
    return x;
}

export class Manifold {
    constructor(a, b) {
        this.collision = false;
        this.normal = Vector.ZERO;
        this.penetration = 0;

        if (a instanceof Point && b instanceof Point) {
            this.collision = (a.pos.subtract(b.pos).magnitude == 0)
        }
        else if (a instanceof Point && b instanceof Circle || a instanceof Circle && b instanceof Point) {
            const [p, c] = a instanceof Point ? [a, b] : [b, a];
            d = p.pos.subtract(c.pos)   // vector from circle to point
            if (d.magnitude <= c.r) {
                this.collision = true;
                this.normal = d;
                this.penetration = c.r - d.magnitude;
            }
        }

        if (a instanceof Circle && b instanceof Circle) {
            const r = a.r + b.r;                    // sum of radii
            const d = a.pos.distance(b.pos)   // distance between centers

            if (r >= d) {
                this.collision = true;
                this.penetration = r - d;
                if (d != 0) {
                    this.normal = a.pos.subtract(b.pos);
                }
                else { // center of circles at same location
                    this.normal = new Vector(Math.random(), Math.random());
                }
            }
        }
        else if (a instanceof Rect && b instanceof Rect) {
            const d = a.pos.subtract(b.pos)   // vector between centers
            const overlap = new Vector(a.w/2 + b.w/2 - Math.abs(d.x), a.h/2 + b.h/2 - Math.abs(d.y))
            
            if (overlap.x >=0 && overlap.y >= 0) {
                this.collision = true;
                if (overlap.x < overlap.y) {
                    this.penetration = overlap.x;
                    if (d.x > 0) {
                        this.normal = new Vector(1, 0);
                    }
                    else {
                        this.normal = new Vector(-1, 0);
                    }
                }
                else {
                    this.penetration = overlap.y;
                    if (d.y > 0) {
                        this.normal = new Vector(0, 1);
                    }
                    else {
                        this.normal = new Vector(0, -1);
                    }
                }
            }
        }
        else if (a instanceof Rect && b instanceof Circle || a instanceof Circle && b instanceof Rect) {
            const [r, c] = a instanceof Rect ? [a, b] : [b, a];
            const d = c.pos.subtract(r.pos)   // vector between centers
            // vector from center of rect to closest point on rect to center of circle
            let closest = new Vector(clamp(d.x, -r.w/2, r.w/2), clamp(d.y, -r.h/2, r.h/2))
            
            const inside = (d.subtract(closest).magnitude == 0);    // circle center inside rect

            if (inside) {
                if (Math.abs(d.x) > Math.abs(d.y)) {
                    closest.x = r.w/2 * Math.sign(closest.x)
                }
                else {
                    closest.y = r.h/2 * Math.sign(closest.y)
                }
            }

            // vector from center of circle to closest point on rect
            const normal = d.subtract(closest);
            if (normal.magnitude <= c.r || inside) {
                this.collision = true;
                this.normal = d.subtract(closest).scale((inside ? 1 : -1) * (a instanceof Rect ? 1 : -1));
                this.penetration = c.r - normal.magnitude;
            }
        }
        
    }

    set normal(vector) {
        this._normal = vector.unit;
    }

    get normal() {
        return this._normal;
    }

    set penetration(penetration) {
        this._penetration = penetration;
    }

    get penetration() {
        return this._penetration;
    }
}

export class Shape {
    constructor(x, y) { 
        this.offset = new Vector(x, y);     // relative coordinates
        this.pos = this.offset           // global coordinates
    }

    get area() {
        return 0;
    }

    get x() {
        return this.pos.x;
    }

    get y() {
        return this.pos.y
    }

    translate(position) {
        this.pos = position.add(this.offset);
        return this;
    }
}

export class Point extends Shape {
    constructor() {
        super(0, 0)
    }

    get area() {
        return 0;
    }
}

export class Circle extends Shape {
    constructor(radius, dx=0, dy=0) {
        super(dx, dy);
        this.r = radius;
    }

    get area() {
        return Math.PI * (this.r ** 2);
    }
}

export class Rect extends Shape {
    constructor(width, height, dx=0, dy=0) {
        super(dx, dy)
        this.w = width, this.h = height;
    }

    get area() {
        return (this.max.x - this.min.x) * (this.max.y - this.min.y);
    }

    get min() {
        return new Vector(this.x - this.w/2, this.y - this.h/2)
    }

    get max() {
        return new Vector(this.x + this.w/2, this.y + this.h/2)
    }
}

export class Line extends Shape {
    constructor(start, end) {
        const midpoint = end.subtract(start).scale(0.5).add(start);
        super(midpoint.x, midpoint.y)
    }

    get area() {
        return 0;
    }
}