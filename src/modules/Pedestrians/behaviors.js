
import * as YUKA from 'yuka';

const desiredVelocity$2 = new YUKA.Vector3();
const displacement$3 = new YUKA.Vector3();

class ArriveBehavior extends YUKA.ArriveBehavior {

    constructor(target=null, deceleration=3, tolerance=1) {
        super(target, deceleration, tolerance);
    }

    calculate(vehicle, force/*, delta */) {

        if (this.target) {

            const target = this.target;
            const deceleration = this.deceleration;

            displacement$3.subVectors(target, vehicle.position);
            const distance = displacement$3.length();

            if (distance > this.tolerance) {
                //Calculate the speed required to reach the target given the desired deceleration
                let speed = distance / deceleration;
                //Make sure the speed does not exceed the max
                speed = Math.min(speed, vehicle.maxSpeed);
                //From here proceed just like "seek" except we don't need to normalize
                //the "displacement" vector because we have already gone to the trouble
                //of calculating its length.
                desiredVelocity$2.copy(displacement$3).multiplyScalar(speed / distance);

            } else {
                this.target = null;
                vehicle.stateMachine.changeTo('Idle');
            }

            force.subVectors(desiredVelocity$2, vehicle.velocity);

        }

        return force;
    }

}

export {
    ArriveBehavior,
};
