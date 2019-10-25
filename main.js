const ROOM_SIZE = 30.0
const HALF_RS = ROOM_SIZE / 2
const SRC_PATH = 'https://b737c3d1.ngrok.io/cubemap_textures/'
const FOV = 75
const ROOMS_SPECIFICATION = {
  cubes: {
    1: [1, 2, 3, 4, 5, 6],
    2: [7, 8, 9, 10, 11, 12]
  },
  map: [
    [0, 2, 0],
    [2, 1, 2],
    [0, 2, 0]
  ]
}

let container
let camera, scene, renderer
let minimapCamera
let navHelper
let stats

let controls
const raycaster = new THREE.Raycaster()

const rooms = new THREE.Group()

let windowHalfX, windowHalfY
let insetWidth, insetHeight

const textureLoader = new THREE.TextureLoader().setPath(SRC_PATH)

const debugPane = document.querySelector('#debugpane')

function makeRoom (sideNames) {
  const materials = []
  for (let i in sideNames) {
    let map = textureLoader.load(sideNames[i] + '.jpg')
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.repeat.set(20, 20)
    let material = new THREE.MeshBasicMaterial({
      map,
      side: THREE.BackSide,
    })
    material.side = THREE.BackSide
    materials.push(material)
  }

  const room = new THREE.BoxGeometry(ROOM_SIZE, ROOM_SIZE, ROOM_SIZE)
  const cube = new THREE.Mesh(room, materials)
  cube.scale.x = -1
  return cube
}

function makeRooms (specification) {
  const map = specification.map
  const correction = (ROOMS_SPECIFICATION.map.length - 1) * HALF_RS
  for (let j in map) {
    for (let i in map[j]) {
      let cubePreset = map[j][i]
      if (!cubePreset) continue
      let room = makeRoom(specification.cubes[cubePreset])
      room.position.set(ROOM_SIZE * i - correction, HALF_RS, ROOM_SIZE * j - correction)
      rooms.add(room)
    }
  }
}

let targetPoint = null

function animateVector3 (vectorToAnimate, target, options) {
  console.log('animation start')
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

function moveIntoView () {
  let intersections = raycaster.intersectObjects(
    rooms.children.filter(function (ch) {
      return !isPointInsideObject(camera.position, ch)
    })
  )
  let intersection = intersections.length > 0 ? intersections[0] : null
  if (!intersection) return
  targetPoint = intersection.object.position
  animateVector3(camera.position, targetPoint, {
    duration: 1000,
    easing: TWEEN.Easing.Quadratic.InOut,
    update: function (d) {
      // console.log("Updating: " + d);
    },
    callback: function () {
      console.log('Completed')
    }
  })
}

function initScene () {
  scene = new THREE.Scene()

  scene.add(new THREE.GridHelper(10, 10))

  camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 400)

  camera.position.y = ROOM_SIZE / 2
  camera.position.z = -1
  camera.lookAt(HALF_RS, HALF_RS, 0)

  let mmSize = ROOMS_SPECIFICATION.map.length * HALF_RS
  minimapCamera = new THREE.OrthographicCamera(-mmSize, mmSize, mmSize, -mmSize, 0.01, 1000)
  scene.add(minimapCamera)

  minimapCamera.position.y = 200
  minimapCamera.lookAt(camera.position)

  makeRooms(ROOMS_SPECIFICATION)
  scene.add(rooms)

  // INIT NAV
  const mat = new THREE.MeshBasicMaterial({
    color: 0x00ff00
  })
  mat.depthTest = false

  navHelper = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), mat)
  navHelper.position.set(24, 24, 0)
  scene.add(navHelper)
}

function initRenderer () {
  renderer = new THREE.WebGLRenderer({ antialias: false })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  container.appendChild(renderer.domElement)
}

function init () {
  stats = new Stats()
  debugPane.appendChild(stats.domElement)
  container = document.createElement('div')
  document.body.appendChild(container)

  initRenderer()
  initScene()

  window.addEventListener('resize', onWindowResize, false)
  onWindowResize()

  controls = new PanControls(camera, container)
  controls.init()
}

function onWindowResize () {
  windowHalfX = window.innerWidth / 2
  windowHalfY = window.innerHeight / 2
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)

  insetWidth = window.innerHeight / 4
  insetHeight = window.innerHeight / 4

  minimapCamera.aspect = insetWidth / insetHeight
  minimapCamera.updateProjectionMatrix()
}

function animate () {
  stats.begin()
  TWEEN.update()
  requestAnimationFrame(animate)

  raycaster.setFromCamera(mouse, camera)

  let intersections = raycaster.intersectObjects(
    rooms.children.filter(function (ch) {
      return !isPointInsideObject(camera.position, ch)
    })
  )
  let intersection = intersections.length > 0 ? intersections[0] : null
  if (intersection) {
    navHelper.visible = true
    navHelper.position.copy(intersection.point)
  } else {
    navHelper.visible = false
  }

  render()
  stats.end()
}

function render () {
  renderer.setClearColor(0x00aaee)
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight)
  renderer.render(scene, camera)

  renderer.setClearColor(0x333333)
  renderer.clearDepth()
  renderer.setScissorTest(true)
  renderer.setScissor(16, window.innerHeight - insetHeight - 16, insetWidth, insetHeight)
  renderer.setViewport(16, window.innerHeight - insetHeight - 16, insetWidth, insetHeight)
  renderer.render(scene, minimapCamera)
  renderer.setScissorTest(false)
}

init()
animate()
