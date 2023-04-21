import { Vector3, Box3 } from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import { Clear, AddCameraControl, AddObjectControl } from './GUITool.js'

export default class ViewerGUI extends GUI {

  constructor(viewer, width = 300) {
    super({ width: width })
    this._viewer = viewer
    this._childCount = 0

    this.cameraFolder = this.addFolder('Camera')
    this.cameraFolder.add({ Reset: () => viewer.controls.reset() }, 'Reset')
    AddCameraControl(this.cameraFolder, viewer.camera)
    this.cameraFolder.close()

    this.lightsFolder = this.addFolder('Lights')
    this.lightsFolder.close()

    this.objectsFolder = this.addFolder('Objects')

    this.FixedUpdate()
  }

  FixedUpdate() {
    if (this._childCount != this._viewer.scene.children.length) {
      this._childCount = this._viewer.scene.children.length
      this.updateLights()
      this.updateObjects()
    }
    requestAnimationFrame(() => this.FixedUpdate())
  }

  updateLights() {
    Clear(this.lightsFolder)
    const lights = this._viewer.scene.children.filter(o => o.isLight).map(o => o.id)
    this.addIDController(lights, this.lightsFolder)
  }

  updateObjects() {
    Clear(this.objectsFolder)
    const ids = this._viewer.scene.children.filter(o => !o.isLight).map(o => o.id)
    this.addIDController(ids, this.objectsFolder)
  }

  addIDController(ids, targetFolder) {
    const target = {
      id: '',
      object: null
    }
    target.zoom2fit = () => {
      if (target.object) this._viewer.zoom2fit(target.object)
    }
    target.delete = () => {
      if (target.object) this._viewer.remove(target.object)
    }
    const idController = targetFolder.add(target, 'id', ids)
    targetFolder.add(target, 'delete')
    const propFolder = targetFolder.addFolder('Properties')
    const controlFolder = targetFolder.addFolder('Controls')
    controlFolder.close()

    idController.onChange(id => {
      const object = this._viewer.scene.getObjectById(id)
      target.object = object
      Clear(propFolder)
      propFolder.add(object, 'name').disable()
      propFolder.add(object, 'type').disable()
      propFolder.add(object, 'visible')

      Clear(controlFolder)
      if (!object.isLight) {
        const box = new Box3()
        box.setFromObject(object)
        const size = box.getSize(new Vector3())
        if (size.y > 0) {
          controlFolder.add(target, 'zoom2fit')
        }
      }
      AddObjectControl(controlFolder, object)
    })
    if (ids.length > 0)
      idController.setValue(ids[ids.length - 1])
  }

}
