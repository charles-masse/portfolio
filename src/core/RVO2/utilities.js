
/**
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

export const RVO_EPSILON = 1e-8;

/**
 * Computes the squared length of a specified two-dimensional vector.
 * @param {THREE.Vector2} v - The two-dimensional vector whose squared length is to be computed.
 * @returns {number} The squared length of the two-dimensional vector.
 */
function absSq(v) {
    return v.dot(v);
}

/**
 * Computes the determinant of a two-dimensional square matrix with rows consisting of the specified two-dimensional vectors.
 * @param {THREE.Vector2} v1 - The top row of the two-dimensional square matrix.
 * @param {THREE.Vector2} v2 - The bottom row of the two-dimensional square matrix.
 * @returns {number} The determinant of the two-dimensional square matrix.
 */
function det(v1, v2) {
    return v1.x * v2.y - v1.y * v2.x;
}

/**
 * Computes the signed distance from a line connecting the specified points to a specified point.
 * @param {THREE.Vector2} a - The first point on the line.
 * @param {THREE.Vector2} b - The second point on the line.
 * @param {THREE.Vector2} c - The point to which the signed distance is to be calculated.
 * @returns {number} Positive when the point c lies to the left of the line ab.
 */
function leftOf(a, b, c) {
    return det(a.clone().sub(c), b.clone().sub(a));
}

/**
 * Computes the square of a float.
 * @param {number} a - The float to be squared.
 * @returns {number} The square of the float.
 */
function sqr(a) {
    return a * a;
}

/**
 * Computes the squared distance from a line segment with the specified endpoints to a specified point.
 * @param {THREE.Vector2} a - The first endpoint of the line segment.
 * @param {THREE.Vector2} b - The second endpoint of the line segment.
 * @param {THREE.Vector2} c - The point to which the squared distance is to be calculated.
 * @returns {number} The squared distance from the line segment to the point.
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

/**
 * Computes the length of a specified two-dimensional vector.
 * @param {THREE.Vector2} v - The two-dimensional vector whose length is to be computed.
 * @returns {number} The length of the two-dimensional vector.
 */
function abs(v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
}

export {
    absSq,
    det,
    leftOf,
    sqr,
    distSqPointLineSegment,
    abs,
};
