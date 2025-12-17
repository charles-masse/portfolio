
import * as YUKA from 'yuka';

import {GUI, Controller} from 'lil-gui';

import Chart from 'chart.js/auto';

const COLORS = [
    {r:255, g:0,  b:0},
    {r:0, g:255,  b:0},
    {r:0, g:0,  b:255},
];

class customGUI extends GUI {

    addFuzzy(object, property, fuzzyModule) {

        return new FuzzyController(this, object, property, fuzzyModule);
    }

    addFolder(title) {

        const folder = new customGUI({parent: this, title});
        if (this.root._closeFolders) folder.close();

        return folder;
    }

}

class FuzzyController extends Controller {

    constructor(parent, object, property, fuzzyVariable) {
        super(parent, object, property, 'lil-color');
        //Create the html element
        this.$display = document.createElement('canvas');
        this.$display.classList.add('lil-display');
        this.$widget.appendChild(this.$display);
        //Chart.js
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

            const color = COLORS[set_id];

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

        let test = []

        for (const value_id in current_values) {

            test.push(
                {
                    data: [
                        {x: current_values[value_id], y: 0},
                        {x: current_values[value_id], y: 1},
                    ],
                    borderWidth: 2,
                    borderColor: '#2cc9ff',
                }
            );

        }

        this.chart_settings.data.datasets = [...test, ...this.sets];

        this.chart.update();

        return this;

    }

}

export {
    customGUI,
    FuzzyController,
};
