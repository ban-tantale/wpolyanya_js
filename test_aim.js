test_point = null;

function test_click(event) {
    const point = camera.point_of_event(event);

    if (test_point == null) {
        test_point = point;
        camera.set_point_colour('#ff0000');
        camera.draw_point(test_point);
        return;
    }

    const point1 = test_point;
    const poly1 = map.containing_poly(point1);

    const target = point;
    const target_poly = map.containing_poly(target);

    poly1.edges.forEach(edge => {
        const cone = Cone.init(point1, edge, Path.from_point(point1));
        const poly2 = cone.last_edge.opposite.poly;
        poly2.edges.forEach(edge2 => {
            const cone2 = Cone.ex(cone, edge2);
            if (cone2 == null) { return; }
            camera.set_cone_colour('#00ff00');
            camera.draw_cone(cone2);

            const zcone = cone2.target_successor(target, target_poly);
            if (zcone != null) {
                const path = zcone.path;
                camera.set_path_colour('#000000');
                camera.set_path_width(3);
                camera.draw_path(path);
            }
        });
        camera.set_cone_colour('#ffff00');
        camera.draw_cone(cone);
    });

    camera.set_point_colour('#ff0000');
    camera.draw_point(target);
}