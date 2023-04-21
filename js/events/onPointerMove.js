import { Vector2, Raycaster } from 'three'
export const raycaster = new Raycaster()
export const pointer = new Vector2()

const onPointerMove = (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1
  pointer.y = - (event.clientY / window.innerHeight) * 2 + 1
}

window.addEventListener('pointermove', onPointerMove)
