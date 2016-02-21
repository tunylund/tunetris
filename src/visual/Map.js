var Cube = require('./Cube')
var noteStrings = require('./../audio/consts').noteStrings

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
