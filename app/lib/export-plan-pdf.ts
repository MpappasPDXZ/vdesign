import { jsPDF } from 'jspdf'
import type { AreaLabel } from '@blueprint3d/floorplanner/area_label'
import type {
  EntranceScheduleEntry,
  FloorFinishSpec,
  VdesignProject,
  WallScheduleEntry
} from '@/types/project'

export type PlanPdfInput = {
  project: VdesignProject
  /** PNG data URL of the 2D plan (printable blueprint theme preferred) */
  planPngDataUrl?: string | null
  /** Optional PNG of the 3D viewport */
  view3dPngDataUrl?: string | null
  fileName?: string
}

const MARGIN = 48
const PAGE_W = 792 // landscape letter
const PAGE_H = 612
const CONTENT_W = PAGE_W - MARGIN * 2

function safeName(raw: string): string {
  return raw.replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'vdesign-plan'
}

function drawHeader(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(17, 24, 39)
  doc.text(title, MARGIN, MARGIN - 8)
  if (subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.text(subtitle, MARGIN, MARGIN + 6)
  }
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, MARGIN + 14, PAGE_W - MARGIN, MARGIN + 14)
}

function drawFooter(doc: jsPDF, page: number, total: number) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text(`vdesign  ·  page ${page} of ${total}`, PAGE_W / 2, PAGE_H - 18, { align: 'center' })
}

function fitImage(
  doc: jsPDF,
  dataUrl: string,
  x: number,
  y: number,
  maxW: number,
  maxH: number
) {
  const props = doc.getImageProperties(dataUrl)
  const ratio = Math.min(maxW / props.width, maxH / props.height)
  const w = props.width * ratio
  const h = props.height * ratio
  const ox = x + (maxW - w) / 2
  const oy = y + (maxH - h) / 2
  doc.addImage(dataUrl, 'PNG', ox, oy, w, h)
}

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text || '—', maxWidth) as string[]
}

function addCoverPage(doc: jsPDF, project: VdesignProject) {
  const meta = project.meta || {}
  const title = meta.name || 'Floor Plan'
  const level = meta.level || meta.levelId || ''
  const address = meta.address || ''
  const walls = project.floorplan?.walls?.length ?? 0
  const items = project.items?.length ?? 0
  const entrances = project.entrances?.length ?? 0
  const areas = project.areas?.length ?? 0
  const finishes = project.floorFinishes?.length ?? 0

  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, PAGE_W, PAGE_H, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(17, 24, 39)
  doc.text(title, MARGIN, 120)

  if (address) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(12)
    doc.setTextColor(71, 85, 105)
    doc.text(address, MARGIN, 148)
  }

  doc.setFontSize(11)
  doc.setTextColor(100, 116, 139)
  const when = new Date().toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
  doc.text([level && `Level: ${level}`, `Exported: ${when}`].filter(Boolean).join('   ·   '), MARGIN, 172)

  const stats: Array<[string, string]> = [
    ['Walls', String(walls)],
    ['Items', String(items)],
    ['Entrances', String(entrances)],
    ['Areas', String(areas)],
    ['Floor finishes', String(finishes)],
    ['Schedule rows', String(project.wallSchedule?.length ?? 0)]
  ]

  let y = 220
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.6)
  for (const [label, value] of stats) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(label, MARGIN, y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(17, 24, 39)
    doc.text(value, MARGIN + 140, y)
    doc.line(MARGIN, y + 8, MARGIN + 220, y + 8)
    y += 28
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(148, 163, 184)
  doc.text('Printable plan · wall schedule · openings · finishes · 3D view', MARGIN, PAGE_H - 40)
}

function addPlanPage(doc: jsPDF, project: VdesignProject, planPng: string) {
  const meta = project.meta || {}
  drawHeader(
    doc,
    'Floor plan',
    [meta.name, meta.level].filter(Boolean).join(' · ') || undefined
  )
  const top = MARGIN + 28
  const boxH = PAGE_H - top - 36
  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.8)
  doc.rect(MARGIN, top, CONTENT_W, boxH)
  fitImage(doc, planPng, MARGIN + 4, top + 4, CONTENT_W - 8, boxH - 8)
}

function addTablePage(
  doc: jsPDF,
  title: string,
  subtitle: string | undefined,
  headers: string[],
  colWidths: number[],
  rows: string[][]
) {
  drawHeader(doc, title, subtitle)
  let y = MARGIN + 28
  const rowH = 16
  const startX = MARGIN

  const drawRow = (cells: string[], header: boolean) => {
    let x = startX
    if (header) {
      doc.setFillColor(241, 245, 249)
      doc.rect(startX, y - 11, CONTENT_W, rowH, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(51, 65, 85)
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(17, 24, 39)
    }
    cells.forEach((cell, i) => {
      const lines = wrapText(doc, cell, colWidths[i] - 6)
      doc.text(lines[0] || '—', x + 3, y)
      x += colWidths[i]
    })
    doc.setDrawColor(226, 232, 240)
    doc.line(startX, y + 5, startX + CONTENT_W, y + 5)
    y += rowH
  }

  drawRow(headers, true)
  for (const row of rows) {
    if (y > PAGE_H - 40) {
      doc.addPage([PAGE_W, PAGE_H], 'landscape')
      drawHeader(doc, title, `${subtitle || ''} (continued)`.trim())
      y = MARGIN + 28
      drawRow(headers, true)
    }
    drawRow(row, false)
  }
}

function wallRows(schedule: WallScheduleEntry[]): string[][] {
  return schedule
    .slice()
    .sort((a, b) => a.n - b.n)
    .map((w) => [
      String(w.n),
      w.name || w.role || '—',
      w.outerLength || '—',
      w.thickness || '—',
      w.wallType || '—',
      w.exposure || '—',
      w.connectsToWall != null ? `#${w.connectsToWall}` : '—',
      (w.notes || '').slice(0, 48) || '—'
    ])
}

function entranceRows(entrances: EntranceScheduleEntry[]): string[][] {
  return entrances.map((e) => [
    String(e.n),
    e.kind || '—',
    e.name || '—',
    e.wallN != null ? `#${e.wallN}` : '—',
    e.widthInches != null ? `${e.widthInches}"` : '—',
    e.heightInches != null ? `${e.heightInches}"` : '—',
    e.offsetInches != null ? `${e.offsetInches}"` : '—',
    (e.notes || '').slice(0, 40) || '—'
  ])
}

function areaRows(areas: AreaLabel[]): string[][] {
  return areas.map((a) => [
    a.name || '—',
    a.xCm != null ? `${(a.xCm / 2.54).toFixed(1)}"` : '—',
    a.yCm != null ? `${(a.yCm / 2.54).toFixed(1)}"` : '—'
  ])
}

function finishRows(finishes: FloorFinishSpec[]): string[][] {
  return finishes.map((f) => [
    f.area || '—',
    f.notes || '—',
    f.url ? f.url.split('/').pop() || f.url : '—',
    f.scale != null ? String(f.scale) : '—'
  ])
}

/**
 * Build and download a multi-page landscape PDF of the active plan.
 */
export function exportPlanPdf(input: PlanPdfInput): { pages: number; fileName: string } {
  const { project, planPngDataUrl, view3dPngDataUrl } = input
  const meta = project.meta || {}
  const base = safeName(String(meta.name || input.fileName || 'vdesign-plan'))
  const levelSlug = meta.levelId || meta.level || ''
  const fileName = `${base}${levelSlug ? `-${safeName(String(levelSlug))}` : ''}.pdf`

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' })
  const pages: Array<() => void> = []

  pages.push(() => addCoverPage(doc, project))

  if (planPngDataUrl) {
    pages.push(() => {
      doc.addPage([PAGE_W, PAGE_H], 'landscape')
      addPlanPage(doc, project, planPngDataUrl)
    })
  }

  if (view3dPngDataUrl) {
    pages.push(() => {
      doc.addPage([PAGE_W, PAGE_H], 'landscape')
      drawHeader(doc, '3D view', meta.name || undefined)
      const top = MARGIN + 28
      const boxH = PAGE_H - top - 36
      doc.setDrawColor(226, 232, 240)
      doc.rect(MARGIN, top, CONTENT_W, boxH)
      fitImage(doc, view3dPngDataUrl, MARGIN + 4, top + 4, CONTENT_W - 8, boxH - 8)
    })
  }

  const schedule = project.wallSchedule || []
  if (schedule.length) {
    pages.push(() => {
      doc.addPage([PAGE_W, PAGE_H], 'landscape')
      addTablePage(
        doc,
        'Wall schedule',
        `${schedule.length} walls`,
        ['#', 'Name / role', 'Length', 'Thick', 'Type', 'Exposure', 'Connect', 'Notes'],
        [28, 180, 70, 50, 70, 60, 55, 183],
        wallRows(schedule)
      )
    })
  }

  const entrances = project.entrances || []
  if (entrances.length) {
    pages.push(() => {
      doc.addPage([PAGE_W, PAGE_H], 'landscape')
      addTablePage(
        doc,
        'Entrances',
        `${entrances.length} openings`,
        ['#', 'Kind', 'Name', 'Wall', 'Width', 'Height', 'Offset', 'Notes'],
        [28, 55, 160, 45, 55, 55, 55, 243],
        entranceRows(entrances)
      )
    })
  }

  const areas = project.areas || []
  const finishes = project.floorFinishes || []
  if (areas.length || finishes.length) {
    pages.push(() => {
      doc.addPage([PAGE_W, PAGE_H], 'landscape')
      if (areas.length) {
        addTablePage(
          doc,
          'Areas',
          undefined,
          ['Name', 'X', 'Y'],
          [280, 120, 120],
          areaRows(areas)
        )
      }
      if (finishes.length) {
        if (areas.length) {
          doc.addPage([PAGE_W, PAGE_H], 'landscape')
        }
        addTablePage(
          doc,
          'Floor finishes',
          undefined,
          ['Area', 'Notes', 'Texture', 'Scale'],
          [140, 280, 200, 76],
          finishRows(finishes)
        )
      }
    })
  }

  // First page already created by constructor — run page 0, then the rest
  const total = pages.length
  pages[0]()
  for (let i = 1; i < pages.length; i++) pages[i]()

  // Footers after all pages exist
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    drawFooter(doc, i, pageCount)
  }

  // Silence unused — total used for clarity in callers
  void total

  doc.save(fileName)
  return { pages: pageCount, fileName }
}
