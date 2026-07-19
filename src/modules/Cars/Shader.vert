
attribute float instance_color;
attribute float instance_headlights;

varying vec2 vUv;
varying float color_range;
varying float active_alpha;

void main() {

    vUv = uv;

    color_range = instance_color;
    active_alpha = instance_headlights;

    vec4 world_position = instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * world_position;

}
