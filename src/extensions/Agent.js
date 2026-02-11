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

import {AgentStateMachine,} from '../extensions/States.js';

import {absSq, det, leftOf, sqr, distSqPointLineSegment, abs,} from '../utilities/RVO2.js';

import {MAX_NEIGHBORS, TIME_STEP, RVO_EPSILON,} from '../settings.js';

class Line {

    constructor() {

        this.point = null;
        this.direction = null;

    }

}

function renderAgent(vehicle, renderComponent) {
    //Geo
    renderComponent.setMatrixAt(vehicle.agentId, vehicle.worldMatrix);
    //Attributes
    const instance_frame_attribute = renderComponent.geometry.getAttribute('current_frame');
    instance_frame_attribute.array[vehicle.agentId] = vehicle.stateMachine.currentState.current_frame;
    instance_frame_attribute.needsUpdate = true;

    renderComponent.instanceMatrix.needsUpdate = true;

}

export default class extends YUKA.Vehicle {

    constructor(navMesh, id) {
        super();

        this.navMesh = navMesh
        this.agentId = id

        this.stateMachine = new AgentStateMachine(this);

        this._agentNeighbors = [];
        this._obstacleNeighbors = [];

        this.active = false;

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

    computeNewVelocity() {

        const newVelocity = new THREE.Vector2();

        const position = new THREE.Vector2(this.position.x, this.position.z);
        const velocity = new THREE.Vector2(this.velocity.x, this.velocity.z);

        this._orcaLines = [];

        const invTimeHorizonObst = 1 / this.timeHorizonObst;
        //Create obstacle ORCA lines.
        for (let i = 0; i < this._obstacleNeighbors.length; ++i) {

            let obstacle1 = this._obstacleNeighbors[i][1];
            let obstacle2 = obstacle1.nextObstacle;

            const relativePosition1 = obstacle1.point.clone().sub(position);
            const relativePosition2 = obstacle2.point.clone().sub(position);
            //Check if velocity obstacle of obstacle is already taken care of by previously constructed obstacle ORCA lines.
            let alreadyCovered = false;
            for (let j = 0; j < this._orcaLines.length; ++j) {

                if (det(relativePosition1.clone().multiplyScalar(invTimeHorizonObst).sub(this._orcaLines[j].point), this._orcaLines[j].direction) - invTimeHorizonObst * this.boundingRadius >= -RVO_EPSILON && det(relativePosition2.clone().multiplyScalar(invTimeHorizonObst).sub(this._orcaLines[j].point), this._orcaLines[j].direction) - invTimeHorizonObst * this.boundingRadius >=  -RVO_EPSILON) {
                    alreadyCovered = true;
                    break;
                }

            }

            if (alreadyCovered) continue;
            //Not yet covered. Check for collisions.
            const distSq1 = absSq(relativePosition1);
            const distSq2 = absSq(relativePosition2);

            const radiusSq = sqr(this.boundingRadius);

            const obstacleVector = obstacle2.point.clone().sub(obstacle1.point);
            const s = -relativePosition1.dot(obstacleVector) / absSq(obstacleVector);
            const distSqLine = absSq(relativePosition1.clone().negate().sub(obstacleVector.clone().multiplyScalar(s)));

            const line = new Line();

            if (s < 0 && distSq1 <= radiusSq) {
                //Collision with left vertex. Ignore if non-convex.
                if (obstacle1.isConvex) {
                    line.point = new THREE.Vector2(0, 0);
                    line.direction = new THREE.Vector2(-relativePosition1.y, relativePosition1.x).normalize();
                    this._orcaLines.push(line);
                }

                continue;

            } else if (s > 1 && distSq2 <= radiusSq) {
                //Collision with right vertex. Ignore if non-convex
                //or if it will be taken care of by neighoring obstacle
                if (obstacle2.isConvex && det(relativePosition2, obstacle2.unitDir) >= 0) {
                    line.point = new THREE.Vector2(0, 0);
                    line.direction = new THREE.Vector2(-relativePosition2.y, relativePosition2.x).normalize();
                    this._orcaLines.push(line);
                }

                continue;

            } else if (s >= 0 && s < 1 && distSqLine <= radiusSq) {
                line.point = new THREE.Vector2(0, 0);
                line.direction = obstacle1.unitDir.clone().negate();
                this._orcaLines.push(line);

                continue;
            }
            //No collision.
            //Compute legs. When obliquely viewed, both legs can come from a single vertex. Legs extend cut-off line when nonconvex vertex.

            let leftLegDirection = new THREE.Vector2();
            let rightLegDirection = new THREE.Vector2();

            if (s < 0 && distSqLine <= radiusSq) {
                //Obstacle viewed obliquely so that left vertex defines velocity obstacle.
                //Ignore obstacle.
                if (!obstacle1.isConvex) continue;

                obstacle2 = obstacle1;

                const leg1 = Math.sqrt(distSq1 - radiusSq);
                leftLegDirection.set(relativePosition1.x * leg1 - relativePosition1.y * this.boundingRadius, relativePosition1.x * this.boundingRadius + relativePosition1.y * leg1).divideScalar(distSq1);
                rightLegDirection.set(relativePosition1.x * leg1 + relativePosition1.y * this.boundingRadius, -relativePosition1.x * this.boundingRadius + relativePosition1.y * leg1).divideScalar(distSq1);

            } else if (s > 1&& distSqLine <= radiusSq) {
                //Obstacle viewed obliquely so that right vertex defines velocity obstacle.
                //Ignore obstacle.
                if (!obstacle2.isConvex) continue;

                obstacle1 = obstacle2;

                const leg2 = Math.sqrt(distSq2 - radiusSq);
                leftLegDirection.set(relativePosition2.x * leg2 - relativePosition2.y * this.boundingRadius, relativePosition2.x * this.boundingRadius + relativePosition2.y * leg2).divideScalar(distSq2);
                rightLegDirection.set(relativePosition2.x * leg2 + relativePosition2.y * this.boundingRadius, -relativePosition2.x * this.boundingRadius + relativePosition2.y * leg2).divideScalar(distSq2);

            } else {
                //Usual situation.
                if (obstacle1.isConvex) {
                    const leg1 = Math.sqrt(distSq1 - radiusSq);
                    leftLegDirection.set(relativePosition1.x * leg1 - relativePosition1.y * this.boundingRadius, relativePosition1.x * this.boundingRadius + relativePosition1.y * leg1).divideScalar(distSq1);
                } else {
                    leftLegDirection = obstacle1.unitDir.clone().negate();
                }

                if (obstacle2.isConvex) {
                    const leg2 = Math.sqrt(distSq2 - radiusSq);
                    rightLegDirection.set(relativePosition2.x * leg2 + relativePosition2.y * this.boundingRadius, -relativePosition2.x * this.boundingRadius + relativePosition2.y * leg2).divideScalar(distSq2);
                } else {
                    rightLegDirection = obstacle1.unitDir.clone();
                }

            }
            //Legs can never point into neighboring edge when convex vertex, take cutoff-line of neighboring edge instead.
            //If velocity projected on "foreign" leg, no constraint is added.
            const leftNeighbor = obstacle1.prevObstacle;

            let isLeftLegForeign = false;
            let isRightLegForeign = false;

            if (obstacle1.isConvex && det(leftLegDirection, leftNeighbor.unitDir.clone().negate()) >= 0) {
                //Left leg points into obstacle.
                leftLegDirection = leftNeighbor.unitDir.clone().negate();
                isLeftLegForeign = true;
            }

            if (obstacle2.isConvex && det(rightLegDirection, obstacle2.unitDir) <= 0) {
                //Right leg points into obstacle.
                rightLegDirection = obstacle2.unitDir;
                isRightLegForeign = true;
            }
            //Compute cut-off centers.
            const leftCutoff =  obstacle1.point.clone()
                .sub(position)
                .multiplyScalar(invTimeHorizonObst);

            const rightCutoff = obstacle2.point.clone()
                .sub(position)
                .multiplyScalar(invTimeHorizonObst);

            const cutoffVec = rightCutoff.clone().sub(leftCutoff);
            //Project current velocity on velocity obstacle.
            //Check if current velocity is projected on cutoff circles.
            const t = (obstacle1 == obstacle2 ? 0.5 : velocity.clone().sub(leftCutoff).dot(cutoffVec) / absSq(cutoffVec));
            const tLeft = velocity.clone().sub(leftCutoff).dot(leftLegDirection);
            const tRight = velocity.clone().sub(rightCutoff).dot(rightLegDirection);

            if ((t < 0 && tLeft < 0) || (obstacle1 == obstacle2 && tLeft < 0 && tRight < 0)) {
                //Project on left cut-off circle.
                const unitW = velocity.clone().sub(leftCutoff).normalize();

                line.direction = new THREE.Vector2(unitW.y, -unitW.x);
                line.point = leftCutoff.clone().add(unitW.clone().multiplyScalar(this.boundingRadius * invTimeHorizonObst));
                this._orcaLines.push(line);
                continue;

            } else if (t > 1 && tRight < 0) {
                //Project on right cut-off circle.
                const unitW = velocity.clone().sub(rightCutoff).normalize();

                line.direction = new THREE.Vector2(unitW.y, -unitW.x);
                line.point = rightCutoff.clone().add(unitW.clone().multiplyScalar(this.boundingRadius * invTimeHorizonObst));
                this._orcaLines.push(line);
                continue;

            }
            //Project on left leg, right leg, or cut-off line, whichever is closest to velocity.
            const distSqCutoff = (t < 0 || t > 1 || obstacle1 == obstacle2) ? Infinity : absSq(velocity.clone().sub(leftCutoff.clone().add(cutoffVec.clone().multiplyScalar(t))));
            const distSqLeft = (tLeft < 0) ? Infinity : absSq(velocity.clone().sub(leftCutoff.clone().add(tLeft * leftLegDirection)));
            const distSqRight = (tRight < 0) ? Infinity : absSq(velocity.clone().sub(rightCutoff.clone().add(tRight * rightLegDirection)));

            if (distSqCutoff <= distSqLeft && distSqCutoff <= distSqRight) {
                //Project on cut-off line.
                line.direction = obstacle1.unitDir.clone().negate();
                line.point = leftCutoff.clone().add(new THREE.Vector2(-line.direction.y, line.direction.x).multiplyScalar(this.boundingRadius * invTimeHorizonObst));
                this._orcaLines.push(line);
                continue;

            } else if (distSqLeft <= distSqRight) {
                //Project on left leg.
                if (isLeftLegForeign) continue;

                line.direction = leftLegDirection;
                line.point = leftCutoff.clone().add(new THREE.Vector2(-line.direction.y, line.direction.x).multiplyScalar(this.boundingRadius * invTimeHorizonObst));
                this._orcaLines.push(line);
                continue;

            } else {
                //Project on right leg.
                if (isRightLegForeign) continue;

                line.direction = rightLegDirection.clone().negate();
                line.point = rightCutoff.clone().add(new THREE.Vector2(-line.direction.y, line.direction.x).multiplyScalar(this.boundingRadius * invTimeHorizonObst));
                this._orcaLines.push(line);
                continue;

            }

        }

        const numObstLines = this._orcaLines.length;
        const invTimeHorizon = 1.0 / this.timeHorizon;
        //Create agent ORCA lines.
        for (let i = 0; i < this._agentNeighbors.length; ++i) {

            const other = this._agentNeighbors[i][1];
            const other_position = new THREE.Vector2(other.position.x, other.position.z);
            const other_velocity = new THREE.Vector2(other.velocity.x, other.velocity.z);

            const relativePosition = other_position.clone().sub(position);
            const relativeVelocity = velocity.clone().sub(other_velocity);

            const distSq = absSq(relativePosition);
            const combinedRadius = this.boundingRadius + other.boundingRadius;
            const combinedRadiusSq = sqr(combinedRadius);

            const line = new Line();
            const u = new THREE.Vector2();

            if (distSq > combinedRadiusSq) {
                //No collision.
                const w = relativeVelocity.clone().sub(relativePosition.clone().multiplyScalar(invTimeHorizon));
                //Vector from cutoff center to relative velocity.
                const wLengthSq = absSq(w);

                const dotProduct1 = w.dot(relativePosition);

                if (dotProduct1 < 0 && sqr(dotProduct1) > combinedRadiusSq * wLengthSq) {
                    //Project on cut-off circle.
                    const wLength = Math.sqrt(wLengthSq);
                    const unitW = w.clone().divideScalar(wLength);

                    line.direction = new THREE.Vector2(unitW.y, -unitW.x);
                    u.set(unitW.clone().multiplyScalar(combinedRadius * invTimeHorizon - wLength));

                } else {
                    //Project on legs.
                    const leg = Math.sqrt(distSq - combinedRadiusSq);

                    if (det(relativePosition, w) > 0) {
                        //Project on left leg.
                        line.direction = new THREE.Vector2(relativePosition.x * leg - relativePosition.y * combinedRadius, relativePosition.x * combinedRadius + relativePosition.y * leg).divideScalar(distSq);

                    } else {
                        //Project on right leg.
                        line.direction = new THREE.Vector2(relativePosition.x * leg + relativePosition.y * combinedRadius, -relativePosition.x * combinedRadius + relativePosition.y * leg).divideScalar(distSq).negate();

                    }

                    const dotProduct2 = relativeVelocity.dot(line.direction);

                    u.copy(line.direction.clone().multiplyScalar(dotProduct2).sub(relativeVelocity));
                
                }

            } else {
                //Collision. Project on cut-off circle of time timeStep.
                const invTimeStep = 1.0 / TIME_STEP;
                //Vector from cutoff center to relative velocity.
                const w = relativeVelocity.clone().sub(relativePosition.clone().multiplyScalar(invTimeStep));

                const wLength = abs(w);
                const unitW = w.clone().divideScalar(wLength);

                line.direction = new THREE.Vector2(unitW.y, -unitW.x);
                u.copy(unitW.clone().multiplyScalar(combinedRadius * invTimeStep - wLength));

            }

            line.point = velocity.clone().add(u.clone().multiplyScalar(0.5));
            this._orcaLines.push(line);

        }

        const lineFail = this.linearProgram2(this._orcaLines, velocity, false, newVelocity);

        if (lineFail < this._orcaLines.length) {
            this.linearProgram3(this._orcaLines, numObstLines, lineFail, newVelocity)
        }

        
        return newVelocity
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
        const optimal_velocity = this.computeNewVelocity();
        this.velocity.copy(new YUKA.Vector3(optimal_velocity.x, 0, optimal_velocity.y));
        //Find best clip for the job
        //TODO
        this.stateMachine.update();
        const current_state = this.stateMachine.currentState;
        //Update the orientation and position TODO blended transforms
        this.lookAt(this.position.clone().add(current_state.direction));
        this.position.add(current_state.locomotion.clone().multiplyScalar(delta));
        //If smoothing is enabled, the orientation (not the position!) of the vehicle is changed based on a post-processed velocity vector
        //KEEP FOR NOW, MIGHT BE USEFUL
        // const velocitySmooth = new YUKA.Vector3();

        // if (this.updateOrientation === true && this.smoother !== null) {

        //     this.smoother.calculate(this.velocity, velocitySmooth);

        //     displacement.copy(velocitySmooth).multiplyScalar(delta);
        //     target.copy(this.position).add(displacement);

        //     this.lookAt(target);

        // }

        return this;
    }

    linearProgram1(lines, lineNo, optVelocity, directionOpt, result) {

        const dotProduct = lines[lineNo].point.clone().dot(lines[lineNo].direction);
        const discriminant = sqr(dotProduct) + sqr(this.maxSpeed) - absSq(lines[lineNo].point);
        //Max speed circle fully invalidates line lineNo.
        if (discriminant < 0) return false;

        const sqrtDiscriminant = Math.sqrt(discriminant);
        let tLeft = -dotProduct - sqrtDiscriminant;
        let tRight = -dotProduct + sqrtDiscriminant;

        for (let i = 0; i < lineNo; ++i) {

            const denominator = det(lines[lineNo].direction, lines[i].direction);
            const numerator = det(lines[i].direction, lines[lineNo].point.clone().sub(lines[i].point));

            if (Math.abs(denominator) <= RVO_EPSILON) {
                //Lines lineNo and i are (almost) parallel.
                if (numerator < 0) {
                    return false;
                } else {
                    continue;
                }

            }

            const t = numerator / denominator;

            if (denominator >= 0) {
                //Line i bounds line lineNo on the right.
                tRight = Math.min(tRight, t);
            }
            else {
                //Line i bounds line lineNo on the left.
                tLeft = Math.max(tLeft, t);
            }

            if (tLeft > tRight) return false;
        }

        if (directionOpt) {
            //Optimize direction.
            if (optVelocity.clone().dot(lines[lineNo].direction) > 0) {
                //Take right extreme.
                result.copy(lines[lineNo].point).add(lines[lineNo].direction.clone().multiplyScalar(tRight));
            }
            else {
                //Take left extreme.
                result.copy(lines[lineNo].point).add(lines[lineNo].direction.clone().multiplyScalar(tLeft));
            }

        } else {
            //Optimize closest point.
            const t = lines[lineNo].direction.dot(optVelocity.clone().sub(lines[lineNo].point));

            if (t < tLeft) {
                result.copy(lines[lineNo].point).add(lines[lineNo].direction.clone().multiplyScalar(tLeft));
            } else if (t > tRight) {
                result.copy(lines[lineNo].point).add(lines[lineNo].direction.clone().multiplyScalar(tRight));
            } else {
                result.copy(lines[lineNo].point).add(lines[lineNo].direction.clone().multiplyScalar(t));
            }
        }

        return true;
    }

    linearProgram2(lines, optVelocity, directionOpt, result) {

        if (directionOpt) {
            //Optimize direction. Note that the optimization velocity is of unit length in this case.
            result.copy(optVelocity.clone().multiplyScalar(this.maxSpeed));

        } else if (absSq(optVelocity) > sqr(this.maxSpeed)) {
            //Optimize closest point and outside circle.
            result.copy(optVelocity.clone().normalize().multiplyScalar(this.maxSpeed));

        } else {
            //Optimize closest point and inside circle.
            result.copy(optVelocity);
        }

        for (let i = 0; i < lines.length; ++i) {
            if (det(lines[i].direction, lines[i].point.clone().sub(result)) > 0) {
                //Result does not satisfy constraint i. Compute new optimal result.
                const tempResult = result.clone();

                if (!this.linearProgram1(lines, i, optVelocity, directionOpt, result)) {
                    result.copy(tempResult);

                    return i;
                }

            }

        }

        return lines.length;
    }

    linearProgram3(lines, numObstLines, beginLine, result) {

        let distance = 0;

        for (let i = beginLine; i < lines.length; ++i) {
            if (det(lines[i].direction, lines[i].point.clone().sub(result)) > distance) {
                //Result does not satisfy constraint of line i.
                const projLines = this._orcaLines.slice(0, numObstLines);

                for (let j = numObstLines; j < i; ++j) {

                    const line = new Line();

                    let determinant = det(lines[i].direction, lines[j].direction);

                    if (Math.abs(determinant) <= RVO_EPSILON) {
                        //Line i and line j are parallel.
                        if (lines[i].direction.clone().dot(lines[j].direction) > 0) {
                            //Line i and line j point in the same direction.
                            continue;

                        } else {
                            //Line i and line j point in opposite direction.
                            line.point = lines[i].point.clone().add(lines[j].point).multiplyScalar(0.5);

                        }

                    } else {
                        line.point = lines[i].point.clone().add(lines[i].direction.clone().multiply(det(lines[j].direction, lines[i].point.clone().sub(lines[j].point)) / determinant));
                    }

                    line.direction = lines[j].direction.clone().sub(lines[i].direction).normalize();
                    projLines.push(line);

                }

                const tempResult = result.clone();

                if (this.linearProgram2(projLines, new THREE.Vector2(-lines[i].direction.y, lines[i].direction.x), true, result) < projLines.length) {
                    //This should in principle not happen.  The result is by definition already in the feasible  region of this linear program.
                    //If it fails, it is due to small floating point error, and the current result is kept.
                    result.copy(tempResult);
                }

                distance = det(lines[i].direction, lines[i].point.clone().sub(result));

            }

        }

    }

}
