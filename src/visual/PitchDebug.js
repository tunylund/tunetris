function PitchDebug (document) {
  this.el = document.createElement('pre')
  document.body.appendChild(this.el)
  this.el.className = 'pitch-debug'
}

PitchDebug.prototype.destroy = function () {
  this.el.parentNode.removeChild(this.el)
  this.el = this.data = null
}

PitchDebug.prototype.setData = function (data) {
  this.data = data
}

PitchDebug.prototype.step = function () {
  if (this.data) this.el.innerHTML = JSON.stringify(this.data, null, 2)
}

module.exports = PitchDebug
