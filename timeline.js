const Timeline = class Timeline {
  constructor(canvas, selectedScale) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.start_x = 0;
    this.smallBarSize = { x: 2, y: 5 };
    this.largeBarSize = { x: 2, y: 10 };
    this.soundDetectBarSize = { x: 2, y: 25 };
    this.motionDetectBarSize = { x: 2, y: 25 };
    this.clipMarkStyle = {
      start : {
        color: 'rgba(255,255,255,1)',
        thick: 4,
        shrink: 4,
      },
      area : {
        color: 'rgba(112,114,119,1)',
      },
      end : {
        color: 'rgba(255,255,255,1)',
        thick: 4,
        shrink: 4,
      },
    }
    this.bookMarkBarSize = { w: 7, h: 12, arrowH: 3};
    this.canMove = false;
    this.clickedAxis = null;
    this.isClipCreate = false;
    this.createdClip = {
      clipStart: null,
      startOffset: null,
      clipEnd: null,
      endOffset: null,
    };
    this.playPoint = new Date(); // 재생시점의 시간 TODO: new Date() 또는 yyyy-MM-dd HH:mm:ss 로 받을 수 있게 작업
    this.playStartPoint = null;
    this.playEndPoint = null;
    this.width = null; 
    this.height = 50; 
    this.mode = 'pc';
    this.scale = 'tenMin'; // 1분, 10분, 1시간, 3시간, 6시간 등
    if(selectedScale) this.scale = selectedScale;
    this.barInterval = null; // 바와 바 사이의 픽셀 간격
    this.unit = null; // 1pixel 당 시간초 : init 또는 scale변경시 초기화
    this.scaleTable = {
      // width와 spacing을 이용하여 pixel당 단위 시간을 구함
      // spacing : 큰바의 최대 갯수
      // sec : 큰바와 큰바 사이의 간격에 대한 시간초
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
          spacing: 10,
          sec: 3600,
        },
        threeHour: {
          spacing: 10,
          sec: 10800,
        },
        sixHour: {
          spacing: 10,
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
    this.bookmarkPositionList = [];
    this.bookMarkList = [];
    this.soundList = [];
    this.motionList = [];
    this.clipList = [];
    this.recordList = [];
    this.init();
    this.setTestData(); // 테스트를 위한 임시 랜덤 데이터 생성, 개발 완료 후 제거 예정
  }
    setTestData() { // 테스트를 위한 임시 랜덤 데이터 생성, 개발 완료 후 제거 예정
    let Point = this.playStartPoint.getTime();
    const loader = (this.playPoint.getTime() - this.playStartPoint.getTime()) / 10;
    for(let g = 0; g < 9; ++ g) {
      Point += loader;
      this.soundList.push(new Date(Point));
      this.motionList.push(new Date(Point + (Math.random(5, 10) * 200000)));
      this.bookMarkList.push(new Date(Point - (Math.random(3, 10) * 300000)));
    }
    // this.clipList.push({
    //   clipStart: new Date(Point - (Math.random(10, 20) * 100000)),
    //   clipEnd: new Date(Point + (Math.random(10, 20) * 100000)),
    //   isStart: true, // 시작점이 타임라인 안에 들어가 있는지 확인
    //   isEnd: true,   // 종료점이 타임라인 안에 들어가 있는지 확인
    // })
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
      }
    });
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.canMove) {
        this.isClipCreate = false;
        const pp = this.getDragPlayPoint(this.clickedAxis, e.clientX);
        this.clickedAxis = e.clientX;
        this.drawCurrent(pp);
      }
    });
    window.addEventListener('resize', (e) => {
      this.width = this.canvas.parentNode.clientWidth;
      this.canvas.width = this.width;
      this.reboot();
      this.drawCurrent(this.playPoint);
    });

    this.canvas.addEventListener('click', e => {
      const x = e.offsetX;
      if (this.isClipCreate) {
        const tmp = this.getClickedClipPlayPoint(x);
        if (this.createdClip.clipStart === null) {
          this.createdClip.clipStart = tmp;
          this.createdClip.startOffset = x;
          this.createdClip.clipEnd = null;
          this.createdClip.endOffset = null;
          this.drawClipStartLine(x);
          return;
        }
        if (this.createdClip.clipStart.getTime() > tmp.getTime()) {
          this.createdClip.clipStart = tmp;
          this.createdClip.startOffset = x;
          this.createdClip.clipEnd = null;
          this.createdClip.endOffset = null;
          this.drawClipStartLine(x);
          return;
        }
        if (this.createdClip.clipEnd === null) {
          this.createdClip.clipEnd = tmp;
          this.createdClip.endOffset = x;
          this.drawClipEndLine(x);
          this.drawClipBox(this.createdClip.startOffset, 0, x, this.canvas.height / 2);
          return;
        }
        this.createdClip.clipStart = tmp;
        this.createdClip.clipEnd = null;
        return;
      }
      const y = e.offsetY;
      if (y > this.bookMarkBarSize.h) return;
      const tmp = this.bookmarkPositionList.filter(ele => {
        if(x >= ele.AxisXStart && x <= ele.AxisXEnd) return true;
      })
      if (tmp.length > 0) {
        const demandDate = tmp[0].date;
        console.log('bookmark demandDate', demandDate);
      }
    })
  }
  reboot() {
    this.setUnit();
    this.setBarInterval();
    if(this.playPoint) {
      this.setTimeLineStartPoint();
      this.setTimeLineEndPoint();
    }
    this.canMove = false;
    this.isClipCreate = false;
    this.createdClip = {
      clipStart : null,
      clipEnd : null,
    }
  }
  getClickedClipPlayPoint(c) {
    const diff = c * 100 * (this.getScaleSec() / this.getSpacing());
    return new Date(this.playStartPoint.getTime() + diff);
  }
  getDragPlayPoint(start, end) {
    // start > end : 현재 플레이보다 미래
    // start < end : 현재 플레이보다 과거
    if (start === end) return this.playPoint;
    const diff = (start - end) * 100 * (this.getScaleSec() / this.getSpacing());
    return new Date(this.playPoint.getTime() + diff);
  }
  setBarInterval() {
    const spacing = this.getSpacing();
    let cell = spacing * 10;
    const largeBarTotalWidth = (spacing - 1) * this.largeBarSize.x;
    const smallBarTotalWidth = spacing * (spacing - 1) * this.smallBarSize.x;
    const remainder = this.width - (largeBarTotalWidth + smallBarTotalWidth);
    this.barInterval = Number((remainder / cell).toFixed(8)) + this.smallBarSize.x;
  }
  setUnit() { // 1pixel 당
    const totalSec = this.getScaleSec() * this.getSpacing();
    this.unit = Number((totalSec / this.width).toFixed(8));
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
  getXAxisOfPoint(date) {
    let isPlus = true;
    let diff = this.playPoint.getTime() - date.getTime();
    if (diff < 0) isPlus = false;
    diff = Math.abs(diff) / (this.unit * 1000);
    return isPlus ? (this.width / 2) - diff : (this.width / 2) + diff;
  }
  drawPlayPointLine() {
    this.ctx.fillStyle = 'rgba(3, 122, 180, 0.9)';
    this.ctx.fillRect(this.width / 2, 0, 2, 100);

    this.ctx.beginPath();
    this.ctx.moveTo(this.width / 2 - 4, 0);
    this.ctx.lineTo(this.width / 2 + 1, 5);
    this.ctx.lineTo(this.width / 2 + 5, 0);
    this.ctx.closePath();
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = 'rgba(3, 122, 180, 0.9)';
    this.ctx.stroke();
    this.ctx.fillStyle = 'rgba(3, 122, 180, 0.9)';
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(this.width / 2 - 4, this.canvas.height);
    this.ctx.lineTo(this.width / 2 + 1, this.canvas.height - 5);
    this.ctx.lineTo(this.width / 2 + 5, this.canvas.height);
    this.ctx.closePath();
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = 'rgba(3, 122, 180, 0.9)';
    this.ctx.stroke();
    this.ctx.fillStyle = 'rgba(3, 122, 180, 0.9)';
    this.ctx.fill();
  }
  drawSmallLine(x, y) {
    this.ctx.fillStyle = 'rgba(156, 157, 160, 0.5)';
    this.ctx.fillRect(x, y, this.smallBarSize.x, this.smallBarSize.y);
  }
  drawLargeLine(x, y, text) {
    if (text) {
      this.ctx.font = '10px Arial';
      this.ctx.fillStyle = 'rgba(150, 150, 150, 1)';
      this.ctx.fillText(text, x - 12, y - 5);
    }
    this.ctx.fillStyle = 'rgba(156, 157, 160, 1)';
    this.ctx.fillRect(x, y, this.largeBarSize.x, this.largeBarSize.y);
  }
  drawSoundDetectLine(x) {
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x, 1);
    this.ctx.lineTo(x, this.soundDetectBarSize.y);
    this.ctx.strokeStyle = 'rgba(116, 65, 198, 1)';
    this.ctx.stroke();
    this.ctx.closePath();
  }
  drawMotionDetectLine(x) {
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x, 1);
    this.ctx.lineTo(x, this.motionDetectBarSize.y);
    this.ctx.strokeStyle = 'rgba(111, 198, 65, 1)';
    this.ctx.stroke();
    this.ctx.closePath();
  }
  drawBookMarkLine(x) {
    const { w, h, arrowH } = this.bookMarkBarSize;
    const halfW = w / 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x, 1);
    this.ctx.lineTo(x - halfW, 1);
    this.ctx.lineTo(x - halfW, h);
    this.ctx.lineTo(x, h + arrowH);
    this.ctx.lineTo(x + halfW, h);
    this.ctx.lineTo(x + halfW, 1);
    this.ctx.closePath();
    this.ctx.lineWidth = 2.5;
    this.ctx.strokeStyle = 'rgba(236, 236, 236, 1)';
    this.ctx.stroke();
    this.ctx.fillStyle = 'rgba(115, 115, 115, 1)';
    this.ctx.fill();
  }
  drawBookMark() {
    this.bookmarkPositionList = [];
    this.bookMarkList
    .filter(ele => this.playStartPoint.getTime() <= ele.getTime() && this.playEndPoint.getTime() >= ele.getTime())
    .forEach(ele => {
      const axisX = this.getXAxisOfPoint(ele);
      this.drawBookMarkLine(axisX);

      this.bookmarkPositionList.push({
          date: ele, 
          AxisXStart: axisX - (this.bookMarkBarSize.w / 2), 
          AxisXEnd : axisX + (this.bookMarkBarSize.w / 2),
        });
    });
  }
  drawClipStartLine(x) {
    this.ctx.beginPath();
    this.ctx.moveTo(x - this.clipMarkStyle.start.thick, this.clipMarkStyle.start.shrink);
    this.ctx.lineTo(x, 0);
    this.ctx.lineTo(x, this.canvas.height / 2 - 1);
    this.ctx.lineTo(x - this.clipMarkStyle.start.thick, this.canvas.height / 2 - this.clipMarkStyle.start.shrink);
    this.ctx.closePath();
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = this.clipMarkStyle.start.color;
    this.ctx.stroke();
    this.ctx.fillStyle = this.clipMarkStyle.start.color;
    this.ctx.fill();
  }
  drawClipEndLine(x){
    this.ctx.beginPath();
    this.ctx.moveTo(x + this.clipMarkStyle.end.thick, this.clipMarkStyle.end.shrink);
    this.ctx.lineTo(x, 0);
    this.ctx.lineTo(x, this.canvas.height / 2 - 1);
    this.ctx.lineTo(x + this.clipMarkStyle.end.thick, this.canvas.height / 2 - this.clipMarkStyle.end.shrink);
    this.ctx.closePath();
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = this.clipMarkStyle.end.color;
    this.ctx.stroke();
    this.ctx.fillStyle = this.clipMarkStyle.end.color;
    this.ctx.fill();
  }
  drawClipBox(sx, sy, ex, ey){
    this.ctx.fillStyle = this.clipMarkStyle.area.color;
    this.ctx.fillRect(sx, sy, ex - sx, ey);
  }
  drawClipArea() {
    this.clipList.filter(ele => {
      if (ele.clipEnd.getTime() >= this.playStartPoint.getTime() 
      && ele.clipStart.getTime() <= this.playEndPoint.getTime()) return true;
    }).map(ele => {
      if (ele.clipStart.getTime() < this.playStartPoint.getTime()) {
        ele.isStart = false;
        ele.clipStart = this.playStartPoint;
      }
      if (ele.clipEnd.getTime() > this.playEndPoint.getTime()) {
        ele.isEnd = false;
        ele.clipEnd = this.playEndPoint;
      }
      return ele;
    }).forEach(ele => {
      const sx = this.getXAxisOfPoint(ele.clipStart);
      const ex = this.getXAxisOfPoint(ele.clipEnd);
      this.drawClipBox(sx, 0, ex, this.canvas.height / 2);
      if (ele.isStart) this.drawClipStartLine(sx);
      if (ele.isEnd) this.drawClipEndLine(ex);
    });
  }
  drawClickedClipArea() {
    if (this.createdClip.clipStart === null) return;
    let sx, ex;
    if (this.createdClip.clipStart.getTime() > this.playStartPoint.getTime()){
      sx = this.getXAxisOfPoint(this.createdClip.clipStart);
      this.drawClipStartLine(sx);
    }
    if (this.createdClip.clipEnd === null) return;
    if (this.createdClip.clipEnd.getTime() < this.playEndPoint.getTime()) {
      ex = this.getXAxisOfPoint(this.createdClip.clipEnd);
      this.drawClipEndLine(ex);
      this.drawClipBox(sx, 0, ex, this.canvas.height / 2);
    }
  }
  drawMotionMark() {
    this.motionList
    .filter(ele => this.playStartPoint.getTime() <= ele.getTime() && this.playEndPoint.getTime() >= ele.getTime())
    .forEach(ele => this.drawMotionDetectLine(this.getXAxisOfPoint(ele)));
  }
  drawSoundMark() {
    this.soundList
    .filter(ele => this.playStartPoint.getTime() <= ele.getTime() && this.playEndPoint.getTime() >= ele.getTime())
    .forEach(ele => this.drawSoundDetectLine(this.getXAxisOfPoint(ele)));
  }
  drawRecordBox() {
    this.drawBlueBox(0, 25, this.width / 2, 40);
  }
  drawBlueBox(sx, sy, ex, ey) {
    this.ctx.fillStyle = '#28384c';
    this.ctx.fillRect(sx, sy, ex, ey);
  }
  drawRefresh() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
  drawTimeScale() {
    let sp = this.playStartPoint.getTime();
    const loader = this.unit * 1000;
    let largeRemainder, largeShare;
    let lastLarge = [-1, -1];
    let isFirst = true;

    for (let g = this.start_x; g < this.width; ++g) {
      const tmp = new Date(sp);
      const hour = tmp.getHours();
      let min = tmp.getMinutes();
      let sec = tmp.getSeconds();

      if (this.scale === 'oneHour') {
        largeShare = hour;
        largeRemainder = min % 60;
      } else if (this.scale === 'threeHour') {
        largeShare = hour / 3;
        largeRemainder = hour % 3;
        min = 0; // this.width 와 this.unit 에 의해 1분 정도의 오차가 발생할 수 있음
      } else if (this.scale === 'sixHour') {
        largeShare = hour / 6;
        largeRemainder = hour % 6;
        min = 0; // this.width 와 this.unit 에 의해 1분 정도의 오차가 발생할 수 있음
      }  else if (this.scale === 'tenMin') {
        largeShare = min / 10;
        largeRemainder = min % 10;
      } else if (this.scale === 'oneMin') {
        largeShare = min / 1;
        largeRemainder = sec % 60;
      }
      
      if (!largeRemainder && lastLarge[0] != largeShare) {
        this.drawLargeLine(
          g,
          this.canvas.height - this.largeBarSize.y,
          `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
        );
        
        if (!isFirst) {
          for (let w = lastLarge[1]; w < g; w += this.barInterval)
            this.drawSmallLine(w, this.canvas.height - this.smallBarSize.y);
        } else {
          for (let w = g; w > 0; w -= this.barInterval)
            this.drawSmallLine(w, this.canvas.height - this.smallBarSize.y);
          isFirst = false;
        }
        lastLarge = [largeShare, g];
      }
      sp += loader;
    }
    
    for (let w = lastLarge[1]; w < this.width; w += this.barInterval)
      this.drawSmallLine(w, this.canvas.height - this.smallBarSize.y);
  }
  drawCurrentPlayPoint() {
    this.drawCurrent(this.playPoint);
  }
  drawCurrent(playPoint) {
    this.drawRefresh();

    this.playPoint = playPoint;
    this.setTimeLineStartPoint();
    this.setTimeLineEndPoint();

    this.drawClipArea();
    this.drawMotionMark();
    this.drawSoundMark();
    this.drawBookMark();
    this.drawRecordBox();
    this.drawTimeScale();
    this.drawPlayPointLine();
    this.drawClickedClipArea();
  }
};

var scaleSelectBox = document.getElementById('scaleSelectBox');
var canvas = document.getElementById('timeline');
const timeline = new Timeline(canvas, scaleSelectBox.selectedOptions[0].value);
const playPoint = new Date();
timeline.drawCurrent(new Date());
logger();
setInterval(() => {
  timeline.drawCurrent(new Date());
  logger();
}, 1000);
function logger() {
  var logger = document.getElementById('logger');
  logger.innerText = timeline.playPoint + ', ' + timeline.mode + ', ' + timeline.scale + ', ' + timeline.unit;
  logger.innerText += ' \nclip: ' + timeline.isClipCreate + ', ' + timeline.createdClip.clipStart + " / " + timeline.createdClip.clipEnd;
}

function scaleSelected(select) {
  timeline.scale = select.selectedOptions[0].value;
  timeline.reboot();
  timeline.drawCurrent(timeline.playPoint);
  logger();
}

function clipCreate() {
  timeline.isClipCreate = !timeline.isClipCreate;
  if (!timeline.isClipCreate) {
    timeline.reboot();
  }
  logger();
}