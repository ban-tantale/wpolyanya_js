class Camera {
    constructor(ctx) {
        this._ctx = ctx;
        this._rect = canvas.getBoundingClientRect();

        this._dx = 0.2;
        this._dy = 0.1;
        this._zoom = 30.0;

        this._min_weight = 0.5;
        this._max_weight = 1;
        this._ratio = 1;

        this._point_width = 2;
        this._point_colour = "#FF0000";

        this._poly_colour = null;

        // this._weight_to_colour = {};
    }

    point_of_event(event) {
        return new Point(
            (event.clientX - this._rect.left) / this._zoom - this._dx,
            (this._rect.bottom - event.clientY) / this._zoom - this._dy
        );
    }

    set_point_colour(colour) { this._point_colour = colour; }
    set_point_width(width) { this._point_width = width; }
    set_poly_colour(colour) { this._poly_colour = colour; }

    compute_weight_colours(map) {
        this._weight_to_colour = {};
        let max_weight = 0;
        map.polygons.forEach(poly => {
            let w = poly.weight;
            if (w > max_weight) { max_weight = w; }
        });
        let min_weight = max_weight;
        map.polygons.forEach(poly => {
            let w = poly.weight;
            if (w < min_weight) { min_weight = w; }
        });
        let ratio = 1.0 / (max_weight - min_weight);
        this._min_weight = min_weight;
        this._max_weight = max_weight;
        this._ratio = ratio;
    }

    colour_of_weight(w) {
        let n = "" + Number(parseInt(this._ratio * (this._max_weight - w) * 255)).toString(16);
        if (n.length == 1) {
            n = "0" + n;
        }
        if (n.length > 2) {
            alert('Error for ' + w)
        }
        let colour = "#0000" + n;
        return colour;
    }

    _position(point) {
        return [
            this._zoom * (point.x + this._dx),
            this._zoom * (point.y + this._dy)
        ];
    }

    _move_to(point) {
        const pos = this._position(point);
        this._ctx.moveTo(pos[0], pos[1]);
    }

    _line_to(point) {
        const pos = this._position(point);
        this._ctx.lineTo(pos[0], pos[1]);
    }

    left() { this._dx -= 1; }
    right() { this._dx += 1; }
    up() { this._dy += 1; }
    down() { this._dy -= 1; }
    zoom() { this._zoom *= 1.2; }
    unzoom() { this._zoom /= 1.2; }

    clear() {
        this._ctx.fillStyle = "#ffffff";
        this._ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    draw_point(point) {
        const pos = this._position(point);
        this._ctx.fillStyle = this._point_colour;
        this._ctx.beginPath();
        this._ctx.ellipse(pos[0], pos[1], this._point_width, this._point_width, 0, 0, Math.PI * 2);
        this._ctx.fill();
    }

    draw_poly(poly) {
        if (this._poly_colour == null) {
            this._ctx.fillStyle = this.colour_of_weight(poly.weight);
        } else {
            this._ctx.fillStyle = this._poly_colour;
        }

        this._move_to(poly.vertex(poly.nb_vertices - 1));
        this._ctx.beginPath();
        for (let i = 0; i < poly.nb_vertices; i++) {
            let v = poly.vertex(i);
            this._line_to(v);
        }
        this._ctx.fill();
    }

    draw_map(map) {
        map._polygons.forEach(poly => {
            this.draw_poly(poly);
        });
        map.vertices.forEach(vertex => {
            this.set_point_colour("#FFFF00");
            this.draw_point(vertex);
        });
    }

}

