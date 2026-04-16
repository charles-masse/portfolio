
import * as THREE from 'three';

import * as YUKA from 'yuka';

class Path extends YUKA.Path {

    constructor() {
        super();

        this.end = false;

    }

    advance() {

        this._index ++;

        if ( ( this._index === this._waypoints.length ) ) {

            if ( this.loop === true ) {

                this._index = 0;

            } else {

                this._index --;
                this.end = true;

            }

        }

        return this;

    }

    done() {
        return this.end;
    }

}

class NavMesh extends YUKA.NavMesh {

    constructor() {
        super();

        this.triangles = null;
        this.perimeter = null;

    }

    fromPolygons(polygons) {
        super.fromPolygons(polygons);

        this.triangulate();
        this.calculatePerimeter();

        return this;
    }

    triangulate() {

        const triangulated = [];

        for (const region of this.regions) {

            const contour = [];
            region.getContour(contour);

            const contour_2d = contour.map(p => new THREE.Vector2(p.x, p.z));

            const triangles = THREE.ShapeUtils.triangulateShape(contour_2d, []);
            const triangles_points = triangles.map(tri => tri.map(idx => contour_2d[idx]));

            triangulated.push(...triangles_points);

        }

        this.triangles = triangulated;

    }

    calculatePerimeter() {

        const perimeter = [];

        for (const region of this.regions) {

            const contour = [];
            region.getContour(contour);

            for (let i=0; i < contour.length; i++) {

                const wall = new YUKA.LineSegment(contour[i], contour[(i + 1) % contour.length]);
                wall.normal = wall.to.clone().sub(wall.from).cross(new YUKA.Vector3(0, 1, 0)).multiplyScalar(-1.0).normalize();

                perimeter.push(wall);

            }

        }

        let final_perimeter = perimeter.slice();

        for (let e=0; e < perimeter.length; e++) {
            for (let i=0; i < perimeter.length; i++) {

                if (i != e) {

                    const distances = [
                        perimeter[e].from.clone().sub(perimeter[i].from).length(),
                        perimeter[e].from.clone().sub(perimeter[i].to).length(),
                        perimeter[e].to.clone().sub(perimeter[i].to).length(),
                        perimeter[e].to.clone().sub(perimeter[i].from).length(),
                    ];

                    if (distances.filter(v => v === 0).length == 2) {
                        final_perimeter.splice(final_perimeter.indexOf(perimeter[i]), 1);
                    }
                    
                }

            }

        }

        this.perimeter = final_perimeter;

    }

    randomPoint() {
        
        const triangles = this.triangles;
        //Random triangle weighted by their area size
        const areas = triangles.map(
            triangle => new THREE.Triangle(
                new THREE.Vector3(triangle[0].x, 0, triangle[0].y),
                new THREE.Vector3(triangle[1].x, 0, triangle[1].y),
                new THREE.Vector3(triangle[2].x, 0, triangle[2].y)
            ).getArea());

        const random_idx = YUKA.MathUtils.choice(
            [...Array(triangles.length).keys()],
            areas.map(size => size / areas.reduce((a,b)=>a+b))
        );
        
        const tri = triangles[random_idx];
        //Random point inside chosen triangle
        let r1 = Math.random();
        let r2 = Math.random();

        if (r1 + r2 > 1) {
            r1 = 1 - r1; r2 = 1 - r2;
        };

        return {
            x: tri[0].x + r1 * (tri[1].x - tri[0].x) + r2 * (tri[2].x - tri[0].x),
            y: tri[0].y + r1 * (tri[1].y - tri[0].y) + r2 * (tri[2].y - tri[0].y)
        };
    }

}

export {
    Path,
    NavMesh,
};