const boundingBox = new THREE.Box3() // for re-use

function isPointInsideObject (point, object) {
  boundingBox.setFromObject(object)
  return boundingBox.containsPoint(point)
}

function animateVector3(vectorToAnimate, target, options) {
  options = options || {}
  // get targets from options or set to defaults
  let to = target || THREE.Vector3(),
    easing = options.easing || TWEEN.Easing.Quadratic.In,
    duration = options.duration || 2000
  // create the tween
  const tweenVector3 = new TWEEN.Tween(vectorToAnimate)
    .to({ x: to.x, y: to.y, z: to.z }, duration)
    .easing(easing)
    .onUpdate(function (d) {
      if (options.update) options.update(d)
    })
    .onComplete(function () {
      if (options.callback) options.callback()
    })
  tweenVector3.start()
  return tweenVector3
}

