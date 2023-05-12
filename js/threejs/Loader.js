import { ObjectLoader } from 'three'
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'
import { TGSLoader } from './TGSLoader.js'

const libsRoot = 'https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/libs'

export default class Loader {

  static _renderer = null

  static initGLTFLoader() {
    const gltfLoader = new GLTFLoader()
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath(`${libsRoot}/draco/`)
    gltfLoader.setDRACOLoader(dracoLoader)

    if (this._renderer != null) {
      const ktx2Loader = new KTX2Loader()
      ktx2Loader.setTranscoderPath(`${libsRoot}/basis/`)
      ktx2Loader.detectSupport(this._renderer)
      gltfLoader.setKTX2Loader(ktx2Loader)
    }

    gltfLoader.dispose = () => {
      if (gltfLoader.dracoLoader) {
        gltfLoader.dracoLoader.dispose()
        gltfLoader.dracoLoader = null
      }
      if (gltfLoader.ktx2Loader) {
        gltfLoader.ktx2Loader.dispose()
        gltfLoader.ktx2Loader = null
      }
    }

    return gltfLoader
  }

  // set animations to scene
  // ref: https://github.com/mrdoob/three.js/blob/e22cb060cc91283d250e704f886528e1be593f45/editor/js/Loader.js#L279
  static parseGLTF(result) {
    const scene = result.scene
    scene.animations.push(...result.animations)
    return scene
  }

  static async loadUrl(url, extension = 'glb') {
    try {
      switch (extension) {
        case 'gltf':
        case 'glb':
          const gltfLoader = this.initGLTFLoader()
          let gltf = await gltfLoader.loadAsync(url)
          gltfLoader.dispose()
          return this.parseGLTF(gltf)
        case 'json':
          const objectLoader = new ObjectLoader()
          return await objectLoader.loadAsync(url)
        case 'fbx':
          const fbxLoader = new FBXLoader()
          return await fbxLoader.loadAsync(url)
        case 'obj':
          const objLoader = new OBJLoader()
          return await objLoader.loadAsync(url)
        case 'tgs':
          const tgsLoader = new TGSLoader()
          return await tgsLoader.loadAsync(url)
        default:
          console.error("Not Support Extension: " + extension)
          resolve(null)
          break
      }
    }
    catch (error) {
      console.log(error)
    }
  }

  static async loadFile(file) {
    const extension = file.name.split('.').pop().toLowerCase()
    const contents = await this.readFile(file, extension === 'json' || extension === 'obj')

    return new Promise((resolve) => {
      switch (extension) {
        case 'gltf':
        case 'glb':
          const gltfLoader = this.initGLTFLoader()
          gltfLoader.parse(contents, '', (gltf) => {
            gltfLoader.dispose()
            resolve(this.parseGLTF(gltf))
          })
          break
        case 'json':
          const objectLoader = new ObjectLoader()
          objectLoader.parse(JSON.parse(contents), (obj) => { resolve(obj) })
          break
        case 'fbx':
          const fbxLoader = new FBXLoader()
          resolve(fbxLoader.parse(contents))
          break
        case 'obj':
          const objLoader = new OBJLoader()
          resolve(objLoader.parse(contents))
          break
        case 'tgs':
          const tgsLoader = new TGSLoader()
          resolve(tgsLoader.parse(contents))
          break
        default:
          console.error("Not Support Extension: " + extension)
          resolve(null)
          break
      }
    })
  }

  static async readFile(file, readAsText = false) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.addEventListener("load", function (event) {
        const contents = event.target.result
        resolve(contents)
      })
      if (readAsText) reader.readAsText(file)
      else reader.readAsArrayBuffer(file)
    })
  }
}
