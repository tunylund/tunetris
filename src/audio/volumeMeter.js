// from https://github.com/cwilso/volume-meter/blob/master/volume-meter.js

function createAudioMeter (audioContext, audioSource) {
  var processor = audioContext.createScriptProcessor(512)
  processor.onaudioprocess = volumeAudioProcess
  processor.clipping = false
  processor.lastClip = 0
  processor.volume = 0
  processor.clipLevel = 0.98
  processor.averaging = 0.95
  processor.clipLag = 750

  audioSource.connect(processor)
  processor.connect(audioContext.destination)

  processor.checkClipping = function () {
    if (!this.clipping) return false

    if ((this.lastClip + this.clipLag) < window.performance.now()) this.clipping = false

    return this.clipping
  }

  processor.shutdown = function () {
    this.disconnect()
    this.onaudioprocess = null
  }

  return function () {
    return processor.volume
  }
}

function volumeAudioProcess (event) {
  var buf = event.inputBuffer.getChannelData(0)
  var bufLength = buf.length
  var sum = 0
  var x

  // Do a root-mean-square on the samples: sum up the squares...
  for (var i = 0; i < bufLength; i++) {
    x = buf[i]
    if (Math.abs(x) >= this.clipLevel) {
      this.clipping = true
      this.lastClip = window.performance.now()
    }
    sum += x * x
  }

  // ... then take the square root of the sum.
  var rms = Math.sqrt(sum / bufLength)

  // Now smooth this out with the averaging factor applied
  // to the previous sample - take the max here because we
  // want "fast attack, slow release."
  this.volume = Math.max(rms, this.volume * this.averaging)
}

module.exports = createAudioMeter
