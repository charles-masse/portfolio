
import * as THREE from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import * as YUKA from 'yuka';
//States
import {Walk} from '../stateMachines/Pictogram.js';

function sync(entity, renderComponent) {
    renderComponent.matrix.copy(entity.worldMatrix);
}

class PictogramAgent extends YUKA.GameEntity {

    constructor(scene) {
        super();

        this.currentTime = 0; //tracks how long the entity is in the current state
        this.stateDuration = 5; //duration of a single state in seconds
        this.crossFadeDuration = 1; //duration of a crossfade in seconds
        //Geo
        const loader = new FBXLoader();
        loader.load('pictogram.fbx', (fbx) => {

            fbx.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshBasicMaterial({
                        color: 0x000000,
                        side: THREE.DoubleSide,
                    });
                }
            });

            const model = fbx;
            
            model.matrixAutoUpdate = false;
            this.setRenderComponent(model, sync);

            scene.add(model);
            //Animations
            const animations = model.animations;
            this.mixer = new THREE.AnimationMixer(model);

            const actions = {};
            animations.forEach((clip) => {
                actions[clip.name] = this.mixer.clipAction(clip);
            });

            actions['Take 001'].play();

            // this.stateMachine = new YUKA.StateMachine(this);
            // this.stateMachine.add('WALK', new Walk());

        });
        //Vehicle
        this.vehicle = new YUKA.Vehicle();
        this.vehicle.maxSpeed = (Math.random() + 0.1) * 0.5;

    }

    //TO DO--Random variations

    update(delta) {

        this.currentTime += delta;

        if (this.mixer) {
            this.mixer.update(delta);
        }
        // this.stateMachine.update();
        this.vehicle.update(delta);
        this.position.copy(this.vehicle.position);
        this.rotation.copy(this.vehicle.rotation);

        return this;

    }

}

export {PictogramAgent};
