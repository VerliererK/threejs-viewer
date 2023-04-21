import * as THREE from 'three'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'
import { FontLoader } from 'three/addons/loaders/FontLoader.js'

const loader = new FontLoader();
loader.load('https://cdn.jsdelivr.net/npm/three/examples/fonts/droid/droid_sans_bold.typeface.json', function (font) {
  Drawer.font = font
})

export default class Drawer {
  static font = null

  static drawPoint(point, color = 0xff0000, size = 0.01) {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0]), 3))
    const material = new THREE.PointsMaterial({ size: size, color: color })
    const dot = new THREE.Points(geometry, material)
    dot.position.set(point.x, point.y, point.z)
    return dot
  }

  static drawSphere(point, color = 0xff0000, size = 0.01) {
    const geometry = new THREE.SphereGeometry()
    const material = new THREE.MeshStandardMaterial({ color: color })
    const sphere = new THREE.Mesh(geometry, material)
    sphere.scale.set(size, size, size)
    sphere.position.set(point.x, point.y, point.z)
    return sphere
  }

  static drawLine(line_points, color = 0x0000ff) {
    const material = new THREE.LineBasicMaterial({ color: color })
    const points = (Array.isArray(line_points) && line_points.length > 1 && line_points[0].isVector3 === true) ?
      line_points :
      line_points.map(p => new THREE.Vector3(p[0], p[1], p[2]))
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const line = new THREE.Line(geometry, material)
    return line
  }

  static drawText(text, size = 0.05, height = 0) {
    const materials = [
      new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true }), // front
    ]
    const textMesh = new THREE.Mesh(new TextGeometry(text, {
      font: this.font,
      size: size,
      height: height,
    }), materials)
    return textMesh
  }

  static drawBBox = (model, showText = true) => {
    const group = new THREE.Group()
    model.add(group)
    model.worldToLocal(group.scale)

    const box = new THREE.Box3()
    box.setFromObject(model)
    const helper = new THREE.Box3Helper(box, 0xffff00)
    group.add(helper)

    if (!showText) return group

    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const textMesh = Drawer.drawText((size.y * 100).toFixed(2))
    textMesh.position.set(box.max.x + 0.1, center.y, center.z)
    group.add(textMesh)

    const textMesh2 = Drawer.drawText((size.x * 100).toFixed(2))
    textMesh2.position.set(center.x, box.max.y + 0.1, center.z)
    group.add(textMesh2)

    return group
  }
}
