module.exports = function (url) {

  return function (audioContext) {

    var source = audioContext.createBufferSource()
    var gainNode = audioContext.createGain()
    gainNode.gain.value = 5
    source.connect(gainNode)

    return window.fetch(url)
      .then(function (res) {
        if (res.status !== 200) throw res.statusText
        return res.arrayBuffer()
      })
      .then(function (buf) {
        return new Promise(function (resolve, reject) {
          audioContext.decodeAudioData(buf, function (buffer) {
            source.buffer = buffer
            source.loop = true
            source.start(0)
            resolve(gainNode)
          })
        })
      })

  }
}
