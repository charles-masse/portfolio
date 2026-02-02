
import * as YUKA from 'yuka';

import * as LIL from 'lil-gui';

import Chart from 'chart.js/auto';

import {COLORS} from '../settings.js';

class GUI extends LIL.GUI {

    addFuzzy(object, property, fuzzyModule, min=0, max=1) {
        return new FuzzyController(this, object, property, fuzzyModule, min, max);
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

class FuzzyController extends LIL.Controller {

    constructor(parent, object, property, fuzzyVariable, min, max) {
        super(parent, object, property, 'lil-color');

        this.fuzzyVariable = fuzzyVariable;
        //Create the html element
        this.$display = document.createElement('canvas');
        this.$display.classList.add('lil-display');
        this.$widget.appendChild(this.$display);
        //Chart.js
        const range = Math.abs(max-min);

        this.chart_settings = {
            type: 'line',
            data: {/*datasets goes here*/},
            options: {
                animation: false,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        display: false,
                        min: min - 0.01 * range,
                        max: max + 0.01 * range,
                    },
                    y: {
                        display: false,
                        min: 0,
                        max: 1,
                    }
                },
                plugins: {
                    legend: {display: false},
                    tooltip: {enabled: false},
                },
                elements: {
                    point: {radius: 0}
                },
            }
        };

        this.sets = this.init_sets(fuzzyVariable);
        this.chart = new Chart(this.$display, this.chart_settings);

        this.updateDisplay();

    }

    init_sets(fuzzyVariable) {

        const sets_array = [];

        for (const set_id in fuzzyVariable.fuzzySets) {

            const set_data = fuzzyVariable.fuzzySets[set_id];
            //Display the right graph type
            let y_value = null;
            if (set_data instanceof YUKA.LeftShoulderFuzzySet) {
                y_value = {left: 1, midpoint: 1, right: 0};

            } else if (set_data instanceof YUKA.RightShoulderFuzzySet) {
                y_value = {left: 0, midpoint: 1, right: 1};

            } else if (set_data instanceof YUKA.TriangularFuzzySet) {
                y_value = {left: 0, midpoint: 1, right: 0};

            }
            
            const color = set_data.color;

            sets_array.push(

                {
                    data: [
                        {x: set_data.left, y: y_value.left},
                        {x: set_data.midpoint, y: y_value.midpoint},
                        {x: set_data.right, y: y_value.right},
                    ],
                    fill: 'origin',
                    borderWidth: 1,
                    borderColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
                    backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`,
                }

            );
        }

        return sets_array;
    }

    updateDisplay() {
        
        const current_values = this.getValue();

        let data = []

        if (current_values) {

            current_values.forEach((value, value_id) => {

                data.push(
                    {
                        data: [
                            {x: current_values[value_id], y: 0},
                            {x: current_values[value_id], y: 1},
                        ],
                        borderWidth: 2,
                        borderColor: COLORS[value_id],
                    }
                );

            });

        }

        this.chart_settings.data.datasets = [...data, ...this.sets];
        this.chart.update();

        return this;
    }

}

export {
    GUI,
    FuzzyController,
};
