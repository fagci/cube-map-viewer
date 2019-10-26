const ROOM_SIZE = 3.0
const HALF_RS = ROOM_SIZE / 2
// const SRC_PATH = 'https://b737c3d1.ngrok.io/cubemap_textures/'
const SRC_PATH = '/res/'
const FOV = 95

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

function makeRoomFromSS(fname) {
  const materials = []
  console.log('Make room from spritesheet ' + fname);
  textureLoader.load(fname + '.jpg', function (map) {
    console.log('texture loaded')
    map.minFilter = THREE.LinearFilter
    map.repeat.x = 1.0 / 6

    for (let i = 0; i < 6; i++) {
      map.offset.x = i * 1.0 / 6
      let mat = new THREE.MeshBasicMaterial({
        map: map.clone(),
        side: THREE.BackSide,
        polygonOffset: true,
        polygonOffsetFactor: 1, // positive value pushes polygon further away
        polygonOffsetUnits: 1
      });
      mat.map.needsUpdate = true
      materials.push(mat)
    }
  })

  const room = new THREE.BoxGeometry(ROOM_SIZE, ROOM_SIZE, ROOM_SIZE)
  const cube = new THREE.Mesh(room, materials)
  cube.scale.x = -1


  // wireframe
  var geo = new THREE.EdgesGeometry(cube.geometry); // or WireframeGeometry
  var mat = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
  var wireframe = new THREE.LineSegments(geo, mat);
  cube.add(wireframe);

  let gh = new THREE.GridHelper(ROOM_SIZE, ROOM_SIZE)
  gh.position.y = -HALF_RS
  cube.add(gh)

  return cube
}

function makeRoom(sideNames) {
  const materials = []
  for (let i in sideNames) {
    let map = textureLoader.load(sideNames[i] + '.jpg')
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.repeat.set(20, 20)
    materials.push(new THREE.MeshBasicMaterial({ map, side: THREE.BackSide }))
  }

  const room = new THREE.BoxGeometry(ROOM_SIZE, ROOM_SIZE, ROOM_SIZE)
  const cube = new THREE.Mesh(room, materials)
  cube.scale.x = -1
  return cube
}

function makeRooms() {
  fetch('/res/point.txt')
  .then((d) => d.text())
  .then(t => {
    console.log(t)
    t.split('\n').forEach((m) => {
      let matches = m.match(/^(\d+) X=([0-9.-]+) Y=([0-9.-]+) Z=([0-9.-]+)$/i)
      
      let num = +matches[1];
      let x = +matches[2];
      let z = +matches[3];

      let room = makeRoomFromSS('render_light'+('000'+num).slice(-4))
      room.position.set(x, HALF_RS, z)
      rooms.add(room)
    })
  })
}

let targetPoint = null

function animateVector3(vectorToAnimate, target, options) {
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

function moveIntoView() {
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

function initScene() {
  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 400)

  camera.position.y = ROOM_SIZE / 2
  camera.position.z = -0.001
  camera.lookAt(HALF_RS, HALF_RS, 0)

  makeRooms()

  let mmSize = 9
  minimapCamera = new THREE.OrthographicCamera(-mmSize, mmSize, mmSize, -mmSize, 0.01, 1000)
  scene.add(minimapCamera)

  minimapCamera.position.y = 200
  minimapCamera.lookAt(camera.position)

  
  scene.add(rooms)

  // INIT NAV
  const mat = new THREE.MeshBasicMaterial({
    color: 0x00ff00
  })
  mat.depthTest = false

  navHelper = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 32), mat)
  navHelper.position.set(24, 24, 0)
  scene.add(navHelper)
}

function initRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: false })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  container.appendChild(renderer.domElement)
}

function init() {
  THREE.Cache.enabled = true
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

function onWindowResize() {
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

function animate() {
  stats.begin()
  TWEEN.update()
  requestAnimationFrame(animate)

  raycaster.setFromCamera(controls.mouse, camera)

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

function render() {
  renderer.setClearColor(0x00aaee)
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight)
  renderer.render(scene, camera)

  renderer.setClearColor(0x333333)
  renderer.clearDepth()
  renderer.setScissorTest(true)
  renderer.setScissor(16, 16, insetWidth, insetHeight)
  renderer.setViewport(16, 16, insetWidth, insetHeight)
  renderer.render(scene, minimapCamera)
  renderer.setScissorTest(false)
}

init()
animate()
