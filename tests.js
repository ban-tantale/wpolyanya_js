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
                new_vector = edge.through(vec);
                if (new_vector != null) {
                    debug_message(
                        "vec = " + vec.to_html + "<br />" +
                        "new = " + new_vector.to_html + "<br />" +
                        "edg = " + edge._vector.to_html + "<br />" +
                        "ort = " + edge._ortho.to_html + "<br />"
                    );
                    // camera.draw_vector(intersection, new_vector);

                    let path = Path.from_point(test_relative_point1);
                    path = Path.ex(path, intersection, test_relative_poly);
                    let new_point = new_vector.translate(intersection);
                    path = Path.ex(path, new_point, edge._opposite.poly);
                    camera.draw_path(path);
                }
            }
        });
        test_relative_point1 = null;
        test_relative_point2 = null;
        alert('Finished')
    }

}