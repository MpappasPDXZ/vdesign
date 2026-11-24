'use client'

import Image from 'next/image'
import { X } from 'lucide-react'
import { FLOOR_TEXTURES, WALL_TEXTURES } from '@blueprint3d/constants'
import { useTranslations } from 'next-intl'
import { useIsMobile } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

interface TextureSelectorProps {
  type: 'floor' | 'wall' | null
  onTextureSelect: (textureUrl: string, stretch: boolean, scale: number) => void
  onClose?: () => void
}

export function TextureSelector({ type, onTextureSelect, onClose }: TextureSelectorProps) {
  const t = useTranslations('BluePrint.textureSelector')
  const isMobile = useIsMobile()

  if (!type) return null

  const textures = type === 'floor' ? FLOOR_TEXTURES : WALL_TEXTURES

  return (
    <div
      className={cn(
        'bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg',
        isMobile ? 'p-4 max-w-[280px]' : 'p-3 max-w-[240px]'
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3
          className={cn('font-semibold', isMobile ? 'text-base' : 'text-sm')}
          title={type === 'floor' ? t('adjustFloorHint') : undefined}
        >
          {type === 'floor' ? t('adjustFloor') : t('adjustWall')}
        </h3>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label={t('close')}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className={cn('grid grid-cols-2', isMobile ? 'gap-3' : 'gap-2')}>
        {textures.map((texture, index) => (
          <button
            key={index}
            onClick={() => onTextureSelect(texture.url, texture.stretch, texture.scale)}
            className={cn(
              'relative aspect-square border-2 border-border rounded-md hover:border-primary transition-all overflow-hidden active:scale-95',
              isMobile ? 'min-h-[60px]' : 'hover:scale-105'
            )}
          >
            <Image
              src={texture.thumbnail}
              alt={texture.name}
              fill
              sizes={isMobile ? '120px' : '100px'}
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
