import { Vector2, Vector3, Line3, Plane } from 'three'
import QuickHull from './QuickHull.js'
import Utils from './Utils.js'

export default class Measurer {

  static getLength(line_points) {
    let sum = 0
    for (let i = 0; i < line_points.length - 1; i++) {
      sum += new Line3(line_points[i], line_points[i + 1]).distance()
    }
    return sum
  }

  static measureCircumference(mesh, plane) {
    if (mesh.edges == null) Utils.extractFromBuffer(mesh, false)

    const v = new Vector3()
    const pts3d = mesh.edges.reduce((filtered, e) => {
      if (plane.intersectLine(e, v)) filtered.push(new Vector3(v.x, v.y, v.z))
      return filtered
    }, [])
    if (pts3d.length < 2) return { line_points: [], value: 0 }
    pts3d.forEach(v => mesh.localToWorld(v))

    const plane_x_axis = new Vector3(1, 0, 0).cross(plane.normal)
    const plane_y_axis = new Vector3().crossVectors(plane.normal, plane_x_axis)
    const pts2d = pts3d.map(p => new Vector2(p.dot(plane_x_axis), p.dot(plane_y_axis)))

    const qhull = new QuickHull(pts2d)
    const line_points = qhull.hull.map(i => pts3d[i])
    const value = this.getLength(line_points)

    return { line_points, value }
  }

  static measureCircumferenceByPoints(mesh, points) {
    points = points.map(v => mesh.worldToLocal(v.clone()))
    const plane = new Plane(new Vector3(0, -1, 0), points[0].y)
    if (points.length == 2) {
      const z_axis = new Vector3().subVectors(points[1], points[0]).normalize()
      const normal = new Vector3().crossVectors(z_axis, new Vector3(1, 0, 0)).normalize()
      const dist = points[1].dot(normal)
      plane.set(normal, dist * -1)
    }
    else if (points.length == 3) {
      plane.setFromCoplanarPoints(points[0], points[1], points[2])
    }

    return this.measureCircumference(mesh, plane)
  }
}
