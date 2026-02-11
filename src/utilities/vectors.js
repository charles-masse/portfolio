
function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function angleTo(direction, toTarget) {

    const dot = direction.dot(toTarget.clone().normalize());
    const angle = Math.acos(dot);
    const cross = toTarget.clone().cross(direction);

    const angle_sign = cross.y >= 0 ? angle : -angle;
    const angle_degrees = radiansToDegrees(angle_sign);

    return angle_degrees;
}

function angleBetween(direction, target_direction) {

    const a = direction.clone().normalize();
    const b = target_direction.clone().normalize();

    const dot = a.dot(b);
    const cross = a.clone().cross(b);

    const angle = Math.atan2(cross.y, dot);
    const angle_degrees = radiansToDegrees(angle);

    return angle_degrees;
}

export {
    radiansToDegrees,
    degreesToRadians,
    angleTo,
    angleBetween,
}
