
import * as THREE from 'three';
import * as YUKA from 'yuka';

import {createGraphHelper} from '../helpers/GraphHelper.js'
import {createConvexRegionHelper} from '../helpers/NavMeshHelper.js'

import CityNavigation from '../behaviors/CityNavigation.js'

export default class {

    constructor(navMesh, entityManager) {

        this.navMesh = navMesh;
        this.entityManager = entityManager;

        this.objects = new THREE.Group();

        const navMeshHelper = createConvexRegionHelper(this.navMesh);
        const graphHelper = createGraphHelper(this.navMesh.graph, 0.75);
        
        this.objects.add(navMeshHelper, graphHelper);

        this.entityManager.entities.forEach((entity, i) => {

            if (entity.active) {

                const pos = entity.position;
                const {x, y} = this.navMesh.randomPoint();

                const points = this.navMesh.findPath(new YUKA.Vector3(pos.x, 0, pos.z), new YUKA.Vector3(x, 0, y));

                const path = new YUKA.Path();
                for (const point of points) {
                    path.add(point);
                }

                const pathHelper = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({color: 0xff0000}));
                // this.objects.add(pathHelper);

                entity.steering.add(new CityNavigation(path, this.navMesh));

            }

        });

    }

}
