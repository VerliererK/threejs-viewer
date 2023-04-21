export default class QuickHull {

  constructor(points) {
    this._points = points
    this.hull = []

    if (points.length == 3) {
      this.hull.push(0)
      this.hull.push(1)
      this.hull.push(2)
      this.hull.push(0)
      return
    }

    const baseline = this.getMinMaxPoints(points)
    this.addSegments(baseline, points)
    this.addSegments([baseline[1], baseline[0]], points) //reverse line direction to get points on other side
    //add the last point to make a closed loop
    this.hull.push(this.hull[0])
  }

  /**
   * Return the min and max points in the set along the X axis
   * Returns [ {x,y}, {x,y} ]
   * @param {Array} points - An array of {x,y} objects
   */
  getMinMaxPoints(points) {
    let minPoint
    let maxPoint

    minPoint = points[0]
    maxPoint = points[0]

    for (let i = 1; i < points.length; i++) {
      if (points[i].x < minPoint.x)
        minPoint = points[i]
      if (points[i].x > maxPoint.x)
        maxPoint = points[i]
    }

    return [minPoint, maxPoint]
  }

  /**
   * Calculates the distance of a point from a line
   * @param {Array} point - Array [x,y]
   * @param {Array} line - Array of two points [ [x1,y1], [x2,y2] ]
   */
  distanceFromLine(point, line) {
    var vY = line[1].y - line[0].y
    var vX = line[0].x - line[1].x
    return (vX * (point.y - line[0].y) + vY * (point.x - line[0].x))
  }

  /**
   * Determines the set of points that lay outside the line (positive), and the most distal point
   * Returns: {points: [ [x1, y1], ... ], max: [x,y] ]
   * @param points
   * @param line
   */
  distalPoints(line, points) {
    var outer_points = []
    var point
    var distal_point
    var distance = 0
    var max_distance = 0

    for (let i = 0; i < points.length; i++) {
      point = points[i]
      distance = this.distanceFromLine(point, line)

      if (distance > 0) outer_points.push(point)
      else continue //short circuit

      if (distance > max_distance) {
        distal_point = point
        max_distance = distance
      }

    }

    return { points: outer_points, max: distal_point }
  }

  /**
   * Recursively adds hull segments
   * @param line
   * @param points
   */
  addSegments(line, points) {
    var distal = this.distalPoints(line, points)
    if (!distal.max) return this.hull.push(this._points.indexOf(line[0]))
    this.addSegments([line[0], distal.max], distal.points)
    this.addSegments([distal.max, line[1]], distal.points)
  }
}
