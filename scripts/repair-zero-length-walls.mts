/**
 * Repair collapsed W3/W9 in basement seed and re-place chain W3–W10.
 */
import { Floorplan } from '../src/model/floorplan.ts'
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = join(root, 'projects/2713-s-224th-basement/floorplan.json')
const pub = join(root, 'app/public/projects/2713-s-224th-basement/floorplan.json')
const project = JSON.parse(readFileSync(src, 'utf8'))

const fp = new Floorplan()
fp.loadFloorplan(project.floorplan)
const walls = fp.getWalls()
const w2 = walls[1]
const w3 = walls[2]
const w4 = walls[3]
const w5 = walls[4]
const w6 = walls[5]
const w7 = walls[6]
const w8 = walls[7]
const w9 = walls[8]
const w10 = walls[9]

const place = (w: (typeof walls)[0], host: (typeof walls)[0], tip: 'top' | 'bottom', dir: 'N' | 'E' | 'S' | 'W', inches: number) => {
  w.thickness = 8 * 2.54
  w.wallType = 'concrete'
  w.exposure = 'exterior'
  w.placeAgainstWall(host, 0, false, tip, dir, inches * 2.54)
}

place(w3, w2, 'bottom', 'N', 60)
place(w4, w3, 'top', 'E', 15 * 12 + 10)
place(w5, w4, 'bottom', 'S', 18 * 12 + 8)
place(w6, w5, 'bottom', 'S', 42 * 12 + 8)
place(w7, w6, 'bottom', 'E', 10 * 12 + 10)
place(w8, w7, 'bottom', 'S', 3 * 12 + 10)
place(w9, w8, 'bottom', 'W', 15 * 12 + 4)
place(w10, w9, 'top', 'N', 5 * 12 + 8)

const lens = walls.slice(0, 10).map((w, i) => ({
  n: i + 1,
  lenIn: +(w.getLength() / 2.54).toFixed(2),
  axis: w.getAxis(),
  zero: w.getStart() === w.getEnd()
}))
console.log(lens)
if (lens.some((r) => r.zero || r.lenIn < 0.5)) {
  console.error('FAIL: still have collapsed walls')
  process.exit(1)
}

// Canonical schedule keys for W2/W3
const s2 = project.wallSchedule.find((w: { n: number }) => w.n === 2)
Object.assign(s2, {
  fromEndInches: undefined,
  fromTopIn: undefined,
  fromEndIn: undefined,
  offsetInches: 88,
  offsetDir: 'S',
  connectsToWall: 15,
  connectsAt: 'N',
  extends: 'east'
})
delete s2.fromEndInches
delete s2.fromTopIn
delete s2.fromEndIn
delete s2.connectsTo

const s3 = project.wallSchedule.find((w: { n: number }) => w.n === 3)
Object.assign(s3, {
  outerLength: '60"',
  offsetInches: 0,
  fromEndInches: undefined,
  fromEndIn: undefined,
  connectsToWall: 2,
  connectsAt: 'bottom',
  extends: 'north'
})
delete s3.fromEndInches
delete s3.fromEndIn

project.floorplan = fp.saveFloorplan()
writeFileSync(src, JSON.stringify(project, null, 2) + '\n')
copyFileSync(src, pub)
console.log('PASS: repaired seeds', src, '→', pub)
