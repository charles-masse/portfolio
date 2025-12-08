
import * as THREE from 'three';

import * as YUKA from 'yuka';
import {createConvexRegionHelper} from '../helpers/NavMeshHelper.js'

export class NavMesh {

    constructor(scene) {

        this.scene = scene;

        this.mesh = null;
        this.mesh_triangulated = null;

    }

    async load(path='models/navMesh.glb') {

        const navMesh = new Promise((resolve) => {

            const loader = new YUKA.NavMeshLoader();
            loader.load(path).then((gltf) => {
                resolve(gltf)
            });

        });

        this.mesh = await navMesh;

        const test = createConvexRegionHelper(this.mesh);
        this.scene.add(test);

        this.#triangulate();

    }

    #triangulate() {

        const regions = this.mesh.regions;
        const region_number = regions.length;

        this.mesh_triangulated = [];

        for (let i = 0; i < region_number; i++) {

            const contour = [];
            regions[i].getContour(contour);

            const contour_2d = contour.map(p => new THREE.Vector2(p.x, p.z));

            const triangles = THREE.ShapeUtils.triangulateShape(contour_2d, [])
            const triangles_points = triangles.map(tri => tri.map(idx => contour_2d[idx]));

            this.mesh_triangulated.push(...triangles_points);

        }

    }

    randomPoint() {

        const triangles = this.mesh_triangulated;
        const tri = triangles[THREE.MathUtils.randInt(0, triangles.length - 1)];

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
