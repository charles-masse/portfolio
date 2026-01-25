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
    return v.clone().dot(v);
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

const MAX_NEIGHBORS = 10;

class Agent extends YUKA.Vehicle {

    constructor(navMesh) {
        super();

        this.navMesh = navMesh;
        //Settings
        this.active = false;
        // this.maxSpeed = 1;
        this.maxForce = 1.25;
        this.boundingRadius = 0.25;
        this.neighborhoodRadius = 4;
        //RVO2
        this._dist_neighbors = [];
        this._timeHorizonObst = 5;
        // // State machine
        // this.stateMachine = new AgentStateMachine(this);

    }

    setActive(bool) {

        this.active = bool;
        if (!bool) this.position.set(0, -9999, 0); //Shadow Realm

    }

    insertAgentNeighbor(agent) {

        if (this != agent) {

            const distSq = absSq(this.position.clone().sub(agent.position));
            if (distSq < this._rangeSq) {

                if (this._dist_neighbors.length < MAX_NEIGHBORS) {
                    this._dist_neighbors.push([distSq, agent]);
                }

                let i = this._dist_neighbors.length - 1;
                while (i != 0 && distSq < this._dist_neighbors[i - 1][0]) {
                    this._dist_neighbors[i] = this._dist_neighbors[i - 1];
                    --i;
                }

                this._dist_neighbors[i] = [distSq, agent];

                if (this._dist_neighbors.length == MAX_NEIGHBORS) {
                    this._rangeSq = this._dist_neighbors[this._dist_neighbors.length - 1][0];
                }

            }

        }

    }

    update(delta) {

        const start_position = this.position.clone(); //Clamp in NavMesh

        const steeringForce = new YUKA.Vector3();
        const acceleration = new YUKA.Vector3();

        // const displacement = new YUKA.Vector3();
        // const target = new YUKA.Vector3();
        // const velocitySmooth = new YUKA.Vector3();
        // calculate steering force
        this.steering.calculate(delta, steeringForce);
        // acceleration = force / mass
        acceleration.copy(steeringForce).divideScalar( this.mass );
        // update velocity
        this.velocity.add( acceleration.multiplyScalar( delta ) );
        // make sure vehicle does not exceed maximum speed
        if ( this.getSpeedSquared() > ( this.maxSpeed * this.maxSpeed ) ) {
            this.velocity.normalize();
            this.velocity.multiplyScalar( this.maxSpeed );
        }
        // // calculate displacement
        // displacement.copy( this.velocity ).multiplyScalar( delta );
        // // calculate target position
        // target.copy( this.position ).add( displacement );
        // // update the orientation if the vehicle has a non zero velocity
        // if ( this.updateOrientation === true && this.smoother === null && this.getSpeedSquared() > 0.00000001 ) {

        //     this.lookAt( target );

        // }
        // // update position
        // this.position.copy( target );
        // // if smoothing is enabled, the orientation (not the position!) of the vehicle is
        // // changed based on a post-processed velocity vector
        // if ( this.updateOrientation === true && this.smoother !== null ) {

        //     this.smoother.calculate( this.velocity, velocitySmooth );

        //     displacement.copy( velocitySmooth ).multiplyScalar( delta );
        //     target.copy( this.position ).add( displacement );

        //     this.lookAt( target );

        // }
        super.update(delta); //DELETE ME

        //Prevent vehicle from going off the navMesh
        const closest_region = this.navMesh.getClosestRegion(this.position);
        const end_position = this.position.clone();
        this.navMesh.clampMovement(closest_region, start_position, end_position, this.position);
        
        this.position.y = 0;

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

const RVO_EPSILON = 0.00001;
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

        const agent = this.agentTree[node] = new AgentTreeNode(
            begin,
            end,
            this.agents[begin].position.x,
            this.agents[begin].position.z
        );

        for (let i = begin + 1; i < end; ++ i) {
            agent.maxX = Math.max(agent.maxX, this.agents[i].position.x);
            agent.minX = Math.min(agent.minX, this.agents[i].position.x);
            agent.maxZ = Math.max(agent.maxZ, this.agents[i].position.z);
            agent.minZ = Math.min(agent.minZ, this.agents[i].position.z);
        }

        if (end - begin > MAX_LEAF_SIZE) {
            //No leaf node.
            const isVertical = (agent.maxX - agent.minX > agent.maxZ - agent.minZ);
            const splitValue = isVertical ? 0.5 * (agent.maxX + agent.minX) : 0.5 * (agent.maxZ + agent.minZ);
            
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

            agent.left = node + 1;
            agent.right = node + 2 * (left - begin);

            this.buildAgentTreeRecursive(begin, left, agent.left);
            this.buildAgentTreeRecursive(left, end, agent.right);

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

            console.log(obstacleI1);

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
        this._obstacles = [];
        entity._rangeSq = sqr(entity._timeHorizonObst * entity.maxSpeed + entity.boundingRadius);
        this.queryObstacleTreeRecursive(entity);

        entity._dist_neighbors = [];
        entity._rangeSq = sqr(entity.neighborhoodRadius);
        //KdTree::computeAgentNeighbors
        this.queryAgentTreeRecursive(entity, 0);
        //Converting neighbors to Yuka
        entity.neighbors = entity._dist_neighbors.map(neighbor => neighbor[1]);

    }

    queryObstacleTreeRecursive(agent) {



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