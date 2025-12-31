import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Sky } from 'three/examples/jsm/objects/Sky.js'
import { Reflector } from 'three/examples/jsm/objects/Reflector.js'

const app = document.querySelector('#app')

// =====================
// Renderer
// =====================
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0x87ceeb)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
app.appendChild(renderer.domElement)

// =====================
// Coordinates HUD
// =====================
const hud = document.createElement('div')
hud.style.position = 'fixed'
hud.style.top = '10px'
hud.style.left = '10px'
hud.style.color = '#fff'
hud.style.backgroundColor = 'rgba(0,0,0,0.5)'
hud.style.padding = '5px 10px'
hud.style.fontFamily = 'monospace'
hud.style.fontSize = '14px'
hud.style.zIndex = '100'
hud.style.borderRadius = '5px'
document.body.appendChild(hud)


// =====================
// Scene & Camera
// =====================
const scene = new THREE.Scene()
scene.fog = new THREE.Fog(0x87ceeb, 50, 300)

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
camera.position.set(0, 1.7, 10)

// =====================
// Sky
// =====================
const sky = new Sky()
sky.scale.setScalar(450000)
scene.add(sky)

const sunParams = new THREE.Vector3()
const skyController = {
  turbidity: 5,
  rayleigh: 2,
  mieCoefficient: 0.005,
  mieDirectionalG: 0.8,
  elevation: 45,
  azimuth: 180
}

function updateSky() {
  const phi = THREE.MathUtils.degToRad(90 - skyController.elevation)
  const theta = THREE.MathUtils.degToRad(skyController.azimuth)
  sunParams.setFromSphericalCoords(1, phi, theta)
  sky.material.uniforms['sunPosition'].value.copy(sunParams)
}
updateSky()

// =====================
// Lighting
// =====================
scene.add(new THREE.AmbientLight(0xffffff, 0.5))

const sun = new THREE.DirectionalLight(0xfff0b5, 1.5)
sun.castShadow = true
sun.shadow.mapSize.width = 4096
sun.shadow.mapSize.height = 4096
sun.shadow.camera.near = 1
sun.shadow.camera.far = 500
sun.shadow.camera.left = -100
sun.shadow.camera.right = 100
sun.shadow.camera.top = 100
sun.shadow.camera.bottom = -100
sun.shadow.bias = -0.0005
sun.position.copy(sunParams).multiplyScalar(100) // match Sky sun
scene.add(sun)

// =====================
// Ocean Reflector Plane
// =====================
const waterGeometry = new THREE.PlaneGeometry(2000, 2000)
const water = new Reflector(waterGeometry, {
  clipBias: 0.003,
  textureWidth: window.innerWidth * window.devicePixelRatio,
  textureHeight: window.innerHeight * window.devicePixelRatio,
  color: 0x0f2a3f // darker blue
})
water.rotation.x = -Math.PI / 2
water.position.y = 0
water.material.opacity = 0.7      // reduce brightness
water.material.transparent = true // enable opacity
scene.add(water)

// =====================
// Easter Eggs
// =====================
const easterEggs = [
  {
    id: 'mural1',
    position: new THREE.Vector3(12, 2, -8),
    radius: 2,
    triggered: false,
    onTrigger: () => showMessage('This is one of my favorite pieces you’ve made.')
  }
]

// =====================
// Cat Easter Eggs
// =====================
const catEggs = [
  {
    id: 'bootsie',
    name: 'Bootsie',
    model: '/bootsie.glb',
    position: new THREE.Vector3(-4.99, 9.44, -5.22),
    scale: 0.6,
    radius: 1.5,
    triggered: false,
    message: 'Bootsie — The most gentle angel in heaven...',
    sound: new Audio('/bootsiemeow.mp3')
  },
  {
    id: 'skippy',
    name: 'Skippy',
    model: '/skippy.glb',
    position: new THREE.Vector3(-8.28, 3.2, 0.38),
    scale: 0.6,
    radius: 1.5,
    triggered: false,
    message: 'Skippy — A grumpy old man...',
    sound: new Audio('/skippymeow.mp3')
  },
  {
    id: 'raven',
    name: 'Raven',
    model: '/raven.glb',
    position: new THREE.Vector3(4.45, 0.39, 1.43),
    scale: 0.6,
    radius: 1.5,
    triggered: false,
    message: 'Raven — Looking for fish to eat...',
    sound: new Audio('/ravenmeow.mp3')
  },
  {
    id: 'popcorn',
    name: 'Popcorn',
    model: '/popcorn.glb',
    position: new THREE.Vector3(6.2, 3.48, -9.76),
    scale: 0.6,
    radius: 1.5,
    triggered: false,
    message: 'Popcorn — Delicately enjoying the hot sicilian sun...',
    sound: new Audio('/popcornmeow.mp3')
  }
]

// Set volume for each cat sound
catEggs.forEach(cat => cat.sound.volume = 0.7)


// =====================
// Load City Model
// =====================
const loader = new GLTFLoader()
let city = null

loader.load('/cityscene_-_cefalu.glb', (gltf) => {
  city = gltf.scene

  const box = new THREE.Box3().setFromObject(city)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  city.position.sub(center)

  const maxDim = Math.max(size.x, size.y, size.z)
  const targetSize = 18
  const scale = targetSize / maxDim
  city.scale.setScalar(scale)

  city.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })

  scene.add(city)
})

// =====================
// Load Cat Models
// =====================
const catLoader = new GLTFLoader()
catEggs.forEach((cat) => {
  catLoader.load(cat.model, (gltf) => {
    const catModel = gltf.scene

    const box = new THREE.Box3().setFromObject(catModel)
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = cat.scale / maxDim
    catModel.scale.setScalar(scale)

    catModel.position.copy(cat.position)

    catModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    cat.object = catModel
    scene.add(catModel)
  })
})

// =====================
// Debug spheres
// =====================
for (const egg of easterEggs) {
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.2),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  )
  sphere.position.copy(egg.position)
  scene.add(sphere)
}

// =====================
// Overlay Messages
// =====================
function showMessage(text) {
  const div = document.createElement('div')
  div.className = 'overlay'
  div.innerText = text
  document.body.appendChild(div)

  // Animate in
  setTimeout(() => div.classList.add('show'), 50)

  // Animate out after 5 seconds
  setTimeout(() => div.remove(), 5000)
}



// =====================
// First-Person Controls
// =====================
let isMouseLocked = false
let canJump = false
const velocity = new THREE.Vector3()
const direction = new THREE.Vector3()
const ACCELERATION = 50
const FRICTION = 10
const GRAVITY = 30
const JUMP_FORCE = 10
const PLAYER_HEIGHT = 1.7
const keys = { forward: false, backward: false, left: false, right: false }
const euler = new THREE.Euler(0, 0, 0, 'YXZ')
const PI_2 = Math.PI / 2

renderer.domElement.addEventListener('click', () => {
  renderer.domElement.requestPointerLock()
})

document.addEventListener('pointerlockchange', () => {
  isMouseLocked = document.pointerLockElement === renderer.domElement
})

document.addEventListener('mousemove', (e) => {
  if (!isMouseLocked) return
  euler.setFromQuaternion(camera.quaternion)
  euler.y -= e.movementX * 0.002
  euler.x -= e.movementY * 0.002
  euler.x = Math.max(-PI_2, Math.min(PI_2, euler.x))
  camera.quaternion.setFromEuler(euler)
})

document.addEventListener('keydown', (e) => {
  switch (e.code) {
    case 'KeyW': keys.forward = true; break
    case 'KeyS': keys.backward = true; break
    case 'KeyA': keys.left = true; break
    case 'KeyD': keys.right = true; break
    case 'Space':
      if (canJump) { velocity.y = JUMP_FORCE; canJump = false }
      break
  }
})

document.addEventListener('keyup', (e) => {
  switch (e.code) {
    case 'KeyW': keys.forward = false; break
    case 'KeyS': keys.backward = false; break
    case 'KeyA': keys.left = false; break
    case 'KeyD': keys.right = false; break
  }
})

// =====================
// Collision Raycaster
// =====================
const raycaster = new THREE.Raycaster()
const down = new THREE.Vector3(0, -1, 0)

// =====================
// Audio
// =====================
const bootsiemeow = new Audio('/bootsiemeow.mp3')
bootsiemeow.volume = 0.7  // adjust volume if needed

const skippymeow = new Audio('/skippymeow.mp3')
skippymeow.volume = 0.7  // adjust volume if needed

const ravenmeow = new Audio('/ravenmeow.mp3')
ravenmeow.volume = 0.7  // adjust volume if needed

const popcornmeow = new Audio('/popcornmeow.mp3')
popcornmeow.volume = 0.7  // adjust volume if needed


// =====================
// Animation Loop
// =====================
let prevTime = performance.now()

function animate() {
  requestAnimationFrame(animate)

  const time = performance.now()
  const delta = (time - prevTime) / 1000
  prevTime = time

  // Update HUD coordinates
  hud.innerText = `X: ${camera.position.x.toFixed(2)}  Y: ${camera.position.y.toFixed(2)}  Z: ${camera.position.z.toFixed(2)}`


  if (isMouseLocked) {
    direction.set(
      Number(keys.right) - Number(keys.left),
      0,
      Number(keys.forward) - Number(keys.backward)
    ).normalize()

    velocity.x += direction.x * ACCELERATION * delta
    velocity.z += direction.z * ACCELERATION * delta
    velocity.x -= velocity.x * FRICTION * delta
    velocity.z -= velocity.z * FRICTION * delta
    velocity.y -= GRAVITY * delta

    camera.translateX(velocity.x * delta)
    camera.translateZ(-velocity.z * delta)
    camera.position.y += velocity.y * delta

    if (city) {
      raycaster.set(camera.position, down)
      const intersects = raycaster.intersectObject(city, true)
      if (intersects.length > 0) {
        const distance = intersects[0].distance
        if (distance < PLAYER_HEIGHT) {
          camera.position.y = intersects[0].point.y + PLAYER_HEIGHT
          velocity.y = 0
          canJump = true
        }
      }
    }

    if (camera.position.y < PLAYER_HEIGHT) {
      camera.position.y = PLAYER_HEIGHT
      velocity.y = 0
      canJump = true
    }
  }

  // Easter eggs
  for (const egg of easterEggs) {
    if (!egg.triggered && camera.position.distanceTo(egg.position) < egg.radius) {
      egg.triggered = true
      egg.onTrigger()
    }
  }

// Cat Easter Egg triggers
for (const cat of catEggs) {
  if (!cat.triggered && camera.position.distanceTo(cat.position) < cat.radius) {
    cat.triggered = true

    // Play this cat's sound
    cat.sound.currentTime = 0
    cat.sound.play()

    // Show this cat's message
    showMessage(cat.message)
  }
}


  renderer.render(scene, camera)
}

animate()
