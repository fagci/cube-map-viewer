/**
 * @file Helps with navigation and movement with animation
 * @copyright Mikhail Yudin aka fagci
 * @author fagci / https://github.com/fagci https://mikhail-yudin.ru
 */

class Navigation {
  constructor (scene, rooms, camera, minimapCamera) {
    this.rooms = rooms
    this.camera = camera
    this.scene = scene
    this.minimapCamera = minimapCamera
    this.isMoving = false

    this.raycaster = new THREE.Raycaster()

    this.navHelper = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, depthTest: false, transparent: true })
    )
    this.navHelper.layers.enable(1)
    this.navHelper.layers.enable(0)
    // this.navHelper.renderOrder = 1

    this.whereAmI = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    )

    this.whereAmI.layers.disable(0)
    this.whereAmI.layers.enable(1)
    this.whereAmI.position.y = 1

    this.arrowHelper = new THREE.ArrowHelper(
      // first argument is the direction
      new THREE.Vector3(0, 0, 0),
      // second argument is the orgin
      new THREE.Vector3(0, 0, 0),
      // length
      2,
      // color
      0xff0000, 0.5, 0.5)

    this.arrowHelper.line.layers.disable(0)
    this.arrowHelper.line.layers.enable(1)
    this.arrowHelper.cone.layers.disable(0)
    this.arrowHelper.cone.layers.enable(1)

    this.whereAmI.add(this.arrowHelper)

    scene.add(this.whereAmI)
    scene.add(this.navHelper)

    window.addEventListener('keyup', e => this.onKeyUp(e))
  }

  setRoom (room) {
    if (this.currentRoom) this.currentRoom.layers.disable(0)
    this.currentRoom = room
    this.currentRoom.layers.enable(0)
    this.camera.position.copy(this.currentRoom.position)
    this.whereAmI.position.copy(this.currentRoom.position)
  }

  update (mouse) {
    this.raycaster.setFromCamera(mouse, this.camera)
    const farPoint = this.getFarIntersectionPoint()
    if (!farPoint) {
      this.navHelper.visible = false
      return
    }

    this.navHelper.position.copy(farPoint)
    this.navHelper.visible = true

    let lookAtVector = new THREE.Vector3(0, 0, -1)
    lookAtVector.applyQuaternion(camera.quaternion)
    this.arrowHelper.setDirection(lookAtVector)

  }

  getFarIntersectionPoint () {
    let maxDistancePoint
    const otherRooms = this.rooms.children.filter((ch) => {
      return ch.object !== this.currentRoom
    })

    let intersections = this.raycaster.intersectObjects(otherRooms)
    if (!intersections.length) return null

    let maxDistance = 0

    intersections.filter((ch) => {
      const distance = ch.point.distanceTo(this.camera.position)
      if (maxDistance < distance) {
        maxDistancePoint = ch.point
        maxDistance = distance
      }
    })
    return maxDistancePoint
  }

  getNearestIntersectionObject (lookAtVector) {
    // get lines between potential movements
    // get angle between camera direction and each line
    // get minimal angle
    // move to direction with this line

    lookAtVector.y = 0

    const currentRoom = this.currentRoom
    let targetRoom
    let minimumAngle = Number.MAX_VALUE

    let dir = new THREE.Vector3() // create once an reuse it

    for (let np of currentRoom.neighbourPoints) {
      let neighbourRoom = this.rooms.getObjectByName(np)

      let p1 = currentRoom.position.clone()
      let p2 = neighbourRoom.position.clone()

      let directionVector = dir.subVectors(p2, p1).normalize()
      let angle = Math.abs(lookAtVector.angleTo(directionVector))

      if (angle < minimumAngle && angle < Math.PI * FOV / 360.0) { // 360 because 1/2 of FOV
        minimumAngle = angle
        targetRoom = neighbourRoom
      }
    }
    return targetRoom
  }

  handleClick () {
    this.moveByLookAtVector()
  }

  moveByLookAtVector (lookAtVector) {
    if (this.isMoving) return
    if (!lookAtVector) {
      lookAtVector = new THREE.Vector3(0, 0, -1)
      lookAtVector.applyQuaternion(camera.quaternion)
    }
    let dstCube = this.getNearestIntersectionObject(lookAtVector)
    if (dstCube) this.moveToCube(dstCube)
  }

  moveToCube (dstCube) {
    if (this.currentRoom === dstCube) return
    this.isMoving = true

    const srcCube = this.currentRoom
    srcCube.layers.enable(0)
    dstCube.layers.enable(0)

    dstCube.material.opacity = 1
    srcCube.material.transparent = true
    dstCube.material.transparent = false

    animateVector3(this.camera.position, dstCube.position, {
      duration: 750,
      easing: TWEEN.Easing.Cubic.InOut,
      update: (d) => {
        srcCube.material.opacity = 1 - TWEEN.Easing.Cubic.In(d)
        this.whereAmI.position.copy(this.camera.position)
      },
      callback: () => {
        srcCube.layers.disable(0)
        srcCube.material.opacity = 1
        srcCube.material.transparent = false

        this.currentRoom = dstCube
        this.whereAmI.position.copy(this.currentRoom.position)
        console.warn('Current cube:', this.currentRoom.position)
        this.isMoving = false
      }
    })
  }

  onKeyUp (e) { // TODO: перенести в контролы
    let lookAtVector = new THREE.Vector3(0, 0, -1)
    lookAtVector.applyQuaternion(camera.quaternion)
    const axis = new THREE.Vector3(0, 1, 0)

    switch (e.which) {
      case 87:
      case 38:
        // forward
        this.moveByLookAtVector(lookAtVector)
        break
      case 83:
      case 40:
        // backward
        lookAtVector.applyAxisAngle(axis, Math.PI)
        this.moveByLookAtVector(lookAtVector)
        break
      case 65:
      case 37:
        // left
        lookAtVector.applyAxisAngle(axis, Math.PI / 2)
        this.moveByLookAtVector(lookAtVector)
        break
      case 68:
      case 39:
        // right
        lookAtVector.applyAxisAngle(axis, -Math.PI / 2)
        this.moveByLookAtVector(lookAtVector)
        break
    }
  }
}