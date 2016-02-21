module.exports = function (audioContext) {

  var source = audioContext.createOscillator()
  source.start(0)

  function update () {
    source.frequency.value += Math.random() * 10
    source.frequency.value = source.frequency.value % 2000
  }

  setInterval(update, 500)

  return Promise.resolve(source)

}
