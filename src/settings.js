//Crowd
export const MAX_AGENTS = 500;
//KdTree
export const MAX_NEIGHBORS = 10;
export const MAX_LEAF_SIZE = 10;
//ORCA
export const TIME_STEP = 0.25;
//Steering
export const FEELER_ANGLE = 45;
//DayNight
export const START_TIME_SECS = 5;
export const SUN_SPEED = -20;
export const DAY_EVENTS = [
    { //Sunrise
        time:0,
        top_color:{r:106, g:132, b:191},
        bot_color:{r:246, g:114, b:128},
        ambient_color:{r:246, g:114, b:128},
    },
    { //Midday
        time:0.24,
        top_color:{r:0, g:191, b:255},
        bot_color:{r:255, g:255, b:255},
        ambient_color:{r:0, g:191, b:255},
    },
    { //Sunset
        time:0.5,
        top_color:{r:246, g:114, b:128},
        bot_color:{r:246, g:114, b:128},
        ambient_color:{r:25, g:25, b:112},
    },
    { //Midnight
        time:0.75,
        top_color:{r:25, g:25, b:112},
        bot_color:{r:0, g:0, b:0},
        ambient_color:{r:25, g:25, b:112},
    },
];
//Charts
export const COLORS = [
    'rgb(130, 70, 200)',
    'rgb(220, 200, 40)',
    'rgb(0, 70, 180)',
    'rgb(190, 100, 50)',
    'rgb(0, 200, 220)',
    'rgb(180, 50, 70)',
    'rgb(0, 140, 120)',
    'rgb(220, 140, 40)',
    'rgb(40, 180, 90)',
    'rgb(150, 200, 60)',
]
