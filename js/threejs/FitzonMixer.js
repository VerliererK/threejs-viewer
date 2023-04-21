import { AnimationMixer, LoopOnce, LoopRepeat } from 'three'

export default class FitzonMixer extends AnimationMixer {

  constructor(avatar) {
    super(avatar)
    this._finish_resolve = null
    this.actions = {}
    this.activeAction = null
    this.lastAction = null

    this.addEventListener('finished', () => {
      if (this._finish_resolve) {
        this._finish_resolve()
        this._finish_resolve = null
      }
    })
  }

  get normalizedTime() {
    if (this.activeAction) {
      const duration = this.activeAction._clip.duration
      return this.activeAction.time % duration / duration
    }
    return 0;
  }

  set normalizedTime(time) {
    if (this.activeAction) {
      const duration = this.activeAction._clip.duration
      this.activeAction.time = time * duration
    }
  }

  addClip(key, clip) {
    if (key in this.actions) {
      this.uncacheClip(this.actions[key]._clip)
    }
    this.actions[key] = this.clipAction(clip)
    this.actions[key].setLoop(LoopOnce, 1)
    this.actions[key].clampWhenFinished = true
  }

  resetAction() {
    if (this.activeAction) {
      this.activeAction.fadeOut(0)
    }
    this.activeAction = null
    this.lastAction = null
    this.stopAllAction()
  }

  _play(action, fadeTime = 1) {
    let toAction = action
    if (!this.activeAction) {
      this.activeAction = toAction
      this.activeAction.reset()
      this.activeAction.play()
    }
    else if (toAction != this.activeAction) {
      this.lastAction = this.activeAction
      this.activeAction = toAction
      //lastAction.stop()
      this.lastAction.fadeOut(fadeTime)
      this.activeAction.reset()
      this.activeAction.fadeIn(fadeTime)
      this.activeAction.play()
    }
    else if (toAction == this.activeAction) {
      this.activeAction.reset()
      this.activeAction.play()
    }
  }

  playAsync(key, repeats = 1, fadeTime = 1) {
    if (!(key in this.actions)) return
    this.actions[key].setLoop(LoopRepeat, repeats)
    this._play(this.actions[key], fadeTime)
    return new Promise(resolve => { this._finish_resolve = resolve })
  }

  clear() {
    this._finish_resolve = null
    this.activeAction = null
    this.lastAction = null
    this.stopAllAction()
    for (const key in this.actions) {
      this.uncacheClip(this.actions[key])
      delete this.actions[key]
    }
    this.uncacheRoot(this._root)
    this.actions = {}
  }
}
