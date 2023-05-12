
import {
  BufferGeometry,
  FileLoader,
  Float32BufferAttribute,
  Mesh,
  MeshLambertMaterial,
  Loader,
} from 'three'

class SimpleOBJLoader extends Loader {

  constructor(manager) {
    super(manager)
  }

  load(url, onLoad, onProgress, onError) {
    const scope = this
    const loader = new FileLoader(this.manager)
    loader.setPath(this.path)
    loader.setRequestHeader(this.requestHeader)
    loader.setWithCredentials(this.withCredentials)
    loader.load(url, function (text) {
      try {
        onLoad(scope.parse(text))
      } catch (e) {
        if (onError) {
          onError(e)
        } else {
          console.error(e)
        }
        scope.manager.itemError(url)
      }
    }, onProgress, onError)
  }

  parse(text) {
    const lines = text.split('\n')
    const vertices = []
    const faces = []
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trimStart()
      if (line.length === 0) continue
      const lineFirstChar = line.charAt(0)
      if (lineFirstChar === '#') continue
      else if (lineFirstChar === 'v') {
        vertices.push(...line.slice(1).trim().split(' ').map(parseFloat))
      }
      else if (lineFirstChar === 'f') {
        faces.push(...line.slice(1).trim().split(' ').map((face) => {
          return face.split('/').map((index) => {
            return parseInt(index) - 1
          })
        }))
      }
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
    geometry.setIndex(faces)
    geometry.computeVertexNormals()
    geometry.computeBoundingSphere()
    const material = new MeshLambertMaterial()
    const mesh = new Mesh(geometry, material)
    return mesh
  }
}

export { SimpleOBJLoader }
