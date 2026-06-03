
varying float color_range;

uniform sampler2D palette;

void main() {
    gl_FragColor = texture2D(palette, vec2(color_range, 0.5));
}
