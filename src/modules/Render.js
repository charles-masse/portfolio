
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';

import outlineShader from '../shaders/outlineShader.js'
import outlineDilationShader from '../shaders/outlineDilationShader.js'


function isCompatible(object) {

    const geometry = object.geometry;
    const hasNormals = (geometry !== undefined) && (geometry.attributes.normal !== undefined);

    return (
        object.isMesh === true &&
        object.material !== undefined &&
        hasNormals === true
    );
}

export default class {

    constructor(renderer, scene, camera) {

        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        this.originalMaterials = {};
        this.materialCache = {};
        //Passes
        this.idRender = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
        this.depthRender = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
        //Comp
        this.composer = new EffectComposer(renderer);
        this.composer.addPass(new ShaderPass(new outlineShader(this.idRender, this.depthRender)));
        this.composer.addPass(new ShaderPass(new outlineDilationShader(this.depthRender)));
        // this.composer.addPass(new RenderPass(scene, camera));

    }

    update() {
        //Create mask
        this.scene.traverse((object) => {this.objectMask(object)});
        //ID Pass
        this.renderer.setRenderTarget(this.idRender);
        this.renderer.render(this.scene, this.camera);
        //Depth Pass
        this.scene.traverse((object) => {this.setDepthMaterial(object)});
        this.renderer.setRenderTarget(this.depthRender);
        this.renderer.render(this.scene, this.camera);
        //Put the materials back
        this.scene.traverse((object) => {this.disableMask(object)});
        //Final render
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

    setDepthMaterial(object) {

        if (object instanceof THREE.InstancedMesh) {

            object.material.fragmentShader = `
                varying float distance;

                void main() {
                    gl_FragColor = vec4(vec3(clamp(distance / 75., 0., 1.)), 1.);
                }
            `;
            object.material.needsUpdate = true;

        }

    }

}
