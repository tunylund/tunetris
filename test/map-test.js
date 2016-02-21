var assert = require('assert')

describe('map-test', function () {

  var map = require('./../src/map')
  var blocks, almostFullMap, fullMap

  beforeEach(function () {
    blocks = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ]

    almostFullMap = [
      [1, 1, 1],
      [0, 1, 1],
      [1, 1, 1]
    ]

    fullMap = [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1]
    ]
  })

  it('should provide a new start-block', function () {
    assert(map.anyFree(blocks, {noteNumber: 69}))
  })

  it('should not provide a new start-block for a full map', function () {
    assert(!map.anyFree(fullMap, {noteNumber: 69}))
  })

  it('should provide adjacent block', function () {
    var b = map.anyFree(blocks, {noteNumber: 69})
    assert(map.adjacentFree(blocks, b))
  })

  it('should not provide adjacent block for a full map', function () {
    var b = map.anyFree(almostFullMap, {noteNumber: 69})
    assert(!map.adjacentFree(almostFullMap, b))
  })

})
