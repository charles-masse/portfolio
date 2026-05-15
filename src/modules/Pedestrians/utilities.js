
function findBestNavmeshSpacing(navMesh, obstacles) {

    let best;
    let maxDist = -Infinity;

    for (let i = 0; i < 10; i++) {

        const pos = navMesh.randomPoint();
        const minDist = Math.min(...obstacles.map((entity) => pos.distanceTo(entity.position)));

        if (minDist > maxDist) {

            maxDist = minDist;
            best = pos;

        }

    }

    return best;
}

export {
    findBestNavmeshSpacing,
};
