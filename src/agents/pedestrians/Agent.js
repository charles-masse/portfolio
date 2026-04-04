
// import * as THREE from 'three';

import * as YUKA from 'yuka';

import {computeNewVelocity,} from '../../core/ORCA.js';
// import {LocomotionClip, BlendSpaces,} from '../../core/BlendSpaces.js';
import {GoToState, IdleState, CheerState, InteractState, DeadState,} from './States.js';

import {StateMachine,} from '../../extensions/States.js';
import {Path,} from '../../extensions/Navigation.js';

const EXITS = [
    new YUKA.Vector3(-23, 0, -20),
    new YUKA.Vector3(23, 0, -20),
    new YUKA.Vector3(-40, 0, -20),
    new YUKA.Vector3(40, 0, -20),
    new YUKA.Vector3(-10, 0, 50),
    new YUKA.Vector3(10, 0, 50),
];

export default class extends YUKA.Vehicle {

    constructor(id) {
        super();

        this.agentId = id; //TODO Does it need to be in the agent--render component might not be the best for that

        this.active = false;

        this.boundingRadius = 0.4;

        this.neighborhoodRadius = 1.8;
        this.maxNeighbors = 15;

        this.canActivateTrigger = true;
        
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

        this.stateMachine.add('GoTo', new GoToState());
        this.stateMachine.add('Idle', new IdleState());
        this.stateMachine.add('Interact', new InteractState());
        this.stateMachine.add('Cheer', new CheerState());
        this.stateMachine.add('Dead', new DeadState());

        this.stateMachine.changeTo('Dead');

        this.smoother = new YUKA.Smoother(20);
        //ORCA
        this.timeHorizon = 3;
        this.timeHorizonObst = 6;

    }
    //TODO Should be handled by the module
    bestCandidate() {

        let best;
        let maxDist = -Infinity;
        for (let i = 0; i < 10; i++) {

            const {x, y} = this.manager.navMesh.randomPoint();
            const pos = new YUKA.Vector3(x, 0, y);

            const minDist = Math.min(...this.manager.agents.map(entity => pos.distanceTo(entity.position)));

            if (minDist > maxDist) {

                maxDist = minDist;
                best = pos;

            }

        }

        return best;
    }

    setActive(bool) {

        this.active = bool;

        if (bool) {

            if (this.manager.user_input) {
                this.position.copy(this.bestCandidate());
            }
            //TODO Exits should be managed in the module
            else {
                const test = YUKA.MathUtils.choice(EXITS);
                this.position.copy(test);
            }
            //Goal
            const path = new Path();
            const test = YUKA.MathUtils.choice(EXITS);

            for (const point of this.manager.navMesh.findPath(this.position, test)) {
                path.add(point);
            }
            //Find behavior
            for (const behavior of this.steering.behaviors) {
                if (behavior instanceof YUKA.FollowPathBehavior) {
                    behavior.path = path;

                    break;
                }
                
            }

            this.stateMachine.changeTo('GoTo');

            const index = this.manager.inactive_agents.indexOf(this);
            this.manager.inactive_agents.splice(index, 1);
            this.manager.active_agents.push(this);

        }

        else {

            this.stateMachine.changeTo('Dead');

            this.position.set(0, -9999, 0); //Shadow Realm
            this._renderComponentCallback(this, this._renderComponent);

            const index = this.manager.active_agents.indexOf(this);
            this.manager.active_agents.splice(index, 1);
            this.manager.inactive_agents.push(this);
            
        }

    }

    handleMessage(telegram) {
        this.stateMachine.handleMessage(telegram);
    }

    update(delta) {
        //Calculate steering force
        const steeringForce = new YUKA.Vector3();
        const acceleration = new YUKA.Vector3();

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
        //TODO clip velocity to navmesh
        //Search for the best new velocity.
        const optimal_velocity = computeNewVelocity(this); //TODO Use the original RVO2 library in C++
        this.velocity.copy(new YUKA.Vector3(optimal_velocity.x, 0, optimal_velocity.y));
        //Calculate displacement
        const displacement = new YUKA.Vector3();
        displacement.copy(this.velocity).multiplyScalar(delta);
        //Calculate target position
        const target = new YUKA.Vector3();
        target.copy(this.position).add(displacement);
        //Update the orientation if the vehicle has a non zero velocity
        if (this.updateOrientation === true && this.smoother === null && this.getSpeedSquared() > 0.00000001) {
            this.lookAt(target);
        }
        //Update position
        this.position.copy(target);
        //If smoothing is enabled, the orientation (not the position!) of the vehicle is changed based on a post-processed velocity vector
        const velocitySmooth = new YUKA.Vector3();

        if (this.updateOrientation === true && this.smoother !== null) {

            this.smoother.calculate(this.velocity, velocitySmooth);

            displacement.copy(velocitySmooth).multiplyScalar(delta);
            target.copy(this.position).add(displacement);

            this.lookAt(target);

        }

        this.stateMachine.update();

        return this;
    }

}
