var three = require('three')

module.exports = function (scene, step, map) {
  var camera = new three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  var renderer = new three.WebGLRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight - 10)
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
