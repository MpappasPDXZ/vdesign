/**
 * W6–W10 interior chain + save round-trip; former south turf is W13.
 */
import { Floorplan } from '../src/model/floorplan.ts'
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const project = JSON.parse(
  readFileSync(join(root, 'projects/2713-s-224th-basement/floorplan.json'), 'utf8')
)

const fp = new Floorplan()
fp.loadFloorplan(project.floorplan)
const walls = fp.getWalls()
const inch = (cm: number) => cm / 2.54
const nearly = (a: number, b: number, eps = 0.15) => Math.abs(a - b) < eps

const w5 = walls[4]
const w6 = walls[5]
const w7 = walls[6]
const w8 = walls[7]
const w9 = walls[8]
const w10 = walls[9]
const w13 = walls[12]

const w5Bottom = w5.getBottomPoint()
const w6Top = w6.getTopPoint()
const w6Bottom = w6.getBottomPoint()
const w7Top = w7.getTopPoint()
const w7Bottom = w7.getBottomPoint()
const w8Top = w8.getTopPoint()
const w8Bottom = w8.getBottomPoint()
const w9Top = w9.getTopPoint()
const w9Bottom = w9.getBottomPoint()

const joined = (
  a: { x: number; y: number },
  b: { x: number; y: number }
) => nearly(a.x, b.x) && nearly(a.y, b.y)

const results = {
  count15: walls.length === 15,
  w6Len42ft8: nearly(inch(w6.getLength()), 512),
  w6NS: w6.getAxis() === 'north-south',
  w6OnW5Bottom: joined(w6Top, w5Bottom),
  w7Len10ft10: nearly(inch(w7.getLength()), 130),
  w7EW: w7.getAxis() === 'east-west',
  w7OnW6Bottom: joined(w7Top, w6Bottom) || joined(w7Bottom, w6Bottom),
  w8Len3ft10: nearly(inch(w8.getLength()), 46),
  w8NS: w8.getAxis() === 'north-south',
  w8OnW7Bottom: joined(w8Top, w7Bottom) || joined(w8Bottom, w7Bottom),
  w9Len15ft4: nearly(inch(w9.getLength()), 184),
  w9EW: w9.getAxis() === 'east-west',
  w9OnW8South: joined(w9Bottom, w8Bottom) || joined(w9Top, w8Bottom),
  w10Len5ft8: nearly(inch(w10.getLength()), 68),
  w10NS: w10.getAxis() === 'north-south',
  w10OnW9West: joined(w10.getStartX() === w9Top.x ? { x: w10.getStartX(), y: w10.getStartY() } : { x: w10.getEndX(), y: w10.getEndY() }, w9Top) ||
    (nearly(w10.getStartX(), w9Top.x) && nearly(w10.getStartY(), w9Top.y)) ||
    (nearly(w10.getEndX(), w9Top.x) && nearly(w10.getEndY(), w9Top.y)),
  w6to10Concrete8: [w6, w7, w8, w9, w10].every(
    (w) => w.wallType === 'concrete' && w.exposure === 'exterior' && nearly(inch(w.thickness), 8, 0.05)
  ),
  formerSouthTurfIsW13: (w13.name || '').includes('south turf') || nearly(inch(w13.getLength()), 258, 1),
  measured: {
    w6: +inch(w6.getLength()).toFixed(2),
    w7: +inch(w7.getLength()).toFixed(2),
    w8: +inch(w8.getLength()).toFixed(2),
    w9: +inch(w9.getLength()).toFixed(2),
    w10: +inch(w10.getLength()).toFixed(2),
    w5Bottom,
    w6Bottom,
    w7Bottom,
    w8Bottom,
    w9Top
  }
}

const savePath = join(root, 'scripts/.tmp-w6-w10-save.json')
writeFileSync(savePath, JSON.stringify({ ...project, floorplan: fp.saveFloorplan() }))
const reloaded = JSON.parse(readFileSync(savePath, 'utf8'))
unlinkSync(savePath)
const fp2 = new Floorplan()
fp2.loadFloorplan(reloaded.floorplan)
const saveOk =
  fp2.getWalls().length === 15 &&
  nearly(fp2.getWalls()[5].getLength(), w6.getLength()) &&
  nearly(fp2.getWalls()[9].getLength(), w10.getLength())

console.log({ ...results, saveRoundTrip: saveOk })

const ok =
  Object.entries(results)
    .filter(([k]) => k !== 'measured')
    .every(([, v]) => v === true) && saveOk

if (!ok) {
  console.error('FAIL: W6–W10 spec')
  process.exit(1)
}
console.log('PASS: W6–W10 chain + W13 former south turf; save OK')
