var three = require('three')

var clock = new three.Clock(true)
var timeScale = 1
var tick = 0

function PitchVisualiser () {
  this.el = document.createElement('pre')
  this.el.className = 'pitch-debug'
  this.data = {
    pitch: '',
    noteNumber: 0,
    noteName: '',
    offset: 0
  }
}

PitchVisualiser.prototype.setData = function (data) {
  this.data = data
}

PitchVisualiser.prototype.step = function () {
  var delta = clock.getDelta() * timeScale
  tick += delta

  if (tick < 0) tick = 0

  if (delta > 0) {
    this.data.delta = delta
    this.data.tick = tick
    this.el.innerHTML = JSON.stringify(this.data, null, 2)
  }
}

module.exports = PitchVisualiser
