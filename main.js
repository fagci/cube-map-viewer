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
let currentRoom;

let windowHalfX, windowHalfY
let insetWidth, insetHeight

const loadManager = new THREE.LoadingManager();
const textureLoader = new THREE.TextureLoader(loadManager).setPath(SRC_PATH)

const debugPane = document.querySelector('#debugpane')
const loadingElem = document.querySelector('#loading');
const progressBarElem = loadingElem.querySelector('.progressbar');

loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
  const progress = itemsLoaded / itemsTotal;
  progressBarElem.style.transform = `scaleX(${progress})`;
};

const cubeGeometry = new CubeGeometry(ROOM_SIZE);

function makeRoomFromSS(fname, position) {
  const map = textureLoader.load(fname)  
  map.minFilter = THREE.NearestFilter;
  map.magFilter = THREE.NearestFilter;
  const mat = new THREE.MeshBasicMaterial({map, side: THREE.BackSide, color: 0xffffff, transparent: true});
  const cube = new THREE.Mesh(cubeGeometry, mat)
  cube.scale.x = -1
  cube.position.copy(position)
  rooms.add(cube)
}

function makeRooms() {
  fetch('/res/point.txt')
  .then((d) => d.text())
  .then(t => {
    t.split('\n').forEach((m) => {
      let matches = m.match(/^(\d+) X=([0-9.-]+) Y=([0-9.-]+) Z=([0-9.-]+)$/i)
      if(!matches) return
      let name = 'render_light'+('000'+matches[1]).slice(-4) + '.jpg'
      let position = new THREE.Vector3(+matches[2], HALF_RS, +matches[3])
      makeRoomFromSS(name, position)
    })
  })
}

let targetPoint = null

function moveIntoView() {
  let intersections = raycaster.intersectObjects(
    rooms.children.filter(function (ch) {
      return !isPointInsideObject(camera.position, ch)
    })
  )
  let intersection = intersections.length > 0 ? intersections[0] : null
  if (!intersection) return
  targetPoint = intersection.object.position
  let srcCube;
  let dstCube = intersection.object;

  rooms.children.filter(function (ch) {
    ch.material.opacity = 0
    if(camera.position.equals(ch.position)) {
      srcCube = ch;
    }
  })

  animateVector3(camera.position, targetPoint, {
    duration: 1000,
    easing: TWEEN.Easing.Quadratic.InOut,
    update: function (d) {
      if(srcCube)srcCube.material.opacity = 1 - d
      dstCube.material.opacity = d
    },
    callback: function () {
      // dstCube.visible = 1
    }
  })
}

function initScene() {
  scene = new THREE.Scene()

  scene.add(rooms)

  makeRooms()
  
  camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.1, 400)
  camera.position.set(0,ROOM_SIZE / 2, -0.01)
  camera.lookAt(HALF_RS, HALF_RS, 0)

  
  let mmSize = 9
  minimapCamera = new THREE.OrthographicCamera(-mmSize, mmSize, mmSize, -mmSize, 0.01, 1000)
  scene.add(minimapCamera)

  minimapCamera.position.y = 20
  minimapCamera.lookAt(camera.position)

  loadManager.onLoad = () => {  
    loadingElem.style.display = 'none';
  }

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
  renderer = new THREE.WebGLRenderer()
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
