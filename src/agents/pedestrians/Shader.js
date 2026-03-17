
import * as THREE from 'three';

export default class extends THREE.ShaderMaterial {

    constructor(animation_texture, alpha_texture) {
        super({

            side: THREE.DoubleSide,
            transparent: true,

            uniforms: {
                animations: {value: animation_texture},
                atlasSize: {
                    value: new THREE.Vector2(
                        animation_texture.image.width,
                        animation_texture.image.height
                    )
                },
                alpha: {value: alpha_texture},
            },

            vertexShader: `
                varying vec2 vUv;

                attribute float instance_variation;
                flat varying float variation;
                //For outline passes
                attribute vec3 instance_id;
                attribute float instance_depth;

                flat varying vec3 color_id;
                flat varying float color_depth;
                //Animation player
                attribute float instance_frame;
                // attribute float length;
                // attribute float origin;
                // attribute float amplitude;

                uniform sampler2D animations;
                uniform vec2 atlasSize;

                void main() {

                    vUv = uv;

                    variation = instance_variation;

                    color_id = instance_id;
                    color_depth = instance_depth;

                    vec3 rest = vec3(0.5059214058523709);
                    float amplitude = 0.9067607074975969;

                    float vertex_id = float(gl_VertexID);
                    vec3 anim_data = texture2D(
                        animations,
                        vec2( (vertex_id + 0.5) / atlasSize.x, mod((instance_frame + 0.5), atlasSize.y) / atlasSize.y)
                    ).rgb;

                    vec3 anim_data_scaled = (anim_data - rest) * amplitude;
                    vec4 world_position = instanceMatrix * vec4(position + anim_data_scaled, 1.0);
                    gl_Position = projectionMatrix * modelViewMatrix * world_position;
                
                }
            `,
            
        });

    }

}
