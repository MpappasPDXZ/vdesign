/**
 * Lengthening W2 must not skew attached W3 into a diagonal.
 */
import { Floorplan } from '../src/model/floorplan.ts'

const fp = new Floorplan()
const c0 = fp.newCorner(0, 100)
const c1 = fp.newCorner(284.48, 100) // 9'4"
const w2 = fp.newWall(c0, c1)

const c2 = fp.newCorner(284.48, 100 - 152.4) // 5' north
const w3 = fp.newWall(c1, c2) // shares east tip of W2

const beforeAxis = w3.getAxis()
w2.setLength(180 * 2.54) // 180"

const nearly = (a: number, b: number) => Math.abs(a - b) < 0.15
const w3StillNS = w3.getAxis() === 'north-south'
const w3StillVertical = nearly(w3.getStartX(), w3.getEndX())
const stillJoined =
  w3.getStart() === w2.getStart() ||
  w3.getStart() === w2.getEnd() ||
  w3.getEnd() === w2.getStart() ||
  w3.getEnd() === w2.getEnd()
const w2Len = w2.getLength() / 2.54

const results = {
  beforeAxis,
  w3StillNS,
  w3StillVertical,
  stillJoined,
  w2Len180: nearly(w2Len, 180)
}
console.log(results)

if (!w3StillNS || !w3StillVertical || !stillJoined || !results.w2Len180) {
  console.error('FAIL: setLength skewed neighbor')
  process.exit(1)
}
console.log('PASS: setLength(180\") keeps W3 N–S and joined to W2 east tip')
