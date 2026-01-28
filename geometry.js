const Position = {
    BEFORE: 0,
    AT_START: 1,
    INSIDE: 2,
    AT_END: 3,
    AFTER: 4
};
const EPSILON_EQUALS = 0.01;

class Point {
    constructor(x, y) {
        this._x = x;
        this._y = y;
    }
    get x() { return this._x; }
    get y() { return this._y; }

    right_of(edge) {
        let v2 = Vector.from_points(edge.v1, this);
        return edge.vector.scalar_product(v2) <= 0;
    }

    relative_position(edge) {
        // Position of this point relative to the specified edge

        // Is `this` on one of the points of the edge?
        let p1 = edge.v1;
        if ((p1.x < this.x + EPSILON_EQUALS) && (this.x < p1.x + EPSILON_EQUALS)) {
            return Position.AT_START;
        }
        let p2 = edge.v2;
        if ((p2.x < this.x + EPSILON_EQUALS) && (this.x < p2.x + EPSILON_EQUALS)) {
            return Position.AT_END;
        }

        // By default, uses `x` for comparison but will use `y` if `x`s are equal.
        let pos1 = p1.x;
        let pos2 = p2.x;
        let pos = this.x;
        if (pos1 == pos2) {
            pos1 = p1.y;
            pos2 = p2.y;
            pos = this.y;
        }
        if (pos1 > pos2) {
            // Negate all positions.  The result is unchanged, but now pos1 < pos2
            pos1 = - pos1;
            pos2 = - pos2;
            pos = - pos;
        }
        if (pos < pos1) { return Position.BEFORE; }
        if (pos > pos2) { return Position.AFTER; }

        return Position.INSIDE;
    }

    static distance(p1, p2) {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return Math.sqrt((dx * dx) + (dy * dy));
    }
}

class Vertex extends Point {
    constructor(p) {
        super(p.x, p.y);
        this._out = [];
        this._in = [];
    }
    get out() { return this._out; }
    get in() { return this._in; }
    add_out(e) { this._out.push(e); }
    add_in(e) { this._in.push(e); }
}

class Vector {
    constructor(dx, dy) {
        this._dx = dx;
        this._dy = dy;
    }
    static from_points(p1, p2) {
        const result = new Vector(p2.x - p1.x, p2.y - p1.y);
        result.normalise();
        return result;
    }
    get dx() { return this._dx; }
    get dy() { return this._dy; }

    normalise() {
        const distance = Math.sqrt((this._dx * this._dx) + (this._dy * this._dy));
        this._dx = this._dx / distance;
        this._dy = this._dy / distance;
    }

    scalar_product(v) {
        return (this._dx * v._dy) - (this._dy * v._dx);
    }

    translate(point) {
        return new Point(point.x + this.dx, point.y + this.dy);
    }

    static sin(v1, v2) {
        // Assumes normalised vectors!
        return (v1.dx * v2.dy) - (v2.dx * v1.dy);
    }

    get to_html() {
        return "&lt;" + this.dx + "," + this.dy + "&gt;";
    }
}

class Line {
    // y = a + b * x
    constructor(point1, point2) {
        // (1) y1 = a + (b * x1)
        // (2) y2 = a + (b * x2)
        // => a = y1 - (b * x1) = y2 - (b * x2)
        // => b = (y2 - y1) / (x2 - x1)
        this._b = (point2.y - point1.y) / (point2.x - point1.x);
        this._a = point1.y - (this._b * point1.x);
    }
    static intersection(line1, line2) {
        // return null if the lines are parallel.
        if (line1._b == line2._b) {
            return null;
        }
        // (1) y = a1 + (b1 * x)
        // (2) y = a2 + (b2 * x)
        // => 0 = (a1 - a2) + ((b1 - b2) * x)
        // => x = (a1 - a2) / (b2 - b1)
        const x = (line1._a - line2._a) / (line2._b - line1._b);
        const y = line1._a + (line1._b * x);
        return new Point(x, y);
    }
}

class Edge {
    constructor(v1, v2) {
        this._v1 = v1;
        this._v2 = v2;
        this._vector = Vector.from_points(v1, v2);
        this._vector.normalise();
        this._ortho = new Vector(-this._vector.dy, this._vector.dx);
        v1.add_out(this);
        v2.add_in(this);
        this._opposite = null; // The opposite edge
        this._poly = null; // The polygon on the right
        this._line = new Line(v1, v2);

        // checks if the opposite edge exists
        for (let i = 0; i < v1.in.length; i++) {
            const e = v1.in[i];
            if (e.v1 == v2) {
                this._opposite = e;
                e._opposite = this;
                break;
            }
        }
    }

    get v1() { return this._v1; }
    get v2() { return this._v2; }
    get vector() { return this._vector; }
    get poly() { return this._poly; }

    set_poly(p) { this._poly = p; }

    intersection(point, vector) {
        // Returns the intersection on the line represented by this edge
        // but that could be outside the edge.
        // Can return <null> if the edge and the vector are parallel

        if (this._v1.x == this._v2.x) { // vertical edge
            if (vector.dx == 0) {
                return null; // parallel
            }
            // return (x,y) such that, for some k,
            // - (1) x = point.x + k * vector.dx
            // - (2) y = point.y + k * vector.dy
            // - (3) x = this._v1.x
            // (1) and (3) => k = (this._v1.x - point.x) / vector.dx
            // and (2) => y = point.y + [(this._v1.x - point.x) / vector.dx] * vector.dy
            const x = this._v1.x;
            const y = point.y + [(x - point.x) / vector.dx] * vector.dy
            return new Point(x, y);
        }

        if (vector.dx == 0) {
            // TODO
        }
        const line = new Line(point, vector.translate(point));
        return Line.intersection(this._line, line);
    }

    through(incoming_vector) {
        // Assumes a normalised vector aimed at the edge!
        if (this._opposite == null) { return null; }

        let s = Vector.sin(this._ortho, incoming_vector);
        let s2 = s * this._poly.weight / this._opposite._poly.weight;
        if (s2 > 1) { return null; }
        if (s2 < -1) { return null; }

        let c2 = Math.sqrt(1 - (s2 * s2));

        return new Vector(
            -(c2 * this._vector.dy + s2 * this._ortho.dy),
            (c2 * this._vector.dx + s2 * this._ortho.dx)
        );
    }
}

class Polygon {
    constructor(vertices, weight) {
        this._weight = weight;
        this._edges = [];
        const nb_vertices = vertices.length;
        for (let i = 0; i < nb_vertices; i++) { // TODO: replace with forEach
            const v1 = vertices[i];
            const v2 = vertices[(i + 1) % nb_vertices];
            const e = new Edge(v1, v2);
            this._edges.push(e);
            e.set_poly(this);
        }
    }
    get weight() { return this._weight; }
    get nb_vertices() { return this._edges.length; }
    get edges() { return this._edges; }
    vertex(index) { return this._edges[index].v1; }
    contains(p) {
        for (let i = 0; i < this.nb_vertices; i++) {
            if (!p.right_of(this._edges[i])) {
                return false;
            }
        }
        return true;
    }
}

class Map {
    // Input:
    // - list of `k` vertices `[[x1,y1], ..., [xk,yk]]`
    // - list of `n` polygon description `[d1,...,dn]`
    // where a description is `[w, [i1,...,im]]` and `w` is the weight and `[i1,...,im]` are indices of the `m` vertices.
    constructor(vertices, polygons) {
        this._vertices = [];
        this._polygons = [];
        vertices.forEach(point => { this._create_vertex(point); });
        polygons.forEach(pd => { this._create_polygon(pd); });
    }
    _create_vertex(point) {
        const v = new Vertex(new Point(point[0], point[1]));
        this._vertices.push(v);
    }
    _create_polygon(poly_description) {
        const w = poly_description[0];
        const indices = poly_description[1];
        let vertices = [];
        indices.forEach(index => {
            let vertex = this._vertices[index];
            vertices.push(vertex);
        });
        this._polygons.push(new Polygon(vertices, w));
    }
    get vertices() { return this._vertices; }
    get polygons() { return this._polygons; }
    containing_poly(p) {
        for (let i = 0; i < this._polygons.length; i++) {
            const poly = this._polygons[i];
            if (poly.contains(p)) {
                return poly;
            }
        }
        return null;
    }
}

class Path {
    constructor() {
        // Note there are ways to prevent direct call to the constructor but let's ignore them for now
        this._end_point = null;
        this._cost = null;
        this._prefix = null;
    }

    get cost() { return this._cost; }
    get end_point() { return this._end_point; }
    get is_empty() { return this._prefix == null; }
    get prefix() { return this._prefix; }

    static from_point(point) {
        const result = new Path();
        result._end_point = point;
        result._cost = 0.0;
        result._prefix = null;
        return result;
    }

    static ex(path, point, poly) {
        const result = new Path();
        result._end_point = point;
        result._cost = path.cost + (poly.weight * Point.distance(path.end_point, point));
        result._prefix = path;
        return result;
    }
}