import { Group } from 'three'
import Drawer from './Drawer.js'
import Measurer from './Measurer.js'

export default class MeasureGroup extends Group {

  constructor() {
    super()
    this.name = 'MeasureGroup'
    this.clickPointsMaxCount = 1
    this.clickPoints = []
    this.textMesh = null
    this.circumMesh = null
  }

  reset() {
    for (let pt of this.clickPoints) this.remove(pt)
    this.clickPoints = []
    if (this.textMesh) {
      this.remove(this.textMesh)
      this.textMesh = null
    }
    if (this.circumMesh) {
      this.remove(this.circumMesh)
      this.circumMesh = null
    }
  }

  addClickPoint(intersect) {
    const { point, object } = intersect
    const p = Drawer.drawSphere(point)
    this.add(p)

    if (this.clickPoints.length == this.clickPointsMaxCount) {
      for (let pt of this.clickPoints) this.remove(pt)
      this.clickPoints = []
    }
    this.clickPoints.push(p)
    if (this.clickPoints.length == this.clickPointsMaxCount) {
      const points = this.clickPoints.map(p => p.position)
      const { line_points, value } = Measurer.measureCircumferenceByPoints(object, points)
      if (line_points.length == 0) return false

      if (this.textMesh) {
        this.remove(this.textMesh)
        this.textMesh = null
      }
      if (this.circumMesh) {
        this.circumMesh.geometry.setFromPoints(line_points)
      }
      else {
        this.circumMesh = Drawer.drawLine(line_points, 0xff0000)
        this.add(this.circumMesh)
      }
      this.textMesh = Drawer.drawText((value * 100).toFixed(2))
      this.textMesh.position.set(0.5, line_points[0].y, line_points[0].z)
      this.add(this.textMesh)

      return true
    }
    return false
  }
}
