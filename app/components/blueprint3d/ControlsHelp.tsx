'use client'

import { useState } from 'react'
import { HelpCircle, X, Hand, Move, ZoomIn, RotateCw, MousePointer2, Pencil, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-media-query"
import { isPlanView, type ViewMode } from '@/types/view-mode'

interface ControlsHelpProps {
  className?: string
  viewMode?: ViewMode
}

/**
 * Persistent floating help button showing control hints
 * Always visible in bottom-right corner
 */
export function ControlsHelp({ className, viewMode = '3d' }: ControlsHelpProps) {
  const [isOpen, setIsOpen] = useState(false)
  const isMobile = useIsMobile()
  const plan = isPlanView(viewMode)

  const toggleHelp = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Floating Help Button */}
      <Button
        onClick={toggleHelp}
        className={cn(
          'fixed bottom-5 right-5 z-[80] rounded-full shadow-lg',
          'hover:scale-110 transition-transform duration-200',
          isMobile ? 'h-14 w-14' : 'h-12 w-12',
          className
        )}
        variant="default"
        size="icon"
        aria-label="Show controls help"
      >
        <HelpCircle className={cn(isMobile ? 'h-7 w-7' : 'h-6 w-6')} />
      </Button>

      {/* Help Modal */}
      {isOpen && (
        <div
          className={cn(
            'fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm',
            'animate-in fade-in duration-300'
          )}
          onClick={toggleHelp}
        >
          <div
            className={cn(
              'relative max-w-md w-full mx-4 bg-card rounded-lg shadow-2xl',
              'animate-in zoom-in-95 duration-300',
              isMobile ? 'max-h-[80vh] overflow-y-auto' : ''
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className={cn('font-semibold', isMobile ? 'text-xl' : 'text-lg')}>
                {viewMode === 'blueprint'
                  ? 'Blueprint View Controls'
                  : plan
                    ? '2D Floorplanner Controls'
                    : '3D Viewer Controls'}
              </h2>
              <Button
                onClick={toggleHelp}
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Content */}
            <div className={cn('p-6 space-y-6', isMobile ? 'text-base' : 'text-sm')}>
              {plan ? (
                <>
                  {/* 2D / Blueprint Floorplanner Controls */}
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Move className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Move Mode</h3>
                        <p className="text-muted-foreground text-sm">
                          Click and drag walls or corners to adjust room shape
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Pencil className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Draw Mode</h3>
                        <p className="text-muted-foreground text-sm">
                          Click to place new wall points. Press ESC to finish drawing.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Trash2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Delete Mode</h3>
                        <p className="text-muted-foreground text-sm">
                          Click on walls or corners to remove them
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ZoomIn className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">Zoom & Pan</h3>
                        <p className="text-muted-foreground text-sm">
                          {isMobile ? 'Pinch to zoom, drag with two fingers to pan' : 'Mouse wheel to zoom, middle-click drag to pan'}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* 3D Viewer Controls */}
                  {isMobile ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Hand className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">One Finger</h3>
                          <p className="text-muted-foreground text-sm">
                            Drag to rotate camera around the scene
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <ZoomIn className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Two Fingers</h3>
                          <p className="text-muted-foreground text-sm">
                            Pinch to zoom in and out
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Move className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Three Fingers</h3>
                          <p className="text-muted-foreground text-sm">
                            Drag to pan camera
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MousePointer2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Select (toolbar)</h3>
                          <p className="text-muted-foreground text-sm">
                            Turn on Select in the bottom bar, then tap a fixture to move or delete
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <RotateCw className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Left Click + Drag</h3>
                          <p className="text-muted-foreground">
                            Rotate camera around the scene
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <ZoomIn className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Mouse Wheel</h3>
                          <p className="text-muted-foreground">
                            Scroll to zoom in and out
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Move className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Right Click + Drag</h3>
                          <p className="text-muted-foreground">
                            Pan camera view
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MousePointer2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Select (toolbar)</h3>
                          <p className="text-muted-foreground">
                            Turn on Select in the bottom bar, then click a fixture to move or delete
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Footer Tip */}
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  {plan
                    ? 'Tip: Use 2D / Blueprint / 3D in the top-right toggle'
                    : 'Tip: Switch between 2D, Blueprint, and 3D using the toggle at the top right'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
