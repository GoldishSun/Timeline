const Timeline = class Timeline {
  constructor(canvas) {
    this.canvas = canvas;
    this.start_x = 0;
    this.smallBarSize = { x: 2, y: 10 };
    this.largeBarSize = { x: 2, y: 20 };
    this.canMove = false;
    this.clickedAxis = null;
    this.playPoint = null; // 재생시점의 시간 TODO: new Date() 또는 yyyy-MM-dd HH:mm:ss 로 받을 수 있게 작업
    this.playStartPoint = null;
    this.playEndPoint = null;
    this.width = null; 
    this.height = 50; 
    this.mode = 'pc';
    this.scale = 'tenMin'; // 1분, 10분, 1시간, 3시간, 6시간 등
    this.barInterval = null; // 바와 바 사이의 픽셀 간격
    this.unit = null; // 1pixel 당 시간임 : init 또는 scale변경시 초기화
    this.scaleTable = {
      // width와 spacing을 이용하여 pixel당 단위 시간을 구함
      pc: {
        oneMin: {
          spacing: 10,
          sec: 60,
        },
        tenMin: {
          spacing: 10,
          sec: 600,
        },
        oneHour: {
          spacing: 6,
          sec: 3600,
        },
        threeHour: {
          spacing: 5,
          sec: 10800,
        },
        sixHour: {
          spacing: 4,
          sec: 21600,
        },
      },
      mobile: {
        oneMin: {
          spacing: 10,
          sec: 60,
        },
        tenMin: {
          spacing: 10,
          sec: 600,
        },
        oneHour: {
          spacing: 5,
          sec: 3600,
        },
        threeHour: {
          spacing: 5,
          sec: 10800,
        },
        sixHour: {
          spacing: 4,
          sec: 21600,
        },
      },
    };
    this.recordList = [];
    this.bookMarkList = [];
    this.soundList = [];
    this.motionList = [];
    this.init();
  }
  init() {
    this.width = this.canvas.parentNode.clientWidth;
    this.canvas.width = this.width;
    this.setUnit();
    this.setBarInterval();
    if (this.playPoint) {
      this.setTimeLineStartPoint();
      this.setTimeLineEndPoint();
    }

    this.canvas.addEventListener('mousedown', (e) => {
      if (!this.canMove) {
        this.canMove = true;
        this.clickedAxis = e.clientX;
      }
    });
    document.addEventListener('mouseup', (e) => {
      if (this.canMove) {
        this.canMove = false;
        const pp = this.getDragPlayPoint(this.clickedAxis, e.clientX);
        this.drawCurrent(pp);
        this.clickedAxis = e.clientX;
      }
    });
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.canMove) {
        const pp = this.getDragPlayPoint(this.clickedAxis, e.clientX);
        this.drawCurrent(pp);
      }
    });

    window.addEventListener('resize', (e) => {
      this.width = this.canvas.parentNode.clientWidth;
      this.canvas.width = this.width;
      this.setUnit();
      this.setBarInterval();
      if (this.playPoint) {
        this.setTimeLineStartPoint();
        this.setTimeLineEndPoint();
      }
      this.drawCurrent(this.playPoint);
    });
  }
  getDragPlayPoint(start, end) {
    // start > end : 현재 플레이보다 미래
    // start < end : 현재 플레이보다 과거
    if (start === end) return this.playPoint;
    const diff = (start - end) * this.unit * this.getSpacing();
    return new Date(this.playPoint.getTime() + diff);
  }
  setBarInterval() {
    const spacing = this.getSpacing();
    console.log(this.unit, spacing);
    // const cell = spacing * 10;
    // const largeBarTotalWidth = (spacing + 1) * this.largeBarSize.x;
    // const smallBarTotalWidth = spacing * 9 * this.smallBarSize.x;
    // const remainder = this.width - (largeBarTotalWidth + smallBarTotalWidth);
    // this.barInterval = Number((remainder / cell).toFixed(4));
  }
  setUnit() {
    const totalSec = this.getScaleSec() * this.getSpacing();
    this.unit = Number((totalSec / this.width).toFixed(4));
  }
  setTimeLineStartPoint() {
    const minus = (this.width / 2) * this.unit;
    const sp = new Date(this.playPoint);
    sp.setSeconds(sp.getSeconds() - minus);
    this.playStartPoint = sp;
  }
  setTimeLineEndPoint() {
    const plus = (this.width / 2) * this.unit;
    const ep = new Date(this.playPoint);
    ep.setSeconds(ep.getSeconds() + plus);
    this.playEndPoint = ep;
  }
  getScaleSec() {
    return this.scaleTable[this.mode][this.scale]['sec'];
  }
  getSpacing() {
    return this.scaleTable[this.mode][this.scale]['spacing'];
  }
  getLargeBarTextList() {
    return [
      '17:10',
      '17:20',
      '17:30',
      '17:40',
      '17:50',
      '18:00',
      '18:10',
      '18:20',
      '18:30',
      '18:40',
      '18:50',
      '19:00',
      '19:10',
    ];
  }
  drawPlayPointLine() {
    const ctx = this.canvas.getContext('2d');
    ctx.fillStyle = 'rgba(3, 122, 180, 0.9)';
    ctx.fillRect(this.width / 2, 0, 2, 100);

    ctx.beginPath();
    ctx.moveTo(this.width / 2 - 4, 0);
    ctx.lineTo(this.width / 2 + 1, 5);
    ctx.lineTo(this.width / 2 + 5, 0);
    ctx.closePath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(3, 122, 180, 0.9)';
    ctx.stroke();
    ctx.fillStyle = 'rgba(3, 122, 180, 0.9)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(this.width / 2 - 4, this.canvas.height);
    ctx.lineTo(this.width / 2 + 1, this.canvas.height - 5);
    ctx.lineTo(this.width / 2 + 5, this.canvas.height);
    ctx.closePath();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(3, 122, 180, 0.9)';
    ctx.stroke();
    ctx.fillStyle = 'rgba(3, 122, 180, 0.9)';
    ctx.fill();
  }
  drawSmallLine(x, y) {
    const ctx = this.canvas.getContext('2d');
    ctx.fillStyle = 'rgba(156, 157, 160, 0.5)';
    ctx.fillRect(x, y, this.smallBarSize.x, this.smallBarSize.y);
  }
  drawLargeLine(x, y, text) {
    if (text) {
      const txt = this.canvas.getContext('2d');
      txt.font = '10px Arial';
      txt.fillStyle = 'rgba(150, 150, 150, 1)';
      txt.fillText(text, x - 12, y - 5);
    }
    const ctx = this.canvas.getContext('2d');
    ctx.fillStyle = 'rgba(156, 157, 160, 1)';
    ctx.fillRect(x, y, this.largeBarSize.x, this.largeBarSize.y);
  }
  drawBookMark() {
    this.bookMarkList.filter((ele) => {}).forEach((ele) => {});
  }
  drawMotionMark() {
    this.motionList.filter((ele) => {}).forEach((ele) => {});
  }
  drawSoundMark() {
    this.soundList.filter((ele) => {}).forEach((ele) => {});
  }
  drawRecordBox(sx, sy, ex, ey) {}
  drawRefresh() {
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.width, this.height);
  }
  drawOneMin() {}
  drawOneHour() {}
  drawThreeHour() {}
  drawSixHour() {}
  drawTenMin() {
    let sp = this.playStartPoint.getTime();
    let loader = this.unit * 1000;
    const largeTerm = 10;
    let largeRemainder, largeShare;
    let lastLarge = [-1, -1];
    let isFirst = true;
    for (let g = this.start_x; g < this.width; ++g) {
      const tmp = new Date(sp);
      const hour = tmp.getHours();
      const min = tmp.getMinutes();
      largeShare = min / largeTerm;
      largeRemainder = min % largeTerm;
      if (!largeRemainder && lastLarge[0] != largeShare) {
        this.drawLargeLine(
          g,
          this.canvas.height - 20,
          `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
        );
        if (!isFirst) {
          for (let w = lastLarge[1]; w < g; w += this.barInterval)
            this.drawSmallLine(w, this.canvas.height - 10);
        } else {
          for (let w = g; w > 0; w -= this.barInterval)
            this.drawSmallLine(w, this.canvas.height - 10);
          isFirst = false;
        }
        lastLarge = [largeShare, g];
      }
      sp += loader;
    }
    for (let w = lastLarge[1]; w < this.width; w += this.barInterval)
      this.drawSmallLine(w, this.canvas.height - 10);
  }
  drawCurrent(playPoint) {
    this.drawRefresh();

    this.playPoint = playPoint;
    this.setTimeLineStartPoint();
    this.setTimeLineEndPoint();

    console.log(this.playStartPoint, this.playEndPoint);

    if (this.scale === 'oneMin') this.drawOneMin();
    else if (this.scale === 'tenMin') this.drawTenMin();
    else if (this.scale === 'oneHour') this.drawOneHour();
    else if (this.scale === 'threeHour') this.drawThreeHour();
    else if (this.scale === 'sixHour') this.drawSixHour();
    else this.drawTenMin();

    this.drawBookMark();
    this.drawMotionMark();
    this.drawSoundMark();
    this.drawPlayPointLine();
  }
};

var canvas = document.getElementById('timeline');
const timeline = new Timeline(canvas);
const playPoint = new Date();
var logger = document.getElementById('logger');
logger.innerText = playPoint + ', ' + timeline.mode + ', ' + timeline.scale;
timeline.drawCurrent(playPoint);
