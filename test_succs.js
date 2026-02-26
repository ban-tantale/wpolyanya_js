// Enumerates all the successors from two points
let starting_point = null;
starting_point = new Point(8.50000,3.83889);
let starting_poly = null;
let target_point = null;
target_point = new Point(12.83333,8.73889);
let target_poly = null;
let cones = [];
let cone_id = 0;

function test_click(event) {

    if (starting_point == null) {
        starting_point = camera.point_of_event(event);
        return;
    }

    camera.set_point_colour('#ff0000');
    camera.draw_point(starting_point);
    if (starting_poly == null) {
        starting_poly = map.containing_poly(starting_point);
        cones.push(ZCone.start_zcone(starting_point, starting_poly));
    }

    if (target_point == null) {
        target_point = camera.point_of_event(event);
        return;
    }

    camera.set_point_colour("#ffff00");
    camera.draw_point(target_point);
    const path = Path.from_point(starting_point);
    //starting_poly.edges.forEach(edge => {
    //    const cone = Cone.init(starting_point, edge, path);
    //    cones.push(cone);
    //});
    
    if (target_poly == null) {
        target_poly = map.containing_poly(target_point);
    }

    //for (let _nb_iters = 0 ; _nb_iters < 300 ; _nb_iters++) {
        if (cone_id > cones.length) { alert("No more cone."); }
        const cone = cones[cone_id];
        cone_id += 1;

        camera.draw_map(map);
        camera.set_cone_colour("#ffff00");
        camera.draw_xcone(cone);

        cone.successors(target_point, target_poly).forEach(newcone => {
            if (newcone == null) {
                alert("Null!");
            }
            cones.push(newcone);
        });
        // Note: cone may now be invalid, so we cannot draw it.
        //camera.set_cone_colour("#ffffff");
        //camera.draw_xcone(cone);
    //}
    
    // Pb with nb 94

    // TODO: Add successors of cone.
    // TODO: Redraw the map.  Have a list of drawable?
}