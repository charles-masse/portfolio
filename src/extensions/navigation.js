
import * as THREE from 'three';

import * as YUKA from 'yuka';

class Path extends YUKA.Path {

    constructor() {
        super();

        this.end = false;

    }

    advance() {

        this._index ++;

        if (this._waypoints.length && this._index === this._waypoints.length) {

            this.end = true;

            if (this.loop === true) {
                this._index = 0;
            }

            else {
                this._index--;
            }

        } else {
            this.end = false;
        }

        return this;
    }

    finished() {
        return this.end;
    }

}

class NavMesh extends YUKA.NavMesh {

    findPath(from, to) {

        const graph = this.graph;
        const path = new Array();

        let fromRegion = this.getRegionForPoint(from, this.epsilonContainsTest);
        let toRegion = this.getRegionForPoint(to, this.epsilonContainsTest);

        if (fromRegion === null || toRegion === null) {
            //If source or target are outside the navmesh, choose the nearest convex region
            if (fromRegion === null) fromRegion = this.getClosestRegion(from);
            if (toRegion === null) toRegion = this.getClosestRegion(to);

        }
        //Check if both convex region are identical
        if (fromRegion === toRegion) {
            //No search necessary, directly create the path
            path.push(new YUKA.Vector3().copy(from));
            path.push(new YUKA.Vector3().copy(to));

            return path;
        }

        else {
            //Source and target are not in same region, perform search
            const source = this.getNodeIndex(fromRegion);
            const target = this.getNodeIndex(toRegion);

            const astar = new YUKA.AStar(graph, source, target);
            astar.search();

            if (astar.found === true) {

                const polygonPath = astar.getPath();
                //Get the portals
                const portalEdge = {left: null, right: null};

                for (let i = 0, l = (polygonPath.length - 1); i < l; i++) {

                    const region = this.regions[polygonPath[i]];
                    const nextRegion = this.regions[polygonPath[i + 1]];

                    this._getPortalEdge(region, nextRegion, portalEdge);
                    //Left/Right are reversed for our purpose
                    const right = portalEdge.right.clone().multiplyScalar(0.3);
                    const left = portalEdge.left.clone().multiplyScalar(0.7);

                    path.push(right.add(left));

                }

                path.push(new YUKA.Vector3().copy(to));

            }

            return path;
        }

    }

    fromPolygons(polygons) {
        super.fromPolygons(polygons);

        this._triangulate();

        return this;
    }

    randomPoint() {
        
        const triangles = this.triangles;
        //Random triangle weighted by their area size
        const areas = triangles.map((triangle) => triangle.getArea());

        const random_idx = YUKA.MathUtils.choice(
            [...Array(triangles.length).keys()],
            areas.map((size) => size / areas.reduce((a, b) => a + b))
        );
        const tri = triangles[random_idx];
        //Random point inside chosen triangle
        let u = Math.random();
        let v = Math.random();

        if (u + v > 1) {
            u = 1 - u;
            v = 1 - v;
        }

        const AB = new THREE.Vector3().subVectors(tri.b, tri.a);
        const AC = new THREE.Vector3().subVectors(tri.c, tri.a);

        return new THREE.Vector3()
            .copy(tri.a)
            .addScaledVector(AB, u)
            .addScaledVector(AC, v);
    }

    _triangulate() {

        this.triangles = [];

        for (const region of this.regions) {
            //Convert contour in 2D
            const contour = [];
            region.getContour(contour);
            const contour_2d = contour.map((p) => new THREE.Vector2(p.x, p.z));
            //Triangulate
            const triangles = THREE.ShapeUtils.triangulateShape(contour_2d, []);
            const triangles_points = triangles.map((tri) => tri.map((idx) => contour[idx]));
            //Create triangles
            for (const tri of triangles_points) {
                this.triangles.push(new THREE.Triangle(...tri));
            }

        }

    }

}

class PolygonalTriggerRegion extends YUKA.TriggerRegion {

    constructor(points) {
        super();

        this.polygon = new YUKA.Polygon().fromContour(points);
        this.polygon.computeCentroid();

    }

    touching(entity) {
        return this.polygon.contains(entity.position);
    }

}

export {
    Path,
    NavMesh,
    PolygonalTriggerRegion,
};
