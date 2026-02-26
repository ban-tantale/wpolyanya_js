// Different types of search nodes

class Node {
    constructor(path) { // Path to the root of the node.
        this._path = path;
    }

    get path() {
        return this._path;
    }

    successors(target, target_poly) {
        alert('Successors not implemented.')
        throw new Error("successors not implemented.");
    }

    is_cone() { return false; }
    is_icone() { return false; }
    is_zcone() { return false; }
}

class Cone extends Node {
    constructor(path) {
        super(path);
        this._root = null;
        this._out_1 = null;
        this._in_1 = null;
        this._out_2 = null;
        this._in_2 = null;
        this._edges = null;
    }

    get root() { return this._root; }
    get out_1() { return this._out_1; }
    get in_1() { return this._in_1; }
    get out_2() { return this._out_2; }
    get in_2() { return this._in_2; }
    get edges() { return this._edges; }
    get last_edge() { return this._edges[this._edges.length - 1]; }

    is_cone() { return true; }

    toString() {
        const indices = [];
        this.edges.forEach(edge => {
            const index = edge.index;
            indices.push(index);
        });
        const result = "Cone(" + this.root 
            + " , " + this.in_1
            + " , " + this.in_2
            + " , [" + indices
            + "])";
        return result;
    }

    static init(root, edge, path) {
        const result = new Cone(path);
        result._root = root;
        result._out_1 = Vector.from_points(root, edge.v1);
        result._in_1 = Vector.from_points(root, edge.v1);
        result._out_2 = Vector.from_points(root, edge.v2);
        result._in_2 = Vector.from_points(root, edge.v2);
        result._edges = [edge];
        return result;
    }

    static ex(cone, edge) {
        // TODO: Is it really necessary to make a special case here?
        if (edge == cone.last_edge.opposite) { return null; }

        const result = new Cone(cone.path);
        result._root = cone.root;
        result._out_1 = cone._out_1;
        result._in_1 = cone._in_1;
        result._out_2 = cone._out_2;
        result._in_2 = cone._in_2;

        result._edges = cone._edges.slice();
        result._edges.push(edge);

        if (result._refine()) {
            if (result.in_1.close_to(result.in_2)) {
                // TODO: Consider create a Cone at the end of the path because the cone seems infinitely small.
                return null;
            }
            return result;
        } else {
            return null;
        }
    }

    _refine() {
        // Returns false if it cannot be refined
        {
            const pos = Path.throw_ray(this._root, this._out_1, this._edges, false)[0];
            if (pos == Position.AFTER) {
                return false;
            }
        }
        {
            const pos = Path.throw_ray(this._root, this._out_2, this._edges, false)[0];
            if (pos == Position.BEFORE) {
                return false;
            }
        }

        const MAX_IT = 1000; // for safety; should not be necessary
        {
            let vec1 = this.out_1;
            let vec2 = this.in_2;
            let it = 0;
            while ((!vec1.close_to(vec2)) && (it < MAX_IT)) {
                it += 1;
                const vec = Vector.bissection(vec1, vec2);
                const pos = Path.throw_ray(this._root, vec, this._edges, false)[0];
                if (pos == Position.BEFORE) {
                    vec1 = vec;
                } else {
                    vec2 = vec;
                }
            }
            this._out_1 = vec1;
            this._in_1 = vec2;

            const pos = Path.throw_ray(this._root, this._in_1, this._edges, false)[0];
            if ((pos == Position.AFTER) || (pos == Position.BEFORE)) { return false; }
        }

        {
            let vec1 = this.in_1;
            let vec2 = this.out_2;
            let it = 0;
            while ((!vec1.close_to(vec2)) && (it < MAX_IT)) {
                it += 1;
                const vec = Vector.bissection(vec1, vec2);
                const pos = Path.throw_ray(this._root, vec, this._edges, false)[0];
                if (pos == Position.AFTER) {
                    vec2 = vec;
                } else {
                    vec1 = vec;
                }
            }
            this._in_2 = vec1;
            this._out_2 = vec2;

            const pos = Path.throw_ray(this._root, this._in_2, this._edges, false)[0];
            if ((pos == Position.AFTER) || (pos == Position.BEFORE)) { return false; }
        }

        if (this._in_1.close_to(this._in_2)) {
            return false;
        }
        return true;
    }

    _refine_outside() {
        // Refines this cone assuming the cone will not be super critical after the last edge.
        // Assumes that the last edge has an opposite edge.
        const last_edge = this.last_edge;
        const opposite = last_edge.opposite;
        if (opposite.poly.weight >= last_edge.poly.weight) { return; } // Only relevant if weight decreases
        
        // TODO:
        // Should actually refine backward from the critical vector rather than using a dichotomy

        { // left
            let v1 = this.out_1;
            let v2 = this.in_2;
            while (!v1.close_to(v2)) {
                const v = Vector.bissection(v1, v2);
                if (check_if_ray_can_cross_edge(v, this.edges) == Position.BEFORE) {
                    v1 = v;
                } else {
                    v2 = v;
                }
            }
            this._out_1 = v1;
            this._in_1 = v2;
        }

        { // right
            let v1 = this.in_1;
            let v2 = this.out_2;
            while (!v1.close_to(v2)) {
                const v = Vector.bissection(v1, v2);
                if (check_if_ray_can_cross_edge(v, this.edges) == Position.AFTER) {
                    v2 = v;
                } else {
                    v1 = v;
                }
            }
            this._in_2 = v1;
            this._out_2 = v2;
        }
    }

    target_successor(target, target_poly) {
        {
            const last_edge = this.last_edge;
            if (last_edge.opposite == null) { return null; }
            const next_poly = last_edge.opposite.poly;
            if (target_poly != next_poly) { return null; }
        }

        if (Path.throw_ray_at_point(this.root, this.in_1, this.edges, target) == Position.AFTER) {
            return null;
        }

        if (Path.throw_ray_at_point(this.root, this.in_2, this.edges, target) == Position.BEFORE) {
            return null;
        }

        let v1 = this.in_1;
        let v2 = this.in_2;
        while (!v1.close_to(v2)) {
            const v = Vector.bissection(v1, v2);
            if (Path.throw_ray_at_point(this.root, v, this.edges, target) == Position.BEFORE) {
                v1 = v;
            } else {
                v2 = v;
            }
        }

        let path = Path.throw_ray(this.root, v1, this.edges, true)[1];
        path = this.path.concat(path);
        path = Path.ex(path, target, target_poly);
        return ZCone.target_zcone(path);
    }

    successors(target, target_poly) {
        const result = [];

        const oppo = this.last_edge.opposite;
        if (oppo != null) {
            const before_in1 = this.in_1;
            const before_in2 = this.in_2;
            this._refine_outside();
            
            // ICones
            if (!before_in1.close_to(this.in_1)) {
                let path = Path.path_from_ray(this.root, this.in_1, this.edges);
                path = this.path.concat(path);
                const icone = ICone.backward_init(this.last_edge, path.end_point, path);
                result.push(icone);
            }
            if (!before_in2.close_to(this.in_2)) {
                let path = Path.path_from_ray(this.root, this.in_2, this.edges);
                path = this.path.concat(path);
                const icone = ICone.forward_init(this.last_edge, path.end_point, path);
                result.push(icone);
            }

            // Cones
            // Ordering the edges from left to right.
            const poly = oppo.poly;
            const edge_index = poly.edge_index(oppo);
            for (let i = 0 ; i < poly.edges.length ; i++) {
                const edge = poly.edges[(i + edge_index) % poly.edges.length];
                const new_cone = Cone.ex(this, edge);
                if (new_cone != null) {
                    result.push(new_cone);
                }
            }

            // ZCones on the corners
            const corner_and_directions = [
                [this.last_edge.v1, this.in_1],
                [this.last_edge.v2, this.in_2]
            ];
            for (const corner_and_direction of corner_and_directions) {
                const corner = corner_and_direction[0];
                const direction = corner_and_direction[1];
                const th = Path.throw_ray(this.root, direction, this.edges, true);
                let path = th[1];
                if (path != null) {
                    if (corner.close_to(path.end_point)) {
                        // TODO: Should modify the path for it to get directly to corner
                        path = this.path.concat(path);
                        const direction = Vector.from_points(path.prefix.end_point, path.prefix.end_point);
                        const zcone = ZCone.corner_zcone(path, this.last_edge, this.last_edge._incoming_poly, direction, corner);
                        result.push(zcone);
                    }
                }
            }
        }

        {
            const tg = this.target_successor(target, target_poly);
            if (tg != null) {
                result.push(tg);
            }
        }

        // TODO: ZCone (left & right), ICones (left & right), ZCone (target)

        return result;
    }
}

class ICone extends Node {
    constructor(path) {
        super(path);
        this._root = null;
        this._out_1 = null;
        this._in_1 = null;
        this._out_2 = null;
        this._in_2 = null;
        this._angle = null;
        this._edges = null;
        this._starting_edge = null;
    }

    get root() { return this._root; }
    get out_1() { return this._out_1; }
    get out_2() { return this._out_2; }
    get in_1() { return this._in_1; }
    get in_2() { return this._in_2; }
    get angle() { return this._angle; }
    get edges() { return this._edges; }
    get last_edge() {
        if (this._edges.length == 0) { return this._starting_edge; }
        return this._edges[this._edges.length - 1];
    }

    static forward_init(edge, point, path) {
        const icone = new ICone(path);
        icone._root = point;
        icone._out_1 = point;
        icone._in_1 = point;
        icone._out_2 = edge.v2;
        icone._in_2 = edge.v2;
        icone._angle = edge._forward_critical_angle;
        icone._edges = [];
        icone._starting_edge = edge;

        return icone;
    }

    static backward_init(edge, point, path) {
        const icone = new ICone(path);
        icone._root = point;
        icone._out_1 = point;
        icone._in_1 = point;
        icone._out_2 = edge.v1;
        icone._in_2 = edge.v1;
        icone._angle = edge._backward_critical_angle;
        icone._edges = [];
        icone._starting_edge = edge;
        return icone;
    }

    static ex(icone, edge) {
        // TODO: Is it really necessary to make a special case here?
        if (edge == icone.last_edge.opposite) { return null; }

        const result = new ICone(icone.path);
        result._root = icone._root;
        result._out_1 = icone._out_1;
        result._in_1 = icone._in_1;
        result._out_2 = icone._out_2;
        result._in_2 = icone._in_2;
        result._angle = icone._angle;
        result._starting_edge = icone._starting_edge;

        result._edges = icone._edges.slice();
        result._edges.push(edge);

        if (result._refine()) {
            return result;
        } else {
            return null;
        }
    }

    _refine() {
        // Returns false if it cannot be refined
        {
            const pos = Path.throw_ray(this._out_1, this._angle, this._edges, false)[0];
            if (pos == Position.AFTER) {
                return false;
            }
        }
        {
            const pos = Path.throw_ray(this._out_2, this._angle, this._edges, false)[0];
            if (pos == Position.BEFORE) {
                return false;
            }
        }

        const MAX_IT = 1000; // for safety; should not be necessary
        {
            let p1 = this.out_1;
            let p2 = this.in_2;
            let it = 0;
            while ((!p1.close_to(p2)) && (it < MAX_IT)) {
                it += 1;
                const p = Point.centre(p1, p2);
                const pos = Path.throw_ray(p, this._angle, this._edges, false)[0];
                if (pos == Position.BEFORE) {
                    p1 = p;
                } else {
                    p2 = p;
                }
            }
            this._out_1 = p1;
            this._in_1 = p2;
        }

        {
            let p1 = this.in_1;
            let p2 = this.out_2;
            let it = 0;
            while ((!p1.close_to(p2)) && (it < MAX_IT)) {
                it += 1;
                const p = Point.centre(p1, p2);
                const pos = Path.throw_ray(p, this._angle, this._edges, false)[0];
                if (pos == Position.AFTER) {
                    p2 = p;
                } else {
                    p1 = p;
                }
            }
            this._in_2 = p1;
            this._out_1 = p2;
        }

        return true;
    }

    successors(target, target_poly) {
        const result = [];
        return result;

        /*
        const oppo = this.last_edge.opposite;
        if (oppo != null) {
            const poly = oppo.poly;
            poly.edges.forEach(edge => {
                const new_icone = ICone.ex(this, edge);
                if (new_icone != null) {
                    result.push(new_icone);
                }
            });
        }

        // TODO: Cone (?), ZCone (left, right, & target)

        return result;
        */
    }
    
    is_icone() { return true; }
}

class ZCone extends Node {
    constructor(path) {
        // All factorised.  Should we distinguish StartingZCone, etc.?
        // Should create subclass for implementation of [successors].
        super(path);
        this._incoming_poly = null;
        this._incoming_direction = null;
        this._incoming_edge = null; // necessary?
        this._corner = null;
    }

    static target_zcone(path) {
        const result = new ZCone(path);
        result._incoming_poly = null; // irrelevant
        result._incoming_direction = null;
        result._incoming_edge = null;
        result._corner = null;
        return result;
    }

    static start_zcone(start_point, start_poly) {
        const path = Path.from_point(start_point);
        const result = new ZCone(path);
        result._incoming_poly = start_poly;
        result._incoming_direction = null;
        result._incoming_edge = null;
        result._corner = null;
        return result;
    }

    static corner_zcone(path, edge, poly, direction, corner) {
        const result = new ZCone(path);
        result._incoming_poly = poly;
        result._incoming_direction = direction;
        result._incoming_edge = edge;
        result._corner = corner;
        return result;
    }

    successors(target, target_poly) {
        if (this.path.end_point == target) { return []; }

        if (this.path.is_empty) {
            // Assumes inside a polygon
            const result = [];
            this._incoming_poly.edges.forEach(edge => {
                const cone = Cone.init(this.path.end_point, edge, this.path);
                result.push(cone);
            });

            // TODO: target in poly
            return result;
        }
        
        // TODO: Complex successors
        return [];
    }

    toString() { return "ZCone"; }
    is_zcone() { return true; }
}