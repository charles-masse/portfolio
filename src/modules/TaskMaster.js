
import * as THREE from 'three';

import * as YUKA from 'yuka';

// import {createGraphHelper} from '../helpers/GraphHelper.js'
import {createConvexRegionHelper} from '../helpers/NavMeshHelper.js'
import {WallAvoidanceBehavior} from '../customs/Steering.js'

export default class {

    constructor(navMesh, entityManager) {

        this.navMesh = navMesh;
        this.entityManager = entityManager;

        this.objects = new THREE.Group();

        const navMeshHelper = createConvexRegionHelper(this.navMesh);
        // const graphHelper = createGraphHelper(this.navMesh.graph, 0.75);
        
        this.objects.add(navMeshHelper, /*graphHelper*/);

        this.entityManager.entities.forEach((entity, i) => {

            if (entity.active) {

                const pos = entity.position;
                const {x, y} = this.navMesh.randomPoint();

                const points = this.navMesh.findPath(new YUKA.Vector3(pos.x, 0, pos.z), new YUKA.Vector3(x, 0, y));

                const path = new YUKA.Path();
                for (const point of points) {
                    path.add(point);
                }

                entity.steering.add(new WallAvoidanceBehavior(this.navMesh));
                // entity.steering.add(new YUKA.SeparationBehavior());
                entity.steering.add(new YUKA.FollowPathBehavior(path, 2));
                //entity.steering.add(new YUKA.WanderBehavior());

            }

        });

    }

}
