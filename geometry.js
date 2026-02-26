const Position = {
    BEFORE: 0,
    AT_START: 1,
    INSIDE: 2,
    AT_END: 3,
    AFTER: 4
};
const EPSILON_EQUALS = 0.01;

_point_difference = 0.0001;
class Point {
    constructor(x, y) {
        this._x = x;
        this._y = y;
    }
    get x() { return this._x; }
    get y() { return this._y; }
    toString() { return "&lt;" + this.x.toFixed(5) + "," + this.y.toFixed(5) + "&gt;"; }

    right_of(edge) {
        let v2 = Vector.from_points(edge.v1, this);
        return edge.vector.cross_product(v2) <= 0;
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

    static centre(p1, p2) {
        return new Point((p1._x + p2._x) / 2, (p1._y + p2._y) / 2);
    }

    close_to(other_point) {
        const result = (Math.abs(this.x - other_point.x) < _point_difference)
            && (Math.abs(this.y - other_point.y) < _point_difference);
        return result;
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

_vector_difference = 0.000000001;
class Vector {
    constructor(dx, dy) {
        this._dx = dx;
        this._dy = dy;
    }

    static from_points(p1, p2) {
        const result = new Vector(p2.x - p1.x, p2.y - p1.y);
        result._normalise();
        return result;
    }

    static bissection(vec1, vec2) {
        const result = new Vector((vec1.dx + vec2.dx) / 2, (vec1.dy + vec2.dy) / 2);
        result._normalise();
        return result;
    }

    close_to(other_vector) {
        const result = (Math.abs(this.dx - other_vector.dx) < _vector_difference)
            && (Math.abs(this.dy - other_vector.dy) < _vector_difference);
        return result;
    }

    get dx() { return this._dx; }
    get dy() { return this._dy; }

    _normalise() {
        const distance = Math.sqrt((this._dx * this._dx) + (this._dy * this._dy));
        this._dx = this._dx / distance;
        this._dy = this._dy / distance;
    }

    cross_product(v) {
        return (this._dx * v._dy) - (this._dy * v._dx);
    }

    scalar_product(v) {
        return (this._dx * v._dx) + (this._dy * v._dy);
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
    toString() { return "&lt;" + this.dx.toFixed(5) + "," + this.dy.toFixed(5) + "&gt;"; }

    static combination(vector_params) {
        // Input = [[vector1, alpha1], ..., [vectork, alphak]]
        // such that `square(alpha1) + ... + square(alpha_k) = 1`
        // output = alpha1 * vector1 + ... + alphak * vectork.
        let x = 0;
        let y = 0;
        vector_params.forEach(element => {
            const vector = element[0];
            const alpha = element[1];
            x += vector.dx * alpha;
            y += vector.dy * alpha;
        });
        return new Vector(x, y);
        //        return null;
    }

    towards(edge) {
        // Assuming coming from the right of the edge,
        // returns whether the vertex is moving towards the line of this edge
        return this.cross_product(edge.vector) < 0;
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

    get a() { return this._a; }
    get b() { return this._b; }

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

_all_edges = []
class Edge {
    constructor(v1, v2, poly) {
        _all_edges.push(this);
        this._v1 = v1;
        this._v2 = v2;
        this._vector = Vector.from_points(v1, v2);
        this._ortho = new Vector(-this._vector.dy, this._vector.dx);
        v1.add_out(this);
        v2.add_in(this);
        this._opposite = null; // The opposite edge
        this._poly = poly; // The polygon on the right
        this._line = new Line(v1, v2);
        this._forward_critical_angle = null;
        this._backward_critical_angle = null;

        // checks if the opposite edge exists
        for (let i = 0; i < v1.in.length; i++) {
            const edge = v1.in[i];
            if (edge.v1 == v2) { // `this` is the opposite of `e`
                this._opposite = edge;
                edge._opposite = this;
                const this_weight = this._poly.weight;
                const edge_weight = edge.poly.weight;
                if (this_weight != edge_weight) {
                    let change_edge = this; // the edge with critical angle
                    let sin = edge_weight / this_weight;
                    if (this_weight < edge_weight) {
                        change_edge = edge;
                        sin = this_weight / edge_weight;
                    }
                    let cos = Math.sqrt(1 - sin * sin);
                    change_edge._forward_critical_angle = Vector.combination(
                        [[change_edge.vector, cos], [change_edge._ortho, sin]]
                    );
                    change_edge._backward_critical_angle = Vector.combination(
                        [[change_edge.vector, -cos], [change_edge._ortho, sin]]
                    );
                }
                break;
            }
        }
    }

    get v1() { return this._v1; }
    get v2() { return this._v2; }
    get centre() { return new Point((this.v1.x + this.v2.x) / 2, (this.v1.y + this.v2.y) / 2); }
    get vector() { return this._vector; }
    get poly() { return this._poly; }
    get opposite() { return this._opposite; }
    toString() { return "(" + this.v1 + "," + this.v2 + ")"; }

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
            const x = point.x;
            const line = new Line(this.v1, this.v2);
            const y = line.a + line.b * x
            return new Point(x, y);
        }
        const line = new Line(point, vector.translate(point));
        return Line.intersection(this._line, line);
    }

    through(incoming_vector) {
        // Assumes a normalised vector aimed at the edge!
        // Returns: position (BEFORE / AFTER / INSIDE) + vector|null
        if (this._opposite == null) { return null; }

        let s = Vector.sin(this._ortho, incoming_vector);
        let s2 = s * this._poly.weight / this._opposite._poly.weight;
        if (s2 > 1) { return [Position.BEFORE, null]; }
        if (s2 < -1) { return [Position.AFTER, null]; }

        let c2 = Math.sqrt(1 - (s2 * s2));

        return [Position.INSIDE, new Vector(
            -(c2 * this._vector.dy + s2 * this._ortho.dy),
            (c2 * this._vector.dx + s2 * this._ortho.dx)
        )];
    }

    get index() {
        // Note: using a list because we do not expect this method to be called much
        for (let result = 0 ; result < _all_edges.length ; result++) {
            if (_all_edges[result] == this) { return result; }
        }
        return -1;
    }
    static of_index(index) {
        return _all_edges[index];
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
            const e = new Edge(v1, v2, this);
            this._edges.push(e);
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
    edge_index(edge) {
        for (let i = 0 ; i < this._edges.length ; i++) {
            if (this._edges[i] == edge) {
                return i;
            }
        }
        return -1;
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
        this._last_polygon = null;
    }

    get cost() { return this._cost; }
    get end_point() { return this._end_point; }
    get is_empty() { return this._prefix == null; }
    get prefix() { return this._prefix; }

    toString() {
        if (this.is_empty) {
            return "[> " + this.end_point;
        }
        return this.prefix.toString() + " --&gt; " + this.end_point;
    }

    static from_point(point) {
        const result = new Path();
        result._end_point = point;
        result._cost = 0.0;
        result._prefix = null;
        result._last_polygon = null;
        return result;
    }

    static ex(path, point, poly) {
        const result = new Path();
        result._end_point = point;
        result._cost = path.cost + (poly.weight * Point.distance(path.end_point, point));
        result._prefix = path;
        result._last_polygon = poly;
        return result;
    }

    static throw_ray(root, direction, edges, compute_path) {
        // Returns (position, path_or_point_or_null)

        let current_point = root;
        let current_direction = direction;
        let current_path = null;
        let current_position = Position.INSIDE;
        if (compute_path) { current_path = Path.from_point(current_point); }

        for (let edge_idx = 0; edge_idx < edges.length; edge_idx++) {
            const edge = edges[edge_idx];

            // If the ray if not towards the edge, it is either BEFORE or AFTER
            if (!current_direction.towards(edge)) {
                if (current_direction.scalar_product(edge.vector) > 0) {
                    return [Position.AFTER, null];
                }
                return [Position.BEFORE, null];
            }

            current_point = edge.intersection(current_point, current_direction);

            let current_position = current_point.relative_position(edge);
            if ((current_position == Position.BEFORE) || (current_position == Position.AFTER)) {
                return [current_position, null];
            }

            if (compute_path) {
                current_path = Path.ex(current_path, current_point, edge.vector);
            }

            if (edge_idx == edges.length - 1) {
                // No need to check that the ray extends beyond the last edge.
                break;
            }

            // Compute the new direction
            const th = edge.through(current_direction);
            current_position = th[0];
            current_direction = th[1];
            // current_position, current_direction = edge.through(current_direction);
            if ((current_position == Position.BEFORE) || (current_position == Position.AFTER)) {
                return [current_position, null];
            }
        }

        if (compute_path) {
            return [current_position, current_path];
        } else {
            return [current_position, current_point];
        }
    }

    static path_from_ray(root, direction, edges) {
        // Returns the path from throwing the ray.
        return this.throw_ray(root, direction, edges, true)[1];
    }

    static throw_ray_at_point(root, direction, edges, target) {
        // `target` is supposed to be *after* the last edges
        // Returns BEFORE or AFTER

        let current_point = root;
        let current_direction = direction;

        for (let edge_idx = 0; edge_idx < edges.length; edge_idx++) {
            const edge = edges[edge_idx];

            // If the ray if not towards the edge, it is either BEFORE or AFTER
            if (!current_direction.towards(edge)) {
                if (current_direction.scalar_product(edge.vector) > 0) {
                    return Position.AFTER;
                }
                return Position.BEFORE;
            }

            current_point = edge.intersection(current_point, current_direction);

            {
                const current_position = current_point.relative_position(edge);
                if ((current_position == Position.BEFORE) || (current_position == Position.AFTER)) {
                    return current_position;
                }
            }

            const th = edge.through(current_direction);
            const current_position = th[0];
            current_direction = th[1];
            // current_position, current_direction = edge.through(current_direction);
            if ((current_position == Position.BEFORE) || (current_position == Position.AFTER)) {
                return current_position;
            }
        }

        const vec1 = Vector.from_points(current_point, target);
        if (current_direction.cross_product(vec1) < 0) {
            return Position.BEFORE;
        }
        return Position.AFTER;
    }

    concat(suffix) {
        if (suffix._prefix == null) { return this; }
        const prefix = this.concat(suffix._prefix);
        return Path.ex(prefix, suffix._end_point, suffix._last_polygon);
    }
}

function check_if_ray_can_cross_edge(direction, edges) {
    // Returns BEFORE, INSIDE, or AFTER
    // Assumes that the different segments are moving towards the edges, but might fall on the left or the right
    let current_direction = direction;

    for (let edge_id = 0 ; edge_id < edges.length ; edge_id++) {
        const edge = edges[edge_id];
        const th = edge.through(current_direction);
        current_position = th[0];
        if ((current_position == Position.BEFORE) || (current_position == Position.AFTER)) {
            return current_position;
        }
        current_direction = th[1];
    }

    return Position.INSIDE;
}