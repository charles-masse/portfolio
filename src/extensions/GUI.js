
import * as THREE from 'three';

import * as YUKA from 'yuka';

import * as LIL from 'lil-gui';

import {worldToLocal,} from '../utilities/math.js';

//'#ebebeb' White
//'#424242' Grey
//'#2cc9ff' Blue
//'#a2db3c' Green

class GUI extends LIL.GUI {

    addDelaunay(object, property) {
        return new DelaunayController(this, object, property).disable();
    }

    addText(property) {
        return new LIL.Controller(this, {}, ` ${property}`).disable();
    }

    addFolder(title) {

        const folder = new GUI({parent: this, title});
        if (this.root._closeFolders) folder.close();

        return folder;
    }

}

class DelaunayController extends LIL.Controller {

    constructor(parent, object, property) {
        super(parent, object, property, 'lil-color');

        this.$display = document.createElement('canvas');
        this.$display.width = 100
        this.$display.height = 100
        this.$display.style.width = '100px'
        this.$display.style.height = '100px';
        
        this.$widget.appendChild(this.$display);

        this.ctx = this.$display.getContext('2d');

        return this;

    }

    drawClip(point, name='', color='#ebebeb') {

        this.ctx.fillStyle = color;

        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.font = '9px monospace';
        this.ctx.textAlign = 'center';

        this.ctx.fillText(name, point.x, point.y - 4.5);

    }

    drawTriangle(coords) {

        this.ctx.strokeStyle = '#424242';
        
        this.ctx.beginPath();
        this.ctx.moveTo(coords[0].x, coords[0].y);
        this.ctx.lineTo(coords[1].x, coords[1].y);
        this.ctx.lineTo(coords[2].x, coords[2].y);
        this.ctx.closePath();
        this.ctx.stroke();

    }

    updateDisplay() {

        this.ctx.clearRect(0,0,100,100);

        const agent = this.getValue();
        const blendSpaces = agent.blendSpaces;
        //Find min and max values
        const points_x = blendSpaces.clips.map(point => point.locomotion.x);
        let max_x = Math.max(...points_x);
        let min_x = Math.min(...points_x);

        const points_z = blendSpaces.clips.map(point => point.locomotion.z);
        let max_z = Math.max(...points_z);
        let min_z = Math.min(...points_z);
        //Scale coords for display
        const center_x = (min_x + max_x) / 2;
        const center_y = (min_z + max_z) / 2;

        max_x = THREE.MathUtils.lerp(center_x,  max_x, 1.5);
        min_x = THREE.MathUtils.lerp(center_x,  min_x, 1.5);

        max_z = THREE.MathUtils.lerp(center_y,  max_z, 1.25); //Bottom doesn't have labels
        min_z = THREE.MathUtils.lerp(center_y,  min_z, 1.5);
        //Map coords on 100px display
        const scaled_points = blendSpaces.clips.map(point => new THREE.Vector2(
            THREE.MathUtils.inverseLerp(max_x, min_x, point.locomotion.x) * 100,
            THREE.MathUtils.inverseLerp(max_z, min_z, point.locomotion.z) * 100)
        );
        //Draw triangles
        const triangles = [];

        for (let i = 0; i < blendSpaces.triangles.length; i += 3) {
            triangles.push([
                scaled_points[blendSpaces.triangles[i]],
                scaled_points[blendSpaces.triangles[i + 1]],
                scaled_points[blendSpaces.triangles[i + 2]]
            ]);
        }

        for (let i = 0; i < triangles.length; ++i) {
            this.drawTriangle(triangles[i]);
        }
        //Draw points
        for (let i = 0; i < scaled_points.length; ++i) {
            this.drawClip(scaled_points[i], blendSpaces.clips[i].name);
        }

        const direction = agent.getDirection(new YUKA.Vector3());
        const velocity = worldToLocal(agent.velocity, direction);

        this.drawClip(
            new THREE.Vector2(
                THREE.MathUtils.inverseLerp(max_x, min_x, velocity.x) * 100,
                THREE.MathUtils.inverseLerp(max_z, min_z, velocity.z) * 100
            ),
            '',
            '#2cc9ff'
        );

    }

}

export {
    GUI,
};
