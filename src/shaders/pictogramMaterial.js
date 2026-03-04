
import * as THREE from 'three';

export default class extends THREE.ShaderMaterial {

    constructor(animation_texture) {
        super({

            side: THREE.DoubleSide,

            uniforms: {
                animationAtlas: {value: animation_texture},
                atlasSize: {value: new THREE.Vector2(
                    animation_texture.image.width,
                    animation_texture.image.height
                )}
            },

            vertexShader: `
                varying vec3 vColor;
                varying float distance;

                attribute vec3 instance_id;
                attribute float instance_depth;

                attribute float current_frame;
                attribute float length;
                attribute float origin;
                attribute float amplitude;

                uniform sampler2D animationAtlas;
                uniform vec2 atlasSize;

                void main() {

                    distance = instance_depth;
                    vColor = instance_id;

                    vec3 rest = vec3(0.5059214058523709);
                    float amplitude = 0.9067607074975969;

                    float vertex_id = float(gl_VertexID);
                    vec3 anim_data = texture2D(
                        animationAtlas,
                        vec2( (vertex_id + 0.5) / atlasSize.x, 1. - mod((current_frame + 0.5), atlasSize.y) / atlasSize.y)
                    ).rgb;

                    vec3 anim_data_scaled = (anim_data - rest) * amplitude;
                    vec4 world_position = instanceMatrix * vec4(position + anim_data_scaled, 1.0);
                    gl_Position = projectionMatrix * modelViewMatrix * world_position;
                
                }
            `,

            fragmentShader: `
                varying vec3 vColor;

                void main() {
                    gl_FragColor = vec4(vColor, 1.0);
                }
            `,
            
        });

    }

}
