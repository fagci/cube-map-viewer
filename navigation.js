/**
 * @file Helps with navigation and movement with animation
 * @copyright Mikhail Yudin aka fagci
 * @author fagci / https://github.com/fagci https://mikhail-yudin.ru
 */

class Navigation {
  constructor(scene, rooms, camera, minimapCamera) {
    this.rooms = rooms
    this.camera = camera
    this.minimapCamera = minimapCamera

    this.raycaster = new THREE.Raycaster()

    this.navHelper = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, depthTest: false, transparent: true })
    )
    this.navHelper.layers.enable(1)
    this.navHelper.layers.enable(0)
    this.navHelper.renderOrder = 1

    this.whereAmI = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 16, 16), 
      new THREE.MeshBasicMaterial({ color: 0xff0000 })
    )

    this.whereAmI.layers.disable(0)
    this.whereAmI.layers.enable(1)
    this.whereAmI.position.y = 1

    scene.add(this.whereAmI)

    scene.add(this.navHelper)
  }

  setRoom(room) {
    if (this.currentRoom) this.currentRoom.layers.disable(0)
    this.currentRoom = room
    this.currentRoom.layers.enable(0)
    this.camera.position.copy(this.currentRoom.position)
    this.whereAmI.position.copy(this.currentRoom.position)
  }

  update(mouse) {
    this.raycaster.setFromCamera(mouse, this.camera)
    const farPoint = this.getFarIntersectionPoint()
    if (!farPoint) {
      this.navHelper.visible = false
      return;
    }

    this.navHelper.position.copy(farPoint)
    this.navHelper.visible = true

  }

  getFarIntersectionPoint(mouse) {
    let maxDistancePoint;
    const otherRooms = this.rooms.children.filter((ch) => {
      return ch.object !== this.currentRoom
    })

    let intersections = this.raycaster.intersectObjects(otherRooms)
    if (!intersections.length) return null

    let maxDistance = 0;

    intersections.filter((ch) => {
      const distance = ch.point.distanceTo(this.camera.position)
      if (maxDistance < distance) {
        maxDistancePoint = ch.point
        maxDistance = distance
      }
    })
    return maxDistancePoint
  }

  handleClick(mouse) {
    let dstCube;
    const srcCube = this.currentRoom
    const farPoint = this.getFarIntersectionPoint()
    if (!farPoint) return;

    let nearestDistance = Infinity
    this.rooms.children.filter((ch) => {
      let distance = farPoint.distanceTo(ch.position)
      if (distance < nearestDistance) {
        nearestDistance = distance
        dstCube = ch
      }
    })

    if (srcCube == dstCube) return;

    srcCube.layers.enable(0)
    dstCube.layers.enable(0)

    dstCube.material.opacity = 1
    dstCube.material.transparent = false

    animateVector3(this.camera.position, dstCube.position, {
      duration: 1000,
      easing: TWEEN.Easing.Quadratic.InOut,
      update: (d) => {
        srcCube.material.opacity = 1 - d
        srcCube.material.transparent = true
        this.whereAmI.position.copy(this.camera.position)
      },
      callback: () => {
        srcCube.layers.disable(0)
        srcCube.material.opacity = 1
        srcCube.material.transparent = false

        this.currentRoom = dstCube
        this.whereAmI.position.copy(this.currentRoom.position)
      }
    })
  }
}