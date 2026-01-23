
import * as THREE from 'three';

import * as YUKA from 'yuka';

// import {createGraphHelper} from '../helpers/GraphHelper.js'
import {createConvexRegionHelper} from '../helpers/NavMeshHelper.js'
import {WallAvoidanceBehavior, FuzzySeparationBehavior, FuzzyCohesionBehavior} from '../customs/Steering.js'

export default class {

    constructor(navMesh, entityManager) {

        this.objects = new THREE.Group();

        const navMeshHelper = createConvexRegionHelper(navMesh);
        // const graphHelper = createGraphHelper(navMesh.graph, 0.75);
        
        this.objects.add(navMeshHelper, /*graphHelper*/);

        entityManager.entities.forEach((entity, i) => {

            if (entity.active) {

                const pos = entity.position;
                const {x, y} = navMesh.randomPoint();
                //Path
                const points = navMesh.findPath(new YUKA.Vector3(pos.x, 0, pos.z), new YUKA.Vector3(x, 0, y));
                const path = new YUKA.Path();
                for (const point of points) {
                    path.add(point);
                }
                //Behaviors
                const obstacle = new YUKA.ObstacleAvoidanceBehavior(entityManager.entities);
                obstacle.weight = 1.0;
                obstacle.brakingWeight = entity.maxForce * 0.95;
                obstacle.dBoxMinLength = entity.boundingRadius * 2;
                entity.steering.add(obstacle);

                // const separation = new FuzzySeparationBehavior();
                // separation.weight = 0.3;
                // entity.steering.add(separation);

                const separation = new YUKA.SeparationBehavior();
                separation.weight = 1;
                entity.steering.add(separation);

                // const cohesion = new FuzzyCohesionBehavior();
                // cohesion.weight = 0.25;
                // entity.steering.add(cohesion);

                const cohesion = new YUKA.CohesionBehavior();
                cohesion.weight = 0.9;
                entity.steering.add(cohesion);

                const wall = new WallAvoidanceBehavior(navMesh);
                wall.weight = 0.25;
                entity.steering.add(wall);

                const follow = new YUKA.FollowPathBehavior(path);
                follow.weight = 1.0;
                entity.steering.add(follow);

                // const wander = new YUKA.WanderBehavior();
                // wander.weight = 1.0;
                // entity.steering.add(wander);

            }

        });

    }

}
