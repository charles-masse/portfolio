
import * as THREE from 'three';

export default class extends THREE.ShaderMaterial {

    constructor(){
        super({

            vertexShader: `
                attribute vec3 instance_id;
                varying vec3 vColor;

                void main() {

                    vColor = instance_id;
                    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.);

                }
            `,

            fragmentShader: `
                varying vec3 vColor;

                void main() {
                    gl_FragColor = vec4(vColor, 1.);
                }
            `,

        })

    }

}
