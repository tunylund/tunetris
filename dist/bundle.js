webpackJsonp([0],{

/***/ 0:
/***/ function(module, exports, __webpack_require__) {

	var three = __webpack_require__(1)
	var render = __webpack_require__(2)
	var Cube = __webpack_require__(3)
	var PitchDebug = __webpack_require__(4)
	var PitchVisualiser = __webpack_require__(5)
	var CleanNoteDetector = __webpack_require__(6)
	var oscillatorAnalyser = __webpack_require__(12)
	var micInputAnalyser = __webpack_require__(13)
	var pitchDetector = __webpack_require__(14)
	var Map = __webpack_require__(34)

	var scene = new three.Scene()

	var AudioContext = window.AudioContext || window.webkitAudioContext

	function tunetris () {
	  var audioContext = new AudioContext()
	  var audioSource = oscillatorAnalyser
	  var map = new Map(window.innerWidth, window.innerHeight, 32)

	  var pitchDebug = new PitchDebug()
	  document.body.appendChild(pitchDebug.el)

	  var pitchVisualiser = new PitchVisualiser()
	  document.body.appendChild(pitchVisualiser.el)

	  pitchVisualiser.particleSystem.position.x = map.data[0].length / 2
	  pitchVisualiser.particleSystem.position.y = map.data.length / 2
	  scene.add(pitchVisualiser.particleSystem)

	  var cleanNoteDetector = new CleanNoteDetector(1, 10)

	  var lastNote, lastPos
	  cleanNoteDetector.on('cleanNote', function (note) {
	    var pos = map.anyFree(note)

	    if (lastNote && lastPos && Math.abs(note.noteNumber - lastNote.noteNumber) === 1) {
	      pos = map.adjacentFree(lastPos) || pos
	    }

	    if (pos) {
	      var c = new Cube(note, pos)
	      map.reserve(pos, c)
	      scene.add(c.mesh)
	    }

	    lastNote = note
	    lastPos = pos
	  })

	  audioSource(audioContext, function (analyser, stopOscillator) {
	    render(scene, function () {
	      var pitch = pitchDetector(analyser, audioContext.sampleRate)

	      var cubesForNote = map.itemsByNoteNumber[pitch.noteNumber] || []
	      cubesForNote.map(function (cube) {
	        cube.provoke()
	      })

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


/***/ },

/***/ 2:
/***/ function(module, exports, __webpack_require__) {

	var three = __webpack_require__(1)

	module.exports = function (scene, step, map) {
	  var camera = new three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
	  var renderer = new three.WebGLRenderer()
	  renderer.setSize(window.innerWidth, window.innerHeight)
	  document.body.appendChild(renderer.domElement)
	  camera.position.z = map.data.length / 3 * 2
	  camera.position.x = map.data[0].length / 2
	  camera.position.y = map.data.length / 2

	  window.addEventListener('resize', function () {
	    camera.aspect = window.innerWidth / window.innerHeight
	    camera.updateProjectionMatrix()
	    renderer.setSize(window.innerWidth, window.innerHeight)
	  }, false)

	  var render = function () {
	    step()
	    window.requestAnimationFrame(render)
	    renderer.render(scene, camera)
	  }
	  return render
	}


/***/ },

/***/ 3:
/***/ function(module, exports, __webpack_require__) {

	var three = __webpack_require__(1)

	function dir () {
	  return Math.random() > .5 ? 1 : -1
	}

	function Cube (note, position) {
	  this.note = note
	  this.position = position

	  var geometry = new three.BoxGeometry(0.8, 0.8, 0.1)
	  var color = new three.Color()
	  color.setHSL((note.noteNumber % 100) / 100, 1, 0.5)
	  var material = new three.MeshBasicMaterial({ color: color })
	  this.mesh = new three.Mesh(geometry, material)
	  this.mesh.position.x = position.x
	  this.mesh.position.y = position.y
	}

	Cube.prototype.provoke = function () {
	  var r = Math.random() / 20
	  this.mesh.position.x = this.position.x + dir() * r
	  this.mesh.position.y = this.position.y + dir() * r
	  clearTimeout(this.revertTimeout)
	  this.revertTimeout = setTimeout(this.revert.bind(this), 100)
	}

	Cube.prototype.revert = function () {
	  this.mesh.position.x = this.position.x
	  this.mesh.position.y = this.position.y
	}

	Cube.prototype.step = function () {

	}

	module.exports = Cube


/***/ },

/***/ 4:
/***/ function(module, exports, __webpack_require__) {

	var three = __webpack_require__(1)

	var clock = new three.Clock(true)
	var timeScale = 1
	var tick = 0

	function PitchVisualiser () {
	  this.el = document.createElement('pre')
	  this.el.className = 'pitch-debug'
	  this.data = {
	    pitch: '',
	    noteNumber: 0,
	    noteName: '',
	    offset: 0
	  }
	}

	PitchVisualiser.prototype.setData = function (data) {
	  this.data = data
	}

	PitchVisualiser.prototype.step = function () {
	  var delta = clock.getDelta() * timeScale
	  tick += delta

	  if (tick < 0) tick = 0

	  if (delta > 0) {
	    this.data.delta = delta
	    this.data.tick = tick
	    this.el.innerHTML = JSON.stringify(this.data, null, 2)
	  }
	}

	module.exports = PitchVisualiser


/***/ },

/***/ 5:
/***/ function(module, exports, __webpack_require__) {

	var three = __webpack_require__(1)

	var clock = new three.Clock(true)
	var timeScale = 1
	var tick = 0
	var particles = 1000

	function PitchVisualiser () {

	  var geometry = new three.BufferGeometry()

	  var positions = new Float32Array(particles * 3)
	  var colors = new Float32Array(particles * 3)

	  var color = new three.Color()

	  var n = 5
	  var n2 = n / 2

	  for (var i = 0; i < positions.length; i += 3) {

	    // positions

	    var x = Math.random() * n - n2
	    var y = Math.random() * n - n2
	    var z = Math.random() * n - n2

	    positions[ i ]     = x
	    positions[ i + 1 ] = 0
	    positions[ i + 2 ] = z

	    // colors

	    var vx = (x / n) + 0.5
	    var vy = (y / n) + 0.5
	    var vz = (z / n) + 0.5

	    color.setRGB(vx, vy, vz)

	    colors[ i ]     = color.r
	    colors[ i + 1 ] = color.g
	    colors[ i + 2 ] = color.b

	  }

	  geometry.addAttribute('position', new three.BufferAttribute(positions, 3))
	  geometry.addAttribute('color', new three.BufferAttribute(colors, 3))

	  geometry.computeBoundingSphere()

	  var material = new three.PointCloudMaterial({ size: 0.05, vertexColors: three.VertexColors })

	  this.particleSystem = new three.PointCloud(geometry, material)

	  this.el = document.createElement('div')
	  this.el.className = 'pitch-visualiser'

	  this.data = {
	    pitch: '',
	    noteNumber: 0,
	    noteName: '',
	    offset: 0
	  }

	  console.log(this.particleSystem)
	}

	PitchVisualiser.prototype.setData = function (data) {
	  if (this.data.noteName !== data.noteName) {
	    this.el.innerHTML = data.noteName || ''
	  }
	  this.data = data
	}

	PitchVisualiser.prototype.step = function () {
	  var delta = clock.getDelta() * timeScale
	  tick += delta

	  if (tick < 0) tick = 0

	  if (delta > 0) {
	    this.data.delta = delta
	    this.data.tick = tick
	  }
	}

	module.exports = PitchVisualiser



/***/ },

/***/ 6:
/***/ function(module, exports, __webpack_require__) {

	var EventEmitter = __webpack_require__(7)
	var util = __webpack_require__(8)
	var three = __webpack_require__(1)

	var timeScale = 1

	function CleanNoteDetector (requiredNoteLength, feather) {
	  EventEmitter.call(this)
	  this.requiredNoteLength = requiredNoteLength
	  this.feather = feather
	  this.clock = new three.Clock(true)
	  this.tick = 0
	}
	util.inherits(CleanNoteDetector, EventEmitter)

	CleanNoteDetector.prototype.setData = function (data) {
	  if (this.data && this.data.noteNumber !== data.noteNumber) {
	    this.tick = 0
	    this.noteDetected = false
	  }
	  this.data = data
	}

	CleanNoteDetector.prototype.step = function () {
	  var delta = this.clock.getDelta() * timeScale
	  this.tick += delta

	  if (this.tick < 0) this.tick = 0

	  if (delta > 0) {
	    if (this.tick > this.requiredNoteLength &&
	        Math.abs(this.data.offset) < this.feather &&
	        !this.noteDetected) {
	      this.emit('cleanNote', this.data)
	      this.noteDetected = true
	    }
	  }
	}

	module.exports = CleanNoteDetector


/***/ },

/***/ 12:
/***/ function(module, exports) {

	var analyser

	module.exports = function (audioContext, callback) {
	  if (analyser) {
	    callback(analyser)
	  } else {
	    var mediaStreamSource = audioContext.createOscillator()
	    analyser = audioContext.createAnalyser()
	    analyser.fftSize = 2048
	    mediaStreamSource.connect(analyser)
	    mediaStreamSource.start(0)

	    function update () {
	      mediaStreamSource.frequency.value += Math.random() * 10
	      mediaStreamSource.frequency.value = mediaStreamSource.frequency.value % 2000
	    }

	    var updateInterval = setInterval(update, 500)

	    callback(analyser, function () {
	      mediaStreamSource.stop(0)
	      clearInterval(updateInterval)
	    })
	  }
	}


/***/ },

/***/ 13:
/***/ function(module, exports) {

	var analyser

	module.exports = function (audioContext, callback) {
	  if (analyser) {
	    callback(analyser)
	  } else {
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
	      var mediaStreamSource = audioContext.createMediaStreamSource(stream)
	      analyser = audioContext.createAnalyser()
	      analyser.fftSize = 2048
	      mediaStreamSource.connect(analyser)
	      callback(analyser)
	    }, function (err) {
	      console.error(err)
	    })
	  }
	}


/***/ },

/***/ 14:
/***/ function(module, exports, __webpack_require__) {

	var detectPitch = __webpack_require__(15)

	var noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
	var buf = new Float32Array(1024)

	const A = 440
	const NOTE_MIDI_OFFSET = 69
	const NOTES_IN_OCTAVE = 12

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

	module.exports = function (analyser, sampleRate) {

	  analyser.getFloatTimeDomainData(buf)

	  var pitch = sampleRate / detectPitch(buf)
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


/***/ },

/***/ 34:
/***/ function(module, exports) {

	function random (arr) {
	  return arr[Math.floor(Math.random() * arr.length)]
	}

	function flatten (memo, value) {
	  return (memo || []).concat(value)
	}

	function compact (value) {
	  return value !== null
	}

	function Map (w, h, tileSize) {
	  this.setup(w, h, tileSize)
	}

	Map.prototype = {

	  setup: function (w, h, tileSize) {
	    var width = Math.floor(w / tileSize)
	    var height = Math.floor(h / tileSize)
	    var map = []
	    for (var i = 0; i < height; i++) {
	      map.push(new Array(width).fill(0))
	    }

	    this.data = map
	    this.itemsByNoteName = {}
	    this.itemsByNoteNumber = {}
	  },

	  adjacentFree: function (block) {
	    var x = block.x
	    var y = block.y
	    var positions = [-1, 0, 1].map(function (yo) {
	        return [-1, 0, 1].map(function (xo) {
	          return { x: x + xo, y: y + yo }
	        })
	      }).reduce(flatten)
	      .filter(function (pos) {
	        return this.data[pos.y] && this.data[pos.y][pos.x] === 0
	      }.bind(this))

	    return random(positions)
	  },

	  anyFree: function (note) {
	    var width = this.data[0].length
	    var mapRange = 12 * 4
	    var noteOffset = note.noteNumber - 69
	    var col = Math.floor(noteOffset / (mapRange / width))
	    var freeRows = this.data.map(function (row, ix) {
	        if (row[col] === 0) {
	          return ix
	        }
	        return null
	      }).filter(compact)

	    var row = random(freeRows)

	    if (row !== undefined && col !== undefined) {
	      return { x: col, y: row }
	    }

	    return null
	  },

	  reserve: function (pos, cube) {
	    this.data[pos.y][pos.x] = cube
	    this.itemsByNoteName[cube.note.noteName] = this.itemsByNoteName[cube.note.noteName] || []
	    this.itemsByNoteName[cube.note.noteName].push(cube)
	    this.itemsByNoteNumber[cube.note.noteNumber] = this.itemsByNoteNumber[cube.note.noteNumber] || []
	    this.itemsByNoteNumber[cube.note.noteNumber].push(cube)
	  }

	}

	module.exports = Map


/***/ }

});