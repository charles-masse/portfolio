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
 *
 */
import * as THREE from 'three';

import * as YUKA from 'yuka';
/*
 * \brief      Computes the square of a float.
 * \param      a               The float to be squared.
 * \return     The square of the float.
 */
function sqr(a) {
    return a * a;
}
/*
 * brief      Computes the determinant of a two-dimensional square matrix with rows consisting of the specified two-dimensional vectors.
 * param      vector1         The top row of the two-dimensional square matrix.
 * param      vector2         The bottom row of the two-dimensional square matrix.
 * return     The determinant of the two-dimensional square matrix.
 */
function det(v1, v2) {
    return v1.x * v2.y - v1.y * v2.x;
}
/*``
 * brief      Computes the squared length of a specified two-dimensional vector.
 * param      vector          The two-dimensional vector whose squared length is to be computed.
 * return     The squared length of the two-dimensional vector.
 */
function absSq(v) {
    return v.dot(v);
}
/**
 * brief      Computes the signed distance from a line connecting the specified points to a specified point.
 * param      a               The first point on the line.
 * param      b               The second point on the line.
 * param      c               The point to which the signed distance is to be calculated.
 * return     Positive when the point c lies to the left of the line ab.
 */
function leftOf(a, b, c) {
    return det(a.clone().sub(c), b.clone().sub(a));
}
/*
 * \brief      Computes the squared distance from a line segment with the specified endpoints to a specified point.
 * \param      a               The first endpoint of the line segment.
 * \param      b               The second endpoint of the line segment.
 * \param      c               The point to which the squared distance is to be calculated.
 * \return     The squared distance from the line segment to the point.
 */
function distSqPointLineSegment(a, b, c) {

    const ab = b.clone().sub(a);
    const ac = c.clone().sub(a);
    const bc = c.clone().sub(b);

    const r = ac.dot(ab) / absSq(ab);

    if (r < 0) {
        return absSq(ac);
    } else if (r > 1) {
        return absSq(bc);
    } else {
        return absSq(c.clone().sub(a.clone().add(ab.clone().multiplyScalar(r))));
    }

}

function v2abs(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
}

function getPointsFromMesh(mesh) {

    mesh.updateMatrixWorld(true);

    const points = [];

    const pt = new THREE.Vector3();

    const positions = mesh.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {

        pt.fromBufferAttribute(positions, i);
        pt.applyMatrix4(mesh.matrixWorld);
        points.push(pt.clone());

    }

    return points;
}

class Line {

    constructor() {

        this.point = null;
        this.direction = null;

    }

}

class Obstacle {

    constructor() {

        this.point = null;
        // this.manager = null;
        this.prevObstacle = null;
        this.nextObstacle = null;
        this.unitDir = null;
        this.isConvex = null;

    }

}

class Agent extends YUKA.Vehicle {

    constructor(navMesh) {
        super();

        this.navMesh = navMesh;

        this.active = false;

        this.maxSpeed = 1;
        //Social forces
        this.maxForce = 1.05;
        //RVO2
        this._agentNeighbors = [];
        this._obstacleNeighbors = [];

        this.maxNeighbors = 10;
        this.boundingRadius = 0.3;
        this.timeHorizon = 5;
        this.timeHorizonObst = 5;
        // // State machine
        // this.stateMachine = new AgentStateMachine(this);

    }

    setActive(bool) {

        this.active = bool;
        if (!bool) this.position.set(0, -9999, 0); //Shadow Realm

    }

    computeNewVelocity() {

        const position = new THREE.Vector2(this.position.x, this.position.z);
        const velocity = new THREE.Vector2(this.velocity.x, this.velocity.z);

        this.orcaLines = [];

        const invTimeHorizonObst = 1 / this.timeHorizonObst;
        //Create obstacle ORCA lines.
        for (let i = 0; i < this._obstacleNeighbors.length; ++i) {

            let obstacle1 = this._obstacleNeighbors[i][1];
            let obstacle2 = obstacle1.nextObstacle;

            const relativePosition1 = obstacle1.point.clone().sub(position);
            const relativePosition2 = obstacle2.point.clone().sub(position);
            //Check if velocity obstacle of obstacle is already taken care of by
            //previously constructed obstacle ORCA lines.
            let alreadyCovered = false;
            for (let j = 0; j < this.orcaLines.length; ++j) {

                if (det(relativePosition1.clone().multiplyScalar(invTimeHorizonObst).sub(this.orcaLines[j].point), this.orcaLines[j].direction) - invTimeHorizonObst * this.boundingRadius >= -RVO_EPSILON && det(relativePosition2.clone().multiplyScalar(invTimeHorizonObst).sub(this.orcaLines[j].point), this.orcaLines[j].direction) - invTimeHorizonObst * this.boundingRadius >=  -RVO_EPSILON) {
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
                    this.orcaLines.push(line);
                }

                continue;

            } else if (s > 1 && distSq2 <= radiusSq) {
                //Collision with right vertex. Ignore if non-convex
                //or if it will be taken care of by neighoring obstacle
                if (obstacle2.isConvex && det(relativePosition2, obstacle2.unitDir) >= 0) {
                    line.point = new THREE.Vector2(0, 0);
                    line.direction = new THREE.Vector2(-relativePosition2.y, relativePosition2.x).normalize();
                    this.orcaLines.push(line);
                }

                continue;

            } else if (s >= 0 && s < 1 && distSqLine <= radiusSq) {
                line.point = new THREE.Vector2(0, 0);
                line.direction = obstacle1.unitDir.clone().negate();
                this.orcaLines.push(line);

                continue;
            }
            //No collision.
            //Compute legs. When obliquely viewed, both legs can come from a single
            //vertex. Legs extend cut-off line when nonconvex vertex.

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
            //Legs can never point into neighboring edge when convex vertex,
            //take cutoff-line of neighboring edge instead. If velocity projected on
            //"foreign" leg, no constraint is added.
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
                this.orcaLines.push(line);
                continue;

            } else if (t > 1 && tRight < 0) {
                //Project on right cut-off circle.
                const unitW = velocity.clone().sub(rightCutoff).normalize();

                line.direction = new THREE.Vector2(unitW.y, -unitW.x);
                line.point = rightCutoff.clone().add(unitW.clone().multiplyScalar(this.boundingRadius * invTimeHorizonObst));
                this.orcaLines.push(line);
                continue;

            }
            //Project on left leg, right leg, or cut-off line, whichever is closest
            //to velocity.
            const distSqCutoff = (t < 0 || t > 1 || obstacle1 == obstacle2) ? Infinity : absSq(velocity.clone().sub(leftCutoff.clone().add(cutoffVec.clone().multiplyScalar(t))));
            const distSqLeft = (tLeft < 0) ? Infinity : absSq(velocity.clone().sub(leftCutoff.clone().add(tLeft * leftLegDirection)));
            const distSqRight = (tRight < 0) ? Infinity : absSq(velocity.clone().sub(rightCutoff.clone().add(tRight * rightLegDirection)));

            if (distSqCutoff <= distSqLeft && distSqCutoff <= distSqRight) {
                //Project on cut-off line.
                line.direction = obstacle1.unitDir.clone().negate();
                line.point = leftCutoff.clone().add(new THREE.Vector2(-line.direction.y, line.direction.x).multiplyScalar(this.boundingRadius * invTimeHorizonObst));
                this.orcaLines.push(line);
                continue;

            } else if (distSqLeft <= distSqRight) {
                //Project on left leg.
                if (isLeftLegForeign) continue;

                line.direction = leftLegDirection;
                line.point = leftCutoff.clone().add(new THREE.Vector2(-line.direction.y, line.direction.x).multiplyScalar(this.boundingRadius * invTimeHorizonObst));
                this.orcaLines.push(line);
                continue;

            } else {
                //Project on right leg.
                if (isRightLegForeign) continue;

                line.direction = rightLegDirection.clone().negate();
                line.point = rightCutoff.clone().add(new THREE.Vector2(-line.direction.y, line.direction.x).multiplyScalar(this.boundingRadius * invTimeHorizonObst));
                this.orcaLines.push(line);
                continue;

            }

        }

        const numObstLines = this.orcaLines.length;
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
                const invTimeStep = 1.0 / 0.25;
                //Vector from cutoff center to relative velocity.
                const w = relativeVelocity.clone().sub(relativePosition.clone().multiplyScalar(invTimeStep));

                const wLength = v2abs(w);
                const unitW = w.clone().divideScalar(wLength);

                line.direction = new THREE.Vector2(unitW.y, -unitW.x);
                u.copy(unitW.clone().multiplyScalar(combinedRadius * invTimeStep - wLength));

            }

            line.point = velocity.clone().add(u.clone().multiplyScalar(0.5));
            this.orcaLines.push(line);

        }

        const newVelocity = new THREE.Vector2();

        const lineFail = this.linearProgram2(this.orcaLines, velocity, false, newVelocity);

        if (lineFail < this.orcaLines.length) {
            this.linearProgram3(this.orcaLines, numObstLines, lineFail, newVelocity)
        }

        this.velocity.copy(new YUKA.Vector3(newVelocity.x, 0, newVelocity.y));

    }

    insertAgentNeighbor(agent) {

        if (this != agent) {

            const distSq = absSq(this.position.clone().sub(agent.position));
            if (distSq < this._rangeSq) {

                if (this._agentNeighbors.length < agent.maxNeighbors) {
                    this._agentNeighbors.push([distSq, agent]);
                }

                let i = this._agentNeighbors.length - 1;
                while (i != 0 && distSq < this._agentNeighbors[i - 1][0]) {
                    this._agentNeighbors[i] = this._agentNeighbors[i - 1];
                    --i;
                }

                this._agentNeighbors[i] = [distSq, agent];

                if (this._agentNeighbors.length == agent.maxNeighbors) {
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
                const projLines = this.orcaLines.slice(0, numObstLines);

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
                    //This should in principle not happen.  The result is by definition already in the feasible 
                    //region of this linear program. If it fails, it is due to small floating point error, and
                    //the current result is kept.
                    result.copy(tempResult);
                }

                distance = det(lines[i].direction, lines[i].point.clone().sub(result));

            }

        }

    }

    update(delta) {

        const steeringForce = new YUKA.Vector3();
        const acceleration = new YUKA.Vector3();

        const displacement = new YUKA.Vector3();
        const target = new YUKA.Vector3();
        // const velocitySmooth = new YUKA.Vector3();
        //calculate steering force
        this.steering.calculate(delta, steeringForce);
        //acceleration = force / mass
        acceleration.copy(steeringForce).divideScalar(this.mass);
        //update velocity
        this.velocity.add(acceleration.multiplyScalar(delta));
        //make sure vehicle does not exceed maximum speed
        // if (this.getSpeedSquared() > (this.maxSpeed * this.maxSpeed)) {
        //     this.velocity.normalize();
        //     this.velocity.multiplyScalar(this.maxSpeed);
        // }
        //ORCA. Search for the best new velocity.
        this.computeNewVelocity();
        //calculate displacement
        displacement.copy(this.velocity).multiplyScalar(delta);
        //calculate target position
        target.copy(this.position).add(displacement);
        //update the orientation if the vehicle has a non zero velocity
        if (this.updateOrientation === true && this.smoother === null && this.getSpeedSquared() > 0.00000001) {
            this.lookAt(target);
        }
        //update position
        this.position.copy(target);
        //if smoothing is enabled, the orientation (not the position!) of the vehicle is
        //changed based on a post-processed velocity vector
        // if (this.updateOrientation === true && this.smoother !== null) {

        //     this.smoother.calculate( this.velocity, velocitySmooth );

        //     displacement.copy(velocitySmooth).multiplyScalar(delta);
        //     target.copy(this.position).add(displacement);

        //     this.lookAt(target);

        // }

        return this;
    }

}

class AgentTreeNode {

    constructor(begin, end, X, Z){

        this.begin = begin;
        this.end = end;
        this.minX = this.maxX = X;
        this.minZ = this.maxZ = Z;

    }

}

class ObstacleTreeNode {

    constructor() {

        this.left = null;
        this.right = null;
        this.obstacle = null;

    }

}

const RVO_EPSILON = 1e-8;
const MAX_LEAF_SIZE = 10;

class EntityManager  extends YUKA.EntityManager {

    constructor() {
        super();

        this.obstacles = new Array();

    }

    addAgent(agent) {
        super.add(agent);
    }

    removeAgent(agent) {
        super.remove(agent);
    }

    addObstacle(vertices) {

        if (vertices.length < 2) return -1;

        const obstacleNo = this.obstacles.length;

        for (let i = 0; i < vertices.length; ++i) {

            const obstacle = new Obstacle()

            obstacle.point = vertices[i]

            if (i != 0) {
                obstacle.prevObstacle = this.obstacles[this.obstacles.length - 1];
                obstacle.prevObstacle.nextObstacle = obstacle;
            }

            if (i == vertices.length - 1) {
                obstacle.nextObstacle = this.obstacles[obstacleNo];
                obstacle.nextObstacle.prevObstacle = obstacle;
            }

            obstacle.unitDir = (vertices[(i == vertices.length - 1 ? 0 : i + 1)].clone().sub(vertices[i])).normalize();

            if (vertices.length === 2) {
                obstacle.isConvex = true;
            } else {
                obstacle.isConvex = (leftOf(vertices[(i == 0 ? vertices.length - 1 : i - 1)], vertices[i], vertices[(i == vertices.length - 1 ? 0 : i + 1)]) >= 0);
            }

            obstacle._id = this.obstacles.length;

            this.obstacles.push(obstacle);

        }

        return obstacleNo;
    }

    removeObstacle(obstacle) {

        const index = this.obstacles.indexOf(obstacle);
        this.obstacles.splice(index, 1);

        return this;
    }

    buildAgentTree() {

        this.agentTree = [];

        this.agents = this.entities.filter(agent => agent.active);
        this.buildAgentTreeRecursive(0, this.agents.length, 0);

    }

    buildAgentTreeRecursive(begin, end, node) {

        const agentTreeNode = this.agentTree[node] = new AgentTreeNode(
            begin,
            end,
            this.agents[begin].position.x,
            this.agents[begin].position.z
        );

        for (let i = begin + 1; i < end; ++ i) {
            agentTreeNode.maxX = Math.max(agentTreeNode.maxX, this.agents[i].position.x);
            agentTreeNode.minX = Math.min(agentTreeNode.minX, this.agents[i].position.x);
            agentTreeNode.maxZ = Math.max(agentTreeNode.maxZ, this.agents[i].position.z);
            agentTreeNode.minZ = Math.min(agentTreeNode.minZ, this.agents[i].position.z);
        }

        if (end - begin > MAX_LEAF_SIZE) {
            //No leaf node.
            const isVertical = (agentTreeNode.maxX - agentTreeNode.minX > agentTreeNode.maxZ - agentTreeNode.minZ);
            const splitValue = isVertical ? 0.5 * (agentTreeNode.maxX + agentTreeNode.minX) : 0.5 * (agentTreeNode.maxZ + agentTreeNode.minZ);
            
            let left = begin;
            let right = end;

            while (left < right) {

                while (left < right && (isVertical ? this.agents[left].position.x : this.agents[left].position.z) < splitValue) {
                    ++left;
                }

                while (right > left && (isVertical ? this.agents[right - 1].position.x : this.agents[right - 1].position.z) >= splitValue) {
                    --right;
                }

                if (left < right) {

                    [this.agents[left], this.agents[right - 1]] = [this.agents[right - 1], this.agents[left]];
                    ++ left;
                    -- right;

                }

            }

            if (left == begin) {
                ++ left;
                ++ right;
            }

            agentTreeNode.left = node + 1;
            agentTreeNode.right = node + 2 * (left - begin);

            this.buildAgentTreeRecursive(begin, left, agentTreeNode.left);
            this.buildAgentTreeRecursive(left, end, agentTreeNode.right);

        }

    }

    buildObstacleTree() {
        this.obstacleTree = this.buildObstacleTreeRecursive(this.obstacles);
    }

    buildObstacleTreeRecursive(obstacles) {

        if (obstacles.length === 0) return null;

        let optimalSplit = 0;
        let minLeft = obstacles.length;
        let minRight = obstacles.length;

        for (let i = 0; i < obstacles.length; ++i) {

            let leftSize = 0;
            let rightSize = 0;

            const obstacleI1 = obstacles[i];
            const obstacleI2 = obstacleI1.nextObstacle;
            /* Compute optimal split node. */
            for (let j = 0; j < obstacles.length; ++j) {
                if (i === j) continue;

                const obstacleJ1 = obstacles[j];
                const obstacleJ2 = obstacleJ1.nextObstacle;

                const j1LeftOfI = leftOf(obstacleI1.point, obstacleI2.point, obstacleJ1.point);
                const j2LeftOfI = leftOf(obstacleI1.point, obstacleI2.point, obstacleJ2.point);

                if (j1LeftOfI >= -RVO_EPSILON && j2LeftOfI >= -RVO_EPSILON) {
                    ++leftSize;

                } else if (j1LeftOfI <= RVO_EPSILON && j2LeftOfI <= RVO_EPSILON) {
                    ++rightSize;

                } else {
                    ++leftSize;
                    ++rightSize;

                }

                if (Math.max(leftSize, rightSize) > Math.max(minLeft, minRight) || Math.max(leftSize, rightSize) === Math.max(minLeft, minRight) && Math.min(leftSize, rightSize) >= Math.min(minLeft, minRight)) {
                    break;
                }

            }

            if (Math.max(leftSize, rightSize) < Math.max(minLeft, minRight) || Math.max(leftSize, rightSize) === Math.max(minLeft, minRight) && Math.min(leftSize, rightSize) < Math.min(minLeft, minRight)) {
                minLeft = leftSize;
                minRight = rightSize;
                optimalSplit = i;
            }

        }
        //Build split node.
        const leftObstacles = [];
        const rightObstacles = [];

        const i = optimalSplit;

        const obstacleI1 = obstacles[i];
        const obstacleI2 = obstacleI1.nextObstacle;

        for (let j = 0; j < obstacles.length; ++j) {
            if (i === j) continue;

            const obstacleJ1 = obstacles[j];
            const obstacleJ2 = obstacleJ1.nextObstacle;

            const j1LeftOfI = leftOf(obstacleI1.point, obstacleI2.point, obstacleJ1.point);
            const j2LeftOfI = leftOf(obstacleI1.point, obstacleI2.point, obstacleJ2.point);

            if (j1LeftOfI >= -RVO_EPSILON && j2LeftOfI >= -RVO_EPSILON) {
                leftObstacles.push(obstacles[j]);
            } else if (j1LeftOfI <= RVO_EPSILON && j2LeftOfI <= RVO_EPSILON) {
                rightObstacles.push(obstacles[j]);
            } else {
                //Split obstacle j.
                const t = det(obstacleI2.point.clone().sub(obstacleI1.point), obstacleJ1.point.clone().sub(obstacleI1.point)) / det(obstacleI2.point.clone().sub(obstacleI1.point), obstacleJ1.point.clone().sub(obstacleJ2.point));

                const splitpoint = obstacleJ1.point.clone()
                    .add(obstacleJ2.point.clone().sub(obstacleJ1.point).multiplyScalar(t));

                const newObstacle = new Obstacle();
                newObstacle.point = splitpoint;
                newObstacle.prevObstacle = obstacleJ1;
                newObstacle.nextObstacle = obstacleJ2;
                newObstacle.isConvex = true;
                newObstacle.unitDir = obstacleJ1.unitDir;

                newObstacle._id = this.obstacles.length;
                this.obstacles.push(newObstacle);

                obstacleJ1.nextObstacle = newObstacle;
                obstacleJ2.prevObstacle = newObstacle;

                if (j1LeftOfI > 0) {
                    leftObstacles.push(obstacleJ1);
                    rightObstacles.push(newObstacle);
                } else {
                    rightObstacles.push(obstacleJ1);
                    leftObstacles.push(newObstacle);
                }

            }

        }

        const node = new ObstacleTreeNode();
        node.obstacle = obstacleI1;
        node.left = this.buildObstacleTreeRecursive(leftObstacles);
        node.right = this.buildObstacleTreeRecursive(rightObstacles);

        return node;
    }

    updateNeighborhood(entity) {
        //Agent::computeNeighbors
        entity._obstacleNeighbors = [];
        entity._rangeSq = sqr(entity.timeHorizonObst * entity.maxSpeed + entity.boundingRadius);
        this.queryObstacleTreeRecursive(entity, this.obstacleTree);

        entity._agentNeighbors = [];
        entity._rangeSq = sqr(entity.boundingRadius);
        //KdTree::computeAgentNeighbors
        this.queryAgentTreeRecursive(entity, 0);
        //Converting neighbors to Yuka
        entity.neighbors = entity._agentNeighbors.map(neighbor => neighbor[1]);

    }

    queryAgentTreeRecursive(agent, node) {

        const nodeAgent = this.agentTree[node];

        if (nodeAgent.end - nodeAgent.begin <= MAX_LEAF_SIZE) {

            for (let i = nodeAgent.begin; i < nodeAgent.end; ++ i) {
                agent.insertAgentNeighbor(this.agents[i]);
            }

        } else {

            const distSqLeft = sqr(Math.max(0, this.agentTree[nodeAgent.left].minX - agent.position.x)) + sqr(Math.max(0, agent.position.x - this.agentTree[nodeAgent.left].maxX)) + sqr(Math.max(0, this.agentTree[nodeAgent.left].minZ - agent.position.z)) + sqr(Math.max(0, agent.position.z - this.agentTree[nodeAgent.left].maxZ));
            const distSqRight = sqr(Math.max(0, this.agentTree[nodeAgent.right].minX - agent.position.x)) + sqr(Math.max(0, agent.position.x - this.agentTree[nodeAgent.right].maxX)) + sqr(Math.max(0, this.agentTree[nodeAgent.right].minZ - agent.position.z)) + sqr(Math.max(0, agent.position.z - this.agentTree[nodeAgent.right].maxZ));

            if (distSqLeft < distSqRight && distSqLeft < agent._rangeSq) {

                this.queryAgentTreeRecursive(agent, nodeAgent.left);

                if (distSqRight < agent._rangeSq) {
                    this.queryAgentTreeRecursive(agent, nodeAgent.right);
                }

            } else if (distSqRight < agent._rangeSq) {

                this.queryAgentTreeRecursive(agent, nodeAgent.right);

                if (distSqLeft < agent._rangeSq) {
                    this.queryAgentTreeRecursive(agent, nodeAgent.left);
                }

            }

        }

    }

    queryObstacleTreeRecursive(agent, node) {

        if (node === null) return;

        const obstacle1 = node.obstacle;
        const obstacle2 = obstacle1.nextObstacle;

        const pos = agent.position;

        const agentLeftOfLine = leftOf(obstacle1.point, obstacle2.point, new THREE.Vector2(pos.x, pos.z));

        this.queryObstacleTreeRecursive(agent, (agentLeftOfLine >= 0 ? node.left : node.right));

        const distSqLine = sqr(agentLeftOfLine) / absSq(obstacle2.point.clone().sub(obstacle1.point))

        if (distSqLine < agent._rangeSq) {
            //Try obstacle at this node only if agent is on right side of obstacle (and can see obstacle).
            if (agentLeftOfLine < 0) {
                agent.insertObstacleNeighbor(node.obstacle);
            }

            this.queryObstacleTreeRecursive(agent, (agentLeftOfLine >= 0 ? node.right : node.left))

        }

    }

    update(delta ) {

        this.buildObstacleTree();
        this.buildAgentTree();

        super.update(delta);

    }

}

export {
    Agent,
    EntityManager,
}