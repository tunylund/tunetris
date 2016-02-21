module.exports = function (audioContext) {

  return new Promise(function (resolve, reject) {

    // workaround vendor syntaxes
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia

    navigator.getUserMedia({
      'audio': {
        'mandatory': {
          'googEchoCancellation': 'false',
          'googAutoGainControl': 'false',
          'googNoiseSuppression': 'false',
          'googHighpassFilter': 'false'
        },
        'optional': []
      }
    }, function (stream) {
      var source = audioContext.createMediaStreamSource(stream)

      // add some gain since mic input is quite not enough
      var gainNode = audioContext.createGain()
      gainNode.gain.value = 5
      source.connect(gainNode)

      resolve(source)

    }, reject)

  })

}
