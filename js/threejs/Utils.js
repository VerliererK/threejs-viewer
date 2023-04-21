import * as THREE from 'three'

export default class Utils {

  static hashCode(vector3) {
    let hash = 17;
    hash = hash * 31 + vector3.x;
    hash = hash * 31 + vector3.y;
    hash = hash * 31 + vector3.z;
    return hash;
  }

  static hasMesh(model) {
    if (model instanceof THREE.Mesh) return true

    for (let child of model.children) {
      if (this.hasMesh(child)) return true
    }

    return false
  }

  static getMeshes(object) {
    let meshs = []
    object.traverse((child) => {
      if (child.isMesh) meshs.push(child)
    })
    return meshs
  }

  static extractFromBuffer(mesh, localToWorld = true) {
    //TODO: Support indexed BufferGeometry
    const positionAttribute = (mesh.geometry.index != null) ? mesh.geometry.toNonIndexed().getAttribute('position') : mesh.geometry.getAttribute('position')
    const p = new THREE.Vector3()

    const vertices = []
    const verticesIndexMap = new Map()
    const faces = new Array(positionAttribute.count / 3).fill(0).map(() => new Array(3))
    let faceIndex = 0
    for (let i = 0; i < positionAttribute.count; i++) {
      p.fromBufferAttribute(positionAttribute, i)
      const key = this.hashCode(p)
      let vertexIndex = verticesIndexMap.get(key)
      if (vertexIndex == null) {
        vertexIndex = vertices.length
        verticesIndexMap.set(key, vertexIndex)
        vertices.push(new THREE.Vector3(p.x, p.y, p.z))
      }
      faces[faceIndex][i % 3] = vertexIndex
      if (i % 3 == 2) {
        faceIndex++
      }
    }

    const edges = []
    const edgesMap = new Array(vertices.length).fill(0).map(() => new Set())
    for (let i = 0; i < faces.length; i++) {
      const f = faces[i];
      for (let j = 0; j < f.length; j++) {
        const edge = (j < f.length - 1) ? [f[j], f[j + 1]] : [f[j], f[0]]
        if (edge[0] > edge[1]) {
          [edge[1], edge[0]] = [edge[0], edge[1]]
        }
        if (!edgesMap[edge[0]].has(edge[1])) {
          edgesMap[edge[0]].add(edge[1])
          edges.push(new THREE.Line3(vertices[edge[0]], vertices[edge[1]]))
        }
      }
    }

    if (localToWorld) {
      vertices.forEach(v => mesh.localToWorld(v))
    }
    mesh.vertices = vertices
    mesh.faces = faces
    mesh.edges = edges
  }

  static getAnimation(model) {
    for (const animation of model.animations) {
      if (animation.tracks.length > 0) {
        return animation
      }
    }
  }

  static removeUnusedTracksKey(avatar, anim) {
    anim.tracks = anim.tracks.filter(track => avatar.getObjectByName(track.name.split('.')[0]))
  }
}
