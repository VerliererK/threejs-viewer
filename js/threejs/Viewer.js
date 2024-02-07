import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import FPSLimiter from '../modules/FPSLimiter.js'
import Loader from './Loader.js'

export default class Viewer {

  constructor($canvas) {
    this.$canvas = $canvas
    this.camera = null
    this.scene = null
    this.renderer = null
    this.avatar = null
    this.controls = null
    this.clock = null
    this.fpsLimiter = new FPSLimiter(30)
    this.selectedObject = null
    this.selectedBBox = null

    this.initScene($canvas)
    Loader._renderer = this.renderer
  }

  initScene($canvas) {
    if (this.scene) return

    this.clock = new THREE.Clock()

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 100)
    this.camera.position.set(0, 1.5, 5)

    this.scene = new THREE.Scene()

    // Default Light Setting //
    const ambientLight = new THREE.AmbientLight(0x222222, 1)
    this.scene.add(ambientLight)

    const light_main = new THREE.PointLight(0xFFFFFF, 1, 0, 2)
    light_main.name = 'LIT_main'
    light_main.position.set(0.9298171401023865, 2.8720896244049072, 1.668777346611023)
    this.scene.add(light_main)

    const light_rearR = new THREE.PointLight(0xFFFFFF, 0.1, 0, 2)
    light_rearR.name = 'LIT_rearR'
    light_rearR.position.set(-0.834324836730957, 1.099313735961914, -0.8507776856422424)
    this.scene.add(light_rearR)

    const light_rearL = new THREE.PointLight(0xFFFFFF, 0.1, 0, 2)
    light_rearL.name = 'LIT_rearL'
    light_rearL.position.set(1.1720513105392456, 1.1462430953979492, -0.4853934645652771)
    this.scene.add(light_rearL)
    // Default Light Setting //

    this.renderer = new THREE.WebGLRenderer({ canvas: $canvas, alpha: true, antialias: true })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = true
    this.renderer.outputEncoding = THREE.sRGBEncoding

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enablePan = true
    this.controls.update()

    this.sceneHelpers = new THREE.Group()
    this.sceneHelpers.name = 'SceneHelpers'
    this.scene.add(this.sceneHelpers)

    const gridHelper = new THREE.GridHelper(5, 10)
    this.sceneHelpers.add(gridHelper)

    this.selectedBBox = new THREE.Box3Helper(new THREE.Box3())
    this.selectedBBox.visible = false;
    this.sceneHelpers.add(this.selectedBBox)

    window.addEventListener('resize', this.onWindowResize.bind(this))
    this.FixedUpdate()
  }

  onWindowResize() {
    let aspect = window.innerWidth / window.innerHeight
    if (this.camera) {
      this.camera.aspect = aspect
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    }
  }

  onRender() {
    if (this.selectedObject && this.selectedBBox.visible) {
      this.selectedBBox.box.setFromObject(this.selectedObject)
    }
    this.renderer.render(this.scene, this.camera)
  }

  FixedUpdate() {
    if (!this.scene) {
      return
    }
    if (this.fpsLimiter.update()) {
      this.onRender()
    }
    requestAnimationFrame(() => this.FixedUpdate())
  }

  add(object, zoom2fit = false, zoom2fit_offset = 1) {
    this.scene.add(object)
    this.selectObject(object)
    if (zoom2fit) {
      this.zoom2fit(object, zoom2fit_offset)
    }
  }

  remove(object) {
    object.traverse((child) => {
      if (child.skeleton && child.skeleton.dispose) child.skeleton.dispose()
      if (child.geometry && child.geometry.dispose) child.geometry.dispose()
      if (child.material && child.material.dispose) child.material.dispose()
      if (child.texture && child.texture.dispose) child.texture.dispose()
    })
    this.scene.remove(object)
    if (object.getObjectById(this.selectedObject?.id)) {
      this.selectObject(null)
    }
  }

  selectObject(object) {
    if (object != null && object.type.includes('Helper')) return
    this.selectedObject = object
    this.selectedBBox.visible = this.selectedObject != null
    if (this.selectedObject != null) {
      this.selectedBBox.box.setFromObject(this.selectedObject)
    }
  }

  initSelectObjectEvent() {
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const pointerDown = { x: 0, y: 0 }

    this.$canvas.addEventListener('dblclick', () => {
      if (this.selectedObject) {
        this.zoom2fit(this.selectedObject)
      }
    })

    this.$canvas.addEventListener('pointerdown', (event) => {
      pointerDown.x = event.clientX
      pointerDown.y = event.clientY
    })

    this.$canvas.addEventListener('pointerup', (event) => {
      if (Math.abs(event.clientX - pointerDown.x) > 1) return
      if (Math.abs(event.clientY - pointerDown.y) > 1) return

      pointer.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.y = - (event.clientY / window.innerHeight) * 2 + 1

      raycaster.setFromCamera(pointer, this.camera)
      const intersects = raycaster.intersectObjects(this.scene.children.slice(5))
      this.selectObject((intersects.length > 0) ? intersects[0].object : null)
    })
  }

  zoom2fit(object, zoom2fit_offset = 1.5) {
    Viewer.Zoom2fit(this.camera, object, zoom2fit_offset, this.controls)
  }

  static Zoom2fit = (camera, object, offset = 1, controls = null) => {
    const bbox = new THREE.Box3().setFromObject(object)
    const center = bbox.getCenter(new THREE.Vector3())
    const size = bbox.getSize(new THREE.Vector3())
    const fov = camera.fov * (Math.PI / 180)
    const radius = (Math.max(size.x, size.y) / 2)
    const cameraZ = center.z + Math.abs(radius / Math.tan(fov / 2)) * offset
    camera.position.set(center.x, center.y, cameraZ)

    if (controls) {
      controls.target = center
      controls.update()
    }
  }
}
