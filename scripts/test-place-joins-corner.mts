/**
 * Place must share the host corner at 0" from an end (real join, not overlap).
 * Apply/setSpanFrom must not split a join that stays put.
 */
import { Floorplan } from '../src/model/floorplan.ts'

const fp = new Floorplan()
const c0 = fp.newCorner(0, 100)
const c1 = fp.newCorner(284.48, 100) // 9'4" east
const host = fp.newWall(c0, c1) // W2 E–W
host.setAxis('east-west')

const d0 = fp.newCorner(500, 200)
const d1 = fp.newCorner(500, 200 - 152.4) // 5' north
const guest = fp.newWall(d0, d1)
guest.setAxis('north-south')

guest.placeAgainstWall(host, 0, false, 'bottom', 'N')

const joined =
  guest.getStart() === host.getStart() ||
  guest.getStart() === host.getEnd() ||
  guest.getEnd() === host.getStart() ||
  guest.getEnd() === host.getEnd()

const atEast =
  Math.abs(guest.getStartX() - host.getBottomPoint().x) < 0.1 &&
  Math.abs(guest.getStartY() - host.getBottomPoint().y) < 0.1

const north =
  Math.min(guest.getStartY(), guest.getEndY()) < host.getBottomPoint().y - 1

// Apply-like setSpanFrom should KEEP the join
const sharedBefore = guest.getStart()
guest.setLength(152.4)
guest.setSpanFrom(guest.getStartX(), guest.getStartY(), 'N', false)
const stillJoined = guest.getStart() === sharedBefore

const results = { joined, atEast, north, stillJoined }
console.log(results)

if (!Object.values(results).every(Boolean)) {
  console.error('FAIL: place/apply join')
  process.exit(1)
}
console.log('PASS: Place joins host east tip; Apply keeps shared corner')
