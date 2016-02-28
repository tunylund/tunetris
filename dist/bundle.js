webpackJsonp([0],[
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var render = __webpack_require__(1)
	var PitchDebug = __webpack_require__(3)
	var PitchVisualiser = __webpack_require__(4)
	var CleanNoteDetector = __webpack_require__(6)
	var Scene = __webpack_require__(12)

	var soundSource = __webpack_require__(13)
	var oscillatorSource = __webpack_require__(14)
	var micSource = __webpack_require__(15)

	var PitchDetector = __webpack_require__(16)
	var VolumeMeter = __webpack_require__(36)
	var WaveFormDebug = __webpack_require__(37)
	var noteStrings = __webpack_require__(5).noteStrings
	var Map = __webpack_require__(38)

	var AudioContext = window.AudioContext || window.webkitAudioContext
	var audioContext = new AudioContext()

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

	      case 'fill':
	        api && api.fillMap()
	        break
	    }

	  })

	  var api
	  function switchSource (source) {
	    if (api) api.destroy()
	    api = null
	    source(audioContext)
	      .then(start)
	      .then(function (sceneApi) {
	        api = sceneApi
	      })
	      .catch(window.alert)
	  }

	  switchSource(oscillatorSource)

	}

	function start (sourceNode) {

	  var map = new Map(window.innerWidth, window.innerHeight, 32)
	  var scene = new Scene(map)

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

	  return {

	    fillMap: function () {
	      map.data.map(function (row) {
	        row.map(function (col, ix) {
	          var note = { noteName: noteStrings[ix % noteStrings.length] }
	          var cube = map.addCube(note)
	          if (cube) scene.scene.add(cube.mesh)
	        })
	      })
	    },

	    destroy: function () {
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

	}

	tunetris()


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var three = __webpack_require__(2)

	module.exports = function (scene, step, map, window, document) {
	  var camera = new three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
	  var renderer = new three.WebGLRenderer()
	  renderer.setSize(window.innerWidth, window.innerHeight - 10)
	  document.body.appendChild(renderer.domElement)
	  camera.position.z = map.data.length / 3 * 2
	  camera.position.x = map.data[0].length / 2
	  camera.position.y = map.data.length / 2

	  function onResize () {
	    camera.aspect = window.innerWidth / window.innerHeight
	    camera.updateProjectionMatrix()
	    renderer.setSize(window.innerWidth, window.innerHeight)
	  }

	  window.addEventListener('resize', onResize, false)

	  var animRequest

	  var render = function () {
	    step()
	    animRequest = window.requestAnimationFrame(render)
	    renderer.render(scene, camera)
	  }

	  render.destroy = function () {
	    window.cancelAnimationFrame(animRequest)
	    renderer.domElement.parentNode.removeChild(renderer.domElement)
	    window.removeEventListener('resize', onResize)
	    camera = renderer = null
	  }

	  return render
	}


/***/ },
/* 2 */,
/* 3 */
/***/ function(module, exports) {

	function PitchDebug (document) {
	  this.el = document.createElement('pre')
	  document.body.appendChild(this.el)
	  this.el.className = 'pitch-debug'
	}

	PitchDebug.prototype.destroy = function () {
	  this.el.parentNode.removeChild(this.el)
	  this.el = this.data = null
	}

	PitchDebug.prototype.setData = function (data) {
	  this.data = data
	}

	PitchDebug.prototype.step = function () {
	  if (this.data) this.el.innerHTML = JSON.stringify(this.data, null, 2)
	}

	module.exports = PitchDebug


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var three = __webpack_require__(2)
	var noteStrings = __webpack_require__(5).noteStrings

	var width = 5
	var width2 = width / 2

	function PitchVisualiser (scene, map, document) {

	  var geometry = new three.Geometry()
	  for (var i = 0; i < 11; i++) {
	    geometry.vertices.push(new three.Vector3(i / 10 * width - width2, 0, 0))
	    geometry.colors.push(new three.Color(0xffffff))
	  }

	  var material = new three.LineBasicMaterial({
	    color: 0xffffff,
	    opacity: 1,
	    linewidth: 3,
	    vertexColors: three.VertexColors
	  })

	  this.line = new three.Line(geometry, material)
	  this.line.position.x = map.data[0].length / 2
	  this.line.position.y = map.data.length / 2
	  this.line.position.z = 2
	  scene.add(this.line)

	  this.light = new three.SpotLight(0xffffff, 1, 100)
	  this.light.position.x = map.data[0].length / 2
	  this.light.position.y = map.data.length / 2
	  this.light.position.z = 10
	  this.light.target.position.set(this.light.position.x, this.light.position.y, 0)
	  scene.add(this.light)
	  scene.add(this.light.target)

	  this.el = document.createElement('div')
	  this.el.className = 'pitch-visualiser'
	  document.body.appendChild(this.el)

	  this.data = {
	    pitch: '',
	    noteNumber: 0,
	    noteName: '',
	    offset: 0
	  }

	}

	PitchVisualiser.prototype.destroy = function () {
	  this.el.parentNode.removeChild(this.el)
	  this.line.parent.remove(this.line)
	  this.light.parent.remove(this.light.target)
	  this.light.parent.remove(this.light)
	  this.el = this.data = this.light = this.line = null
	}

	PitchVisualiser.prototype.setData = function (data) {
	  if (this.data.noteName !== data.noteName) {
	    this.el.innerHTML = data.noteName || ''
	  }
	  this.data = data
	}

	PitchVisualiser.prototype.step = function () {
	  var tone = (noteStrings.indexOf(this.data.noteName) + 1) / noteStrings.length
	  var color = new three.Color().setHSL(tone, 1, 0.75)
	  this.light.color = color

	  var offset = this.data.offset / 40
	  var v, c, i, weight

	  for (i = 0; i < this.line.geometry.vertices.length; i++) {
	    v = this.line.geometry.vertices[i]
	    c = this.line.geometry.colors[i]

	    weight = Math.atan(width2 - Math.abs(v.x)) * offset
	    v.setY(weight)

	    var opacity = 1 - Math.abs(v.x) / width2
	    if (opacity > 0.5) opacity = 1
	    c.r = (Math.abs(weight) + 0.5) * opacity
	    c.g = (Math.abs(v.x) / width2 + 0.5) * opacity
	    c.b = (0.5) * opacity
	  }

	  this.line.geometry.verticesNeedUpdate = true
	  this.line.geometry.colorsNeedUpdate = true

	}

	module.exports = PitchVisualiser



/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports.noteStrings = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var EventEmitter = __webpack_require__(7)
	var util = __webpack_require__(8)
	var three = __webpack_require__(2)

	var timeScale = 1
	var requiredNoteLength = 1
	var feather = 20

	function CleanNoteDetector () {
	  EventEmitter.call(this)
	  this.clock = new three.Clock(true)
	  this.tick = 0
	  this.noteDetected = false
	  this.detectLength = 0
	}
	util.inherits(CleanNoteDetector, EventEmitter)

	CleanNoteDetector.prototype.destroy = function () {
	  this.removeAllListeners()
	  this.clock.stop()
	  this.clock = this.data = null
	}

	CleanNoteDetector.prototype.setData = function (data) {
	  if (this.data && this.data.noteName !== data.noteName) {
	    this.tick = 0
	    this.noteDetected = false
	    this.detectLength = 0
	  }
	  this.data = data
	}

	CleanNoteDetector.prototype.step = function () {
	  var delta = this.clock.getDelta() * timeScale
	  this.tick += delta

	  if (this.tick < 0) this.tick = 0

	  if (delta > 0 && this.data.pitch) {

	    if (Math.abs(this.data.offset) < feather) {
	      this.detectLength += delta
	    }

	    if (this.tick > requiredNoteLength && !this.noteDetected) {

	      if (this.detectLength > requiredNoteLength) {
	        this.emit('cleanNote', this.data)
	        this.noteDetected = true
	      }

	    }

	  }
	}

	module.exports = CleanNoteDetector


/***/ },
/* 7 */,
/* 8 */,
/* 9 */,
/* 10 */,
/* 11 */,
/* 12 */
/***/ function(module, exports, __webpack_require__) {

	var three = __webpack_require__(2)

	var timeScale = 1
	var tick = 0

	function stepGen (_value, min, max, speed) {
	  var value = 0
	  var dir = 1
	  return function (delta) {
	    value = value + dir * delta * speed
	    if (value < min) {
	      dir = -dir
	      value = min
	    }
	    if (value > max) {
	      dir = -dir
	      value = max
	    }

	    return value
	  }
	}

	function TravellingLight (x, y, min, max) {
	  this.light = new three.SpotLight(0xffffff, 1, 100)
	  this.light.position.set(x, y, 2)
	  this.light.nextX = stepGen(x, min, max, 8)
	  this.light.nextY = stepGen(y, min, max, 4)
	  this.light.target.nextX = stepGen(x, min, max, 8)
	  this.light.target.nextY = stepGen(y, min, max, 4)
	  this.light.target.position.set(x, y, 0)
	}

	TravellingLight.prototype.destroy = function () {
	  this.light.parent.remove(this.light.target)
	  this.light.parent.remove(this.light)
	  this.light = null
	}

	TravellingLight.prototype.step = function (delta) {
	  this.light.position.x = this.light.nextX(Math.log(this.light.position.x + 1) * delta)
	  this.light.position.y = this.light.nextY(delta)
	  this.light.target.position.x = this.light.target.nextX(delta)
	  this.light.target.position.y = this.light.target.nextY(Math.log(this.light.target.position.x + 1) * delta)
	}

	function Scene (map) {
	  this.scene = new three.Scene()

	  this.clock = new three.Clock(true)

	  this.ambient = new three.HemisphereLight(0xffffff, 0x080808, 1)
	  this.scene.add(this.ambient)

	  this.alight = new TravellingLight(0, 0, 0, map.data[0].length)
	  this.scene.add(this.alight.light)
	  this.scene.add(this.alight.light.target)

	  this.blight = new TravellingLight(map.data[0][0].length, map.data[0].length, 0, map.data[0].length)
	  this.scene.add(this.blight.light)
	  this.scene.add(this.blight.light.target)
	}

	Scene.prototype.destroy = function () {
	  this.alight.destroy()
	  this.blight.destroy()
	  this.ambient.parent.remove(this.ambient)
	  this.clock.stop()
	  this.alight = this.blight = this.ambient = this.scene = this.clock = null
	}

	Scene.prototype.step = function () {
	  var delta = this.clock.getDelta() * timeScale
	  tick += delta

	  if (tick < 0) tick = 0

	  this.alight.step(delta)
	  this.blight.step(delta)
	}

	module.exports = Scene


/***/ },
/* 13 */
/***/ function(module, exports) {

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


/***/ },
/* 14 */
/***/ function(module, exports) {

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


/***/ },
/* 15 */
/***/ function(module, exports) {

	module.exports = function (audioContext) {

	  return new Promise(function (resolve, reject) {

	    // workaround vendor syntaxes
	    navigator.getUserMedia = navigator.getUserMedia ||
	                              navigator.webkitGetUserMedia ||
	                              navigator.mozGetUserMedia

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

	      resolve(gainNode)

	    }, reject)

	  })

	}


/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	var detectPitch = __webpack_require__(17)
	var noteStrings = __webpack_require__(5).noteStrings

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


/***/ },
/* 17 */,
/* 18 */,
/* 19 */,
/* 20 */,
/* 21 */,
/* 22 */,
/* 23 */,
/* 24 */,
/* 25 */,
/* 26 */,
/* 27 */,
/* 28 */,
/* 29 */,
/* 30 */,
/* 31 */,
/* 32 */,
/* 33 */,
/* 34 */,
/* 35 */,
/* 36 */
/***/ function(module, exports) {

	// from https://github.com/cwilso/volume-meter/blob/master/volume-meter.js

	function VolumeMeter (audioContext, audioSource) {
	  this.processVolume = this.processVolume.bind(this)
	  this.processor = audioContext.createScriptProcessor(512)
	  this.processor.addEventListener('audioprocess', this.processVolume)
	  this.processor.clipping = false
	  this.processor.lastClip = 0
	  this.processor.volume = 0
	  this.processor.clipLevel = 0.98
	  this.processor.averaging = 0.95
	  this.processor.clipLag = 750

	  audioSource.connect(this.processor)

	  // workaround a chrome bug where processor does not run if not connected
	  this.processor.connect(audioContext.destination)
	}

	VolumeMeter.prototype.destroy = function () {
	  this.processor.removeEventListener('audioprocess', this.processVolume)
	  this.processor.disconnect()
	  this.processor = null
	}

	VolumeMeter.prototype.processVolume = function (event) {
	  var buf = event.inputBuffer.getChannelData(0)
	  var bufLength = buf.length
	  var sum = 0
	  var x

	  // Do a root-mean-square on the samples: sum up the squares...
	  for (var i = 0; i < bufLength; i++) {
	    x = buf[i]
	    if (Math.abs(x) >= this.processor.clipLevel) {
	      this.processor.clipping = true
	      this.processor.lastClip = window.performance.now()
	    }
	    sum += x * x
	  }

	  // ... then take the square root of the sum.
	  var rms = Math.sqrt(sum / bufLength)

	  // Now smooth this out with the averaging factor applied
	  // to the previous sample - take the max here because we
	  // want "fast attack, slow release."
	  this.volume = Math.max(rms, this.processor.volume * this.processor.averaging)
	}

	module.exports = VolumeMeter


/***/ },
/* 37 */
/***/ function(module, exports) {

	function WaveFormDebug (audioContext, audioSource, document) {
	  this.el = document.createElement('canvas')
	  this.el.width = 256
	  this.el.height = 124
	  this.el.className = 'wave-form-debug'
	  this.context = this.el.getContext('2d')
	  document.body.appendChild(this.el)

	  // workaround chrome garbage collection issue
	  window.__pc = this.analyser = audioContext.createAnalyser()
	  this.analyser.fftSize = 2048
	  this.bufferLength = this.analyser.frequencyBinCount
	  this.data = new Float32Array(this.bufferLength)
	  audioSource.connect(this.analyser)
	}

	WaveFormDebug.prototype.destroy = function () {
	  this.el.parentNode.removeChild(this.el)
	  this.analyser.disconnect()
	  window.__pc = this.analyser = this.el = this.data = this.context = null
	}

	WaveFormDebug.prototype.step = function () {
	  var w = this.el.width / 32

	  this.analyser.getFloatTimeDomainData(this.data)

	  var imgData = this.context.getImageData(0, 0, this.el.width, this.el.height)
	  this.context.putImageData(imgData, -w, 0)
	  this.context.save()
	  this.context.fillStyle = '#000'
	  this.context.fillRect(this.el.width - w, 0, w, this.el.height)
	  this.context.strokeStyle = '#353'
	  this.context.globalAlpha = 0.5
	  this.context.globalCompositeOperation = 'lighter'
	  this.context.translate(0, this.el.height / 2)
	  for (var i = 0; i < this.data.length; i = i + 8) {
	    var x = this.el.width - w + Math.floor(w * i / this.data.length)
	    var y = this.data[i] * this.el.height / 2
	    this.context.beginPath()
	    this.context.moveTo(x, 0)
	    this.context.lineTo(x + 1, y)
	    this.context.stroke()
	  }
	  this.context.restore()
	}

	module.exports = WaveFormDebug


/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	var Cube = __webpack_require__(39)
	var noteStrings = __webpack_require__(5).noteStrings

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
	  var width = Math.floor(w / tileSize)
	  var height = Math.floor(h / tileSize)
	  var map = []
	  for (var i = 0; i < height; i++) {
	    map.push(new Array(width).fill(0))
	  }

	  this.data = map
	  this.cubes = []
	  this.itemsByNoteName = {}
	  this.itemsByNoteNumber = {}
	}

	Map.prototype = {

	  destroy: function () {
	    this.cubes.map(function (cube) {
	      cube.destroy()
	    })
	    this.data = this.last = this.itemsByNoteNumber = this.itemsByNoteName = this.cubes = null
	  },

	  addCube: function (note) {
	    var pos = this.anyFree(note)
	    var c

	    if (this.last && Math.abs(noteStrings.indexOf(note.noteName) - noteStrings.indexOf(this.last.note.noteName)) === 1) {
	      pos = this.adjacentFree(this.last.pos) || pos
	    }

	    if (pos) {
	      c = new Cube(note, pos)
	      this.reserve(pos, c)
	      this.last = { note: note, pos: pos }
	    }

	    return c
	  },

	  adjacentFree: function (block) {
	    var x = block.x
	    var y = block.y
	    var positions = [-1, 0, 1].map(function (yo) {
	        return [-1, 0, 1].map(function (xo) {
	          return { x: x + xo, y: y + yo, z: 0 }
	        })
	      }).reduce(flatten)
	      .filter(function (pos) {
	        return this.data[pos.y] && this.data[pos.y][pos.x] === 0
	      }.bind(this))

	    return random(positions)
	  },

	  anyFree: function (note) {
	    var adjacentPositions =
	      (this.itemsByNoteName[note.noteName] || [])
	      .map(function (cube) {
	        return this.adjacentFree(cube.position)
	      }.bind(this))
	    var adj = random(adjacentPositions)
	    if (adj) return adj

	    var freeRows = this.data.map(function (row, ix) {
	      return row.indexOf(0) > -1 ? ix : null
	    }).filter(compact)

	    var row = random(freeRows)

	    var freeCols = (this.data[row] || []).map(function (col, ix) {
	      return col === 0 ? ix : null
	    }).filter(compact)

	    var col = random(freeCols)

	    if (row !== undefined && col !== undefined) {
	      return { x: col, y: row, z: 0 }
	    }

	    return null
	  },

	  invoke: function (pitch, methodName) {
	    var cubesForNote = this.itemsByNoteName[pitch.noteName] || []
	    cubesForNote.map(function (cube) {
	      cube[methodName]()
	    })
	  },

	  reserve: function (pos, cube) {
	    this.data[pos.y][pos.x] = cube
	    this.cubes.push(cube)
	    this.itemsByNoteName[cube.note.noteName] = this.itemsByNoteName[cube.note.noteName] || []
	    this.itemsByNoteName[cube.note.noteName].push(cube)
	    this.itemsByNoteNumber[cube.note.noteNumber] = this.itemsByNoteNumber[cube.note.noteNumber] || []
	    this.itemsByNoteNumber[cube.note.noteNumber].push(cube)
	  }

	}

	module.exports = Map


/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	var three = __webpack_require__(2)
	var noteStrings = __webpack_require__(5).noteStrings

	function dir () {
	  return Math.random() > 0.5 ? 1 : -1
	}

	function Cube (note, position) {
	  this.note = note
	  this.position = position

	  var geometry = new three.BoxGeometry(0.8, 0.8, 0.15)

	  var tone = (noteStrings.indexOf(note.noteName) + 1) / noteStrings.length
	  var color = new three.Color().setHSL(tone, 1, 0.75)

	  var material = new three.MeshLambertMaterial({ color: color })
	  this.mesh = new three.Mesh(geometry, material)
	  this.mesh.position.x = position.x
	  this.mesh.position.y = position.y
	  this.mesh.position.z = position.z
	}

	Cube.prototype.destroy = function () {
	  clearTimeout(this.revertTimeout)
	  this.mesh.parent.remove(this.mesh)
	  this.note = this.position = this.mesh = null
	}

	Cube.prototype.provoke = function () {
	  var r = Math.random() / 20
	  this.mesh.position.x = this.position.x + dir() * r
	  this.mesh.position.y = this.position.y + dir() * r
	  this.mesh.position.z = this.position.z + dir() * r
	  clearTimeout(this.revertTimeout)
	  this.revertTimeout = setTimeout(this.revert.bind(this), 100)
	}

	Cube.prototype.revert = function () {
	  this.mesh.position.x = this.position.x
	  this.mesh.position.y = this.position.y
	  this.mesh.position.z = this.position.z
	}

	Cube.prototype.step = function () {}

	module.exports = Cube


/***/ }
]);