
import * as YUKA from 'yuka';

const xaxis = new YUKA.Vector3();
const yaxis = new YUKA.Vector3();
/**
 * Creates a direction matrix from a direction vector.
 * 
 * {@link https://stackoverflow.com/questions/18558910/direction-vector-to-rotation-matrix}
 * @param {YUKA.Vector3} direction - The direction vector to be transformed into a matrix.
 * @param {YUKA.Vector3} up - The up vector.
 * @returns {YUKA.Matrix3} The direction matrix.
 */
function directionMatrixFromVector(direction, up=new YUKA.Vector3(0, 1, 0)) {

    xaxis.crossVectors(up, direction).normalize();
    yaxis.crossVectors(direction, xaxis).normalize();

    const matrix = new YUKA.Matrix3();

    return matrix.fromArray([
        xaxis.x, yaxis.x, direction.x,
        xaxis.y, yaxis.y, direction.y,
        xaxis.z, yaxis.z, direction.z
    ]);
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
    directionMatrixFromVector,
    worldToLocal,
};
