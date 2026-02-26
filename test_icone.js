function test_click(event) {
    const point = camera.point_of_event(event);
    const poly = map.containing_poly(point);
    const edge = poly.edges[0];
    const edge2 = edge.opposite;

        if (edge != null && edge._forward_critical_angle != null) {
            const v1 = edge.v1;
            const icone = ICone.forward_init(edge, v1);
            edge2.poly.edges.forEach(edge => {
                const icone2 = ICone.ex(icone, edge);
                if (icone2 != null) {
                    camera.draw_icone(icone2);
                }
            });
        }

    [edge, edge2].forEach(edge => {
        if (edge != null && edge._forward_critical_angle != null) {
            const centre = edge.centre;
            camera.draw_vector(centre, edge._forward_critical_angle);
            camera.draw_vector(centre, edge._backward_critical_angle);
        }
    });

    alert('kk');
}