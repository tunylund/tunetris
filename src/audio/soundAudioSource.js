module.exports = function (audioContext) {

  var source = audioContext.createBufferSource()
  var gainNode = audioContext.createGain()
  gainNode.gain.value = 5
  source.connect(gainNode)

  return window.fetch('https://dl.dropboxusercontent.com/s/eo7e0pnui99kdte/%231%20%2020-helmikuuta-16.m4a?dl=0')
    .then(function (res) {
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
