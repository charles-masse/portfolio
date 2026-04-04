
// import * as THREE from 'three';

import * as YUKA from 'yuka';

import {radiansToDegrees,} from '../utilities/math.js';

class StopSign extends YUKA.Trigger {

    constructor(region) {
        super(region);

        this.neighborhoodRadius = 5;
        this.maxNeighbors = 99;

    }

    execute(entity) {

        // let waypoint;

        // for (const behavior of entity.steering.behaviors) {

        //     if (behavior instanceof YUKA.FollowPathBehavior) {
        //         waypoint = behavior.path.current();
        //         break;
        //     }
            
        // }

        // const entity_direction = entity.getDirection(new YUKA.Vector3());
        // const waypoint_direction = entity.position.clone().sub(waypoint).normalize();

        // const angle = entity_direction.angleTo(waypoint_direction);
        
        // if (radiansToDegrees(angle) <= 75) {
        //     entity.stateMachine.changeTo('Idle');
        // }
        
    }

}

export {
    StopSign,
};
