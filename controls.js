class PanControls {

  constructor(camera, container, cbClick) {
    this.camera = camera
    this.container = container
    this.mouseDown = false
    this.mouseX = 0
    this.mouseY = 0
    this.mouseMoved = false
    this.mouse = new THREE.Vector2()
    this.cbClick = cbClick
    this.init()
  }

  rotateScene(deltaX, deltaY) {
    this.camera.rotation.y += -deltaX / 400
    // this.camera.rotation.x += -deltaY / 500;
  }

  onMouseMove(e) {

    let posX = e.touches ? e.touches[0].pageX : e.clientX
    let posY = e.touches ? e.touches[0].pageY : e.clientY

    this.mouse.x = posX / window.innerWidth * 2 - 1
    this.mouse.y = -(posY / window.innerHeight) * 2 + 1
    if (!this.mouseDown) return

    e.preventDefault()

    let deltaX = posX - this.mouseX
    let deltaY = posY - this.mouseY
    this.mouseX = posX
    this.mouseY = posY
    this.mouseMoved = true
    this.rotateScene(deltaX, deltaY)
  }

  onMouseDown(e) {
    e.preventDefault()

    this.mouseDown = true
    this.mouseX = e.touches ? e.touches[0].pageX : e.clientX
    this.mouseY = e.touches ? e.touches[0].pageY : e.clientY
    this.mouseMoved = false
  }

  onMouseUp(evt) {
    evt.preventDefault()
    this.mouseDown = false
    if (!this.mouseMoved && this.cbClick) this.cbClick(this.mouse)
  }

  addMouseHandler() {
    this.container.addEventListener('mousemove', (e) => this.onMouseMove(e), false)
    this.container.addEventListener('touchmove', (e) => this.onMouseMove(e), false)

    this.container.addEventListener('mousedown', (e) => this.onMouseDown(e), false)
    this.container.addEventListener('touchstart', (e) => this.onMouseDown(e), false)

    this.container.addEventListener('mouseup', (e) => this.onMouseUp(e), false)
    this.container.addEventListener('touchend', (e) => this.onMouseUp(e), false)
  }

  init() {
    this.addMouseHandler()
  }
}