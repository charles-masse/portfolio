
import * as YUKA from 'yuka';

function sqr(x) {
    return x * x; 
}

function absSq(a) {
    return a.clone().dot(a)
}

const MAX_NEIGHBORS = 10;

class Agent extends YUKA.Vehicle {

    constructor(navMesh) {
        super();

        this.navMesh = navMesh;
        //RVO2
        this._dist_neighbors = [];
        //Settings
        // this.maxSpeed = 1;
        this.maxForce = 1.25;
        this.boundingRadius = 0.25;
        this.neighborhoodRadius = 4;
        //State machine
        // this.stateMachine = new AgentStateMachine(this);
        this.active = false;

    }

    setActive(bool) {

        if (bool) {
            this.active = true;
        } else {

            this.position.set(0, -9999, 0); //Shadow Realm
            this.active = false;

        }

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

        const start_position = this.position.clone();

        super.update(delta);
        //Prevent vehicle from going off the navMesh
        const closest_region = this.navMesh.getClosestRegion(this.position);
        const end_position = this.position.clone();
        this.navMesh.clampMovement(closest_region, start_position, end_position, this.position);
        
        this.position.y = 0;

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

const MAX_LEAF_SIZE = 10;

class EntityManager  extends YUKA.EntityManager {

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

    updateNeighborhood(entity) {
        //Agent::computeNeighbors()
        entity._dist_neighbors = [];
        entity._rangeSq = sqr(entity.neighborhoodRadius);
        //KdTree::computeAgentNeighbors
        this.queryAgentTreeRecursive(entity, 0);
        //Converting neighbors to Yuka
        entity.neighbors = entity._dist_neighbors.map(neighbor => neighbor[1]);

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

}

export {
    Agent,
    EntityManager,
}