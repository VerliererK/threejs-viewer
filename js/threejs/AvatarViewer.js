import Utils from './Utils.js'
import Viewer from "./Viewer.js"
import FitzonMixer from "./FitzonMixer.js"

export default class AvatarViewer extends Viewer {

  constructor($canvas) {
    super($canvas)
    this.avatar = null
    this.mixer = null

    // store clips before mixer create
    this._tempClips = {}
  }

  addAvatar(name, _avatar) {
    if (Utils.hasMesh(_avatar)) {
      if (this.mixer) {
        this.mixer.clear()
        this.mixer = null
      }
      if (this.avatar) {
        this.remove(this.avatar)
        this.avatar = null
      }
      this.avatar = _avatar
      this.mixer = new FitzonMixer(this.avatar)
      this.add(this.avatar)
      this.zoom2Avatar()
    } else if (_avatar.animations.length > 0) {
      const anim = Utils.getAnimation(_avatar)
      anim.name = name
      this._tempClips[name] = anim
    } else {
      this.add(_avatar)
      return
    }

    if (this.mixer) {
      for (const key in this._tempClips) {
        const anim = this._tempClips[key]
        Utils.removeUnusedTracksKey(this.avatar, anim)
        this.mixer.addClip(key, anim)
        //delete this._tempClips[key]
      }
    }
  }

  zoom2Avatar(offset = 1.5) {
    if (this.avatar)
      this.zoom2fit(this.avatar, offset);
  }

  onRender() {
    super.onRender()
    if (this.mixer) {
      this.mixer.update(this.clock.getDelta())
    }
  }
}
