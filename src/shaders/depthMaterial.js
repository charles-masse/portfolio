
import * as THREE from 'three';

export default class extends THREE.ShaderMaterial {

    constructor(){
        super({

            vertexShader: `
                attribute float instance_depth;
                varying float distance;

                void main() {

                    distance = instance_depth;
                    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.);

                }
            `,

            fragmentShader: `
                varying float distance;

                void main() {
                    gl_FragColor = vec4(vec3(1. - clamp(distance / 100., 0., 1.)), 1.);
                }
            `,
            
        });

    }

}