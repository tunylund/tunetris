var three = require('three')
var noteStrings = require('./../audio/consts').noteStrings

var width = 5
var width2 = width / 2

function PitchVisualiser (scene, map, document) {

  var geometry = new three.Geometry()
  for (var i = 0; i < 11; i++) {
    geometry.vertices.push(new three.Vector3(i / 10 * width - width2, 0, 0))
    geometry.colors.push(new three.Color(0xffffff))
  }

  var material = new three.LineBasicMaterial({
    color: 0xffffff,
    opacity: 1,
    linewidth: 3,
    vertexColors: three.VertexColors
  })

  this.line = new three.Line(geometry, material)
  this.line.position.x = map.data[0].length / 2
  this.line.position.y = map.data.length / 2
  this.line.position.z = 2
  scene.add(this.line)

  this.light = new three.SpotLight(0xffffff, 1, 100)
  this.light.position.x = map.data[0].length / 2
  this.light.position.y = map.data.length / 2
  this.light.position.z = 10
  this.light.target.position.set(this.light.position.x, this.light.position.y, 0)
  scene.add(this.light)
  scene.add(this.light.target)

  this.el = document.createElement('div')
  this.el.className = 'pitch-visualiser'
  document.body.appendChild(this.el)

  this.data = {
    pitch: '',
    noteNumber: 0,
    noteName: '',
    offset: 0
  }

}

PitchVisualiser.prototype.destroy = function () {
  this.el.parentNode.removeChild(this.el)
  this.line.parent.remove(this.line)
  this.light.parent.remove(this.light.target)
  this.light.parent.remove(this.light)
  this.el = this.data = this.light = this.line = null
}

PitchVisualiser.prototype.setData = function (data) {
  if (this.data.noteName !== data.noteName) {
    this.el.innerHTML = data.noteName || ''
  }
  this.data = data
}

PitchVisualiser.prototype.step = function () {
  var tone = (noteStrings.indexOf(this.data.noteName) + 1) / noteStrings.length
  var color = new three.Color().setHSL(tone, 1, 0.75)
  this.light.color = color

  var offset = this.data.offset / 40
  var v, c, i, weight

  for (i = 0; i < this.line.geometry.vertices.length; i++) {
    v = this.line.geometry.vertices[i]
    c = this.line.geometry.colors[i]

    weight = Math.atan(width2 - Math.abs(v.x)) * offset
    v.setY(weight)

    var opacity = 1 - Math.abs(v.x) / width2
    if (opacity > 0.5) opacity = 1
    c.r = (Math.abs(weight) + 0.5) * opacity
    c.g = (Math.abs(v.x) / width2 + 0.5) * opacity
    c.b = (0.5) * opacity
  }

  this.line.geometry.verticesNeedUpdate = true
  this.line.geometry.colorsNeedUpdate = true

}

module.exports = PitchVisualiser

