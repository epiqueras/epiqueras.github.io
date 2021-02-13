'use strict'
const viewHeight = 275

const dotSize = 2
const maxConnectionLength = 20
const cellWidth = 20
const cellHeight = 20
let input = 'hi'
let numOfDots = 0
let time = 0
let shape

// Dot class
class Dot {
  constructor(anchor, position, radius, direction, startAngle) {
    this.size = dotSize
    this.anchor = anchor
    this.position = position
    this.radius = radius
    this.direction = direction
    this.startAngle = startAngle
    this.connections = []
    this.transporting = false
    this.transportDir
    this.transportLoc = createVector(0, 0)
  }

  move() {
    if (!this.transporting) {
      this.position.x =
        this.anchor.x +
        cos(time * this.direction + this.startAngle) * this.radius
      this.position.y =
        this.anchor.y +
        sin(time * this.direction + this.startAngle) * this.radius
    } else {
      if (this.position.dist(this.transportLoc) < 3) {
        this.transporting = false
      } else {
        this.position.add(this.transportDir)
      }
    }
  }

  transport(newAnchor) {
    this.anchor = newAnchor
    this.transporting = true
    this.transportLoc.x =
      this.anchor.x + cos(time * this.direction + this.startAngle) * this.radius
    this.transportLoc.y =
      this.anchor.y + sin(time * this.direction + this.startAngle) * this.radius
    this.transportDir = p5.Vector.sub(this.transportLoc, this.position)
    this.transportDir.normalize()
    this.transportDir.mult(4)
  }

  render() {
    noStroke()
    fill(255, 200)
    ellipse(this.position.x, this.position.y, this.size)
  }

  run() {
    this.render()
    this.move()
  }
}

class Shape {
  constructor(width, height, x, y, string) {
    this.dots = []
    this.setUp(width, height, x, y, string)
  }

  createGrid() {
    const cols = floor(this.graphic.width / cellWidth)
    const rows = floor(this.graphic.height / cellHeight)
    const dots = []
    for (let col = 0; col <= cols; col++) {
      dots.push([])
      for (let row = 0; row <= rows; row++) {
        dots[col].push([])
      }
    }
    return { cols, rows, dots }
  }

  changeString(x, y, string = this.string) {
    this.isChanging = true
    const fontSize = this.graphic.height - 32
    this.x = x
    this.y = y + fontSize / 3.5
    this.graphic.background(255)
    this.graphic.noStroke()
    this.graphic.fill(0)
    this.graphic.textAlign(CENTER)
    this.graphic.textSize(fontSize)
    this.graphic.text(string, this.x, this.y)
    this.graphic.loadPixels()
    this.createDots()
    this.isChanging = false
    this.image = null
    this.string = string
  }

  changeImage(image = this.image) {
    this.isChanging = true
    this.graphic.background(255)
    image.resize(0, this.graphic.height - 16)
    this.graphic.copy(
      image,
      0,
      0,
      image.width,
      image.height,
      this.graphic.width / 2 - image.width / 2,
      this.graphic.height / 2 - image.height / 2,
      image.width,
      image.height
    )
    this.graphic.loadPixels()
    this.createDots()
    this.isChanging = false
    this.string = null
    this.image = image
  }

  setUp(width, height, x, y, string) {
    this.graphic = createGraphics(width, height)
    this.grid = this.createGrid()
    if (string || this.string) this.changeString(x, y, string)
    else this.changeImage()
  }

  createDots() {
    const freeDots = this.dots
    this.dots = []
    for (let i = 0; i < numOfDots; i++) {
      const x = floor(random(this.graphic.width))
      const y = floor(random(this.graphic.height))
      const pd = pixelDensity()
      const index = 4 * pd * (x + y * this.graphic.width * pd)
      const pixel = this.graphic.pixels[index]
      if (pixel < 255) {
        const anchor = createVector(x, y)
        if (freeDots.length === 0) {
          const radius = random(5, 10)
          const startPosition = createVector(anchor.x + radius, anchor.y)
          const startAngle = random(TWO_PI)
          const prob = random()
          let direction
          if (prob < 0.5) {
            direction = -1
          } else {
            direction = 1
          }
          const dot = new Dot(
            anchor,
            startPosition,
            radius,
            direction,
            startAngle
          )
          this.dots.push(dot)
        } else {
          const dot = freeDots.pop()
          dot.transport(anchor)
          this.dots.push(dot)
        }
      }
    }
  }

  static checkForConnect(dotA, dotB, numOfConnections) {
    let newNumOfConnections = numOfConnections
    const distance = dist(
      dotA.position.x,
      dotA.position.y,
      dotB.position.x,
      dotB.position.y
    )
    if (distance > 0 && distance < maxConnectionLength) {
      const sat = map(newNumOfConnections, 0, 10, 0, 255)
      stroke(sat)
      line(dotA.position.x, dotA.position.y, dotB.position.x, dotB.position.y)
      newNumOfConnections++
    }
    return newNumOfConnections
  }

  registerDots() {
    this.grid = this.createGrid()
    for (let i = 0; i < this.dots.length; i++) {
      let col = floor(this.dots[i].position.x / cellWidth)
      let row = floor(this.dots[i].position.y / cellHeight)
      col = col < 0 ? 0 : col > this.grid.cols ? this.grid.cols : col
      row = row < 0 ? 0 : row > this.grid.rows ? this.grid.rows : row
      this.grid.dots[col][row].push(this.dots[i])
    }
  }

  connectDots() {
    let numOfConnections = 1
    for (let col = 1; col < this.grid.cols - 1; col++) {
      for (let row = 1; row < this.grid.rows - 1; row++) {
        for (let i = 0; i < this.grid.dots[col][row].length; i++) {
          // Check all surrounding cells
          for (let addCol = -1; addCol <= 1; addCol++) {
            for (let addRow = -1; addRow <= 1; addRow++) {
              for (
                let j = 0;
                j < this.grid.dots[col + addCol][row + addRow].length;
                j++
              ) {
                if (!(addCol === 0 && addRow === 0) || i !== j) {
                  numOfConnections = Shape.checkForConnect(
                    this.grid.dots[col][row][i],
                    this.grid.dots[col + addCol][row + addRow][j],
                    numOfConnections
                  )
                }
              }
            }
          }
          numOfConnections = 1
        }
      }
    }
  }

  run() {
    if (!this.isChanging) {
      this.registerDots()
      this.connectDots()
      for (let i = 0; i < this.dots.length; i++) {
        this.dots[i].run()
      }
    }
  }
}

function gotFile(file) {
  if (file.type === 'image') {
    loadImage(file.data, (image) => shape.changeImage(image))
  }
}

function setup() {
  if (
    window.location.pathname !== '/' &&
    window.location.pathname !== '/index.html'
  )
    return
  const canvas = createCanvas(windowWidth, viewHeight)
  canvas.parent(
    document.querySelector(
      '#notion-app > div > div > div > div.notion-scroller.vertical.horizontal > div:nth-child(1) > div:nth-child(1)'
    )
  )
  canvas.drop(gotFile)
  background(20)
  numOfDots = Math.floor((windowWidth + viewHeight) / 2) * 6
  shape = new Shape(
    windowWidth,
    viewHeight,
    windowWidth / 2,
    viewHeight / 2,
    input
  )
  input = ''
}

function draw() {
  background(20)
  shape.run()
  time += 0.05
}

function keyTyped() {
  if (keyCode === 13) {
    shape.changeString(windowWidth / 2, viewHeight / 2, input)
    input = ''
  } else {
    input += key
  }
}

function windowResized() {
  numOfDots = Math.floor((windowWidth + viewHeight) / 2) * 6
  resizeCanvas(windowWidth, viewHeight)
  shape.setUp(windowWidth, viewHeight, windowWidth / 2, viewHeight / 2)
}
