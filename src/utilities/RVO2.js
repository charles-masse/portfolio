/*
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
/*``
 * brief      Computes the squared length of a specified two-dimensional vector.
 * param      vector          The two-dimensional vector whose squared length is to be computed.
 * return     The squared length of the two-dimensional vector.
 */
function absSq(v) {
    return v.dot(v);
}
/*
 * brief      Computes the determinant of a two-dimensional square matrix with rows consisting of the specified two-dimensional vectors.
 * param      vector1         The top row of the two-dimensional square matrix.
 * param      vector2         The bottom row of the two-dimensional square matrix.
 * return     The determinant of the two-dimensional square matrix.
 */
function det(v1, v2) {
    return v1.x * v2.y - v1.y * v2.x;
}
/**
 * brief      Computes the signed distance from a line connecting the specified points to a specified point.
 * param      a               The first point on the line.
 * param      b               The second point on the line.
 * param      c               The point to which the signed distance is to be calculated.
 * return     Positive when the point c lies to the left of the line ab.
 */
function leftOf(a, b, c) {
    return det(a.clone().sub(c), b.clone().sub(a));
}
/*
 * \brief      Computes the square of a float.
 * \param      a               The float to be squared.
 * \return     The square of the float.
 */
function sqr(a) {
    return a * a;
}
/*
 * \brief      Computes the squared distance from a line segment with the specified endpoints to a specified point.
 * \param      a               The first endpoint of the line segment.
 * \param      b               The second endpoint of the line segment.
 * \param      c               The point to which the squared distance is to be calculated.
 * \return     The squared distance from the line segment to the point.
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
}
