
varying float color_range;

attribute float instance_color;

void main() {

    color_range = instance_color;

    vec4 world_position = instanceMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * world_position;

}
