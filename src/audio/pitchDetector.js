var detectPitch = require('detect-pitch')

var noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
var A = 440
var NOTE_MIDI_OFFSET = 69
var NOTES_IN_OCTAVE = 12

function noteFromPitch (frequency) {
  var noteNum = 12 * (Math.log(frequency / A) / Math.log(2))
  return Math.round(noteNum) + NOTE_MIDI_OFFSET
}

function frequencyFromNoteNumber (note) {
  return A * Math.pow(2, (note - NOTE_MIDI_OFFSET) / NOTES_IN_OCTAVE)
}

function centsOffFromPitch (frequency, noteNumber) {
  return Math.floor(1200 * Math.log(frequency / frequencyFromNoteNumber(noteNumber)) / Math.log(2))
}

module.exports = function pitchDetector (audioContext, soundSource) {

  var analyser = audioContext.createAnalyser()
  analyser.fftSize = 2048 * 2
  soundSource.connect(analyser)

  var buf = new Float32Array(2048 * 2)

  return function () {
    analyser.getFloatTimeDomainData(buf)

    var pitch = audioContext.sampleRate / detectPitch(buf)
    var noteNumber = noteFromPitch(pitch)
    var noteName = noteStrings[noteNumber % 12]
    var offset = centsOffFromPitch(pitch, noteNumber)

    return {
      pitch: pitch,
      noteNumber: noteNumber,
      noteName: noteName,
      offset: offset
    }
  }
}
