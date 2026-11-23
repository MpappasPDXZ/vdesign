/**
 * Place against host tip must not collapse wall to 0″ when end already on tip.
 */
import { Floorplan } from '../src/model/floorplan.ts'

const fp = new Floorplan()
const a = fp.newCorner(0, 0)
const b = fp.newCorner(180 * 2.54, 0)
const host = fp.newWall(a, b)

const c = fp.newCorner(180 * 2.54 - 10, 10)
const d = fp.newCorner(180 * 2.54, 60 * 2.54)
const w = fp.newWall(c, d)
w.setEnd(b)

w.placeAgainstWall(host, 0, false, 'bottom', 'N', 60 * 2.54)

const ok =
  Math.abs(w.getLength() / 2.54 - 60) < 0.2 &&
  w.getAxis() === 'north-south' &&
  (w.getStart() === b || w.getEnd() === b) &&
  w.getStart() !== w.getEnd()

console.log({
  ok,
  len: +(w.getLength() / 2.54).toFixed(2),
  axis: w.getAxis(),
  sharesHost: w.getStart() === b || w.getEnd() === b
})

const e = fp.newCorner(50, 50)
const f = fp.newCorner(50, 80)
const w2 = fp.newWall(e, f)
w2.setStart(b)
w2.setEnd(b)
w2.placeAgainstWall(host, 0, false, 'bottom', 'N', 60 * 2.54)
const ok2 =
  Math.abs(w2.getLength() / 2.54 - 60) < 0.2 &&
  w2.getStart() !== w2.getEnd() &&
  (w2.getStart() === b || w2.getEnd() === b)

console.log({
  ok2,
  len: +(w2.getLength() / 2.54).toFixed(2),
  axis: w2.getAxis()
})

if (!ok || !ok2) {
  console.error('FAIL: placeAgainstWall collapsed')
  process.exit(1)
}
console.log('PASS: placeAgainstWall no collapse')
