
varying vec2 vUv;
varying float color_range;
varying float active_alpha;

uniform sampler2D palette;
uniform sampler2D alpha;

void main() {

    vec4 rgba = texture2D(palette, vec2(color_range, 0.5));

    if (active_alpha > 0.1) {
        rgba[3] = texture2D(alpha, vUv)[0];
    }

    gl_FragColor = rgba;
}
