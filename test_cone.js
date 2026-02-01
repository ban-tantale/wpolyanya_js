test_point = null;
test_poly = null;
test_idx = 0;

function test_click(event) {
    if (test_poly == null) {
        test_point = camera.point_of_event(event);
        test_poly = map.containing_poly(test_point);
        test_idx = -1;

        if (test_poly == null) {
            debug_message('No polygon');
            return;
        }
    }

    const edge = test_poly.edges[0];
    const oppo_edge = edge.opposite;

    let cone = Cone.init(test_point, test_poly.edges[0]);
    if (test_idx >= 0) {
        alert('drawing deep cone ' + test_idx);
        if (oppo_edge == null) {
            test_poly = null;
        } else {
            const second_poly = oppo_edge.poly;
            const second_edge = second_poly.edges[test_idx];
            debug_message("second edge = " + second_edge);
            cone = Cone.ex(cone, second_edge);
            test_idx += 1;
            if (test_idx == second_poly.edges.length) {
                alert('No more cones');
                test_poly = null;
            }

        }
    } else {
        test_idx += 1;
    }

    camera.clear();
    camera.draw_map(map);
    camera.draw_cone(cone);

    alert('kk');
}

function test_click2(event) {
    const point = camera.point_of_event(event);
    // const point = new Point(4, 8.4);
    const poly = map.containing_poly(point);

    if (poly == null) {
        debug_message('No polynom.');
        return;
    }

    camera.set_cone_colour("#ff0000");
    poly.edges.forEach(edge => {
        const cone = Cone.init(point, edge);
        camera.draw_cone(cone);
    });

    camera.set_cone_colour("#ffff00");
    let it1 = -1;
    poly.edges.forEach(edge => {
        it1++;
        //if (it1 != 0) { return; }
        let it2 = -1;
        const cone = Cone.init(point, edge);
        /*
        const poly2 = edge.opposite.poly;
        poly2.edges.forEach(edge2 => {
            it2++;
            // if (it2 != 3) { return; }
            //if (it2 == 0) { camera.set_cone_colour("#000000"); }
            //else 
            //if (it2 == 1) { 
            //    debug_message("Edge = " + edge2);
            //    camera.set_cone_colour("#ffffff"); 
            //}
            //else { return; }
            debug_message('deep2 ' + it1 + ' - ' + it2);
            const cone2 = Cone.ex(cone, edge2);
            if (cone2 == null) { debug_message("cone2 is null"); }
            if (cone2 != null) {
                camera.draw_cone(cone2);
            }
        });*/
        cone.successors.forEach(cone2 => {
            camera.draw_cone(cone2);
        });
    });

    alert('kk');
}
