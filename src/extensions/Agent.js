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

import {computeNewVelocity,} from '../core/RVO2.js';
import {LocomotionClip, BlendSpaces,} from '../core/BlendSpaces.js';
// import {AgentStateMachine,} from '../extensions/States.js';

import {absSq, distSqPointLineSegment,} from '../utilities/RVO2.js';

import {MAX_NEIGHBORS,} from '../settings.js';

function renderAgent(vehicle, renderComponent) {
    //Geo
    renderComponent.setMatrixAt(vehicle.agentId, vehicle.worldMatrix);
    //Attributes
    const instance_depth = renderComponent.geometry.getAttribute('instance_depth');
    instance_depth.array[vehicle.agentId] = new YUKA.Vector3(15, 7.5, 25).sub(vehicle.position).length(); //FIX ME
    instance_depth.needsUpdate = true;

    const current_frame = renderComponent.geometry.getAttribute('current_frame');
    current_frame.array[vehicle.agentId] = current_frame.array[vehicle.agentId] + 1;
    current_frame.needsUpdate = true;

    renderComponent.instanceMatrix.needsUpdate = true;

}

export default class extends YUKA.Vehicle {

    constructor(navMesh, id) {
        super();

        this.navMesh = navMesh
        this.agentId = id

        this.active = false;

        this.smoother = new YUKA.Smoother(20);

        // this.stateMachine = new AgentStateMachine(this);

        this.blendSpaces = new BlendSpaces(this);

        const idle = new LocomotionClip('idle');
        this.blendSpaces.add(idle);

        const walk = new LocomotionClip('walk');
        walk.locomotion.set(0, 0, 1.75);
        this.blendSpaces.add(walk);

        const walk45R = new LocomotionClip('walk45R');
        walk45R.locomotion.set(-1.125, 0, 1.125);
        this.blendSpaces.add(walk45R);

        const walk45L = new LocomotionClip('walk45L');
        walk45L.locomotion.set(1.125, 0, 1.125);
        this.blendSpaces.add(walk45L);

        const walk90L = new LocomotionClip('walk90L');
        walk90L.locomotion.set(1, 0, 0);
        this.blendSpaces.add(walk90L);

        const walk90R = new LocomotionClip('walk90R');
        walk90R.locomotion.set(-1, 0, 0);
        this.blendSpaces.add(walk90R);

        const walk180R = new LocomotionClip('walk180R');
        walk180R.locomotion.set(0, 0, -0.5);
        this.blendSpaces.add(walk180R);
        //KdTree neighbors
        this._agentNeighbors = [];
        this._obstacleNeighbors = [];

    }

    setActive(bool) {

        this.active = bool;

        if (bool) {

            const spawn_position = this.bestCandidate();
            this.position.copy(spawn_position);

            const pos = this.position;
            const {x, y} = this.navMesh.randomPoint();
            //Path
            const points = this.navMesh.findPath(new YUKA.Vector3(pos.x, 0, pos.z), new YUKA.Vector3(x, 0, y));
            const path = new YUKA.Path();
            for (const point of points) {
                path.add(point);
            }

            this.steering.behaviors[0].path = path;

        } else {
            this.position.set(0, -9999, 0); //Shadow Realm
            renderAgent(this, this._renderComponent);
        }

    }

    bestCandidate() {

        const entities = this.manager.entities.filter(entity => entity.active);

        let best;
        let maxDist = -Infinity;
        for (let i = 0; i < 10; i++) {

            const {x, y} = this.navMesh.randomPoint();
            const pos = new YUKA.Vector3(x, 0, y);

            const minDist = Math.min(...entities.map(entity => pos.distanceTo(entity.position)));

            if (minDist > maxDist) {

                maxDist = minDist;
                best = pos;

            }

        }

        return best;
    }

    setRenderComponent(renderComponent) {

        this._renderComponent = renderComponent;
        this._renderComponentCallback = renderAgent;

        return this;

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
        const optimal_velocity = computeNewVelocity(this);
        this.velocity.copy(new YUKA.Vector3(optimal_velocity.x, 0, optimal_velocity.y));
        //Find best clip for the job
        //TODO
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

        return this;
    }

}
