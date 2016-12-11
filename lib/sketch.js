"use strict";

const dotSize = 2;
const maxConnectionLength = 20;
let input = 'COOL';
let numOfDots = 0;
let time = 0;
let display;

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
      if (this.position.dist(this.transportLoc) < 5) {
        this.transporting = false;
      } else {
        this.position.add(this.transportDir);
      }
    }
  }

  transport(newAnchor) {
    this.anchor = newAnchor;
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

class Shape {
  constructor(character, x, y, freeDots) {
    this.x = x;
    this.y = y;
    this.graphic = createGraphics(windowWidth, windowHeight);
    this.dots = [];
    this.graphic.noStroke();
    this.graphic.background(255);
    this.graphic.fill(0);
    this.graphic.textAlign(CENTER);
    this.graphic.textSize(windowWidth / 4);
    this.graphic.text(character, this.x, this.y);
    this.graphic.loadPixels();
    this.createDots(freeDots);
  }

  createDots(freeDots = []) {
    for (let i = 0; i < numOfDots; i++) {
      const x = floor(random(this.x + windowWidth / 8));
      const y = floor(random(windowHeight));
      const pd = pixelDensity();
      const index = 4 * pd * (x + y * windowWidth * pd);
      const pixel = this.graphic.pixels[index];
      if (pixel < 255) {
        const anchor = createVector(x, y);
        if (freeDots.length === 0) {
          const radius = random(5, 10);
          const startPosition = createVector(anchor.x + radius, anchor.y);
          const startAngle = random(TWO_PI);
          const prob = random();
          let direction;
          if (prob < 0.5) {
            direction = -1;
          } else {
            direction = 1;
          }
          this.dots.push(new Dot(anchor, startPosition, radius, direction, startAngle));
        } else {
          const dot = freeDots.pop();
          dot.transport(anchor);
          this.dots.push(dot);
        }
      }
    }
  }

  connectDots() {
    let numOfConnections = 1;
    for (let i = 0; i < this.dots.length; i++) {
      for (let j = 0; j < this.dots.length; j++) {
        if (i !== j) {
          const distance = dist(this.dots[i].position.x, this.dots[i].position.y, this.dots[j].position.x, this.dots[j].position.y);
          if (distance > 0 && distance < maxConnectionLength) {
            const sat = map(numOfConnections, 0, 10, 0, 255);
            stroke(sat);
            line(this.dots[i].position.x, this.dots[i].position.y, this.dots[j].position.x, this.dots[j].position.y);
            numOfConnections++;
          }
        }
      }
      numOfConnections = 1;
    }
  }

  runShape() {
    this.connectDots();
    for (let i = 0; i < this.dots.length; i++) {
      this.dots[i].run();
    }
  }
}

class Display {
  constructor(string) {
    this.string = string;
    this.shapes = [];
    this.freeDots = [];
    let x = windowWidth / 2 - this.string.length * windowWidth / 17;
    const y = windowHeight / 1.5;
    for (let i = 0; i < this.string.length; i++) {
      this.shapes.push(new Shape(this.string[i], x, y));
      x += windowWidth / 5.5;
    }
  }

  changeText(nextString) {
    this.string = nextString;
    let x = windowWidth / 2 - this.string.length * windowWidth / 17;
    const y = windowHeight / 1.5;
    for (let i = 0; i < this.shapes.length; i++) {
      for (let j = 0; j < this.shapes[i].dots.length; j++) {
        this.freeDots.push(this.shapes[i].dots[j]);
      }
    }
    this.shapes = [];
    for (let i = 0; i < this.string.length; i++) {
      this.shapes.push(new Shape(this.string[i], x, y, this.freeDots));
      x += windowWidth / 5.5;
    }
  }

  run() {
    for (let i = 0; i < this.shapes.length; i++) {
      this.shapes[i].runShape();
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(20);
  numOfDots = windowWidth * 3;
  display = new Display(input);
  input = '';
}

function draw() {
  background(20);
  display.run();
  time += 0.05;
}

function keyTyped() {
  input += key;
  if (input.length === 4) {
    display.changeText(input);
    input = '';
  }
}