var render = require('./visual/render')
var PitchDebug = require('./visual/PitchDebug')
var PitchVisualiser = require('./visual/PitchVisualiser')
var CleanNoteDetector = require('./audio/CleanNoteDetector')
var Scene = require('./visual/Scene')

var soundSource = require('./audio/soundAudioSource')
var oscillatorSource = require('./audio/oscillatorAudioSource')
var micSource = require('./audio/micAudioSource')

var PitchDetector = require('./audio/PitchDetector')
var VolumeMeter = require('./audio/VolumeMeter')
var WaveFormDebug = require('./visual/WaveFormDebug')
var noteStrings = require('./audio/consts').noteStrings
var Map = require('./visual/Map')

var AudioContext = window.AudioContext || window.webkitAudioContext
var audioContext = new AudioContext()

function fillMap (scene, map) {
  map.data.map(function (row) {
    row.map(function (col, ix) {
      var note = { noteName: noteStrings[ix % noteStrings.length] }
      var cube = map.addCube(note)
      if (cube) scene.add(cube.mesh)
    })
  })
}

function tunetris () {

  document.querySelector('.source-selector').addEventListener('click', function (e) {
    switch (e.srcElement.value) {
      case 'mic':
        switchSource(micSource)
        break

      case 'url':
        var url = window.prompt('What is the url of the audio file?')
        switchSource(soundSource(url))
        break

      case 'oscillator':
        switchSource(oscillatorSource)
        break
    }

  })

  var stop
  function switchSource (source) {
    if (stop) stop()
    stop = null
    source(audioContext)
      .then(start)
      .then(function (value) {
        stop = value
      })
      .catch(window.alert)
  }

  switchSource(oscillatorSource)

}

function start (sourceNode) {

  var map = new Map(window.innerWidth, window.innerHeight, 32)
  var scene = new Scene(map)

  // fillMap(scene.scene, map)

  var pitchDebug = new PitchDebug(document)
  var pitchVisualiser = new PitchVisualiser(scene.scene, map, document)

  var cleanNoteDetector = new CleanNoteDetector()
  cleanNoteDetector.on('cleanNote', function (note) {
    var cube = map.addCube(note)
    if (cube) scene.scene.add(cube.mesh)
  })

  var volumeMeter = new VolumeMeter(audioContext, sourceNode)
  var pitchDetector = new PitchDetector(audioContext, sourceNode)
  var waveFormDebug = new WaveFormDebug(audioContext, sourceNode, document)

  var renderer = render(scene.scene, function () {

    var pitch = {
      pitch: '',
      noteNumber: 0,
      noteName: '',
      offset: 0
    }

    if (volumeMeter.volume > 0.05) {
      pitch = pitchDetector.detect()
    }

    pitch.volume = volumeMeter.volume

    waveFormDebug.step()

    scene.step()

    map.invoke(pitch, 'provoke')

    cleanNoteDetector.setData(pitch)
    cleanNoteDetector.step()

    pitchDebug.setData(pitch)
    pitchDebug.step()

    pitchVisualiser.setData(pitch)
    pitchVisualiser.step()

  }, map, window, document)

  renderer()

  return function () {
    renderer.destroy()
    map.destroy()
    scene.destroy()
    pitchDebug.destroy()
    pitchVisualiser.destroy()
    cleanNoteDetector.destroy()
    volumeMeter.destroy()
    pitchDetector.destroy()
    sourceNode.stop && sourceNode.stop()
    sourceNode.disconnect()
    renderer = map = scene = pitchDebug = pitchVisualiser = cleanNoteDetector = volumeMeter = pitchDetector = sourceNode = null
  }

}

tunetris()
