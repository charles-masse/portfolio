
import * as THREE from 'three';

export default class extends THREE.ShaderMaterial {

    constructor(depth, beauty) {
        super({

            uniforms: {
                tDiffuse: {value: null},
                tDepth: {value: depth.texture},
                tBeauty: {value: beauty.texture},
                thickness: {value: 2},
            },

            vertexShader: `
                varying vec2 vUv;

                void main() {

                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

                }
            `,

            fragmentShader: `
                varying vec2 vUv;

                uniform sampler2D tDiffuse; //previous pass
                uniform sampler2D tDepth;
                uniform sampler2D tBeauty;
                
                uniform int thickness;

                void main() {

                    bool edge = false;

                    for (int x = -thickness; x <= thickness; x++) {
                        for (int y = -thickness; y <= thickness; y++) {

                            vec2 texel = 1. / vec2(textureSize(tDiffuse, 0));

                            vec2 offset = vec2(float(x), float(y)) * texel;
                            vec2 sampleUv = vUv + offset;

                            if (texture2D(tDiffuse, sampleUv).r == 1.) {

                                float depth = 1. - texture2D(tDepth, sampleUv).r;
                                float radius = float(thickness) * depth;

                                if (length(vec2(x, y)) < radius) {
                                    edge = true;
                                    break;
                                }

                            }

                        }
                    }

                    if (edge) {
                        gl_FragColor = vec4(vec3(1.), 1.);
                    }

                    else {
                        gl_FragColor = texture2D(tBeauty, vUv);
                    }
                    
                }
            `,
            
        });

    }

}
