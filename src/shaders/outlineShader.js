
import * as THREE from 'three';

export default class extends THREE.ShaderMaterial {

    constructor(depthid, beauty) {
        super({

            uniforms: {
                tDepthid: {value: depthid.texture},  
                tBeauty: {value: beauty.texture},     
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

                uniform sampler2D tDepthid;
                uniform sampler2D tBeauty;

                void create_kernel(inout vec4 n[9], sampler2D idTex, vec2 coord) {

                    float width = float(textureSize(idTex, 0).x);
                    float height = float(textureSize(idTex, 0).y);

                    float w = 1. / width;
                    float h = 1. / height;

                    vec2 offsets[9];
                    offsets[0] = vec2(-w, -h);
                    offsets[1] = vec2(0.0, -h);
                    offsets[2] = vec2(w, -h);
                    offsets[3] = vec2(-w, 0.0);
                    offsets[4] = vec2(0.0, 0.0);
                    offsets[5] = vec2(w, 0.0);
                    offsets[6] = vec2(-w, h);
                    offsets[7] = vec2(0.0, h);
                    offsets[8] = vec2(w, h);

                    for (int i = 0; i < 9; i++) {
                        n[i] = texture2D(idTex, coord + offsets[i]);
                    }

                }

                void main() {

                    vec4 n[9];
                    create_kernel(n, tDepthid, vUv);

                    bool edge = false;

                    if (n[4].z != 0.) {

                        for (int i = 0; i < 9; i++) {
                            //Skip middle
                            if (i == 4) continue;

                            if (n[i] != n[4] && (n[i].z > n[4].z || n[i].z == 0.)) {

                                edge = true;
                                gl_FragColor = vec4(vec3(1. - n[4].z), 1.);

                                break;
                            }

                        }

                    }

                    if (!edge) {
                        // gl_FragColor = vec4(vec3(0.), 1.);
                        gl_FragColor = texture2D(tBeauty, vUv);
                    }
                    
                }
            `,
            
        });

    }

}
