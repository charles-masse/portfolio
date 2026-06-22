
import * as THREE from 'three';

import * as YUKA from 'yuka';

const steeringForce = new YUKA.Vector3();
const displacement = new YUKA.Vector3();
const acceleration = new YUKA.Vector3();
const target = new YUKA.Vector3();
const velocitySmooth = new YUKA.Vector3();

const up = new YUKA.Vector3(0, 1, 0);

const forward = new YUKA.Vector3();
const right = new YUKA.Vector3();

export default class extends YUKA.Vehicle {

    constructor(id=-1) {
        super();

        this.active = false;

        this.id = id;

        this.mass = 0.75;
        this.maxSpeed = 5;
        this.maxTurnRate = THREE.MathUtils.degToRad(5);

        this.boundingRadius = 2;
        this.maxNeighbors = 10;
        this.neighborhoodRadius = 10;

    }

    getLateralVelocity() {

        this.getDirection(forward);
        right.crossVectors(forward, up);

        return right.clone().multiplyScalar(right.dot(this.velocity));
    }

    update(delta) {
        //Find path behavior
        let path_behavior;

        for (const behavior of this.steering.behaviors) {

            if (behavior instanceof YUKA.FollowPathBehavior) {
                path_behavior = behavior;
                break;
            }

        }
        //Disable if at end of path
        if (path_behavior && path_behavior.path.finished()) {

            const aid = this.manager.active_agents.indexOf(this);
            this.manager.active_agents.splice(aid, 1);

            this.manager.inactive_agents.push(this);
            this.position.set(0, -9999, 0);
            this.active = false;

        }
        //Calculate steering force
        this.steering.calculate(delta, steeringForce);
        //Acceleration = Force / Mass
        acceleration.copy(steeringForce).divideScalar(this.mass);
        //Update velocity
        this.velocity.add(acceleration.multiplyScalar(delta));
        //Make sure vehicle does not exceed maximum speed
        if ( this.getSpeedSquared() > (this.maxSpeed * this.maxSpeed) ) {
            this.velocity.normalize();
            this.velocity.multiplyScalar(this.maxSpeed);
        }
        //Calculate displacement
        displacement.copy(this.velocity).multiplyScalar(delta);
        //Calculate target position
        target.copy(this.position).add(displacement);
        //Update the orientation if the vehicle has a non zero velocity
        if (this.updateOrientation === true && this.smoother === null && this.getSpeedSquared() > 0.00000001) {
            this.rotateTo(target, displacement.length());
        }
        //Update position
        this.position.copy(target);
        //If smoothing is enabled, the orientation (not the position!) of the vehicle is
        //changed based on a post-processed velocity vector
        if (this.updateOrientation === true && this.smoother !== null) {

            this.smoother.calculate(this.velocity, velocitySmooth);

            displacement.copy(velocitySmooth).multiplyScalar(delta);
            target.copy(this.position).add(displacement);

            this.rotateTo(target, displacement.length());

        }

        return this;
    }

}
