/**
 * Insert a wall after #4 (index 3): new becomes #5, old #5+ shift up; shares W4 bottom corner.
 */
import { Floorplan } from '../src/model/floorplan.ts'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const project = JSON.parse(
  readFileSync(join(root, 'projects/2713-s-224th-basement/floorplan.json'), 'utf8')
)

function insertWallScheduleEntry(
  schedule: { n: number; role: string }[],
  afterN: number,
  entry: { role: string }
) {
  const sorted = [...schedule].sort((a, b) => a.n - b.n)
  const insertAt = Math.max(0, Math.min(sorted.length, afterN))
  const next = [
    ...sorted.slice(0, insertAt),
    { ...entry, n: insertAt + 1 },
    ...sorted.slice(insertAt)
  ]
  return next.map((e, i) => ({ ...e, n: i + 1 }))
}

const fp = new Floorplan()
fp.loadFloorplan(project.floorplan)
const before = fp.getWalls().length
const w4 = fp.getWalls()[3]
const w4Bottom = w4.getBottomPoint()
const oldW5Len = fp.getWalls()[4].getLength()

const inserted = fp.insertWallAfter(3) // after W4 → new #5
const walls = fp.getWalls()

const nearly = (a: number, b: number, eps = 0.08) => Math.abs(a - b) < eps
const inch = (cm: number) => cm / 2.54

const startOnW4Bottom =
  (nearly(inserted.getStartX(), w4Bottom.x) && nearly(inserted.getStartY(), w4Bottom.y)) ||
  (nearly(inserted.getEndX(), w4Bottom.x) && nearly(inserted.getEndY(), w4Bottom.y))

const sharesCorner =
  inserted.getStart() === w4.getStart() ||
  inserted.getStart() === w4.getEnd() ||
  inserted.getEnd() === w4.getStart() ||
  inserted.getEnd() === w4.getEnd()

const results = {
  countWas15: before === 15,
  countNow16: walls.length === 16,
  insertedIsIndex4: walls[4] === inserted,
  oldW5ShiftedTo6: nearly(walls[5].getLength(), oldW5Len),
  defaultLen8ft: nearly(inch(inserted.getLength()), 96, 0.2),
  extendsSouth: inserted.getAxis() === 'north-south' && inserted.getEndY() > inserted.getStartY(),
  startOnW4Bottom,
  sharesCorner,
  inheritsConcrete: inserted.wallType === 'concrete',
  inheritsExterior: inserted.exposure === 'exterior'
}

const sched = insertWallScheduleEntry(
  (project.wallSchedule || []).map((e: { n: number; role: string }) => ({
    n: e.n,
    role: e.role
  })),
  4,
  { role: 'Inserted stub' }
)
const scheduleOk =
  sched.length === (project.wallSchedule?.length || 0) + 1 &&
  sched[4].role === 'Inserted stub' &&
  sched[4].n === 5 &&
  sched.every((e, i) => e.n === i + 1)

console.log({ ...results, scheduleOk, insertedName: inserted.name })

const ok = Object.values(results).every((v) => v === true) && scheduleOk
if (!ok) {
  console.error('FAIL: insert wall')
  process.exit(1)
}
console.log('PASS: insertWallAfter(#4) → new #5 south stub on W4 bottom; schedule renumbers')
