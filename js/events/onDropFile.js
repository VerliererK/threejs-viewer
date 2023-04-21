function dragOverHandler(ev) {
  ev.preventDefault()
}

function dropHandler(ev) {
  ev.preventDefault()

  if (ev.dataTransfer.items) {
    for (let i = 0; i < ev.dataTransfer.items.length; i++) {
      if (ev.dataTransfer.items[i].kind === 'file') {
        const file = ev.dataTransfer.items[i].getAsFile()
        console.log(`… file[${i}].name = ${file.name}`)
        if (window.onDropFile) {
          window.onDropFile(file)
        }
      }
    }
  } else {
    for (let i = 0; i < ev.dataTransfer.files.length; i++) {
      console.log(`… file[${i}].name = ${ev.dataTransfer.files[i].name}`)
    }
  }
}

document.body.ondrop = dropHandler
document.body.ondragover = dragOverHandler
