// Different types of search nodes

class Node {
    constructor() {
    }
    successors(target, target_poly) {
        throw new Error("successor not implemented.");
    }
}

class Cone extends Node {
    constructor() {
        super();
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

    static init(root, edge) {
        const result = new Cone();
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
        if (edge == cone.edges[cone.edges.length - 1].opposite) { return null; }

        const result = new Cone();
        result._root = cone.root;
        result._out_1 = cone._out_1;
        result._in_1 = cone._in_1;
        result._out_2 = cone._out_2;
        result._in_2 = cone._in_2;
        result._edges = cone._edges.slice();
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
            this._out_1 = vec2;
        }

        return true;
    }

    get successors() {
        const result = [];
        const oppo = this.last_edge.opposite;
        if (oppo != null) {
            const poly = oppo.poly;
            poly.edges.forEach(edge => {
                const new_cone = Cone.ex(this, edge);
                if (new_cone != null) {
                    result.push(new_cone);
                }
            });
        }
        return result;
    }
}