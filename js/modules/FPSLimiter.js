export default class FPSLimiter {
  constructor(limit_fps) {
    this.fpsInterval = 1000 / limit_fps
    this.then = Date.now()
  }

  update() {
    let now = Date.now()
    let elapsed = now - this.then
    if (elapsed > this.fpsInterval) {
      this.then = now - (elapsed % this.fpsInterval)
      return true
    }
    return false
  }
}
