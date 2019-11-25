/**
 * @file Cube geometry with UV for linear spritesheet
 * @copyright Mikhail Yudin aka fagci
 * @author fagci / https://github.com/fagci https://mikhail-yudin.ru
 */

class CubeGeometry extends THREE.BoxGeometry {
  constructor (size) {
    super(size, size, size)

    const face1 = [new THREE.Vector2(0, 1), new THREE.Vector2(0, 0), new THREE.Vector2(1 / 6, 0), new THREE.Vector2(1 / 6, 1)]
    const face2 = [new THREE.Vector2(1 / 6, 1), new THREE.Vector2(1 / 6, 0), new THREE.Vector2(2 / 6, 0), new THREE.Vector2(2 / 6, 1)]
    const face3 = [new THREE.Vector2(2 / 6, 1), new THREE.Vector2(2 / 6, 0), new THREE.Vector2(3 / 6, 0), new THREE.Vector2(3 / 6, 1)]
    const face4 = [new THREE.Vector2(3 / 6, 1), new THREE.Vector2(3 / 6, 0), new THREE.Vector2(4 / 6, 0), new THREE.Vector2(4 / 6, 1)]
    const face5 = [new THREE.Vector2(4 / 6, 1), new THREE.Vector2(4 / 6, 0), new THREE.Vector2(5 / 6, 0), new THREE.Vector2(5 / 6, 1)]
    const face6 = [new THREE.Vector2(5 / 6, 1), new THREE.Vector2(5 / 6, 0), new THREE.Vector2(6 / 6, 0), new THREE.Vector2(6 / 6, 1)]

    this.faceVertexUvs[0] = []

    this.faceVertexUvs[0][0] = [face1[0], face1[1], face1[3]]
    this.faceVertexUvs[0][1] = [face1[1], face1[2], face1[3]]

    this.faceVertexUvs[0][2] = [face2[0], face2[1], face2[3]]
    this.faceVertexUvs[0][3] = [face2[1], face2[2], face2[3]]

    this.faceVertexUvs[0][4] = [face3[0], face3[1], face3[3]]
    this.faceVertexUvs[0][5] = [face3[1], face3[2], face3[3]]

    this.faceVertexUvs[0][6] = [face4[0], face4[1], face4[3]]
    this.faceVertexUvs[0][7] = [face4[1], face4[2], face4[3]]

    this.faceVertexUvs[0][8] = [face5[0], face5[1], face5[3]]
    this.faceVertexUvs[0][9] = [face5[1], face5[2], face5[3]]

    this.faceVertexUvs[0][10] = [face6[0], face6[1], face6[3]]
    this.faceVertexUvs[0][11] = [face6[1], face6[2], face6[3]]

    this.uvsNeedUpdate = true
  }
}
