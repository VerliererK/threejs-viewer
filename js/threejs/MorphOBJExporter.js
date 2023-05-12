import { Vector3 } from 'three'

export class MorphOBJExporter {

  getFacesAndVertices(mesh, scale = 1) {
    if (mesh.isSkinnedMesh) {
      // In order to calculate skinned BufferGeometry by skeleton
      // need import { computeMorphedAttributes } from 'three/addons/utils/BufferGeometryUtils.js'
      // but computeMorphedAttributes is slow
      console.warn('MorphOBJExporter: SkinnedMesh not supported yet')
    }
    if (mesh.geometry.index == null) {
      throw new Error('Only support indexed geometry')
    }
    const positionAttribute = mesh.geometry.getAttribute('position')

    const faces = []
    const vertices = []
    const p = new Vector3()
    const q = new Vector3()
    for (let i = 0; i < positionAttribute.count; i++) {
      p.fromBufferAttribute(positionAttribute, i)

      for (let j = 0; j < mesh.morphTargetInfluences.length; j++) {
        const influence = mesh.morphTargetInfluences[j]
        if (influence == 0) continue
        const morphPosition = mesh.geometry.morphAttributes.position[j]
        p.addScaledVector(q.fromBufferAttribute(morphPosition, i), influence)
      }

      vertices.push(p.x * scale, p.y * scale, p.z * scale)
    }

    for (let i = 0; i < mesh.geometry.index.count; i++) {
      const index = mesh.geometry.index.getX(i)
      faces.push(index)
    }

    return { faces, vertices }
  }

  parse(mesh) {
    let output = '# TG3D-OBJ-LUF-1\n'
    const { faces, vertices } = this.getFacesAndVertices(mesh, 1000)

    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i + 0]
      const y = vertices[i + 1]
      const z = vertices[i + 2]
      output += `v ${x.toFixed(6)} ${y.toFixed(6)} ${z.toFixed(6)}\n`
    }
    for (let i = 0; i < faces.length; i += 3) {
      output += `f ${faces[i + 0] + 1} ${faces[i + 1] + 1} ${faces[i + 2] + 1}\n`
    }

    return output
  }

}
