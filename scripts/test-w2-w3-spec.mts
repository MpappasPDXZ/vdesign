/**
 * Spec: W2 = 9'4" E–W off W10 @ 88"; W3 = 5' N–S on W2 free end, exterior concrete 8".
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
const w10 = walls[9]

const inch = (cm: number) => cm / 2.54
const nearly = (a: number, b: number, eps = 0.05) => Math.abs(a - b) < eps

const w2LenIn = inch(w2.getLength())
const w3LenIn = inch(w3.getLength())
const w3ThickIn = inch(w3.thickness)

const joined =
  (nearly(w2.getEndX(), w3.getStartX()) && nearly(w2.getEndY(), w3.getStartY())) ||
  (nearly(w2.getEndX(), w3.getEndX()) && nearly(w2.getEndY(), w3.getEndY())) ||
  (nearly(w2.getStartX(), w3.getStartX()) && nearly(w2.getStartY(), w3.getStartY())) ||
  (nearly(w2.getStartX(), w3.getEndX()) && nearly(w2.getStartY(), w3.getEndY()))

const onParty88 = (() => {
  const P = w10.pointFromTop(88)
  const d0 = Math.hypot(w2.getStartX() - P.x, w2.getStartY() - P.y)
  const d1 = Math.hypot(w2.getEndX() - P.x, w2.getEndY() - P.y)
  return Math.min(d0, d1) < 0.1
})()

const results = {
  w2Length9ft4: nearly(w2LenIn, 112, 0.1),
  w2EastWest: w2.getAxis() === 'east-west',
  w2OnW10at88: onParty88,
  w3Length5ft: nearly(w3LenIn, 60, 0.1),
  w3NorthSouth: w3.getAxis() === 'north-south',
  w3ExteriorConcrete: w3.wallType === 'concrete' && w3.exposure === 'exterior',
  w3Thickness8: nearly(w3ThickIn, 8, 0.05),
  w3JoinedToW2: joined,
  measured: {
    w2LenIn: +w2LenIn.toFixed(3),
    w3LenIn: +w3LenIn.toFixed(3),
    w3ThickIn: +w3ThickIn.toFixed(3),
    w2Axis: w2.getAxis(),
    w3Axis: w3.getAxis()
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
console.log('PASS: W2 9\'4" E–W @ W10/88"; W3 5\' N–S exterior concrete 8" on W2')
