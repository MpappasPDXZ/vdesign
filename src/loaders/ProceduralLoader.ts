import * as THREE from 'three'

/**
 * Loads procedural placeholder geometry from URLs like:
 * procedural:box:WIDTH:HEIGHT:DEPTH:HEXCOLOR[:opacity]
 * Dimensions are centimeters (scene units).
 */
export class ProceduralLoader {
  load(
    url: string,
    onLoad: (geometry: THREE.BufferGeometry, materials: THREE.Material[]) => void,
    _onProgress?: (event: ProgressEvent) => void,
    onError?: (error: Error) => void
  ): void {
    try {
      const { geometry, materials } = this.build(url)
      onLoad(geometry, materials)
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      console.error('ProceduralLoader error:', err)
      onError?.(err)
    }
  }

  private build(url: string): {
    geometry: THREE.BufferGeometry
    materials: THREE.Material[]
  } {
    const parts = url.split(':')
    // procedural : box : w : h : d : color [: opacity]
    if (parts[0] !== 'procedural' || parts.length < 6) {
      throw new Error(`Invalid procedural URL: ${url}`)
    }

    const shape = parts[1]
    const width = parseFloat(parts[2])
    const height = parseFloat(parts[3])
    const depth = parseFloat(parts[4])
    const hex = parts[5].replace(/^#/, '')
    const opacity = parts[6] != null ? parseFloat(parts[6]) : 1

    if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
      throw new Error(`Invalid procedural dimensions: ${url}`)
    }

    const color = new THREE.Color(`#${hex}`)
    const transparent = opacity < 1

    let geometry: THREE.BufferGeometry
    switch (shape) {
      case 'cylinder': {
        const radius = Math.min(width, depth) / 2
        geometry = new THREE.CylinderGeometry(radius, radius, height, 24)
        break
      }
      case 'plane': {
        // Thin floor mat: width x depth on XZ, height as thickness
        geometry = new THREE.BoxGeometry(width, Math.max(height, 1), depth)
        break
      }
      case 'box':
      default:
        geometry = new THREE.BoxGeometry(width, height, depth)
        break
    }

    // Center box on floor (Y=0 at bottom) to match typical furniture GLBs after scale
    geometry.translate(0, height / 2, 0)
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()

    const material = new THREE.MeshPhongMaterial({
      color,
      specular: new THREE.Color(0x222222),
      shininess: 8,
      side: THREE.DoubleSide,
      transparent,
      opacity,
      depthWrite: !transparent
    })

    return { geometry, materials: [material] }
  }
}

export function isProceduralUrl(url: string): boolean {
  return url.toLowerCase().startsWith('procedural:')
}
