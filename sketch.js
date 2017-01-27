"use strict"
const dotSize = 2;
const maxConnectionLength = 20;
const cellWidth = 20;
const cellHeight = 20;
let input = '{hello}';
let numOfDots = 0;
let time = 0;
let word;

// Dot class
class Dot {
  constructor(anchor, position, radius, direction, startAngle) {
    this.size = dotSize;
    this.anchor = anchor;
    this.position = position;
    this.radius = radius;
    this.direction = direction;
    this.startAngle = startAngle;
    this.connections = [];
    this.transporting = false;
    this.transportDir;
    this.transportLoc = createVector(0, 0);
  }
  
  move() {
    if (!this.transporting) {
      this.position.x = this.anchor.x + cos(time * this.direction + this.startAngle) * this.radius;
      this.position.y = this.anchor.y + sin(time * this.direction + this.startAngle) * this.radius;
    } else {
      if (this.position.dist(this.transportLoc) < 3) {
        this.transporting = false;
      } else {
        this.position.add(this.transportDir);
      }
    }
  }
  
  transport(newAnchor) {
    this.anchor = newAnchor
    this.transporting = true;
    this.transportLoc.x = this.anchor.x + cos(time * this.direction + this.startAngle) * this.radius;
    this.transportLoc.y = this.anchor.y + sin(time * this.direction + this.startAngle) * this.radius;
    this.transportDir = p5.Vector.sub(this.transportLoc, this.position);
    this.transportDir.normalize();
    this.transportDir.mult(4);
  }
  
  render() {
    noStroke();
    fill(255, 200);
    ellipse(this.position.x, this.position.y, this.size);
  }
  
  run() {
    this.render();
    this.move();
  }
}

class Word {
  constructor(string, x, y) {
    const fontSize = windowWidth / sqrt(string.length + 10);
    this.x = x;
    this.y = y + (fontSize / 3.8);
    this.graphic = createGraphics(windowWidth, windowHeight);
    this.dots = [];
    this.grid = Word.createGrid();
    this.graphic.noStroke();
    this.graphic.background(255);
    this.graphic.fill(0);
    this.graphic.textAlign(CENTER);
    this.graphic.textSize(fontSize);
    this.graphic.text(string, this.x, this.y);
    this.graphic.loadPixels();
    this.createDots();
    this.isChanging = false;
  }

  static createGrid() {
    const cols = floor(windowWidth / cellWidth);
    const rows = floor(windowHeight / cellHeight);
    const dots = [];
    for (let col = 0; col <= cols; col++) {
      dots.push([]);
      for (let row = 0; row <= rows; row++) {
        dots[col].push([]);
      }
    }
    return { cols, rows, dots };
  }

  changeString(string, x, y) {
    this.isChanging = true;
    const fontSize = windowWidth / sqrt(string.length + 10);
    this.x = x;
    this.y = y + (fontSize / 3.8);
    this.graphic.noStroke();
    this.graphic.background(255);
    this.graphic.fill(0);
    this.graphic.textAlign(CENTER);
    this.graphic.textSize(fontSize);
    this.graphic.text(string, this.x, this.y);
    this.graphic.loadPixels();
    this.createDots();
    this.isChanging = false;
  }
  
  createDots() {
    const freeDots = this.dots;
    this.dots = [];
    for (let i = 0; i < numOfDots; i++) {
      const x = floor(random(windowWidth));
      const y = floor(random(windowHeight));
      const pd = pixelDensity();
      const index = 4 * pd * (x + (y * windowWidth * pd));
      const pixel = this.graphic.pixels[index];
      if (pixel < 255) {
        const anchor = createVector(x, y);
        if (freeDots.length === 0) {
          const radius = random(5, 10);
          const startPosition = createVector(anchor.x + radius, anchor.y);
          const startAngle = random(TWO_PI);
          const prob = random();
          let direction
          if (prob < 0.5) {
            direction = -1;
          } else {
            direction = 1;
          }
          const dot = new Dot(anchor, startPosition, radius, direction, startAngle);
          this.dots.push(dot);
        } else {
          const dot = freeDots.pop();
          dot.transport(anchor);
          this.dots.push(dot);
        }
      }
    }
  }

  static checkForConnect(dotA, dotB, numOfConnections) {
    let newNumOfConnections = numOfConnections;
    const distance = dist(dotA.position.x, dotA.position.y, dotB.position.x, dotB.position.y);
    if (distance > 0 && distance < maxConnectionLength) {
      const sat = map(newNumOfConnections, 0, 10, 0, 255);
      stroke(sat);
      line(dotA.position.x, dotA.position.y, dotB.position.x, dotB.position.y);
      newNumOfConnections++;
    }
    return newNumOfConnections;
  }

  registerDots() {
    this.grid = Word.createGrid();
    for (let i = 0; i < this.dots.length; i++) {
      let col = floor(this.dots[i].position.x / cellWidth);
      let row = floor(this.dots[i].position.y / cellHeight);
      col = col < 0 ? 0 : col > this.grid.cols ? this.grid.cols : col;
      row = row < 0 ? 0 : row > this.grid.rows ? this.grid.rows : row;
      this.grid.dots[col][row].push(this.dots[i]);
    }
  }
  
  connectDots() {
    let numOfConnections = 1;
    for (let col = 1; col < this.grid.cols - 1; col++) {
      for (let row = 1; row < this.grid.rows - 1; row++) {
        for (let i = 0; i < this.grid.dots[col][row].length; i++) {
          // Check all surrounding cells
          for (let addCol = -1; addCol <= 1; addCol++) {
            for (let addRow = -1; addRow <= 1; addRow++) {
              for (let j = 0; j < this.grid.dots[col + addCol][row + addRow].length; j++) {
                if (!(addCol === 0 && addRow === 0) || i !== j) {
                  numOfConnections = Word.checkForConnect(this.grid.dots[col][row][i], this.grid.dots[col + addCol][row + addRow][j], numOfConnections)
                }
              }
            }
          }
          numOfConnections = 1;
        }
      }
    }
  }
  
  run() {
    if (!this.isChanging) {
      this.registerDots();
      this.connectDots();
      for (let i = 0; i < this.dots.length; i++) {
        this.dots[i].run();
      }
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(20);
  numOfDots = max(windowWidth, windowHeight) * 6;
  word = new Word(input, windowWidth / 2, windowHeight / 2);
  input = '';
}

function draw() {
  background(20);
  word.run();
  time += 0.05;
}

function keyTyped() {
  if (keyCode === 13) {
    word.changeString(input, windowWidth / 2, windowHeight / 2);
    input = '';
  } else {
    input += key;
  }
}
