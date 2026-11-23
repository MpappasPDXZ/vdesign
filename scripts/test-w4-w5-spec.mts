/**
 * W4: 15'10" E–W east from top of W3; W5: 18'8" N–S south from bottom (east) of W4.
 * Also exercises placeAgainstWall top/bottom + save payload shape.
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
const w3 = walls[2]
const w4 = walls[3]
const w5 = walls[4]

const inch = (cm: number) => cm / 2.54
const nearly = (a: number, b: number, eps = 0.08) => Math.abs(a - b) < eps

const w3Top = w3.getTopPoint()
const w4Top = w4.getTopPoint()
const w4Bottom = w4.getBottomPoint()

// East-extending W4: top (west) on W3 top; bottom (east) free for W5
const w4TopOnW3Top = nearly(w4Top.x, w3Top.x) && nearly(w4Top.y, w3Top.y)
const w4ExtendsEast = w4Bottom.x > w4Top.x + 1

const w5OnW4Bottom =
  (nearly(w5.getStartX(), w4Bottom.x) && nearly(w5.getStartY(), w4Bottom.y)) ||
  (nearly(w5.getEndX(), w4Bottom.x) && nearly(w5.getEndY(), w4Bottom.y))

const w5OtherY =
  nearly(w5.getStartX(), w4Bottom.x) && nearly(w5.getStartY(), w4Bottom.y)
    ? w5.getEndY()
    : w5.getStartY()
const w5ExtendsSouth = w5OtherY > w4Bottom.y + 1

const results = {
  w4Length15ft10: nearly(inch(w4.getLength()), 190, 0.15),
  w4EastWest: w4.getAxis() === 'east-west',
  w4ConcreteExterior: w4.wallType === 'concrete' && w4.exposure === 'exterior',
  w4Thick8: nearly(inch(w4.thickness), 8, 0.05),
  w4TopOnW3Top,
  w4ExtendsEast,
  w5Length18ft8: nearly(inch(w5.getLength()), 224, 0.15),
  w5NorthSouth: w5.getAxis() === 'north-south',
  w5ConcreteExterior: w5.wallType === 'concrete' && w5.exposure === 'exterior',
  w5Thick8: nearly(inch(w5.thickness), 8, 0.05),
  w5OnW4Bottom,
  w5ExtendsSouth,
  measured: {
    w4LenIn: +inch(w4.getLength()).toFixed(3),
    w5LenIn: +inch(w5.getLength()).toFixed(3),
    w3Top,
    w4Top,
    w4Bottom
  }
}

// Place API: rebuild chain from a north-edge start to prove Top·0 placements
const fp2 = new Floorplan()
const c0 = fp2.newCorner(0, 0)
const c1 = fp2.newCorner(100, 0)
const c2 = fp2.newCorner(100, -152.4) // N-S 5' north
fp2.newWall(c0, c1)
const t3 = fp2.newWall(c2, c1)
t3.setAxis('north-south')
const t4 = fp2.newWall(fp2.newCorner(200, -152.4), fp2.newCorner(200 + 482.6, -152.4))
t4.placeAgainstWall(t3, 0, false, 'top', 'E')
const pTop = t3.pointFromEnd('top', 0)
const pBot = t3.pointFromEnd('bottom', 0)
const placeApi = {
  topIsNorth: pTop.y < pBot.y,
  topZeroIsEndpoint: nearly(pTop.x, c2.x) && nearly(pTop.y, c2.y),
  placedEast:
    nearly(t4.getStartX(), pTop.x) &&
    nearly(t4.getStartY(), pTop.y) &&
    t4.getEndX() > t4.getStartX() + 1
}

// Save payload shape (recovery JSON)
const savePath = join(root, 'scripts/.tmp-w4-w5-save.json')
const savePayload = {
  ...project,
  floorplan: fp.saveFloorplan(),
  meta: { ...(project.meta || {}), savedBy: 'test-w4-w5-spec' }
}
writeFileSync(savePath, JSON.stringify(savePayload))
const reloaded = JSON.parse(readFileSync(savePath, 'utf8'))
unlinkSync(savePath)
const fp3 = new Floorplan()
fp3.loadFloorplan(reloaded.floorplan)
const saveOk =
  nearly(fp3.getWalls()[3].getLength(), w4.getLength()) &&
  nearly(fp3.getWalls()[4].getLength(), w5.getLength())

console.log({ ...results, placeApi, saveRoundTrip: saveOk })

const ok =
  Object.entries(results)
    .filter(([k]) => k !== 'measured')
    .every(([, v]) => v === true) &&
  placeApi.topIsNorth &&
  placeApi.topZeroIsEndpoint &&
  placeApi.placedEast &&
  saveOk

if (!ok) {
  console.error('FAIL: W4/W5 spec')
  process.exit(1)
}
console.log(
  'PASS: W4 15\'10" E–W east from W3 top; W5 18\'8" N–S from W4 bottom; save round-trip OK'
)
