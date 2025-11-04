
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
        // Spawn zone
        const polygon = [
            new THREE.Vector2(0, 10),
            new THREE.Vector2(75, 15),
            new THREE.Vector2(50, -20),
            new THREE.Vector2(0, -5)
        ];
        this.spawnTris = this.triangulate(polygon);

    }

    triangulate(polygon) {

        const triangles = THREE.ShapeUtils.triangulateShape(polygon, []);

        return triangles.map(pt => pt.map(i => polygon[i]));
    }

    randomPointInTriangles(triangles) {

        const triangle = triangles[THREE.MathUtils.randInt(0, triangles.length - 1)]; 

        let r1 = Math.random();
        let r2 = Math.random();

        if (r1 + r2 > 1) {r1 = 1 - r1; r2 = 1 - r2;}

        return {
            x: triangle[0].x + r1 * (triangle[1].x - triangle[0].x) + r2 * (triangle[2].x - triangle[0].x),
            y: triangle[0].y + r1 * (triangle[1].y - triangle[0].y) + r2 * (triangle[2].y - triangle[0].y)
        };

    }

    bestCandidate() {

        const current_positions = this.entityManager.entities.map(entity => entity.position);

        let best;
        let maxDist = -Infinity;

        for (let i = 0; i < CANDIDATE_NB; i++) {

            const {x, y} = this.randomPointInTriangles(this.spawnTris);

            const pos = new YUKA.Vector3(x, 0, y);
            const minDist = Math.min(...current_positions.map(p => pos.distanceTo(p)));

            if (minDist > maxDist) {
                maxDist = minDist;
                best = pos;
            }

        }

    return best;
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
