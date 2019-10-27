class Navigation {
  constructor(scene, rooms, camera, minimapCamera) {
    this.rooms = rooms
    this.camera = camera
    this.minimapCamera = minimapCamera

    this.raycaster = new THREE.Raycaster()

    const mat = new THREE.MeshBasicMaterial({ color: 0x00ff00, depthTest: false })

    this.navHelper = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 32), mat)
    this.navHelper.position.set(24, 24, 0)

    scene.add(this.navHelper)
  }

  setRoom(room) {
    if(this.currentRoom) this.currentRoom.layers.disable(0)
    this.currentRoom = room
    this.currentRoom.layers.enable(0)
    this.camera.position.copy(this.currentRoom.position)
  }

  update() {
    this.raycaster.setFromCamera(controls.mouse, this.camera)

    let intersections = this.raycaster.intersectObjects(
      this.rooms.children.filter((ch) => {
        return !isPointInsideObject(this.camera.position, ch)
      })
    )
    let intersection = intersections.length > 0 ? intersections[0] : null
    if (intersection) {
      this.navHelper.visible = true
      this.navHelper.position.copy(intersection.point)
    } else {
      this.navHelper.visible = false
    }

  }

  handleClick(mouse) {
    let dstCube;
    const otherRooms = this.rooms.children.filter((ch) => {
      return ch !== this.currentRoom
    })

    let intersections = this.raycaster.intersectObjects(otherRooms)
    if (!intersections.length) return

    dstCube = intersections[0].object

    const srcCube = this.currentRoom;
    let maxDistance = dstCube.position.distanceTo(srcCube.position);

    intersections.filter((ch) => {
      const distance = ch.object.position.distanceTo(srcCube.position)
      if(maxDistance < distance) {
        dstCube = ch.object
      }
    })

    srcCube.layers.enable(0)
    dstCube.layers.enable(0)

    animateVector3(this.camera.position, dstCube.position, {
      duration: 1000,
      easing: TWEEN.Easing.Quadratic.InOut,
      update: function (d) {
        srcCube.material.opacity = 1 - d
        dstCube.material.opacity = d
      },
      callback: () => {
        srcCube.layers.disable(0)
        this.currentRoom = dstCube
      }
    })
  }
}