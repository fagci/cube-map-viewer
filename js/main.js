/**
 * @file Shows Cube Maps to users as Google Map Street View
 * @copyright Mikhail Yudin aka fagci
 * @author fagci / https://github.com/fagci https://mikhail-yudin.ru
 */

const isLightMode = !!window.location.search.match(/light_mode/)
const qualityParamMatch = window.location.search.match(/quality=(\d+)/)
const quality = qualityParamMatch ? qualityParamMatch[1] : 256 || 256

const ROOM_SIZE = 3.0 // Размер комнаты
const SRC_PATH = '/res/br' + (+quality) + '/' // Папка с рендерами кубов
const FILE_POINTS = '/res/point.txt' // Файл с точками и путями
const FOV = 70 // Угол обзора камеры

const CUBES_ROTATION = Math.PI / 2 // коррекция поворота кубов
const IS_INSIDEOUT = false // Вывернутый наизнанку рендер

const HALF_RS = ROOM_SIZE / 2

let camera, scene, renderer
let minimapCamera

let controls
let navigation

let cubesGroup

let windowHalfX, windowHalfY
let insetWidth, insetHeight

const cubeGeometry = new CubeGeometry(ROOM_SIZE)
const textureManager = new TextureManager(SRC_PATH, '#loading', '.progressbar')

let overlapFixHeight = 0.0

console.info('Quality set to', quality)
if (isLightMode) console.info('Light mode on')

function makeRoomFromSS (index, position, neighbourPoints) {
  const map = textureManager.load('big_render' + ('000' + index).slice(-4) + '.jpg')
  map.minFilter = map.magFilter = THREE.LinearFilter
  if (!isLightMode) map.anisotropy = renderer.capabilities.getMaxAnisotropy()
  const mat = new THREE.MeshBasicMaterial({ map, side: THREE.BackSide, color: 0xffffff })
  const cube = new THREE.Mesh(cubeGeometry, mat)
  if (IS_INSIDEOUT) cube.scale.x = -1
  cube.rotation.y = CUBES_ROTATION

  cube.neighbourPoints = []
  for (let np of neighbourPoints) cube.neighbourPoints.push('Cube_' + np)

  cube.position.copy(position)
  cube.layers.disable(0)
  cube.layers.enable(1)
  cube.name = 'Cube_' + index

  cube.position.y += overlapFixHeight
  overlapFixHeight += 0.00001

  cubesGroup.add(cube)
}

function parsePoints (t) {
  t.split('\n').forEach((m) => {
    let matches = m.match(/^(\d+) X=([0-9.-]+) Y=([0-9.-]+) Z=([0-9.-]+) ([\d,]+)/i)
    if (!matches) return

    const renderNumber = matches[1]

    const x = +matches[2]
    const y = +matches[3]
    const z = +matches[4]

    const neighbourPoints = matches[5].split(',')

    const cubePosition = new THREE.Vector3(x, y, z)

    makeRoomFromSS(renderNumber, cubePosition, neighbourPoints)
  })
  navigation.setRoom(cubesGroup.children[0]) // Первая комната
  resizeMinimap()
}

function initRooms () {
  cubesGroup = new THREE.Group()
  cubesGroup.name = 'Cubes group'
  scene.add(cubesGroup)
  fetch(FILE_POINTS).then((d) => d.text()).then(parsePoints)
}

function initCamera () {
  camera = new THREE.PerspectiveCamera(FOV, window.innerWidth / window.innerHeight, 0.01, 200)
  camera.position.set(0, 0, -0.01)
  camera.lookAt(200, HALF_RS, 0)
}

function initMinimap () {
  let mmSize = ROOM_SIZE
  minimapCamera = new THREE.OrthographicCamera(-mmSize, mmSize, mmSize, -mmSize, 0.01, 200)
  scene.add(minimapCamera)
  minimapCamera.rotation.set(0, 0, 0)

  minimapCamera.position.y = 20
  minimapCamera.lookAt(camera.position)
  minimapCamera.layers.enable(1)
  minimapCamera.layers.disable(0)

  minimapCamera.aspect = insetWidth / insetHeight
  minimapCamera.updateProjectionMatrix()
}

function resizeMinimap () {
  const bb = new THREE.Box3().setFromObject(cubesGroup)
  let mmSize = Math.max(bb.max.x, bb.max.z) // TODO: make it relative to full map size
  minimapCamera.left = -mmSize
  minimapCamera.top = mmSize
  minimapCamera.right = mmSize
  minimapCamera.bottom = -mmSize
  minimapCamera.aspect = insetWidth / insetHeight
  minimapCamera.updateProjectionMatrix()
}

function initScene () {
  scene = new THREE.Scene()
  window.scene = scene

  initRooms()
  initCamera()
  initMinimap()

  navigation = new Navigation(scene, cubesGroup, camera, minimapCamera)
}

function initRenderer () {
  renderer = new THREE.WebGLRenderer({ antialias: !isLightMode, alpha: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  document.body.appendChild(renderer.domElement)
}

function init () {
  THREE.Cache.enabled = true

  initRenderer()
  initScene()

  window.addEventListener('resize', onWindowResize, false)
  onWindowResize()

  controls = new PanControls(camera, document.body, mouse => navigation.handleClick(mouse))
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
  requestAnimationFrame(animate)

  if (navigation.isMoving) TWEEN.update()
  navigation.update(controls.mouse)

  render()
}

function render () {
  renderer.setClearColor(0xffffff)
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
