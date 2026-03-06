
import * as YUKA from 'yuka';

function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

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
    radiansToDegrees,
    degreesToRadians,
    worldToLocal,
}
