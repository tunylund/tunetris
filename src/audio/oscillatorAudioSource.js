module.exports = function (audioContext) {

  var source = audioContext.createOscillator()
  source.start(0)

  function update () {
    source.frequency.value += Math.random() * 10
    source.frequency.value = source.frequency.value % 2000
  }

  var interval = setInterval(update, 500)
  source.addEventListener('ended', function () {
    clearInterval(interval)
  })

  return Promise.resolve(source)

}
