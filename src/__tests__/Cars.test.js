
import {expect, test} from 'vitest';

import * as YUKA from 'yuka';

import EntityManager from '../extensions/EntityManager.js';

import {getClosestDistance} from './utilities.js';

import Agent from '../modules/Cars/Agent.js';
import {BrakingBehavior} from '../modules/Cars/behaviors.js';
import {checkIntersection, randomOnPath} from '../modules/Cars';

const AGENT_RADIUS = new Agent().boundingRadius;

const CIRCLE_RES = 30;
const CIRCLE_RADIUS = 100;

const MAX_FAIL = 10;

/**
 * Returns a point on a circle.
 * @param {number} r - The radius of the cicle.
 * @param {number} a - The angle of the point.
 * @returns {number|number} The 2d point (x, y).
 */
function pointOnCircle(r, a) {

    const x = r * Math.sin(a);
    const y = r * Math.cos(a);

    return {x:x, y:y};
}
//Create Manager
const entityManager = new EntityManager();
//Create circle
const circle = [];

for (let i = 1; i <= CIRCLE_RES; ++i) {

    const point = pointOnCircle(CIRCLE_RADIUS, 360. * (i / CIRCLE_RES));

    circle.push(new YUKA.Vector3(point.x, 0, point.y));

}

let fail = 0;

test('Spawning non-intersecting agents', () => {

        while (fail <= MAX_FAIL) {

            const random_point = randomOnPath(circle);

            const intersect = checkIntersection(
                random_point[1],
                new YUKA.Vector3(0, 0, 1), //TODO
                entityManager.entities
            );

            if (!intersect) {
                //Reset failure counter
                fail = 0;
                //Create agent
                const entity = new Agent(-1);

                entity.active = true;
                entity.position.copy(random_point[1]);
                //Braking
                entity.steering.add(new BrakingBehavior());
                //Follow path
                const path = new YUKA.Path();
                path.loop = true;
                for (const point of circle.slice(random_point[0]).concat(circle.slice(0, random_point[0]))) {
                    path.add(point);
                }
                entity.steering.add(new YUKA.FollowPathBehavior(path));

                entityManager.add(entity);

            } else {
                fail++;
            }

        }
        //Update for neighbors
        entityManager.update(0);
        //Check distance between agents
        const distance = getClosestDistance(entityManager.entities);
        console.log(`Spawned ${entityManager.entities.length} agents.`);
        console.log(`Closest agent : ${distance}`);

        expect(distance).toBeGreaterThanOrEqual(AGENT_RADIUS);
    }
);

test('Braking without intersection', () => {

        const distances = [];
        //Run sim
        for (let i = 0; i < 24; ++i) {
            entityManager.update(0.0415);
            distances.push(getClosestDistance(entityManager.entities));
        }
        //Check distance between agents
        const distance = Math.min(...distances);
        console.log(`Closest agent : ${distance}`);

        expect(distance).toBeGreaterThanOrEqual(AGENT_RADIUS);
    }
);
