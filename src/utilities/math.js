
import * as YUKA from 'yuka';

/**
 * Converts degrees to radians.
 * @param {number} degrees - The angle in degrees.
 * @returns {number} The angle in radians.
 */
function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Converts radians to degrees.
 * @param {number} radians - The angle in radians.
 * @returns {number} The angle in degrees.
 */
function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

/**
 * Converts a vector from world space to local space.
 * @param {YUKA.Vector3} vector - The vector in world space.
 * @param {YUKA.Vector3} direction - The direction of the local coordinate system.
 * @param {YUKA.Vector3} up - The up vector of the local coordinate system.
 * @returns {YUKA.Vector3} The vector in local space.
 */
function worldToLocal(vector, direction, up=new YUKA.Vector3(0, 1, 0)) {

    const forward = direction.clone().normalize();

    const right = new YUKA.Vector3().crossVectors(up, forward).normalize();
    const localUp = new YUKA.Vector3().crossVectors(forward, right);

    const localVelocity = new YUKA.Vector3(
        vector.dot(right),
        vector.dot(localUp),
        vector.dot(forward)
    );

    return localVelocity;
}

export {
    degreesToRadians,
    radiansToDegrees,
    worldToLocal,
};
