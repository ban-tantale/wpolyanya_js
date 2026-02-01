function click_poly(event) { // Shows the current poly
    const p = camera.point_of_event(event);
    camera.set_point_colour('#FF0000');
    camera.set_point_width(100);
    camera.draw_point(p);
    const poly = map.containing_poly(p);
    if (poly == null) {
        alert('No polygon!');
    } else {
        camera.set_poly_colour('#00FFFF');
        camera.draw_poly(poly);
    }
}


// Function that verifies the implementation of intersection
let test_intersection_point1 = null;
let test_intersection_point2 = null;
let test_intersection_poly = null;
function test_intersection_click(event) {
    const point = camera.point_of_event(event);

    if (test_intersection_point1 == null) {
        test_intersection_point1 = point;
        test_intersection_poly = map.containing_poly(point);
        camera.set_point_colour('#ff0000');
        camera.set_point_width(5);
        camera.draw_point(test_intersection_point1);
        return;
    }
    if (test_intersection_point2 == null) {
        test_intersection_point2 = point;
        const vec = Vector.from_points(test_intersection_point1, test_intersection_point2);
        const edge = test_intersection_poly.edges[0];
        const intersection = edge.intersection(test_intersection_point1, vec);
        camera.set_point_colour('#00ff00');
        camera.draw_point(test_intersection_point2);
        camera.set_point_colour('#0000ff');
        camera.draw_point(intersection);
        test_intersection_point1 = null;
        test_intersection_point2 = null;
        return;
    }
    // Should not happen
    test_intersection_point1 = null;
    test_intersection_point2 = null;
}

// Function that verifies the implementation of relative_position
let test_relative_point1 = null;
let test_relative_point2 = null;
let test_relative_poly = null;
function test_relative_click(event) {
    const point = camera.point_of_event(event);

    if (test_relative_point1 == null) {
        test_relative_point1 = point;
        test_relative_poly = map.containing_poly(point);
        camera.set_point_colour('#ff0000');
        camera.set_point_width(5);
        camera.draw_point(test_relative_point1);
        return;
    }
    if (test_relative_point2 == null) {
        test_relative_point2 = point;
        camera.set_point_colour('#00ff00');
        camera.draw_point(test_relative_point2);
        const vec = Vector.from_points(test_relative_point1, test_relative_point2);
        //camera.draw_vector(test_relative_point1, vec);

        test_relative_poly.edges.forEach(edge => {
            const intersection = edge.intersection(test_relative_point1, vec);
            const rel = intersection.relative_position(edge);
            if ((rel == Position.AT_START) || (rel == Position.AT_END) || (rel == Position.INSIDE)) {
                camera.set_point_colour('#00ffff');
                camera.draw_point(intersection);
                let th = edge.through(vec);
                let position = th[0];
                if (position == Position.BEFORE) { alert('Before!'); }
                if (position == Position.AFTER) { alert('AFTER!'); }
                new_vector = th[1];

                // Caerful: This is only correct if intersection is in the same direction as clicked point!
                if (new_vector != null) {
                    debug_message(
                        "vec = " + vec.to_html + "<br />" +
                        "new = " + new_vector.to_html + "<br />" +
                        "edg = " + edge._vector.to_html + "<br />" +
                        "ort = " + edge._ortho.to_html + "<br />"
                    );

                    let path = Path.from_point(test_relative_point1);
                    path = Path.ex(path, intersection, test_relative_poly);
                    let target = new_vector.translate(intersection);
                    path = Path.ex(path, target, edge._opposite.poly);
                    camera.set_path_colour('#000000');
                    camera.draw_path(path);

                    // Checking correctness of Snell
                    const vec2 = new Vector(vec.dx - 0.01, vec.dy);
                    let path2 = Path.from_point(test_relative_point1);
                    let intersection2 = edge.intersection(test_relative_point1, vec2);
                    path2 = Path.ex(path2, intersection2, test_relative_poly);
                    path2 = Path.ex(path2, target, edge._opposite.poly);
                    camera.set_path_colour('#FF0000');
                    camera.draw_path(path2);

                    const vec3 = new Vector(vec.dx + 0.01, vec.dy);
                    let path3 = Path.from_point(test_relative_point1);
                    let intersection3 = edge.intersection(test_relative_point1, vec3);
                    path3 = Path.ex(path3, intersection3, test_relative_poly);
                    path3 = Path.ex(path3, target, edge._opposite.poly);
                    camera.set_path_colour('#FFFF00');
                    camera.draw_path(path3);

                    debug_message('----<br />'
                        + "path cost = " + path.cost + "<br />"
                        + "path cost = " + path2.cost + "<br />"
                        + "path cost = " + path3.cost + "<br />"
                        + '----<br />'
                    );
                }
            }
        });
        test_relative_point1 = null;
        test_relative_point2 = null;
        alert('Finished')
    }

}

// Function that tests the drawing of cones
function test_cone_click(event) {
    const point = camera.point_of_event(event);
    const poly = map.containing_poly(point);
    const cone = Cone.init(point, poly.edges[0]);
    camera.draw_cone(cone);
}