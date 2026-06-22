
import * as YUKA from 'yuka';

import {computeNewVelocity,} from '../../core/RVO2';
// import {LocomotionClip, BlendSpaces,} from '../../core/BlendSpaces.js';

import {StateMachine,} from '../../extensions/states.js';

import {CheerState, IdleState, RunState, WalkState,} from './states.js';

const steeringForce = new YUKA.Vector3();
const displacement = new YUKA.Vector3();
const acceleration = new YUKA.Vector3();
const target = new YUKA.Vector3();
const velocitySmooth = new YUKA.Vector3();

export default class extends YUKA.Vehicle {

    constructor(id=-1) {
        super();

        this.active = false;

        this.id = id;

        this.boundingRadius = 0.375;
        this.neighborhoodRadius = 4;
        this.maxNeighbors = 10;

        this.orca_timeHorizon = 4;
        this.orca_timeHorizonObst = 4;
        //Animation blending
        // agent.blendSpaces = new BlendSpaces(this);

        // const idle = new LocomotionClip('idle');
        // agent.blendSpaces.add(idle);

        // const walk = new LocomotionClip('walk');
        // walk.locomotion.set(0, 0, 1.75);
        // agent.blendSpaces.add(walk);

        // const walk45R = new LocomotionClip('walk45R');
        // walk45R.locomotion.set(-1.125, 0, 1.125);
        // agent.blendSpaces.add(walk45R);

        // const walk45L = new LocomotionClip('walk45L');
        // walk45L.locomotion.set(1.125, 0, 1.125);
        // agent.blendSpaces.add(walk45L);

        // const walk90L = new LocomotionClip('walk90L');
        // walk90L.locomotion.set(1, 0, 0);
        // agent.blendSpaces.add(walk90L);

        // const walk90R = new LocomotionClip('walk90R');
        // walk90R.locomotion.set(-1, 0, 0);
        // agent.blendSpaces.add(walk90R);

        // const walk180R = new LocomotionClip('walk180R');
        // walk180R.locomotion.set(0, 0, -0.5);
        // agent.blendSpaces.add(walk180R);
        //States
        this.stateMachine = new StateMachine(this);
        this.stateMachine.add('Cheer', new CheerState());
        this.stateMachine.add('Idle', new IdleState());
        this.stateMachine.add('Run', new RunState());
        this.stateMachine.add('Walk', new WalkState());
        
        this.stateMachine.changeTo('Walk');

    }

    setActive(bool) {

        this.active = bool;

        if (bool) {

            this.manager.active_agents.push(this);

            const id = this.manager.inactive_agents.indexOf(this);
            this.manager.inactive_agents.splice(id, 1);

        }

        else {

            this.position.set(0, -9999, 0); //Shadow Realm
            this._renderComponentCallback(this, this._renderComponent);

            this.manager.inactive_agents.push(this);

            const id = this.manager.active_agents.indexOf(this);
            this.manager.active_agents.splice(id, 1);

        }

    }

    handleMessage(telegram) {
        this.stateMachine.handleMessage(telegram);
    }

    update(delta) {

        if (this.maxSpeed != 0) {
            //Calculate steering force
            this.steering.calculate(delta, steeringForce);
            //Acceleration = force / mass
            acceleration.copy(steeringForce).divideScalar(this.mass);
            //Update velocity
            this.velocity.add(acceleration.multiplyScalar(delta));
            //Make sure vehicle does not exceed maximum speed
            if (this.getSpeedSquared() > (this.maxSpeed * this.maxSpeed)) {
                this.velocity.normalize();
                this.velocity.multiplyScalar(this.maxSpeed);
            }
            //Search for the best new velocity.
            const optimal_velocity = computeNewVelocity(this, delta);
            this.velocity.set(optimal_velocity.x, 0, optimal_velocity.y);
            //Calculate displacement
            displacement.copy(this.velocity).multiplyScalar(delta);
            //Calculate target position
            target.copy(this.position).add(displacement);
            // //Find path behavior
            // let path;
            // for (const behavior of this.steering.behaviors) {

            //     if (behavior instanceof YUKA.FollowPathBehavior) {
            //         path = behavior.path;

            //         break;
            //     }
                
            // }
            //Update the orientation if the vehicle has a non zero velocity
            if (this.updateOrientation === true && this.smoother === null && this.getSpeedSquared() > 0.00000001) {
                this.lookAt(target);
            }
            //Update position
            this.position.copy(target);
            //If smoothing is enabled, the orientation (not the position!) of the vehicle is
            //changed based on a post-processed velocity vector
            if (this.updateOrientation === true && this.smoother !== null) {

                this.smoother.calculate(this.velocity, velocitySmooth);

                displacement.copy(velocitySmooth).multiplyScalar(delta);
                target.copy(this.position).add(displacement);
                this.lookAt(target);

            }

        }

        this.stateMachine.update();
        //Reset activated triggers
        this.triggers = [];

        return this;
    }

}
