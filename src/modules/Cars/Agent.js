
import * as YUKA from 'yuka';

const targetRotation = new YUKA.Quaternion();
const targetDirection = new YUKA.Vector3();
const positionWorld = new YUKA.Vector3();
const quaternionWorld = new YUKA.Quaternion();

export default class extends YUKA.Vehicle {

    constructor(id) {
        super();

        this.active = false;

        this.id = id;

        this.maxSpeed = 6;
        this.maxTurnRate = Math.PI / 2;

        this.boundingRadius = 3;

        this.neighborhoodRadius = 10;
        this.maxNeighbors = 10;

        // this.smoother = new YUKA.Smoother(10);

    }

    rotateTo( target, delta, tolerance = 0.0001 ) {

        const parent = this.parent;

        if (parent !== null) {

            this.getWorldPosition(positionWorld);

            targetDirection.subVectors(target, positionWorld).normalize();

            targetRotation.lookAt(this.forward, targetDirection, this.up);

            quaternionWorld.extractRotationFromMatrix(parent.worldMatrix).inverse();

            targetRotation.premultiply(quaternionWorld);

        } else {

            targetDirection.subVectors(target, this.position).normalize();

            targetRotation.lookAt(this.forward, targetDirection, this.up);

        }

        const speed = (this.velocity.length() / this.maxSpeed);

        return this.rotation.rotateTo(targetRotation, (this.maxTurnRate * delta) * speed, tolerance);

    }

    update(delta) {

        const steeringForce = new YUKA.Vector3();
        const displacement = new YUKA.Vector3();
        const acceleration = new YUKA.Vector3();
        const target = new YUKA.Vector3();
        const velocitySmooth = new YUKA.Vector3();
        //Find path behavior
        let behavior;

        for (behavior of this.steering.behaviors) {

            if (behavior instanceof YUKA.FollowPathBehavior) {
                break;
            }

        }

        if (behavior.path.finished()) {

            const aid = this.manager.active_agents.indexOf(this);
            this.manager.active_agents.splice(aid, 1);

            this.manager.inactive_agents.push(this);
            this.position.set(0, -9999, 0);
            this.active = false;

        }
        //calculate steering force
        this.steering.calculate(delta, steeringForce);
        //acceleration = force / mass
        acceleration.copy(steeringForce).divideScalar(this.mass);
        //update velocity
        this.velocity.add(acceleration.multiplyScalar(delta));
        //make sure vehicle does not exceed maximum speed
        if (this.getSpeedSquared() > (this.maxSpeed * this.maxSpeed)) {

            this.velocity.normalize();
            this.velocity.multiplyScalar(this.maxSpeed);

        }
        //calculate displacement
        displacement.copy(this.velocity).multiplyScalar(delta);
        //calculate target position
        target.copy(this.position).add(displacement);
        //update the orientation if the vehicle has a non zero velocity
        if (this.updateOrientation === true && this.smoother === null && this.getSpeedSquared() > 0.00000001) {
            this.rotateTo(target, delta);
        }
        //update position
        this.position.copy(target);
        //if smoothing is enabled, the orientation (not the position!) of the vehicle is
        //changed based on a post-processed velocity vector
        if (this.updateOrientation === true && this.smoother !== null) {

            this.smoother.calculate(this.velocity, velocitySmooth);

            displacement.copy(velocitySmooth).multiplyScalar(delta);
            target.copy(this.position).add(displacement);

            this.rotateTo(target, delta);

        }

        return this;

    }

}
