import * as Animation from './animation.js';

const canvas = document.getElementById('physicsCanvas');

function windowResize() {
    canvas.width = window.innerWidth * (2/3);
    canvas.height = window.innerHeight * (2/3);
}

window.addEventListener('resize', windowResize, false);
windowResize();

const a = new Animation.Animation(canvas)
a.run();