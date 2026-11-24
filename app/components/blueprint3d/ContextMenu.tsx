'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { useTranslations } from 'next-intl'
import { useIsMobile } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'
import type { Item } from '@blueprint3d/items/item'
import { isFloorItemType } from './ItemMovePanel'
import { Configuration, configDimUnit } from '@blueprint3d/core/configuration'

interface ContextMenuProps {
  selectedItem: Item | null
  onDelete: () => void
  onResize: (height: number, width: number, depth: number) => void
  onFixedChange: (fixed: boolean) => void
  /** After N/E/S/W nudge or angle apply — e.g. force 3D redraw. */
  onMoved?: () => void
}

const NUDGE_IN = 6

export function ContextMenu({
  selectedItem,
  onDelete,
  onResize,
  onFixedChange,
  onMoved
}: ContextMenuProps) {
  const t = useTranslations('BluePrint.contextMenu')
  const tItems = useTranslations('BluePrint.items')
  const isMobile = useIsMobile()
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [depth, setDepth] = useState(0)
  const [fixed, setFixed] = useState(false)
  const [currentUnit, setCurrentUnit] = useState('inch')
  const [angle, setAngle] = useState('0')

  const cmToDisplay = (cm: number, unit: string): number => {
    switch (unit) {
      case 'inch':
        return cm / 2.54
      case 'm':
        return cm / 100
      case 'cm':
        return cm
      case 'mm':
        return cm * 10
      default:
        return cm / 2.54
    }
  }

  const displayToCm = (value: number, unit: string): number => {
    switch (unit) {
      case 'inch':
        return value * 2.54
      case 'm':
        return value * 100
      case 'cm':
        return value
      case 'mm':
        return value / 10
      default:
        return value * 2.54
    }
  }

  const getUnitLabel = (unit: string): string => {
    switch (unit) {
      case 'inch':
        return t('units.inches')
      case 'm':
        return t('units.meters')
      case 'cm':
        return t('units.centimeters')
      case 'mm':
        return t('units.millimeters')
      default:
        return t('units.inches')
    }
  }

  const getDecimalPlaces = (unit: string): number => {
    switch (unit) {
      case 'inch':
        return 0
      case 'm':
        return 2
      case 'cm':
        return 1
      case 'mm':
        return 0
      default:
        return 0
    }
  }

  useEffect(() => {
    const unit = Configuration.getStringValue(configDimUnit)
    setCurrentUnit(unit)

    if (selectedItem) {
      const decimals = getDecimalPlaces(unit)
      setWidth(Number(cmToDisplay(selectedItem.getWidth(), unit).toFixed(decimals)))
      setHeight(Number(cmToDisplay(selectedItem.getHeight(), unit).toFixed(decimals)))
      setDepth(Number(cmToDisplay(selectedItem.getDepth(), unit).toFixed(decimals)))
      setFixed(selectedItem.fixed || false)
      setAngle(radToDeg(selectedItem.rotation.y))
    }
  }, [selectedItem])

  const handleResize = (field: 'width' | 'height' | 'depth', value: number) => {
    if (field === 'width') setWidth(value)
    if (field === 'height') setHeight(value)
    if (field === 'depth') setDepth(value)

    const newWidth = field === 'width' ? value : width
    const newHeight = field === 'height' ? value : height
    const newDepth = field === 'depth' ? value : depth

    onResize(
      displayToCm(newHeight, currentUnit),
      displayToCm(newWidth, currentUnit),
      displayToCm(newDepth, currentUnit)
    )
  }

  const handleFixedChange = (checked: boolean) => {
    setFixed(checked)
    onFixedChange(checked)
  }

  const nudge = (dir: 'N' | 'E' | 'S' | 'W') => {
    if (!selectedItem || fixed) return
    const cm = NUDGE_IN * 2.54
    const next = selectedItem.position.clone()
    if (dir === 'N') next.z -= cm
    else if (dir === 'S') next.z += cm
    else if (dir === 'E') next.x += cm
    else next.x -= cm
    selectedItem.moveToPosition(next, null)
    onMoved?.()
  }

  const applyAngle = () => {
    if (!selectedItem || fixed) return
    const n = Number(angle)
    if (!Number.isFinite(n)) return
    const wrapped = ((n % 360) + 360) % 360
    selectedItem.rotation.y = (wrapped * Math.PI) / 180
    setAngle(String(Math.round(wrapped)))
    onMoved?.()
  }

  if (!selectedItem || typeof document === 'undefined') {
    return null
  }

  const showMove = isFloorItemType(selectedItem) && !fixed

  return createPortal(
    <div
      className={cn(
        'fixed right-3 top-14 z-[70] bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg',
        'animate-in fade-in-0 slide-in-from-right-5 duration-300',
        isMobile ? 'p-4 w-[min(320px,calc(100vw-1.5rem))]' : 'p-3 w-[280px]'
      )}
      title={selectedItem.metadata?.itemName || ''}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={cn('font-semibold truncate', isMobile ? 'text-base' : 'text-sm')}>
          {selectedItem.metadata?.itemKey
            ? tItems(selectedItem.metadata.itemKey)
            : selectedItem.metadata?.itemName}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0',
            isMobile ? 'h-9 w-9' : 'h-7 w-7'
          )}
          onClick={onDelete}
        >
          <Trash2 className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
        </Button>
      </div>

      <div className={cn('mb-3', isMobile ? 'space-y-3' : 'space-y-2')}>
        <div className={cn('grid grid-cols-3 text-xs', isMobile ? 'gap-3' : 'gap-2')}>
          <div>
            <label
              className={cn('text-muted-foreground mb-1 block', isMobile && 'text-sm')}
              title={getUnitLabel(currentUnit)}
            >
              {t('width')}
            </label>
            <Input
              type="number"
              value={width}
              onChange={(e) => handleResize('width', Number(e.target.value))}
              className={cn(isMobile ? 'h-10 text-sm' : 'h-8 text-xs')}
              step={currentUnit === 'm' ? '0.01' : '1'}
            />
          </div>
          <div>
            <label
              className={cn('text-muted-foreground mb-1 block', isMobile && 'text-sm')}
              title={getUnitLabel(currentUnit)}
            >
              {t('depth')}
            </label>
            <Input
              type="number"
              value={depth}
              onChange={(e) => handleResize('depth', Number(e.target.value))}
              className={cn(isMobile ? 'h-10 text-sm' : 'h-8 text-xs')}
              step={currentUnit === 'm' ? '0.01' : '1'}
            />
          </div>
          <div>
            <label
              className={cn('text-muted-foreground mb-1 block', isMobile && 'text-sm')}
              title={getUnitLabel(currentUnit)}
            >
              {t('height')}
            </label>
            <Input
              type="number"
              value={height}
              onChange={(e) => handleResize('height', Number(e.target.value))}
              className={cn(isMobile ? 'h-10 text-sm' : 'h-8 text-xs')}
              step={currentUnit === 'm' ? '0.01' : '1'}
            />
          </div>
        </div>
      </div>

      {showMove && (
        <div
          className="mb-3 border-t border-border/60 pt-3"
          title="Nudge on the plan, or type yaw 0–360. Drag the item in 3D to move freely."
        >
          <div className="mb-1.5 text-xs font-medium text-foreground">
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-blue-500 align-middle" />
            Move
          </div>
          <div className="grid grid-cols-3 gap-1 place-items-center">
            <span />
            <Button type="button" variant="outline" size="sm" className="h-7 w-9 px-0" onClick={() => nudge('N')}>
              N
            </Button>
            <span />
            <Button type="button" variant="outline" size="sm" className="h-7 w-9 px-0" onClick={() => nudge('W')}>
              W
            </Button>
            <span className="h-3 w-3 rounded-full bg-blue-500 shadow" aria-hidden />
            <Button type="button" variant="outline" size="sm" className="h-7 w-9 px-0" onClick={() => nudge('E')}>
              E
            </Button>
            <span />
            <Button type="button" variant="outline" size="sm" className="h-7 w-9 px-0" onClick={() => nudge('S')}>
              S
            </Button>
            <span />
          </div>
          <label
            className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"
            title="Yaw degrees: 0 faces +Z (south), 90 faces +X (east)"
          >
            <span className="shrink-0">Angle</span>
            <Input
              type="number"
              min={0}
              max={360}
              step={1}
              value={angle}
              onChange={(e) => setAngle(e.target.value)}
              onBlur={applyAngle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                  applyAngle()
                }
              }}
              className="h-7 text-xs"
            />
          </label>
        </div>
      )}

      <label
        className={cn(
          'flex items-center gap-2 cursor-pointer rounded-md transition-colors',
          isMobile ? 'py-2 px-3 min-h-[44px]' : 'py-1.5 px-2 hover:bg-accent'
        )}
      >
        <Checkbox
          checked={fixed}
          onCheckedChange={handleFixedChange}
          className={cn(isMobile ? 'h-5 w-5' : 'h-4 w-4')}
        />
        <span className={cn('select-none', isMobile ? 'text-sm' : 'text-xs')}>
          {t('lockInPlace')}
        </span>
      </label>
    </div>,
    document.body
  )
}

function radToDeg(rad: number): string {
  return String(Math.round(((((rad * 180) / Math.PI) % 360) + 360) % 360))
}
