var EventEmitter = require('events')
var util = require('util')
var three = require('three')

var timeScale = 1
var requiredNoteLength = 1
var feather = 20

function CleanNoteDetector () {
  EventEmitter.call(this)
  this.clock = new three.Clock(true)
  this.tick = 0
  this.noteDetected = false
  this.detectLength = 0
}
util.inherits(CleanNoteDetector, EventEmitter)

CleanNoteDetector.prototype.destroy = function () {
  this.removeAllListeners()
  this.clock.stop()
  this.clock = this.data = null
}

CleanNoteDetector.prototype.setData = function (data) {
  if (this.data && this.data.noteName !== data.noteName) {
    this.tick = 0
    this.noteDetected = false
    this.detectLength = 0
  }
  this.data = data
}

CleanNoteDetector.prototype.step = function () {
  var delta = this.clock.getDelta() * timeScale
  this.tick += delta

  if (this.tick < 0) this.tick = 0

  if (delta > 0 && this.data.pitch) {

    if (Math.abs(this.data.offset) < feather) {
      this.detectLength += delta
    }

    if (this.tick > requiredNoteLength && !this.noteDetected) {

      if (this.detectLength > requiredNoteLength) {
        this.emit('cleanNote', this.data)
        this.noteDetected = true
      }

    }

  }
}

module.exports = CleanNoteDetector
