var three = require('three')

const noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function dir () {
  return Math.random() > 0.5 ? 1 : -1
}

function Cube (note, position) {
  this.note = note
  this.position = position

  var geometry = new three.BoxGeometry(0.8, 0.8, 0.15)

  var tone = (noteStrings.indexOf(note.noteName) + 1) / noteStrings.length
  var color = new three.Color().setHSL(tone, 1, 0.75)

  var material = new three.MeshLambertMaterial({ color: color })
  this.mesh = new three.Mesh(geometry, material)
  this.mesh.position.x = position.x
  this.mesh.position.y = position.y
  this.mesh.position.z = position.z
}

Cube.prototype.provoke = function () {
  var r = Math.random() / 20
  this.mesh.position.x = this.position.x + dir() * r
  this.mesh.position.y = this.position.y + dir() * r
  this.mesh.position.z = this.position.z + dir() * r
  clearTimeout(this.revertTimeout)
  this.revertTimeout = setTimeout(this.revert.bind(this), 100)
}

Cube.prototype.revert = function () {
  this.mesh.position.x = this.position.x
  this.mesh.position.y = this.position.y
  this.mesh.position.z = this.position.z
}

Cube.prototype.step = function () {}

module.exports = Cube
