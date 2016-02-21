var three = require('three')

var timeScale = 1
var tick = 0

function stepGen (_value, min, max, speed) {
  var value = 0
  var dir = 1
  return function (delta) {
    value = value + dir * delta * speed
    if (value < min) {
      dir = -dir
      value = min
    }
    if (value > max) {
      dir = -dir
      value = max
    }

    return value
  }
}

function TravellingLight (x, y, min, max) {
  this.light = new three.SpotLight(0xffffff, 1, 100)
  this.light.position.set(x, y, 2)
  this.light.nextX = stepGen(x, min, max, 8)
  this.light.nextY = stepGen(y, min, max, 4)
  this.light.target.nextX = stepGen(x, min, max, 8)
  this.light.target.nextY = stepGen(y, min, max, 4)
  this.light.target.position.set(x, y, 0)
}

TravellingLight.prototype.destroy = function () {
  this.light.parent.remove(this.light.target)
  this.light.parent.remove(this.light)
  this.light = null
}

TravellingLight.prototype.step = function (delta) {
  this.light.position.x = this.light.nextX(Math.log(this.light.position.x + 1) * delta)
  this.light.position.y = this.light.nextY(delta)
  this.light.target.position.x = this.light.target.nextX(delta)
  this.light.target.position.y = this.light.target.nextY(Math.log(this.light.target.position.x + 1) * delta)
}

function Scene (map) {
  this.scene = new three.Scene()

  this.clock = new three.Clock(true)

  this.ambient = new three.HemisphereLight(0xffffff, 0x080808, 1)
  this.scene.add(this.ambient)

  this.alight = new TravellingLight(0, 0, 0, map.data[0].length)
  this.scene.add(this.alight.light)
  this.scene.add(this.alight.light.target)

  this.blight = new TravellingLight(map.data[0][0].length, map.data[0].length, 0, map.data[0].length)
  this.scene.add(this.blight.light)
  this.scene.add(this.blight.light.target)
}

Scene.prototype.destroy = function () {
  this.alight.destroy()
  this.blight.destroy()
  this.ambient.parent.remove(this.ambient)
  this.clock.stop()
  this.alight = this.blight = this.ambient = this.scene = this.clock = null
}

Scene.prototype.step = function () {
  var delta = this.clock.getDelta() * timeScale
  tick += delta

  if (tick < 0) tick = 0

  this.alight.step(delta)
  this.blight.step(delta)
}

module.exports = Scene
