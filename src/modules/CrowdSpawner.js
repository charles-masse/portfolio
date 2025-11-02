
import * as THREE from 'three';
import * as YUKA from 'yuka';
//Agents
import {PictogramAgent} from '../agents/Pictogram.js';

const AGENTS_PER_FRAMES = 5;
const MAX_AGENTS = 100;

const CANDIDATE_NB = 5;

export class CrowdSpawner {

    constructor(scene) {

        this.scene = scene;
        this.entityManager = new YUKA.EntityManager();

        this.time = new YUKA.Time();

    }

    bestCandidate() {

        let positions = [];

        const current_positions = this.entityManager.entities.map(entity => entity.position);

        let position;
        let candidates = 0;
        while (candidates < CANDIDATE_NB) {

            position = new YUKA.Vector3(
                YUKA.MathUtils.randFloat(-5, 5),
                -1,
                YUKA.MathUtils.randFloat(1, 3)
            );

            const distances = current_positions.map(pos => position.distanceTo(pos));
            const min_dist = Math.min(...distances);
            positions.push({pos: position, dist:min_dist});

            candidates++;
        }

        const best_candidate = positions.reduce((a, b) => (a.dist > b.dist ? a : b));
        return best_candidate.pos;
    }

    spawn() {
        // //Path
        // const path = new YUKA.Path();
        // path.add(new YUKA.Vector3(-2, -1, 2));
        // path.add(new YUKA.Vector3(-3, -1, 0));
        // path.add(new YUKA.Vector3(-2, -1, -2));
        // path.add(new YUKA.Vector3(0, -1, 0));
        // path.add(new YUKA.Vector3(2, -1, -2));
        // path.add(new YUKA.Vector3(3, -1, 0));
        // path.add(new YUKA.Vector3(2, -1, 2));
        // path.add(new YUKA.Vector3(0, -1, 3));
        // path.loop = true;

        // if (debug) {

        //     const position = [];

        //     for (let i = 0; i < path._waypoints.length; i ++) {

        //         const waypoint = path._waypoints[i];
        //         position.push(waypoint.x, waypoint.y, waypoint.z);


        //     }

        //     const lineGeometry = new THREE.BufferGeometry();
        //     lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(position, 3));
        //     const lineMaterial = new THREE.LineBasicMaterial({color: 0xff0000});
        //     const lines = new THREE.LineLoop(lineGeometry, lineMaterial);
        //     this.scene.add(lines);

        // }
        
        const agent = new PictogramAgent(this.scene);
        agent.vehicle.position.copy(this.bestCandidate());
        // //Behaviors
        // const followPathBehavior = new YUKA.FollowPathBehavior(path, 0.25);
        // agent.vehicle.steering.add(followPathBehavior);

        // const onPathBehavior = new YUKA.OnPathBehavior(path);
        // agent.vehicle.steering.add(onPathBehavior);

        this.entityManager.add(agent);

    }

    update() {

        if (this.entityManager.entities.length < MAX_AGENTS) {

            for (let x = 0; x < AGENTS_PER_FRAMES; x++) {
                this.spawn();
            }

            document.getElementById('population').textContent = `Population: ${this.entityManager.entities.length}`;

        }

        this.entityManager.update(this.time.update().getDelta());

    }

}
