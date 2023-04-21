export const Clear = (gui) => {
  const folders = gui.foldersRecursive()
  for (let i = folders.length - 1; i >= 0; i--) {
    folders[i].destroy()
  }
  const controls = gui.controllersRecursive()
  for (let i = controls.length - 1; i >= 0; i--) {
    controls[i].destroy()
  }
}

export const AddCameraControl = (folder, camera) => {
  folder.add(camera, 'fov', 5, 180).step(1).listen().onChange(v => {
    camera.updateProjectionMatrix()
  })
  AddObjectControl(folder, camera)
}

export const AddObjectControl = (folder, object) => {
  const pos = folder.addFolder('Position')
  const rot = folder.addFolder('Rotation')
  const scale = folder.addFolder('Scale')
  pos.add(object.position, 'x', -10, 10).decimals(3).listen()
  pos.add(object.position, 'y', -10, 10).decimals(3).listen()
  pos.add(object.position, 'z', -10, 10).decimals(3).listen()
  rot.add(object.rotation, 'x', -10, 10).decimals(3).listen()
  rot.add(object.rotation, 'y', -10, 10).decimals(3).listen()
  rot.add(object.rotation, 'z', -10, 10).decimals(3).listen()
  scale.add(object.scale, 'x', 0, 10).decimals(3).listen()
  scale.add(object.scale, 'y', 0, 10).decimals(3).listen()
  scale.add(object.scale, 'z', 0, 10).decimals(3).listen()
}
