
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {SMAAPass} from 'three/addons/postprocessing/SMAAPass.js';

import outlineShader from '../shaders/outlineShader.js';

const MAX_DEPTH = "100.";

function isCompatible(object) {

    const geometry = object.geometry;
    const hasNormals = (geometry !== undefined) && (geometry.attributes.normal !== undefined);

    return (object.isMesh === true && object.material !== undefined && hasNormals === true);
}

export default class {

    constructor(renderer, scene, camera) {

        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        this.originalMaterials = {};
        this.materialCache = {};
        //Passes
        this.beautyRender = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
        this.depthidRender = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
        //Comp
        this.composer = new EffectComposer(renderer);
        this.composer.addPass(new ShaderPass(new outlineShader(this.depthidRender, this.beautyRender)));
        this.composer.addPass(new SMAAPass(window.innerWidth * 16, window.innerHeight * 16));

    }

    update() {
        //Beauty
        this.renderer.setRenderTarget(this.beautyRender);
        this.renderer.render(this.scene, this.camera);
        //Create object mask
        this.scene.traverse((object) => {this.objectMask(object);});
        //Depth/ID Pass
        this.scene.traverse((object) => {this.overrideFragment(
            object, 
            `
                varying vec2 vUv;

                flat varying float variation;
                flat varying vec3 color_id;
                flat varying float color_depth;

                uniform sampler2D alpha;

                void main() {
                    gl_FragColor = vec4(vec3(color_id[0], color_id[1], color_depth / ${MAX_DEPTH}), texture2D(alpha, vUv)[int(variation)]);
                }
            `
        );});

        this.renderer.setRenderTarget(this.depthidRender);
        this.renderer.render(this.scene, this.camera);
        //Put the original materials back
        this.scene.traverse((object) => {this.disableMask(object);});
        this.scene.traverse((object) => {this.overrideFragment(
            object, 
            `
                varying vec2 vUv;

                flat varying float variation;

                uniform sampler2D alpha;

                void main() {
                    gl_FragColor = vec4(vec3(0.), texture2D(alpha, vUv)[int(variation)]);
                }
            `
        );});
        //Comp
        this.composer.render();

    }

    getMaskMaterial(originalMaterial) {

        let mat = this.materialCache[originalMaterial.uuid];

        if (mat === undefined) {

            mat = new THREE.MeshBasicMaterial({color: 0x000000});
            this.materialCache[originalMaterial.uuid] = mat;

        }

        return mat;
    }

    objectMask(object) {

        if (isCompatible(object) && !(object instanceof THREE.InstancedMesh)) {

            const mask_material = this.getMaskMaterial(object.material);

            this.originalMaterials[mask_material.uuid] = object.material;

            object.material = mask_material;

        }
        
    }

    disableMask(object) {

        if (isCompatible(object) && !(object instanceof THREE.InstancedMesh)) {
            object.material = this.originalMaterials[object.material.uuid];
        }

    }

    overrideFragment(object, override) {

        if (object instanceof THREE.InstancedMesh) {

            object.material.fragmentShader = override;
            object.material.needsUpdate = true;

        }

    }

}
