/**
 * Spec: W2 = 9'4" E–W off party W15 @ 88"; W3 = 5' N–S north from bottom (east) of W2, exterior concrete 8".
 */
import { Floorplan } from '../src/model/floorplan.ts'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const project = JSON.parse(
  readFileSync(join(root, 'projects/2713-s-224th-basement/floorplan.json'), 'utf8')
)

const fp = new Floorplan()
fp.loadFloorplan(project.floorplan)
const walls = fp.getWalls()
const w2 = walls[1]
const w3 = walls[2]
const party = walls[14] // W15 party wall (was W10 before interior chain renumber)

const inch = (cm: number) => cm / 2.54
const nearly = (a: number, b: number, eps = 0.05) => Math.abs(a - b) < eps

const w2LenIn = inch(w2.getLength())
const w3LenIn = inch(w3.getLength())
const w3ThickIn = inch(w3.thickness)

const w2Bottom = w2.getBottomPoint()
const joinedToW2Bottom =
  (nearly(w3.getStartX(), w2Bottom.x) && nearly(w3.getStartY(), w2Bottom.y)) ||
  (nearly(w3.getEndX(), w2Bottom.x) && nearly(w3.getEndY(), w2Bottom.y))

const w3OtherY =
  nearly(w3.getStartX(), w2Bottom.x) && nearly(w3.getStartY(), w2Bottom.y)
    ? w3.getEndY()
    : w3.getStartY()
const w3ExtendsNorth = w3OtherY < w2Bottom.y - 1

const onParty88 = (() => {
  const P = party.pointFromEnd('top', 88)
  const d0 = Math.hypot(w2.getStartX() - P.x, w2.getStartY() - P.y)
  const d1 = Math.hypot(w2.getEndX() - P.x, w2.getEndY() - P.y)
  return Math.min(d0, d1) < 0.1
})()

const results = {
  w2Length9ft4: nearly(w2LenIn, 112, 0.1),
  w2EastWest: w2.getAxis() === 'east-west',
  w2OnPartyAt88: onParty88,
  w3Length5ft: nearly(w3LenIn, 60, 0.1),
  w3NorthSouth: w3.getAxis() === 'north-south',
  w3ExteriorConcrete: w3.wallType === 'concrete' && w3.exposure === 'exterior',
  w3Thickness8: nearly(w3ThickIn, 8, 0.05),
  w3JoinedToW2Bottom: joinedToW2Bottom,
  w3ExtendsNorth,
  measured: {
    w2LenIn: +w2LenIn.toFixed(3),
    w3LenIn: +w3LenIn.toFixed(3),
    w3ThickIn: +w3ThickIn.toFixed(3),
    w2Axis: w2.getAxis(),
    w3Axis: w3.getAxis(),
    w2Bottom,
    w3OtherY: +w3OtherY.toFixed(3)
  }
}

console.log(results)
const ok = Object.entries(results)
  .filter(([k]) => k !== 'measured')
  .every(([, v]) => v === true)

if (!ok) {
  console.error('FAIL: W2/W3 spec')
  process.exit(1)
}
console.log('PASS: W2 9\'4" E–W @ W15/88"; W3 5\' N–S north from W2 bottom, exterior concrete 8"')
