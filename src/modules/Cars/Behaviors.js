
import * as THREE from 'three';

import * as YUKA from 'yuka';

class brakingBehavior extends YUKA.SteeringBehavior {

    calculate(vehicle, force /*, delta */) {

        // vehicle.neighbors;

        // let closestObstacle = null;

        // // this will be used to track the distance to the closest obstacle

        // let distanceToClosestObstacle = Infinity;

        // // the detection box length is proportional to the agent's velocity

        // const dBoxLength = this.dBoxMinLength + ( vehicle.getSpeed() / vehicle.maxSpeed ) * this.dBoxMinLength;

        // vehicle.worldMatrix.getInverse( inverse );

        // for ( let i = 0, l = obstacles.length; i < l; i ++ ) {

        //     const obstacle = obstacles[ i ];

        //     if ( obstacle === vehicle ) continue;

        //     // calculate this obstacle's position in local space of the vehicle

        //     localPositionOfObstacle.copy( obstacle.position ).applyMatrix4( inverse );

        //     // if the local position has a positive z value then it must lay behind the agent.
        //     // besides the absolute z value must be smaller than the length of the detection box

        //     if ( localPositionOfObstacle.z > 0 && Math.abs( localPositionOfObstacle.z ) < dBoxLength ) {

        //         // if the distance from the x axis to the object's position is less
        //         // than its radius + half the width of the detection box then there is a potential intersection

        //         const expandedRadius = obstacle.boundingRadius + vehicle.boundingRadius;

        //         if ( Math.abs( localPositionOfObstacle.x ) < expandedRadius ) {

        //             // do intersection test in local space of the vehicle

        //             boundingSphere$1.center.copy( localPositionOfObstacle );
        //             boundingSphere$1.radius = expandedRadius;

        //             ray$1.intersectBoundingSphere( boundingSphere$1, intersectionPoint$1 );

        //             // compare distances

        //             if ( intersectionPoint$1.z < distanceToClosestObstacle ) {

        //                 // save new minimum distance

        //                 distanceToClosestObstacle = intersectionPoint$1.z;

        //                 // save closest obstacle

        //                 closestObstacle = obstacle;

        //                 // save local position for force calculation

        //                 localPositionOfClosestObstacle.copy( localPositionOfObstacle );

        //             }

        //         }

        //     }

        // }

        // // if we have found an intersecting obstacle, calculate a steering force away from it

        // if ( closestObstacle !== null ) {

        //     // the closer the agent is to an object, the stronger the steering force should be

        //     const multiplier = 1 + ( ( dBoxLength - localPositionOfClosestObstacle.z ) / dBoxLength );

        //     // calculate the lateral force

        //     force.x = ( closestObstacle.boundingRadius - localPositionOfClosestObstacle.x ) * multiplier;

        //     // apply a braking force proportional to the obstacles distance from the vehicle

        //     force.z = ( closestObstacle.boundingRadius - localPositionOfClosestObstacle.z ) * this.brakingWeight;

        //     // finally, convert the steering vector from local to world space (just apply the rotation)

        //     force.applyRotation( vehicle.rotation );

        // }

        return force;

    }

}

export {
    brakingBehavior,
};
