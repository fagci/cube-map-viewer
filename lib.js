const boundingBox = new THREE.Box3() // for re-use

function isPointInsideObject (point, object) {
  boundingBox.setFromObject(object)
  return boundingBox.containsPoint(point)
}