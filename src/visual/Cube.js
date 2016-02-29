var three = require('three')
var noteStrings = require('./../audio/consts').noteStrings

function dir () {
  return Math.random() > 0.5 ? 1 : -1
}

function choose (a, b) {
  return Math.random() > 0.5 ? a : b
}

function Cube (note, position) {
  this.note = note
  this.position = position
  this.scale = 1

  var geometry = new three.BoxGeometry(0.8, 0.8, 0.15)

  var tone = (noteStrings.indexOf(note.noteName) + 1) / noteStrings.length
  var color = new three.Color().setHSL(tone, 1, 0.75)

  var material = new three.MeshLambertMaterial({ color: color })
  this.mesh = new three.Mesh(geometry, material)
  this.revert()
}

Cube.prototype.destroy = function () {
  clearTimeout(this.revertTimeout)
  this.mesh.parent.remove(this.mesh)
  this.note = this.position = this.mesh = null
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
  this.mesh.position.z = this.position.z - 0.5
}

Cube.prototype.step = function () {}

module.exports = Cube
