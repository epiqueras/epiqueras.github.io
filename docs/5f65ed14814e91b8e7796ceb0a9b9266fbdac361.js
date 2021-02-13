'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var viewHeight = 275;
var dotSize = 2;
var maxConnectionLength = 20;
var cellWidth = 20;
var cellHeight = 20;
var input = 'hi';
var numOfDots = 0;
var time = 0;
var shape; // Dot class

var Dot = /*#__PURE__*/function () {
  function Dot(anchor, position, radius, direction, startAngle) {
    _classCallCheck(this, Dot);

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

  _createClass(Dot, [{
    key: "move",
    value: function move() {
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
  }, {
    key: "transport",
    value: function transport(newAnchor) {
      this.anchor = newAnchor;
      this.transporting = true;
      this.transportLoc.x = this.anchor.x + cos(time * this.direction + this.startAngle) * this.radius;
      this.transportLoc.y = this.anchor.y + sin(time * this.direction + this.startAngle) * this.radius;
      this.transportDir = p5.Vector.sub(this.transportLoc, this.position);
      this.transportDir.normalize();
      this.transportDir.mult(4);
    }
  }, {
    key: "render",
    value: function render() {
      noStroke();
      fill(255, 200);
      ellipse(this.position.x, this.position.y, this.size);
    }
  }, {
    key: "run",
    value: function run() {
      this.render();
      this.move();
    }
  }]);

  return Dot;
}();

var Shape = /*#__PURE__*/function () {
  function Shape(width, height, x, y, string) {
    _classCallCheck(this, Shape);

    this.dots = [];
    this.setUp(width, height, x, y, string);
  }

  _createClass(Shape, [{
    key: "createGrid",
    value: function createGrid() {
      var cols = floor(this.graphic.width / cellWidth);
      var rows = floor(this.graphic.height / cellHeight);
      var dots = [];

      for (var col = 0; col <= cols; col++) {
        dots.push([]);

        for (var row = 0; row <= rows; row++) {
          dots[col].push([]);
        }
      }

      return {
        cols: cols,
        rows: rows,
        dots: dots
      };
    }
  }, {
    key: "changeString",
    value: function changeString(x, y) {
      var string = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.string;
      this.isChanging = true;
      var fontSize = this.graphic.height - 32;
      this.x = x;
      this.y = y + fontSize / 3.5;
      this.graphic.background(255);
      this.graphic.noStroke();
      this.graphic.fill(0);
      this.graphic.textAlign(CENTER);
      this.graphic.textSize(fontSize);
      this.graphic.text(string, this.x, this.y);
      this.graphic.loadPixels();
      this.createDots();
      this.isChanging = false;
      this.image = null;
      this.string = string;
    }
  }, {
    key: "changeImage",
    value: function changeImage() {
      var image = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.image;
      this.isChanging = true;
      this.graphic.background(255);
      image.resize(0, this.graphic.height - 16);
      this.graphic.copy(image, 0, 0, image.width, image.height, this.graphic.width / 2 - image.width / 2, this.graphic.height / 2 - image.height / 2, image.width, image.height);
      this.graphic.loadPixels();
      this.createDots();
      this.isChanging = false;
      this.string = null;
      this.image = image;
    }
  }, {
    key: "setUp",
    value: function setUp(width, height, x, y, string) {
      this.graphic = createGraphics(width, height);
      this.grid = this.createGrid();
      if (string || this.string) this.changeString(x, y, string);else this.changeImage();
    }
  }, {
    key: "createDots",
    value: function createDots() {
      var freeDots = this.dots;
      this.dots = [];

      for (var i = 0; i < numOfDots; i++) {
        var x = floor(random(this.graphic.width));
        var y = floor(random(this.graphic.height));
        var pd = pixelDensity();
        var index = 4 * pd * (x + y * this.graphic.width * pd);
        var pixel = this.graphic.pixels[index];

        if (pixel < 255) {
          var anchor = createVector(x, y);

          if (freeDots.length === 0) {
            var radius = random(5, 10);
            var startPosition = createVector(anchor.x + radius, anchor.y);
            var startAngle = random(TWO_PI);
            var prob = random();
            var direction = void 0;

            if (prob < 0.5) {
              direction = -1;
            } else {
              direction = 1;
            }

            var dot = new Dot(anchor, startPosition, radius, direction, startAngle);
            this.dots.push(dot);
          } else {
            var _dot = freeDots.pop();

            _dot.transport(anchor);

            this.dots.push(_dot);
          }
        }
      }
    }
  }, {
    key: "registerDots",
    value: function registerDots() {
      this.grid = this.createGrid();

      for (var i = 0; i < this.dots.length; i++) {
        var col = floor(this.dots[i].position.x / cellWidth);
        var row = floor(this.dots[i].position.y / cellHeight);
        col = col < 0 ? 0 : col > this.grid.cols ? this.grid.cols : col;
        row = row < 0 ? 0 : row > this.grid.rows ? this.grid.rows : row;
        this.grid.dots[col][row].push(this.dots[i]);
      }
    }
  }, {
    key: "connectDots",
    value: function connectDots() {
      var numOfConnections = 1;

      for (var col = 1; col < this.grid.cols - 1; col++) {
        for (var row = 1; row < this.grid.rows - 1; row++) {
          for (var i = 0; i < this.grid.dots[col][row].length; i++) {
            // Check all surrounding cells
            for (var addCol = -1; addCol <= 1; addCol++) {
              for (var addRow = -1; addRow <= 1; addRow++) {
                for (var j = 0; j < this.grid.dots[col + addCol][row + addRow].length; j++) {
                  if (!(addCol === 0 && addRow === 0) || i !== j) {
                    numOfConnections = Shape.checkForConnect(this.grid.dots[col][row][i], this.grid.dots[col + addCol][row + addRow][j], numOfConnections);
                  }
                }
              }
            }

            numOfConnections = 1;
          }
        }
      }
    }
  }, {
    key: "run",
    value: function run() {
      if (!this.isChanging) {
        this.registerDots();
        this.connectDots();

        for (var i = 0; i < this.dots.length; i++) {
          this.dots[i].run();
        }
      }
    }
  }], [{
    key: "checkForConnect",
    value: function checkForConnect(dotA, dotB, numOfConnections) {
      var newNumOfConnections = numOfConnections;
      var distance = dist(dotA.position.x, dotA.position.y, dotB.position.x, dotB.position.y);

      if (distance > 0 && distance < maxConnectionLength) {
        var sat = map(newNumOfConnections, 0, 10, 0, 255);
        stroke(sat);
        line(dotA.position.x, dotA.position.y, dotB.position.x, dotB.position.y);
        newNumOfConnections++;
      }

      return newNumOfConnections;
    }
  }]);

  return Shape;
}();

function gotFile(file) {
  if (file.type === 'image') {
    loadImage(file.data, function (image) {
      return shape.changeImage(image);
    });
  }
}

function setup() {
  if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') return;
  var canvas = createCanvas(windowWidth, viewHeight);
  canvas.parent(document.querySelector('#notion-app > div > div > div > div.notion-scroller.vertical.horizontal > div:nth-child(1) > div:nth-child(1)'));
  canvas.drop(gotFile);
  background(20);
  numOfDots = Math.floor((windowWidth + viewHeight) / 2) * 6;
  shape = new Shape(windowWidth, viewHeight, windowWidth / 2, viewHeight / 2, input);
  input = '';
}

function draw() {
  background(20);
  shape.run();
  time += 0.05;
}

function keyTyped() {
  if (keyCode === 13) {
    shape.changeString(windowWidth / 2, viewHeight / 2, input);
    input = '';
  } else {
    input += key;
  }
}

function windowResized() {
  numOfDots = Math.floor((windowWidth + viewHeight) / 2) * 6;
  resizeCanvas(windowWidth, viewHeight);
  shape.setUp(windowWidth, viewHeight, windowWidth / 2, viewHeight / 2);
}