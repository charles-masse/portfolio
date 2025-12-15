
import {GUI, Controller} from 'lil-gui';

import Chart from 'chart.js/auto';

class customGUI extends GUI {

    constructor(parent, autoPlace, container, width, title, closeFolders, injectStyles, touchStyles) {
        super(parent, autoPlace, container, width, title, closeFolders, injectStyles, touchStyles);
    }

    addGraph(object, property) {
        return new GraphController(this, object, property);
    }

}

class GraphController extends Controller {

    constructor(parent, object, property) {
        super(parent, object, property, 'lil-color');

        this.$display = document.createElement('canvas');
        this.$display.classList.add('lil-display');
        this.$display.id = 'fuzzy';

        this.$widget.appendChild(this.$display);

        new Chart(document.getElementById('fuzzy'), {
            type: 'line',
            data: {
                datasets: [
                    {
                        data: [
                            {x: 0.25, y: 0},
                            {x: 0.25, y: 1}
                        ],
                        borderColor: '#2cc9ff',
                        borderWidth: 2,
                        fill: false,
                        showLine: true,
                        pointRadius: 0
                    },
                    {
                        data: [
                            {x: 0.5, y: 0},
                            {x: 0.9, y: 1},
                            {x: 1, y: 0}
                        ],
                        fill: 'origin',
                        borderColor: 'green',
                        backgroundColor: 'rgba(0,255,0,0.3)',
                        borderWidth: 1,
                        tension: 0.4
                    }, 
                    {
                        data: [
                            {x: 0, y: 0},
                            {x: 0.25, y: 1},
                            {x: 0.75, y: 0}
                        ],
                        fill: 'origin',
                        borderColor: 'red',
                        backgroundColor: 'rgba(255,0,0,0.3)',
                        borderWidth: 1,
                        tension: 0.4
                    },
                ]
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        display: false,
                        suggestedMin: 0,
                        suggestedMax: 1
                    },
                    y: {
                        display: false,
                        suggestedMin: 0,
                        suggestedMax: 1
                    }
                },
                plugins: {
                    legend: {display: false},
                    filler: {propagate: true}
                },
                elements: {point: {radius: 0}},
                layout: {padding: 0}
            }
        });

    }

}

export {
    customGUI,
    GraphController,
};