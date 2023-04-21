export default class FPSCounter {
  constructor() {
    this.frameCount = 0
    this.fps = 0
    this.lastTime = Date.now()
    setInterval(this.updateFPS, 1000)
  }

  updateFPS = () => {
    const currTime = Date.now()
    this.fps = this.frameCount * 1000 / (currTime - this.lastTime)
    this.lastTime = currTime
    this.frameCount = 0
  }

  update() {
    this.frameCount++
    return this.fps
  }
}
