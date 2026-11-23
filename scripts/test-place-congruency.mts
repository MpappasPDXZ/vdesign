/**
 * Critical: Place W2 on W10 @ 88" from top — only W3 (free-end chain) moves;
 * predecessor W1 and host W10 stay put.
 */
import { Floorplan } from '../src/model/floorplan.ts'

const fp = new Floorplan()

// Mirror seed topology (cm): W1–W5 north chain, W10 party, etc.
const cNW = fp.newCorner(0, 0)
const cPartyTop = fp.newCorner(655.32, 0)
const cW2e = fp.newCorner(947.42, 0)
const cW3e = fp.newCorner(1409.7, 0)
const cW4e = fp.newCorner(1896.745, 0)
const cNE = fp.newCorner(2206.625, 0)
const cSE = fp.newCorner(2206.625, 1259.84)
const cPartyBot = fp.newCorner(655.32, 1259.84)
const cSW = fp.newCorner(0, 1259.84)

const w1 = fp.newWall(cNW, cPartyTop) // #1
const w2 = fp.newWall(cPartyTop, cW2e) // #2
const w3 = fp.newWall(cW2e, cW3e) // #3
const w4 = fp.newWall(cW3e, cW4e) // #4
fp.newWall(cW4e, cNE) // #5
fp.newWall(cNE, cSE) // #6
fp.newWall(cSE, cPartyBot) // #7
fp.newWall(cPartyBot, cSW) // #8 south turf-ish
fp.newWall(cNW, cSW) // #9 west
const w10 = fp.newWall(cPartyTop, cPartyBot) // #10 party

function snap(w: { getStartX(): number; getStartY(): number; getEndX(): number; getEndY(): number }) {
  return {
    x0: +w.getStartX().toFixed(3),
    y0: +w.getStartY().toFixed(3),
    x1: +w.getEndX().toFixed(3),
    y1: +w.getEndY().toFixed(3)
  }
}

const before = {
  w1: snap(w1),
  w2: snap(w2),
  w3: snap(w3),
  w4: snap(w4),
  w10: snap(w10)
}

const target = w10.pointFromTop(88)
console.log('target on W10 @ 88" from top:', {
  x: +target.x.toFixed(3),
  y: +target.y.toFixed(3)
})

w2.placeAgainstWall(w10, 88, true)

const after = {
  w1: snap(w1),
  w2: snap(w2),
  w3: snap(w3),
  w4: snap(w4),
  w10: snap(w10)
}

const moved = (a: ReturnType<typeof snap>, b: ReturnType<typeof snap>) =>
  a.x0 !== b.x0 || a.y0 !== b.y0 || a.x1 !== b.x1 || a.y1 !== b.y1

const w2Near = () => {
  const d0 = (w2.getStartX() - target.x) ** 2 + (w2.getStartY() - target.y) ** 2
  const d1 = (w2.getEndX() - target.x) ** 2 + (w2.getEndY() - target.y) ** 2
  return Math.sqrt(Math.min(d0, d1))
}

const results = {
  w1Stayed: !moved(before.w1, after.w1),
  w10Stayed: !moved(before.w10, after.w10),
  w4Stayed: !moved(before.w4, after.w4),
  w2Moved: moved(before.w2, after.w2),
  w3Moved: moved(before.w3, after.w3),
  w2OnTarget: w2Near() < 0.01,
  w2w3StillJoined:
    (Math.abs(w2.getEndX() - w3.getStartX()) < 0.01 &&
      Math.abs(w2.getEndY() - w3.getStartY()) < 0.01) ||
    (Math.abs(w2.getEndX() - w3.getEndX()) < 0.01 &&
      Math.abs(w2.getEndY() - w3.getEndY()) < 0.01) ||
    (Math.abs(w2.getStartX() - w3.getStartX()) < 0.01 &&
      Math.abs(w2.getStartY() - w3.getStartY()) < 0.01) ||
    (Math.abs(w2.getStartX() - w3.getEndX()) < 0.01 &&
      Math.abs(w2.getStartY() - w3.getEndY()) < 0.01)
}

console.log('before', before)
console.log('after', after)
console.log('results', results)

const ok =
  results.w1Stayed &&
  results.w10Stayed &&
  results.w4Stayed &&
  results.w2Moved &&
  results.w3Moved &&
  results.w2OnTarget &&
  results.w2w3StillJoined

if (!ok) {
  console.error('FAIL: place congruency')
  process.exit(1)
}
console.log('PASS: W2+W3 moved to W10@88"; W1/W4/W10 stayed')
