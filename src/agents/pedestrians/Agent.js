/*
 * This is a conversion of the RVO2 Library to JavaScript/Three.js/Yuka.
 *
 * Copyright 2008 University of North Carolina at Chapel Hill
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as THREE from 'three';

import * as YUKA from 'yuka';

import {computeNewVelocity,} from '../../core/ORCA.js';
// import {LocomotionClip, BlendSpaces,} from '../../core/BlendSpaces.js';
import {GoToState, DeadState,} from './States.js';

import {absSq, distSqPointLineSegment,} from '../../utilities/RVO2.js';

import {MAX_NEIGHBORS,} from '../../settings.js';

export default class extends YUKA.Vehicle {

    constructor(id) {
        super();

        this.agentId = id

        this.active = false;

        this.neighborhoodRadius = 1.8;
        this.boundingRadius = 0.4;

        this.smoother = new YUKA.Smoother(20);
        
        this.stateMachine = new YUKA.StateMachine(this);
        this.stateMachine.add('GoTo', new GoToState());
        this.stateMachine.add('Dead', new DeadState());
        
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
        //Steering
        const follow = new YUKA.FollowPathBehavior();
        this.steering.add(follow);
        //ORCA
        this.timeHorizon = 3;
        this.timeHorizonObst = 6;

        this._agentNeighbors = [];
        this._obstacleNeighbors = [];

    }

    setActive(bool) {

        this.active = bool;

        if (bool) {

            this.stateMachine.changeTo('GoTo');

        } 

        else {

            this.stateMachine.changeTo('Dead');
            this._renderComponentCallback(this, this._renderComponent);

        }

    }

    insertAgentNeighbor(agent) {

        if (this != agent) {

            const distSq = absSq(this.position.clone().sub(agent.position));

            if (distSq < this._rangeSq) {

                if (this._agentNeighbors.length < MAX_NEIGHBORS) {
                    this._agentNeighbors.push([distSq, agent]);
                }

                let i = this._agentNeighbors.length - 1;
                while (i != 0 && distSq < this._agentNeighbors[i - 1][0]) {
                    this._agentNeighbors[i] = this._agentNeighbors[i - 1];
                    --i;
                }

                this._agentNeighbors[i] = [distSq, agent];

                if (this._agentNeighbors.length == MAX_NEIGHBORS) {
                    this._rangeSq = this._agentNeighbors[this._agentNeighbors.length - 1][0];
                }

            }
            
        }

    }

    insertObstacleNeighbor(obstacle) {

        const nextObstacle = obstacle.nextObstacle;

        const distSq = distSqPointLineSegment(obstacle.point, nextObstacle.point, new THREE.Vector2(this.position.x, this.position.z));

        if (distSq < this._rangeSq) {
            this._obstacleNeighbors.push([distSq, obstacle]);

            let i = this._obstacleNeighbors.length - 1;

            while (i != 0 && distSq < this._obstacleNeighbors[i - 1][0]) {

                this._obstacleNeighbors[i] = this._obstacleNeighbors[i - 1];
                --i;

            }

            this._obstacleNeighbors[i] = [distSq, obstacle];

        }

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
