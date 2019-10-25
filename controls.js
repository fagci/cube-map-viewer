class PanControls {

  constructor (camera, container) {
    this.camera = camera
    this.container = container
    this.mouseDown = false
    this.mouseX = 0
    this.mouseY = 0
    this.mouseMoved = false
    this.mouse = new THREE.Vector2()
  }

  rotateScene (deltaX, deltaY) {
    this.camera.rotation.y += -deltaX / 500
    // this.camera.rotation.x += -deltaY / 500;
  }

  onMouseMove (evt) {
    this.mouse.x = evt.clientX / window.innerWidth * 2 - 1
    this.mouse.y = -(evt.clientY / window.innerHeight) * 2 + 1
    if (!this.mouseDown) return

    evt.preventDefault()

    let deltaX = evt.clientX - this.mouseX
    let deltaY = evt.clientY - this.mouseY
    this.mouseX = evt.clientX
    this.mouseY = evt.clientY
    this.mouseMoved = true
    this.rotateScene(deltaX, deltaY)
  }

  onMouseDown (evt) {
    evt.preventDefault()

    this.mouseDown = true
    this.mouseX = evt.clientX
    this.mouseY = evt.clientY
    this.mouseMoved = false
  }

  onMouseUp (evt) {
    evt.preventDefault()
    this.mouseDown = false
    if (!this.mouseMoved) moveIntoView()
  }

  addMouseHandler () {
    this.container.addEventListener('mousemove', this.onMouseMove, false)
    this.container.addEventListener('mousedown', this.onMouseDown, false)
    this.container.addEventListener('mouseup', this.onMouseUp, false)
  }

  init () {
    this.container.addEventListener('mousemove', this.onMouseMove, false)
    this.addMouseHandler()
  }
}