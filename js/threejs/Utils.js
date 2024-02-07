import * as THREE from 'three'
import { computeMorphedAttributes } from 'three/addons/utils/BufferGeometryUtils.js'

export default class Utils {

  static floatToIntBits(floatValue) {
    const buffer = new ArrayBuffer(4);
    const view = new DataView(buffer);
    view.setFloat32(0, floatValue, false);
    return view.getInt32(0, false);
  }

  static hashCode(vector3) {
    let hash = 1;
    hash = 31 * hash + this.floatToIntBits(vector3.x);
    hash = 31 * hash + this.floatToIntBits(vector3.y);
    hash = 31 * hash + this.floatToIntBits(vector3.z);

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

  static extractFromBuffer(mesh, localToWorld = true, computeMorphed = false) {
    let vertices = []
    let faces
    const positionAttribute = computeMorphed ? computeMorphedAttributes(mesh).morphedPositionAttribute : mesh.geometry.getAttribute('position')

    if (mesh.geometry.index != null) {
      faces = new Array(mesh.geometry.index.count / 3).fill(0).map(() => new Array(3))
      for (let i = 0; i < mesh.geometry.index.count; i++) {
        const index = mesh.geometry.index.getX(i)
        faces[Math.floor(i / 3)][i % 3] = index
      }

      const p = new THREE.Vector3()
      for (let i = 0; i < positionAttribute.count; i++) {
        p.fromBufferAttribute(positionAttribute, i)
        vertices[i] = new THREE.Vector3(p.x, p.y, p.z)
      }
    } else {
      const p = new THREE.Vector3()
      const verticesIndexMap = new Map()
      vertices = []
      faces = new Array(positionAttribute.count / 3).fill(0).map(() => new Array(3))
      for (let i = 0; i < positionAttribute.count; i++) {
        p.fromBufferAttribute(positionAttribute, i)
        const key = this.hashCode(p)
        let vertexIndex = verticesIndexMap.get(key)
        if (vertexIndex == null) {
          vertexIndex = vertices.length
          verticesIndexMap.set(key, vertexIndex)
          vertices.push(new THREE.Vector3(p.x, p.y, p.z))
        }
        faces[Math.floor(i / 3)][i % 3] = vertexIndex
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

  static getRoot(object) {
    if (object.parent != null && object.parent.type != 'Scene') {
      return this.getRoot(object.parent)
    }
    return object
  }
}
