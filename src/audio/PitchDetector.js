var detectPitch = require('detect-pitch')
var noteStrings = require('./consts').noteStrings

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

function PitchDetector (audioContext, soundSource) {
  this.analyser = audioContext.createAnalyser()
  this.sampleRate = audioContext.sampleRate
  this.analyser.fftSize = 2048 * 2
  soundSource.connect(this.analyser)
  this.buf = new Float32Array(this.analyser.fftSize)
}

PitchDetector.prototype.destroy = function () {
  this.analyser.disconnect()
  this.analyser = null
  this.buf = null
}

PitchDetector.prototype.detect = function () {
  this.analyser.getFloatTimeDomainData(this.buf)

  var pitch = this.sampleRate / detectPitch(this.buf)
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

module.exports = PitchDetector
