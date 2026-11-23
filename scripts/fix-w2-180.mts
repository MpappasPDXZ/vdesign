import { Floorplan } from '../src/model/floorplan.ts'
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const path = join(root, 'projects/2713-s-224th-basement/floorplan.json')
const project = JSON.parse(readFileSync(path, 'utf8'))
const fp = new Floorplan()
fp.loadFloorplan(project.floorplan)
const walls = fp.getWalls()
const w2 = walls[1]
const w15 = walls[14]

w2.thickness = 8 * 2.54
w2.wallType = 'concrete'
w2.exposure = 'exterior'
w2.name = 'basement #2 stub off party, exterior wall'
w2.setLength(180 * 2.54)
w2.placeAgainstWall(w15, 88, false, 'top', 'E')

const w3 = walls[2]
const w4 = walls[3]
const w5 = walls[4]
w3.setLength(60 * 2.54)
w3.thickness = 8 * 2.54
w3.placeAgainstWall(w2, 0, false, 'bottom', 'N')
w4.setLength((15 * 12 + 10) * 2.54)
w4.thickness = 8 * 2.54
w4.placeAgainstWall(w3, 0, false, 'top', 'E')
w5.setLength((18 * 12 + 8) * 2.54)
w5.thickness = 8 * 2.54
w5.placeAgainstWall(w4, 0, false, 'bottom', 'S')

const w6 = walls[5]
const w7 = walls[6]
const w8 = walls[7]
const w9 = walls[8]
const w10 = walls[9]
w6.setLength((42 * 12 + 8) * 2.54)
w6.placeAgainstWall(w5, 0, false, 'bottom', 'S')
w7.setLength((10 * 12 + 10) * 2.54)
w7.placeAgainstWall(w6, 0, false, 'bottom', 'E')
w8.setLength((3 * 12 + 10) * 2.54)
w8.placeAgainstWall(w7, 0, false, 'bottom', 'S')
w9.setLength((15 * 12 + 4) * 2.54)
w9.placeAgainstWall(w8, 0, false, 'bottom', 'W')
w10.setLength((5 * 12 + 8) * 2.54)
w10.placeAgainstWall(w9, 0, false, 'top', 'N')

const P = w15.pointFromEnd('top', 88)
const d = Math.min(
  Math.hypot(w2.getStartX() - P.x, w2.getStartY() - P.y),
  Math.hypot(w2.getEndX() - P.x, w2.getEndY() - P.y)
)
console.log({
  w2LenIn: +(w2.getLength() / 2.54).toFixed(2),
  w2ThickIn: +(w2.thickness / 2.54).toFixed(2),
  distTo88: +d.toFixed(3),
  east: w2.getEndX() > w2.getStartX(),
  w3NS: w3.getAxis() === 'north-south'
})

project.floorplan = fp.saveFloorplan()
const s2 = project.wallSchedule.find((w: { n: number }) => w.n === 2)
Object.assign(s2, {
  outerLength: '180"',
  thickness: '8"',
  wallType: 'concrete',
  exposure: 'exterior',
  orientation: 'east-west',
  connectsTo: 15,
  connectsToWall: 15,
  connectsAt: 'N',
  fromEndInches: 88,
  fromTopIn: 88,
  extends: 'east',
  notes: 'E–W 180" from party W15 at 88" from north tip; 8" concrete exterior'
})
writeFileSync(path, JSON.stringify(project, null, 2) + '\n')
copyFileSync(path, join(root, 'app/public/projects/2713-s-224th-basement/floorplan.json'))
console.log('W2 seed fixed to 180" @ W15/88" N → E')
