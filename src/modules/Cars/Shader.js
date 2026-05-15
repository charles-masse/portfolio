
import * as THREE from 'three';

export default class extends THREE.ShaderMaterial {

    constructor(palette_texture) {

        super({

            uniforms: {
                palette: {value: palette_texture},
            },
            
            vertexShader: `

                varying float color_range;

                attribute float instance_color;
            
                void main() {

                    color_range = instance_color;

                    vec4 world_position = instanceMatrix * vec4(position, 1.0);
                    gl_Position = projectionMatrix * modelViewMatrix * world_position;
                }

            `,

            fragmentShader: `

                varying float color_range;

                uniform sampler2D palette;

                void main() {
                    gl_FragColor = texture2D(palette, vec2(color_range, 0.5));
                }

            `
        });

    }

}
