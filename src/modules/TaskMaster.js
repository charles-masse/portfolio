
import * as THREE from 'three';

import * as YUKA from 'yuka';

import {createGraphHelper} from '../helpers/GraphHelper.js'

export default class {

    constructor(navMesh, entityManager) {

        this.navMesh = navMesh;
        this.entityManager = entityManager;

        this.objects = new THREE.Group();

        this.entityManager.entities.forEach((entity, i) => {

            if (entity.active) {

                const pos = entity.position;
                const {x, y} = this.navMesh.randomPoint();

                const points = this.navMesh.mesh.findPath(new YUKA.Vector3(pos.x, 0, pos.z), new YUKA.Vector3(x, 0, y));

                const path = new YUKA.Path();
                for (const point of points) {
                    path.add(point);
                }

                const pathHelper = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({color: 0xff0000}));
                const graphHelper = createGraphHelper(this.navMesh.mesh.graph, 0.2);
                this.objects.add(pathHelper, graphHelper);

                const followPathBehavior = new YUKA.FollowPathBehavior(path, 0.5);
                entity.vehicle.steering.add(followPathBehavior);

            }

        });

    }

}
