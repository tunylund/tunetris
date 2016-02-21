// from https://github.com/cwilso/volume-meter/blob/master/volume-meter.js

function VolumeMeter (audioContext, audioSource) {
  this.processVolume = this.processVolume.bind(this)
  this.processor = audioContext.createScriptProcessor(512)
  this.processor.addEventListener('audioprocess', this.processVolume)
  this.processor.clipping = false
  this.processor.lastClip = 0
  this.processor.volume = 0
  this.processor.clipLevel = 0.98
  this.processor.averaging = 0.95
  this.processor.clipLag = 750

  audioSource.connect(this.processor)

  // workaround a chrome bug where processor does not run if not connected
  this.processor.connect(audioContext.destination)
}

VolumeMeter.prototype.destroy = function () {
  this.processor.removeEventListener('audioprocess', this.processVolume)
  this.processor.disconnect()
  this.processor = null
}

VolumeMeter.prototype.processVolume = function (event) {
  var buf = event.inputBuffer.getChannelData(0)
  var bufLength = buf.length
  var sum = 0
  var x

  // Do a root-mean-square on the samples: sum up the squares...
  for (var i = 0; i < bufLength; i++) {
    x = buf[i]
    if (Math.abs(x) >= this.processor.clipLevel) {
      this.processor.clipping = true
      this.processor.lastClip = window.performance.now()
    }
    sum += x * x
  }

  // ... then take the square root of the sum.
  var rms = Math.sqrt(sum / bufLength)

  // Now smooth this out with the averaging factor applied
  // to the previous sample - take the max here because we
  // want "fast attack, slow release."
  this.volume = Math.max(rms, this.processor.volume * this.processor.averaging)
}

module.exports = VolumeMeter
