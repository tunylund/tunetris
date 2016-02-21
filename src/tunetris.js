var render = require('./visual/render')
var PitchDebug = require('./visual/PitchDebug')
var PitchVisualiser = require('./visual/PitchVisualiser')
var CleanNoteDetector = require('./audio/CleanNoteDetector')
var Scene = require('./visual/Scene')

var soundSource = require('./audio/soundAudioSource')
var oscillatorSource = require('./audio/oscillatorAudioSource')
var micSource = require('./audio/micAudioSource')

var pitchDetector = require('./audio/pitchDetector')
var volumeMeter = require('./audio/volumeMeter')
var WaveFormDebug = require('./visual/WaveFormDebug')
var Map = require('./visual/Map')

var AudioContext = window.AudioContext || window.webkitAudioContext
var noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

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
  var map = new Map(window.innerWidth, window.innerHeight, 32)
  var scene = new Scene(map)

  var audioContext = new AudioContext()

  var pitchDebug = new PitchDebug()
  document.body.appendChild(pitchDebug.el)

  var pitchVisualiser = new PitchVisualiser(scene.scene, map)
  document.body.appendChild(pitchVisualiser.el)

  var cleanNoteDetector = new CleanNoteDetector()

  //fillMap(scene.scene, map)

  cleanNoteDetector.on('cleanNote', function (note) {
    var cube = map.addCube(note)
    if (cube) scene.scene.add(cube.mesh)
  })

  soundSource(audioContext)
    .then(function (sourceNode) {

    var volume = volumeMeter(audioContext, sourceNode)
    var pitchDetect = pitchDetector(audioContext, sourceNode)

    var waveFormDebug = new WaveFormDebug(audioContext, sourceNode)
    document.body.appendChild(waveFormDebug.el)

    render(scene.scene, function () {

      var pitch = {
        pitch: '',
        noteNumber: 0,
        noteName: '',
        offset: 0
      }

      if (volume() > 0.05) {
        pitch = pitchDetect()
      }

      pitch.volume = volume()

      waveFormDebug.step()

      scene.step()

      map.invoke(pitch, 'provoke')

      cleanNoteDetector.setData(pitch)
      cleanNoteDetector.step()

      pitchDebug.setData(pitch)
      pitchDebug.step()

      pitchVisualiser.setData(pitch)
      pitchVisualiser.step()

    }, map)()
  })

}
tunetris()
