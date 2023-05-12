import {
  BufferGeometry,
  FileLoader,
  Float32BufferAttribute,
  Mesh,
  MeshLambertMaterial,
  Loader,
} from 'three'
import * as fflate from 'three/addons/libs/fflate.module.js'
import aesjs from 'https://cdn.jsdelivr.net/npm/aes-js@3.1.2/+esm'

const TGS_VERSION = 1
const FILE_MAGIC = 'tgs0'
const IV_LENGTH = 16
const AES_BLOCK = 128
const TGS_AES_KEY1 = '63acf1a4f87247fe'
const TGS_AES_KEY2 = '48684b8679bb4169'
const XOR_KEY = 218

class TGSLoader extends Loader {

  constructor(manager) {
    super(manager)
  }

  load(url, onLoad, onProgress, onError) {
    const scope = this
    const loader = new FileLoader(this.manager)
    loader.setPath(this.path)
    loader.setRequestHeader(this.requestHeader)
    loader.setWithCredentials(this.withCredentials)
    loader.setResponseType('arraybuffer')
    loader.load(url, function (buffer) {
      try {
        onLoad(scope.parse(buffer))
      } catch (e) {
        if (onError) {
          onError(e)
        } else {
          console.error(e)
        }
        scope.manager.itemError(url)
      }
    }, onProgress, onError)
  }

  // Decrypt tgs Data using AES Decryptor
  decrypt(data) {
    // --- Extract Header --- //
    const file_magic = String.fromCharCode.apply(null, [data.getUint8(0), data.getUint8(1), data.getUint8(2), data.getUint8(3)])
    if (file_magic != FILE_MAGIC) return []

    const version = data.getInt16(4, true)
    const header_length = data.getInt32(6, true)
    const data_length = data.getInt32(10, true)
    if (version != TGS_VERSION || data_length < 14) return []

    // --- Extract IV of AES --- //
    let index = header_length
    const iv1 = new Uint8Array(data.buffer, index, IV_LENGTH)
    index += IV_LENGTH
    const iv2 = new Uint8Array(data.buffer, index, IV_LENGTH)
    index += IV_LENGTH

    // --- Decrypt Data --- //
    const key1 = new TextEncoder().encode(TGS_AES_KEY1)
    const aesCbc1 = new aesjs.ModeOfOperation.cbc(key1, iv1)
    const key2 = new TextEncoder().encode(TGS_AES_KEY2)
    const aesCbc2 = new aesjs.ModeOfOperation.cbc(key2, iv2)

    let i = 0
    let deflated = []

    while (index < data.byteLength) {
      const aes_block = new Uint8Array(data.buffer, index, AES_BLOCK)
      index += AES_BLOCK
      
      // XOR Operation
      aes_block[1] = aes_block[0] ^ aes_block[1]
      aes_block[0] = aes_block[0] ^ XOR_KEY

      const decryptedBytes = (i % 2 == 0) ? aesCbc1.decrypt(aes_block) : aesCbc2.decrypt(aes_block)
      deflated.push.apply(deflated, decryptedBytes)
      i++
    }
    return deflated
  }

  // Convert Flat Item Block To Vertices and Faces.
  // Each Block: |MAGIC_NUMBER|ITEM_TYPE|P_ITEM_COUNT|DATA|
  // MAGIC_NUMBER is 0x00003D02
  // ITEM_TYPE: (char) 'v' 'f' 'p'
  // P_ITEM_COUNT: (uint)
  // DATA: 3 float (vertex) or 3 int (face) or 6 float (vertex and vertex normal)
  // DATA is I-item and P-item, Will Conver to Array [I-Item, I-Item + P-Item[0] / Ratio, I-Item + P-Item[1] / Ratio, ..., I-Item + P-Item[P_ITEM_COUNT - 1] / Ratio]
  convert(data) {
    let vertices = []
    let faces = []
    let index = 0
    while (index < data.byteLength) {
      const MAGIC_NUMBER = [data.getUint8(index + 0), data.getUint8(index + 1), data.getUint8(index + 2), data.getUint8(index + 3)]
      index += 4
      if (MAGIC_NUMBER[0] != 0 || MAGIC_NUMBER[1] != 0 || MAGIC_NUMBER[2] != 61 || MAGIC_NUMBER[3] != 2) {
        break
      }

      const itemType = String.fromCharCode(data.getUint8(index))
      index += 1
      const itemCount = data.getUint32(index, true)
      index += 4
      const itemRatio = (itemType == 'v') ? 100 : 1

      // --- get I Item (3 float or int) first --- //
      const I_item = []
      for (let i = 0; i < 3; i++) {
        if (itemType == 'v') {
          I_item.push(data.getFloat32(index, true))
          vertices.push(I_item[i])
        }
        else if (itemType == 'f') {
          I_item.push(data.getUint32(index, true) - 1)
          faces.push(I_item[i])
        }
        index += 4
      }

      // --- get P Item (3 signed-short) --- //
      for (let i = 0; i < itemCount; i++) {
        const x = data.getInt16(index, true) / itemRatio + I_item[0]
        index += 2
        const y = data.getInt16(index, true) / itemRatio + I_item[1]
        index += 2
        const z = data.getInt16(index, true) / itemRatio + I_item[2]
        index += 2
        if (itemType == 'v') {
          vertices.push(x, y, z)
        }
        else if (itemType == 'f') {
          faces.push(x, y, z)
        }
      }
    }

    return { vertices, faces }
  }

  async parse(buffer) {
    const data = new DataView(buffer)

    const deflated = this.decrypt(data)
    if (deflated.length == 0) return null

    const inflate = fflate.unzlibSync(new Uint8Array(deflated))

    const { vertices, faces } = this.convert(new DataView(inflate.buffer))

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
    geometry.setIndex(faces)
    geometry.computeVertexNormals()
    geometry.computeBoundingSphere()
    const material = new MeshLambertMaterial()
    const mesh = new Mesh(geometry, material)
    return mesh
  }
}

export { TGSLoader }
