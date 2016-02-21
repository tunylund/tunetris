function WaveFormDebug (audioContext, audioSource) {
  this.el = document.createElement('canvas')
  this.el.width = 256
  this.el.height = 124
  this.el.className = 'wave-form-debug'
  this.context = this.el.getContext('2d')

  window.__pc = this.analyser = audioContext.createAnalyser()
  this.analyser.fftSize = 2048
  this.bufferLength = this.analyser.frequencyBinCount
  this.data = new Float32Array(this.bufferLength)
  audioSource.connect(this.analyser)
}

WaveFormDebug.prototype.step = function () {
  var w = this.el.width / 32

  this.analyser.getFloatTimeDomainData(this.data)

  var imgData = this.context.getImageData(0, 0, this.el.width, this.el.height)
  this.context.putImageData(imgData, -w, 0)
  this.context.save()
  this.context.fillStyle = '#000'
  this.context.fillRect(this.el.width - w, 0, w, this.el.height)
  this.context.strokeStyle = '#353'
  this.context.globalAlpha = 0.5
  this.context.globalCompositeOperation = 'lighter'
  this.context.translate(0, this.el.height / 2)
  for (var i = 0; i < this.data.length; i = i + 8) {
    var x = this.el.width - w + Math.floor(w * i / this.data.length)
    var y = this.data[i] * this.el.height / 2
    this.context.beginPath()
    this.context.moveTo(x, 0)
    this.context.lineTo(x + 1, y)
    this.context.stroke()
  }
  this.context.restore()
}

module.exports = WaveFormDebug
