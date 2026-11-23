/**
 * Apply/re-span on wall A must not move neighbors that shared its free tip.
 */
import { Floorplan } from '../src/model/floorplan.ts'

const fp = new Floorplan()
// Perimeter stub: W12 E–W, W13 continues east, W17 off W12 north tip
const a = fp.newCorner(0, 100)
const b = fp.newCorner(300, 100)
const w12 = fp.newWall(a, b)

const c = fp.newCorner(300, 100)
const d = fp.newCorner(500, 100)
const w13 = fp.newWall(b, d) // shares W12 east tip

const e = fp.newCorner(0, 100)
const f = fp.newCorner(0, 0)
const w17 = fp.newWall(a, f) // shares W12 west tip — wait, attach is start on host usually
// Remap: W17 on free east of W12 together with W13? User said 13 and 17 move.
// Put both on east tip: W13 E, W17 N from east tip
w17.remove()
const w17b = fp.newWall(b, fp.newCorner(300, 0))

const w13Before = {
  x0: w13.getStartX(),
  y0: w13.getStartY(),
  x1: w13.getEndX(),
  y1: w13.getEndY()
}
const w17Before = {
  x0: w17b.getStartX(),
  y0: w17b.getStartY(),
  x1: w17b.getEndX(),
  y1: w17b.getEndY()
}

// Host to the west — re-place W12: join west tip, extend east 400cm
const h0 = fp.newCorner(-200, 100)
const h1 = fp.newCorner(0, 100)
const host = fp.newWall(h0, h1)
w12.placeAgainstWall(host, 0, false, 'bottom', 'E', 400)

const nearly = (u: number, v: number) => Math.abs(u - v) < 0.05
const w13Ok =
  nearly(w13.getStartX(), w13Before.x0) &&
  nearly(w13.getStartY(), w13Before.y0) &&
  nearly(w13.getEndX(), w13Before.x1) &&
  nearly(w13.getEndY(), w13Before.y1)
const w17Ok =
  nearly(w17b.getStartX(), w17Before.x0) &&
  nearly(w17b.getStartY(), w17Before.y0) &&
  nearly(w17b.getEndX(), w17Before.x1) &&
  nearly(w17b.getEndY(), w17Before.y1)

console.log({
  w13Ok,
  w17Ok,
  w12Len: +(w12.getLength() / 2.54).toFixed(2),
  joinedHost: w12.getStart() === host.getEnd() || w12.getStart() === host.getStart()
})

if (!w13Ok || !w17Ok) {
  console.error('FAIL: placeAgainstWall/setSpanFrom dragged neighbors')
  process.exit(1)
}
console.log('PASS: Apply-like place does not move neighbors on free tip')
