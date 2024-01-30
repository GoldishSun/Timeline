
const Timeline = class Timeline {
  constructor(canvas) {
    this.canvas = canvas;
    this.lines = new Map();
    this.start_x = 10;
    this.scale = 1;
    this.init();
    this.canMove = false;
    this.clickedAxis = [0, 0];
  }
  init() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.canMove = true;
      this.clickedAxis = [e.clientX, e.clientY];
    });
    document.addEventListener('mouseup', (e) => {
      this.canMove = false;
      this.clickedAxis = [0, 0];
    });
    this.canvas.addEventListener('mousemove', (e) => {
      // if (this.canMove) {
      //   const weigth = (e.clientX - this.clickedAxis[0]) / 5
      //   this.drawRefresh();
      //   this.drawCurrent(weigth);
      // }
    });
    
  }
  drawSmallLine(x, y) {
    const ctx = this.canvas.getContext('2d');
    ctx.fillStyle = "#111111";
    ctx.fillRect(x, y, 2, 10);
    this.lines.set(`${x}_${y}_sl`, ctx);
  }
  drawLargeLine(x, y) {
    const ctx = this.canvas.getContext('2d');
    ctx.fillStyle = "111111";
    ctx.fillRect(x, y, 2, 20);
    this.lines.set(`${x}_${y}_ll`, ctx);
  }
  drawRefresh() {
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, 2000, 100);
  }
  drawCurrent(weight, maximum) {
    let axis_x = this.start_x + weight;
    const scale_x = 10;
    for (let g = 0; g <= maximum; ++ g) {
      if (g % 5) timeline.drawSmallLine(axis_x, 20);
      else timeline.drawLargeLine(axis_x, 10);
      axis_x += scale_x;
    }
  }
}

var canvas = document.getElementById('timeline');
const timeline = new Timeline(canvas);
var logger = document.getElementById('logger');
let weight = 0;
let adder = 0;
setInterval(() => {
  timeline.drawRefresh();
  timeline.drawCurrent(weight, 100 + (adder / 10));
  weight -= 1;
  adder += 1;
  logger.innerText = `${(adder / 10)}s`;
}, 100);