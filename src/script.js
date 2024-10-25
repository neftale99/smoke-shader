import * as THREE from 'three'
import GUI from 'lil-gui'
import gsap from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import overlayVertexShader from './Shaders/Overlay/vertex.glsl'
import overlayFragmentShader from './Shaders/Overlay/fragment.glsl'
import smokeVertexShader from './Shaders/Smoke/vertex.glsl'
import smokeFragmentShader from './Shaders/Smoke/fragment.glsl'


/**
 * Loaders
 */
// Loading
const loaderElement = document.querySelector('.loading')
const loadingManager = new THREE.LoadingManager(
    // Loaded
    () => {
        gsap.delayedCall(1, () => {

            loaderElement.style.display = 'none'

            gsap.to(
                overlayMaterial.uniforms.uAlpha, 
                { duration: 1.5, value: 0, delay: 0.5 }
            )

            gsap.to(
                smokeMaterial.uniforms.uAlpha, 
                { duration: 1.5, value: 1, delay: 0.5 }
            )

            gsap.to(
                smokeMaterial2.uniforms.uAlpha,
                { duration: 1.5, value: 1, delay: 0.5 }
            )
        })
    },
    // Progress
    (itemUrl, itemsLoaded, itemsTotal) => 
    {
        // const progressRatio = itemsLoaded / itemsTotal
        // loadingBarElement.style.transform = `scaleX(${progressRatio})`
        loaderElement.style.display = 'block'
    }
)

// Texture
const textureLoader = new THREE.TextureLoader(loadingManager)

// Draco
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('draco/')

// GLTF
const gltfLoader = new GLTFLoader(loadingManager)
gltfLoader.setDRACOLoader(dracoLoader)

/**
 * Base
 */
// Debug
// const gui = new GUI()
// gui.close()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Overlay
 */
const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1)
const overlayMaterial = new THREE.ShaderMaterial({
    vertexShader: overlayVertexShader,
    fragmentShader: overlayFragmentShader,
    uniforms: {
        uAlpha: new THREE.Uniform(1)
    },
    transparent: true,
    depthWrite: false,
})
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
scene.add(overlay)

/**
 * Model
 */
// Material
const bakedTexture = textureLoader.load('/Model/baked.jpg')
bakedTexture.flipY = false
bakedTexture.colorSpace = THREE.SRGBColorSpace
const bakedMaterial = new THREE.MeshBasicMaterial({ map: bakedTexture })

// Perlin texture
const perlinTexture = textureLoader.load('/Noise/perlin.png')
const perlinTexture2 = textureLoader.load('/Noise/perlin2.png')
perlinTexture.wrapS = THREE.RepeatWrapping
perlinTexture.wrapT = THREE.RepeatWrapping
perlinTexture2.wrapS = THREE.RepeatWrapping
perlinTexture2.wrapT = THREE.RepeatWrapping

// Smoke Material
const smokeMaterial = new THREE.ShaderMaterial({
    vertexShader: smokeVertexShader,
    fragmentShader: smokeFragmentShader,
    uniforms: {
        uTime: new THREE.Uniform(0),
        uPerlinTexture: new THREE.Uniform(perlinTexture),
        uAlpha: new THREE.Uniform(0)
    },
    side: THREE.DoubleSide,
    depthWrite: false,
    transparent: true
})

const smokeMaterial2 = new THREE.ShaderMaterial({
    vertexShader: smokeVertexShader,
    fragmentShader: smokeFragmentShader,
    uniforms: {
        uTime: new THREE.Uniform(0),
        uPerlinTexture: new THREE.Uniform(perlinTexture2),
        uAlpha: new THREE.Uniform(0)
    },
    side: THREE.DoubleSide,
    depthWrite: false,
    transparent: true
})

gltfLoader.load(
    'Model/coffee.glb',
    (gltf) =>
    {

        gltf.scene.rotation.y = - 0.5
        gltf.scene.position.y = - 0.6
        scene.add(gltf.scene)

        const baked = gltf.scene.children.find((child) => child.name === 'Baked')
        const smoke1 = gltf.scene.children.find((child) => child.name === 'Smoke')
        const smoke2 = gltf.scene.children.find((child) => child.name === 'Smoke2')

        // Material
        baked.material = bakedMaterial
        smoke1.material = smokeMaterial
        smoke2.material = smokeMaterial2
    }
)

/**
 * Fonts
 */
const matcapTexture = textureLoader.load('Matcap/matcap.png')
matcapTexture.colorSpace = THREE.SRGBColorSpace
const fontLoader = new FontLoader()

let text = {}

fontLoader.load(
    'Font/Playwrite CU_Regular.json',
    (fonts) =>
    {
        const textMaterial = new THREE.MeshMatcapMaterial({ matcap: matcapTexture })

        let textGeometry = new TextGeometry(
            'But first\nCoffee!!',
            {
                font: fonts,
                size: 0.5,
                depth: 0.2,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.03,
                bevelSize: 0.02,
                bevelOffset: 0,
                bevelSegments: 5
            })
        textGeometry.deleteAttribute('normal')
        textGeometry = mergeVertices(textGeometry, 1e-3)
        textGeometry.computeVertexNormals()

        const text = new THREE.Mesh(textGeometry, textMaterial)
        text.position.y = 4
        text.position.x = - 3.5
        text.rotation.y = Math.PI / 3
        scene.add(text) 
    }
)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 5
camera.position.z = 6
// camera.position.copy(positionView)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)

controls.minPolarAngle = Math.PI / 4
controls.maxPolarAngle = Math.PI / 2

controls.minAzimuthAngle = -Math.PI / 6
controls.maxAzimuthAngle = Math.PI / 2

controls.minDistance = 2
controls.maxDistance = 12

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.toneMapping = THREE.CineonToneMapping
renderer.toneMappingExposure = 0.9
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    // Update smoke
    smokeMaterial.uniforms.uTime.value = elapsedTime 
    smokeMaterial2.uniforms.uTime.value = elapsedTime 

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()