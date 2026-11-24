import * as THREE from 'three'

/**
 * Loads procedural placeholder geometry from URLs like:
 * procedural:box:WIDTH:HEIGHT:DEPTH:HEXCOLOR[:opacity]
 * procedural:smith:WIDTH:HEIGHT:DEPTH:HEXCOLOR — Blazzed-style smith / functional trainer
 * procedural:dbrack:WIDTH:HEIGHT:DEPTH:HEXCOLOR — multi-tier DB/KB rack
 * procedural:tread:WIDTH:HEIGHT:DEPTH:HEXCOLOR — Peloton-style treadmill (deck, rails, console)
 * procedural:bike:WIDTH:HEIGHT:DEPTH:HEXCOLOR — Peloton Bike+ (frame, flywheel, screen)
 * procedural:sauna:WIDTH:HEIGHT:DEPTH:HEXCOLOR — 3-person IR cabin + glass door + red light
 * procedural:plunge:WIDTH:HEIGHT:DEPTH:HEXCOLOR — NuRecover-style ice bath (rim, water, frame)
 * procedural:chiller:WIDTH:HEIGHT:DEPTH:HEXCOLOR — compact chiller Pro beside plunge
 * procedural:sofa:WIDTH:HEIGHT:DEPTH:HEXCOLOR — sofa run (cushions, arms, back)
 * procedural:lsofa:BOUND_W:HEIGHT:BOUND_D:ARM_D:HEXCOLOR — one congruent L-sectional
 *   Backs on +Z (south) and +X (east); open toward −X/−Z. ARM_D = seat depth both arms.
 * procedural:fridge:WIDTH:HEIGHT:DEPTH:HEXCOLOR — glass-front commercial fridge
 * procedural:cabinet:WIDTH:HEIGHT:DEPTH:HEXCOLOR — base/wall cabinet with doors + toe-kick
 * procedural:island:WIDTH:HEIGHT:DEPTH:HEXCOLOR — kitchen island base
 * procedural:counter:WIDTH:HEIGHT:DEPTH:HEXCOLOR — countertop slab with edge profile
 * procedural:bed:WIDTH:HEIGHT:DEPTH:HEXCOLOR — queen platform bed + headboard + pillows
 * procedural:dresser:WIDTH:HEIGHT:DEPTH:HEXCOLOR — dresser with drawer fronts
 * procedural:toilet:WIDTH:HEIGHT:DEPTH:HEXCOLOR — toilet bowl + tank + seat
 * procedural:vanity:WIDTH:HEIGHT:DEPTH:HEXCOLOR — floating vanity + stone top + sink + faucet
 * procedural:furnace:WIDTH:HEIGHT:DEPTH:HEXCOLOR — residential furnace cabinet
 * procedural:tv:WIDTH:HEIGHT:DEPTH:HEXCOLOR — flat-panel TV with bezel + mount
 * procedural:ustairs:WELL_W:WELL_D:FLIGHT_W:TOTAL_RISE:RISERS:HEXCOLOR
 * procedural:lscreen:WIDTH:HEIGHT:CUTOUT:TUBE:HEXCOLOR
 *   Letter-L screen: long foot on the ground, stem west, opening top-east (RH).
 * procedural:tannertee:BASE:HEIGHT:BASE:HEX — Tanner Tee (9.5″ base, 26–43″ stem)
 * procedural:ballbucket:DIA:HEIGHT:DIA:HEX — Scheels/Rawlings 6-gal (12″×17″) + pad lid
 * procedural:sumppit:DIA:DEPTH:DIA:HEX — open basement sump pit (rim + basin, no cover)
 * procedural:hitmat:WIDTH:HEIGHT:DEPTH:HEX — VEVOR-style 12×6 batting mat (turf + home plate + L/R boxes)
 * procedural:homeplate:WIDTH:HEIGHT:DEPTH:HEX — MLB 17″ pentagon (front −Z toward pitcher)
 * procedural:plyowall:FRAME_W:FRAME_H:FRAME_D:HEX — PLYO WALL Elite I-frame; 73×55 pad between uprights
 * procedural:batrack:WIDTH:HEIGHT:DEPTH:HEX — wall-mounted bat rack with bats
 * procedural:cagenet:WIDTH:HEIGHT:DEPTH:HEX[:opacity] — sparse see-through baseball netting
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
    if (parts[0] !== 'procedural' || parts.length < 6) {
      throw new Error(`Invalid procedural URL: ${url}`)
    }

    const shape = parts[1]
    let opacity = 1
    let hex = '888888'
    let geometry: THREE.BufferGeometry
    let materialsOverride: THREE.Material[] | null = null

    switch (shape) {
      case 'ustairs': {
        // procedural:ustairs:WELL_W:WELL_D:FLIGHT_W:TOTAL_RISE:RISERS:HEX
        if (parts.length < 8) {
          throw new Error(`Invalid ustairs URL: ${url}`)
        }
        const wellW = parseFloat(parts[2])
        const wellD = parseFloat(parts[3])
        const flightW = parseFloat(parts[4])
        const totalRise = parseFloat(parts[5])
        const risers = Math.max(4, Math.round(parseFloat(parts[6])))
        hex = parts[7].replace(/^#/, '')
        if ([wellW, wellD, flightW, totalRise].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid ustairs dimensions: ${url}`)
        }
        geometry = buildUStairsGeometry(wellW, wellD, flightW, totalRise, risers)
        break
      }
      case 'lscreen': {
        // procedural:lscreen:WIDTH:HEIGHT:CUTOUT:TUBE:HEX
        if (parts.length < 7) {
          throw new Error(`Invalid lscreen URL: ${url}`)
        }
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const cutout = parseFloat(parts[4])
        const tube = parseFloat(parts[5])
        hex = parts[6].replace(/^#/, '')
        opacity = parts[7] != null ? parseFloat(parts[7]) : 1
        if ([width, height, cutout, tube].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid lscreen dimensions: ${url}`)
        }
        geometry = buildLScreenGeometry(width, height, cutout, tube)
        break
      }
      case 'smith': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid smith dimensions: ${url}`)
        }
        geometry = buildSmithGeometry(width, height, depth)
        break
      }
      case 'dbrack': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid dbrack dimensions: ${url}`)
        }
        geometry = buildDumbbellRackGeometry(width, height, depth)
        break
      }
      case 'tread': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid tread dimensions: ${url}`)
        }
        geometry = buildTreadmillGeometry(width, height, depth)
        break
      }
      case 'bike': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid bike dimensions: ${url}`)
        }
        geometry = buildPelotonBikeGeometry(width, height, depth)
        break
      }
      case 'sauna': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid sauna dimensions: ${url}`)
        }
        const built = buildSaunaGeometry(width, height, depth, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'plunge': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid plunge dimensions: ${url}`)
        }
        const built = buildPlungeGeometry(width, height, depth, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'chiller': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid chiller dimensions: ${url}`)
        }
        const built = buildChillerGeometry(width, height, depth, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'tannertee': {
        // procedural:tannertee:BASE_W:HEIGHT:BASE_D:HEX
        const baseW = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const baseD = parseFloat(parts[4])
        hex = parts[5]?.replace(/^#/, '') || '1a1a1a'
        if ([baseW, height, baseD].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid tannertee dimensions: ${url}`)
        }
        const built = buildTannerTeeGeometry(baseW, height, baseD)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'ballbucket': {
        // procedural:ballbucket:DIA:HEIGHT:DIA:HEX  (Scheels/Rawlings 6-gal)
        const dia = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const dia2 = parseFloat(parts[4])
        hex = parts[5]?.replace(/^#/, '') || 'c41e3a'
        if ([dia, height, dia2].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid ballbucket dimensions: ${url}`)
        }
        const built = buildBallBucketGeometry(Math.min(dia, dia2), height, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'sumppit': {
        // procedural:sumppit:DIA:DEPTH:DIA:HEX — uncovered pit
        const dia = parseFloat(parts[2])
        const depth = parseFloat(parts[3])
        const dia2 = parseFloat(parts[4])
        hex = parts[5]?.replace(/^#/, '') || '9ca3af'
        if ([dia, depth, dia2].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid sumppit dimensions: ${url}`)
        }
        const built = buildSumpPitGeometry(Math.min(dia, dia2), depth, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'hitmat': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid hitmat dimensions: ${url}`)
        }
        const built = buildHitMatGeometry(width, height, depth, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'homeplate': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid homeplate dimensions: ${url}`)
        }
        const built = buildHomePlateGeometry(width, height, depth, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'plyowall': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid plyowall dimensions: ${url}`)
        }
        const built = buildPlyoWallGeometry(width, height, depth, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'batrack': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid batrack dimensions: ${url}`)
        }
        const built = buildBatRackGeometry(width, height, depth, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'cagenet': {
        // procedural:cagenet:WIDTH:HEIGHT:DEPTH:HEX[:opacity]
        // Sparse cord grid — openings are empty air; opacity is cord alpha only.
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        // Default near-solid cords so the mesh reads as netting, not a tinted sheet
        opacity = parts[6] != null ? parseFloat(parts[6]) : 0.85
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid cagenet dimensions: ${url}`)
        }
        geometry = buildCageNetGeometry(width, height, depth)
        break
      }
      case 'lsofa': {
        // procedural:lsofa:BOUND_W:HEIGHT:BOUND_D:ARM_D:HEX
        if (parts.length < 7) {
          throw new Error(`Invalid lsofa URL: ${url}`)
        }
        const boundW = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const boundD = parseFloat(parts[4])
        const armD = parseFloat(parts[5])
        hex = parts[6].replace(/^#/, '')
        opacity = parts[7] != null ? parseFloat(parts[7]) : 1
        if ([boundW, height, boundD, armD].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid lsofa dimensions: ${url}`)
        }
        const built = buildLSofaGeometry(boundW, height, boundD, armD, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'sofa':
      case 'fridge':
      case 'cabinet':
      case 'island':
      case 'counter':
      case 'bed':
      case 'dresser':
      case 'toilet':
      case 'vanity':
      case 'furnace':
      case 'tv': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid ${shape} dimensions: ${url}`)
        }
        const built =
          shape === 'sofa'
            ? buildSofaGeometry(width, height, depth, hex)
            : shape === 'fridge'
              ? buildFridgeGeometry(width, height, depth, hex)
              : shape === 'cabinet'
                ? buildCabinetGeometry(width, height, depth, hex)
                : shape === 'island'
                  ? buildIslandGeometry(width, height, depth, hex)
                  : shape === 'counter'
                    ? buildCounterGeometry(width, height, depth, hex)
                    : shape === 'bed'
                      ? buildBedGeometry(width, height, depth, hex)
                      : shape === 'dresser'
                        ? buildDresserGeometry(width, height, depth, hex)
                        : shape === 'toilet'
                          ? buildToiletGeometry(width, height, depth, hex)
                          : shape === 'vanity'
                            ? buildVanityGeometry(width, height, depth, hex)
                            : shape === 'furnace'
                              ? buildFurnaceGeometry(width, height, depth, hex)
                              : buildTvGeometry(width, height, depth, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'cylinder': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid procedural dimensions: ${url}`)
        }
        const radius = Math.min(width, depth) / 2
        geometry = new THREE.CylinderGeometry(radius, radius, height, 24)
        geometry.translate(0, height / 2, 0)
        break
      }
      case 'plane': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid procedural dimensions: ${url}`)
        }
        geometry = new THREE.BoxGeometry(width, Math.max(height, 1), depth)
        geometry.translate(0, Math.max(height, 1) / 2, 0)
        break
      }
      case 'box':
      default: {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid procedural dimensions: ${url}`)
        }
        geometry = new THREE.BoxGeometry(width, height, depth)
        geometry.translate(0, height / 2, 0)
        break
      }
    }

    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()

    if (materialsOverride) {
      return { geometry, materials: materialsOverride }
    }

    const color = new THREE.Color(`#${hex}`)

    const transparent = opacity < 1
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

/**
 * U-shaped stair in a well. Local space: +X = well width (east), +Z = well depth (south),
 * open side at -X (west / hall). Y up from basement floor. Ascends toward main level.
 */
function buildUStairsGeometry(
  wellW: number,
  wellD: number,
  flightW: number,
  totalRise: number,
  risers: number
): THREE.BufferGeometry {
  // Open side = west (−X). Lower flight along south (west→east), upper along north (east→west).
  const fw = Math.min(flightW, wellD * 0.42)
  const landing = Math.min(fw, wellW * 0.32)
  const runLen = Math.max(wellW - landing, fw)
  const perFlight = Math.ceil(risers / 2)
  const rise = totalRise / risers
  const tread = runLen / perFlight

  const geometries: THREE.BufferGeometry[] = []

  const addBox = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const g = new THREE.BoxGeometry(w, h, d)
    g.translate(x, y + h / 2, z)
    geometries.push(g)
  }

  const southZ = wellD / 2 - fw / 2
  const northZ = -wellD / 2 + fw / 2
  const lowerCount = Math.floor(risers / 2)
  const upperCount = risers - lowerCount

  // Lower flight (basement start at west / hall): south run, west → east
  for (let i = 0; i < lowerCount; i++) {
    const y0 = i * rise
    const x0 = -wellW / 2 + (i + 0.5) * tread
    addBox(tread * 0.92, Math.max(rise * 0.9, 2), fw, x0, y0, southZ)
  }

  // Mid landing (SE) + east turn slab
  const midY = lowerCount * rise
  addBox(landing, Math.max(rise * 0.45, 3), fw, wellW / 2 - landing / 2, midY, southZ)
  addBox(landing * 0.95, Math.max(rise * 0.4, 3), wellD - fw * 0.5, wellW / 2 - landing / 2, midY, 0)

  // Upper flight: north run, east → west (continues up toward main)
  for (let i = 0; i < upperCount; i++) {
    const y0 = (lowerCount + i) * rise
    const x0 = wellW / 2 - landing - (i + 0.5) * tread
    addBox(tread * 0.92, Math.max(rise * 0.9, 2), fw, x0, y0, northZ)
  }

  // Top landing (NW of north flight / toward hall-theatre open side)
  const topY = risers * rise
  addBox(landing, Math.max(rise * 0.4, 3), fw, -wellW / 2 + landing / 2, topY, northZ)

  const merged = mergeGeometries(geometries)
  for (const g of geometries) g.dispose()
  return merged
}

/**
 * Sparse baseball cage netting — thin cords only (very see-through).
 * Thin axis = panel thickness; the other horizontal axis is the run length.
 */
function buildCageNetGeometry(width: number, height: number, depth: number): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = []
  const addBox = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const g = new THREE.BoxGeometry(w, h, d)
    g.translate(x, y + h / 2, z)
    geometries.push(g)
  }

  // ~3/32″ cord, ~14″ square openings — very see-through baseball netting
  const cord = 0.25
  const mesh = 36
  const f = Math.max(cord * 3, 0.8) // light perimeter rope
  const isEW = width <= depth // thin in X → east/west panel, run along Z

  if (isEW) {
    for (let z = -depth / 2; z <= depth / 2 + 0.01; z += mesh) {
      addBox(cord, height, cord, 0, 0, z)
    }
    for (let y = mesh * 0.5; y < height - cord; y += mesh) {
      addBox(cord, cord, depth, 0, y, 0)
    }
    addBox(f, height, f, 0, 0, -depth / 2)
    addBox(f, height, f, 0, 0, depth / 2)
    addBox(f, f, depth, 0, 0, 0)
    addBox(f, f, depth, 0, height - f, 0)
  } else {
    for (let x = -width / 2; x <= width / 2 + 0.01; x += mesh) {
      addBox(cord, height, cord, x, 0, 0)
    }
    for (let y = mesh * 0.5; y < height - cord; y += mesh) {
      addBox(width, cord, cord, 0, y, 0)
    }
    addBox(f, height, f, -width / 2, 0, 0)
    addBox(f, height, f, width / 2, 0, 0)
    addBox(width, f, f, 0, 0, 0)
    addBox(width, f, f, 0, height - f, 0)
  }

  const merged = mergeGeometries(geometries)
  for (const g of geometries) g.dispose()
  return merged
}

/**
 * Regulation L-screen as a letter L: long horizontal foot ON THE GROUND,
 * vertical stem up the west side, throw-through opening top-east (RH).
 * Flat in Z; face toward batter (+Z). 7′×7′ typical, ~42″ opening.
 *
 *   Elevation from batter:
 *   ████
 *   ████
 *   ████████████  ← long side on the ground
 *   ████████████
 */
function buildLScreenGeometry(
  width: number,
  height: number,
  cutout: number,
  tube: number
): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = []
  const addBox = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const g = new THREE.BoxGeometry(w, h, d)
    g.translate(x, y + h / 2, z)
    geometries.push(g)
  }

  const W = width
  const H = height
  // Opening size (top-east). Foot height = remaining band on the ground.
  const open = Math.min(cutout, W * 0.55, H * 0.55)
  const footH = H - open // long horizontal band sits on the ground
  const stemW = W - open // west vertical stem width
  const t = Math.min(Math.max(tube, 2.5), 6)
  const halfW = W / 2
  const netT = Math.max(t * 0.22, 0.8)
  const cord = Math.max(t * 0.28, 0.9)
  const footZ = t * 2.8
  const footY = t * 0.5

  // —— Frame (1.5″ tube) — letter L ——
  // West stem: floor → top
  addBox(t, H, t, -halfW + t / 2, 0, 0)
  // East post: only through the ground foot (opening above)
  addBox(t, footH, t, halfW - t / 2, 0, 0)
  // Long bottom rail (full width — on the ground)
  addBox(W, t, t, 0, 0, 0)
  // Top of stem only (west)
  addBox(stemW, t, t, -halfW + stemW / 2, H - t, 0)
  // Opening sill (top of foot under the cutout)
  addBox(open + t, t, t, halfW - open / 2 - t / 2, footH - t / 2, 0)
  // Opening west jamb (east edge of stem)
  addBox(t, open, t, -halfW + stemW - t / 2, footH, 0)
  // Cross braces in foot + stem
  addBox(W - t * 2, t * 0.85, t * 0.85, 0, footH * 0.45, 0)
  addBox(t * 0.85, H - footH - t, t * 0.85, -halfW + stemW * 0.5, footH + t, 0)
  addBox(t * 0.85, footH - t * 2, t * 0.85, -halfW + stemW * 0.5, t, 0)

  // —— Netting: ground foot (full width) + west stem above ——
  const netPad = t * 1.05
  const addNetGrid = (x0: number, x1: number, y0: number, y1: number) => {
    const spanX = x1 - x0
    const spanY = y1 - y0
    if (spanX < cord * 2 || spanY < cord * 2) return
    const step = Math.max(12, Math.min(18, Math.min(spanX, spanY) / 5))
    for (let x = x0 + step * 0.5; x < x1 - cord; x += step) {
      addBox(cord, spanY - cord, netT, x, y0 + cord * 0.5, 0)
    }
    for (let y = y0 + step * 0.5; y < y1 - cord; y += step) {
      addBox(spanX - cord, cord, netT, (x0 + x1) / 2, y, 0)
    }
  }
  // Long foot on the ground (full width)
  addNetGrid(-halfW + netPad, halfW - netPad, netPad, footH - netPad * 0.5)
  // West stem above the foot
  addNetGrid(-halfW + netPad, -halfW + stemW - netPad, footH + netPad * 0.3, H - netPad)

  // —— Base feet under the long ground rail (N–S) ——
  for (const x of [-halfW + t, 0, halfW - t]) {
    addBox(t * 1.2, footY, footZ * 2, x, 0, 0)
  }

  const merged = mergeGeometries(geometries)
  for (const g of geometries) g.dispose()
  return merged
}

/**
 * Tanner Tee Original — 9.5″ composite base, steel telescoping stem, rubber Flextop.
 * Adult height typically set ~32–36″ within 26–43″ range.
 */
function buildTannerTeeGeometry(
  baseW: number,
  height: number,
  baseD: number
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const baseGeoms: THREE.BufferGeometry[] = []
  const steelGeoms: THREE.BufferGeometry[] = []
  const rubberGeoms: THREE.BufferGeometry[] = []

  const addBox = (
    dest: THREE.BufferGeometry[],
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number
  ) => {
    const g = new THREE.BoxGeometry(w, h, d)
    g.translate(x, y + h / 2, z)
    dest.push(g)
  }
  const addCyl = (
    dest: THREE.BufferGeometry[],
    rTop: number,
    rBot: number,
    h: number,
    x: number,
    y: number,
    z: number,
    segs = 20
  ) => {
    const g = new THREE.CylinderGeometry(rTop, rBot, h, segs)
    g.translate(x, y + h / 2, z)
    dest.push(g)
  }

  const bw = Math.max(baseW, 20)
  const bd = Math.max(baseD, 20)
  const baseH = Math.max(bw * 0.08, 2.2) // ~0.9″ thick plate look
  const H = Math.max(height, 66) // ≥26″
  const stemR = 1.15 // ~0.9″ OD steel
  const stemR2 = 0.95
  const stemR3 = 0.78
  const collarH = 2.4

  // Rounded-ish square base (composite black) — stepped for thickness read
  addBox(baseGeoms, bw * 0.92, baseH, bd * 0.92, 0, 0, 0)
  addBox(baseGeoms, bw * 0.78, baseH * 0.55, bd * 0.78, 0, baseH * 0.85, 0)
  // Soften corners with corner pads
  for (const [sx, sz] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1]
  ] as const) {
    addCyl(baseGeoms, bw * 0.12, bw * 0.12, baseH * 0.95, sx * bw * 0.32, 0, sz * bd * 0.32, 12)
  }
  // Center socket boss
  addCyl(baseGeoms, stemR * 2.2, stemR * 2.4, baseH * 1.1, 0, baseH * 0.3, 0, 16)

  // Telescoping steel stem (3 sections)
  const tipY = H - 8
  const mid1 = baseH + (tipY - baseH) * 0.38
  const mid2 = baseH + (tipY - baseH) * 0.72
  addCyl(steelGeoms, stemR, stemR, mid1 - baseH, 0, baseH, 0)
  addCyl(steelGeoms, stemR2, stemR2, mid2 - mid1 + collarH, 0, mid1 - collarH * 0.3, 0)
  addCyl(steelGeoms, stemR3, stemR3, tipY - mid2 + 1, 0, mid2, 0)
  // Friction collars
  addCyl(steelGeoms, stemR * 1.55, stemR * 1.55, collarH * 0.7, 0, mid1 - collarH * 0.2, 0, 12)
  addCyl(steelGeoms, stemR2 * 1.55, stemR2 * 1.55, collarH * 0.65, 0, mid2 - collarH * 0.15, 0, 12)

  // Hand-rolled rubber Flextop cone
  const coneH = Math.min(10, H * 0.12)
  addCyl(rubberGeoms, 0.35, 3.2, coneH, 0, tipY - 1, 0, 16)
  // Soft lip
  addCyl(rubberGeoms, 3.4, 3.0, 1.2, 0, tipY - 1 + coneH * 0.15, 0, 16)

  const baseMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0x1a1a1a),
    specular: new THREE.Color(0x222222),
    shininess: 18,
    side: THREE.DoubleSide
  })
  const steelMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0x6b7280),
    specular: new THREE.Color(0xcccccc),
    shininess: 70,
    side: THREE.DoubleSide
  })
  const rubberMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0x111111),
    specular: new THREE.Color(0x333333),
    shininess: 8,
    side: THREE.DoubleSide
  })

  const geometry = mergeGeometriesGrouped([
    { geoms: baseGeoms, materialIndex: 0 },
    { geoms: steelGeoms, materialIndex: 1 },
    { geoms: rubberGeoms, materialIndex: 2 }
  ])
  for (const g of [...baseGeoms, ...steelGeoms, ...rubberGeoms]) g.dispose()
  return { geometry, materials: [baseMat, steelMat, rubberMat] }
}

/**
 * Scheels Rawlings 6-gallon ball bucket — 12″ dia × 17″ H, red body, padded seat lid.
 */
function buildBallBucketGeometry(
  dia: number,
  height: number,
  bodyHex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const bodyGeoms: THREE.BufferGeometry[] = []
  const lidGeoms: THREE.BufferGeometry[] = []
  const metalGeoms: THREE.BufferGeometry[] = []
  const ballGeoms: THREE.BufferGeometry[] = []

  const addCyl = (
    dest: THREE.BufferGeometry[],
    rTop: number,
    rBot: number,
    h: number,
    x: number,
    y: number,
    z: number,
    segs = 24
  ) => {
    const g = new THREE.CylinderGeometry(rTop, rBot, h, segs)
    g.translate(x, y + h / 2, z)
    dest.push(g)
  }
  const addTorus = (
    dest: THREE.BufferGeometry[],
    r: number,
    tube: number,
    x: number,
    y: number,
    z: number
  ) => {
    const g = new THREE.TorusGeometry(r, tube, 8, 20)
    g.rotateX(Math.PI / 2)
    g.translate(x, y, z)
    dest.push(g)
  }

  const R = Math.max(dia, 28) / 2
  const H = Math.max(height, 40)
  const wall = 0.7
  const lidH = 4.5
  const padH = 3.2
  const bodyH = H - lidH

  // Tapered bucket body (slightly wider at top)
  addCyl(bodyGeoms, R, R * 0.92, bodyH, 0, 0, 0)
  // Inner hollow cue — darker ring at rim
  addCyl(bodyGeoms, R * 0.97, R * 0.97, 1.2, 0, bodyH - 1.2, 0)
  // Bottom
  addCyl(bodyGeoms, R * 0.9, R * 0.9, 1.5, 0, 0, 0)

  // Wire bail handle
  const handleR = R * 0.92
  addTorus(metalGeoms, handleR, 0.45, 0, bodyH * 0.72, 0)
  // Handle pivots
  addCyl(metalGeoms, 0.7, 0.7, 2.2, handleR, bodyH * 0.68, 0, 8)
  addCyl(metalGeoms, 0.7, 0.7, 2.2, -handleR, bodyH * 0.68, 0, 8)

  // Padded seat lid (Scheels cushioned top — black pad on red rim)
  addCyl(lidGeoms, R * 1.02, R * 1.02, lidH * 0.35, 0, bodyH, 0)
  addCyl(lidGeoms, R * 0.95, R * 0.95, padH, 0, bodyH + lidH * 0.3, 0)
  // Soft crown on pad
  addCyl(lidGeoms, R * 0.88, R * 0.92, padH * 0.45, 0, bodyH + lidH * 0.3 + padH * 0.7, 0)

  // Rawlings-style baseballs visible just under / at rim (lid ajar look — one side)
  const ballR = 3.65
  for (const [ang, yOff] of [
    [0.35, 0.4],
    [1.1, 0.1],
    [2.0, 0.55]
  ] as const) {
    const g = new THREE.SphereGeometry(ballR, 12, 10)
    g.translate(Math.cos(ang) * R * 0.45, bodyH - ballR * 0.35 + yOff, Math.sin(ang) * R * 0.45)
    ballGeoms.push(g)
  }

  const bodyMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(`#${bodyHex.replace(/^#/, '')}`),
    specular: new THREE.Color(0x444444),
    shininess: 35,
    side: THREE.DoubleSide
  })
  const lidMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0x1f2937),
    specular: new THREE.Color(0x222222),
    shininess: 12,
    side: THREE.DoubleSide
  })
  const metalMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0x9ca3af),
    specular: new THREE.Color(0xffffff),
    shininess: 80,
    side: THREE.DoubleSide
  })
  const ballMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0xf5f5f0),
    specular: new THREE.Color(0x333333),
    shininess: 20,
    side: THREE.DoubleSide
  })

  const geometry = mergeGeometriesGrouped([
    { geoms: bodyGeoms, materialIndex: 0 },
    { geoms: lidGeoms, materialIndex: 1 },
    { geoms: metalGeoms, materialIndex: 2 },
    { geoms: ballGeoms, materialIndex: 3 }
  ])
  for (const g of [...bodyGeoms, ...lidGeoms, ...metalGeoms, ...ballGeoms]) g.dispose()
  return { geometry, materials: [bodyMat, lidMat, metalMat, ballMat] }
}

/**
 * Uncovered basement sump pit — concrete rim, open basin (no lid), dark water,
 * and a compact pedestal pump with discharge pipe.
 */
function buildSumpPitGeometry(
  dia: number,
  depth: number,
  rimHex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const rimGeoms: THREE.BufferGeometry[] = []
  const voidGeoms: THREE.BufferGeometry[] = []
  const pumpGeoms: THREE.BufferGeometry[] = []

  const addCyl = (
    dest: THREE.BufferGeometry[],
    rTop: number,
    rBot: number,
    h: number,
    x: number,
    y: number,
    z: number,
    segs = 28
  ) => {
    const g = new THREE.CylinderGeometry(rTop, rBot, h, segs)
    g.translate(x, y + h / 2, z)
    dest.push(g)
  }
  const addBox = (
    dest: THREE.BufferGeometry[],
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number
  ) => {
    const g = new THREE.BoxGeometry(w, h, d)
    g.translate(x, y + h / 2, z)
    dest.push(g)
  }

  const R = Math.max(dia, 50) / 2
  const D = Math.max(depth, 30)
  const rimH = 5.5
  const wall = Math.min(6, R * 0.18)

  // Concrete curb / rim (raised, open center)
  addCyl(rimGeoms, R + 2, R + 2.5, rimH, 0, 0, 0)
  // Inner cut of rim — darker ledge so the opening reads
  addCyl(voidGeoms, R - wall * 0.35, R - wall * 0.35, rimH * 0.55, 0, rimH * 0.35, 0)

  // Basin wall (visible liner down into the pit)
  addCyl(rimGeoms, R - wall * 0.1, R - wall * 0.25, D, 0, 0, 0)
  // Open void / water surface recessed in the basin (no cover)
  addCyl(voidGeoms, R - wall * 1.15, R - wall * 1.2, D * 0.85, 0, rimH * 0.2, 0)
  // Dark pit floor
  addCyl(voidGeoms, R - wall * 1.25, R - wall * 1.25, 2.5, 0, rimH * 0.15, 0)

  // Pedestal sump pump on the pit floor (uncovered)
  const px = (R - wall * 1.6) * 0.35
  const pz = (R - wall * 1.6) * 0.15
  addCyl(pumpGeoms, 7.5, 8.5, 14, px, rimH * 0.3, pz, 12) // pump body
  addCyl(pumpGeoms, 3.2, 3.2, D * 0.55, px, rimH * 0.3 + 12, pz, 10) // riser
  // Discharge elbow + horizontal out over rim
  addBox(pumpGeoms, 18, 3.2, 3.2, px + 6, rimH * 0.3 + 12 + D * 0.45, pz)
  addCyl(pumpGeoms, 2.2, 2.2, 22, px + 16, rimH * 0.3 + 12 + D * 0.45 - 1, pz, 8)

  const rimMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(`#${rimHex.replace(/^#/, '')}`),
    specular: new THREE.Color(0x333333),
    shininess: 12,
    side: THREE.DoubleSide
  })
  const voidMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0x0c1929),
    specular: new THREE.Color(0x113355),
    shininess: 40,
    side: THREE.DoubleSide
  })
  const pumpMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0x1e293b),
    specular: new THREE.Color(0x666666),
    shininess: 50,
    side: THREE.DoubleSide
  })

  const geometry = mergeGeometriesGrouped([
    { geoms: rimGeoms, materialIndex: 0 },
    { geoms: voidGeoms, materialIndex: 1 },
    { geoms: pumpGeoms, materialIndex: 2 }
  ])
  for (const g of [...rimGeoms, ...voidGeoms, ...pumpGeoms]) g.dispose()
  return { geometry, materials: [rimMat, voidMat, pumpMat] }
}

/** Blazzed-style smith / functional trainer — uprights, guides, bar, stacks, base. */
function buildSmithGeometry(width: number, height: number, depth: number): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = []
  const addBox = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const g = new THREE.BoxGeometry(w, h, d)
    g.translate(x, y + h / 2, z)
    geometries.push(g)
  }
  const addCyl = (
    r: number,
    h: number,
    x: number,
    y: number,
    z: number,
    axis: 'y' | 'x' | 'z' = 'y'
  ) => {
    const g = new THREE.CylinderGeometry(r, r, h, 12)
    if (axis === 'x') g.rotateZ(Math.PI / 2)
    if (axis === 'z') g.rotateX(Math.PI / 2)
    g.translate(x, axis === 'y' ? y + h / 2 : y, z)
    geometries.push(g)
  }

  const post = Math.min(7.62, width * 0.04) // ~3" tube
  const halfW = width / 2
  const halfD = depth / 2
  const uprightSpan = Math.min(width * 0.55, 120) // olympic ~47"
  const uHalf = uprightSpan / 2
  const frontZ = halfD - post
  const rearZ = -halfD + post * 1.2

  // Base feet (front + rear)
  addBox(width * 0.92, post * 0.7, post * 1.4, 0, 0, frontZ)
  addBox(width * 0.75, post * 0.7, post * 1.4, 0, 0, rearZ)
  addBox(post * 1.2, post * 0.7, depth * 0.85, -uHalf, 0, 0)
  addBox(post * 1.2, post * 0.7, depth * 0.85, uHalf, 0, 0)

  // Four main uprights (front squat + rear cable/smith frame)
  for (const x of [-uHalf, uHalf]) {
    addBox(post, height * 0.92, post, x, post * 0.7, frontZ)
    addBox(post, height * 0.95, post, x, post * 0.7, rearZ)
  }

  // Outer rear posts (weight-stack towers) — wider stance
  const stackX = halfW - post * 1.5
  addBox(post * 1.1, height * 0.88, post * 1.1, -stackX, post * 0.7, rearZ)
  addBox(post * 1.1, height * 0.88, post * 1.1, stackX, post * 0.7, rearZ)

  // Crossmembers
  const topY = height * 0.9
  addBox(uprightSpan + post, post * 0.8, post * 0.8, 0, topY, frontZ)
  addBox(uprightSpan + post, post * 0.8, post * 0.8, 0, topY, rearZ)
  addBox(post * 0.8, post * 0.8, depth * 0.72, -uHalf, topY, 0)
  addBox(post * 0.8, post * 0.8, depth * 0.72, uHalf, topY, 0)
  // Mid safety / cross
  addBox(uprightSpan + post, post * 0.55, post * 0.55, 0, height * 0.42, frontZ)

  // Pull-up bar
  addCyl(1.6, uprightSpan + post * 2, 0, topY + post * 0.6, frontZ - post * 0.3, 'x')

  // Smith linear guides (vertical rods in front of rear plane)
  const guideZ = rearZ + (frontZ - rearZ) * 0.35
  addCyl(1.2, height * 0.78, -uHalf * 0.92, post * 1.2, guideZ, 'y')
  addCyl(1.2, height * 0.78, uHalf * 0.92, post * 1.2, guideZ, 'y')

  // Smith bar + sleeves
  const barY = height * 0.38
  const barLen = Math.min(width * 0.95, 220)
  addCyl(1.75, barLen, 0, barY, guideZ, 'x')
  addCyl(2.4, 12, -barLen / 2 + 6, barY, guideZ, 'x')
  addCyl(2.4, 12, barLen / 2 - 6, barY, guideZ, 'x')
  // Plate stacks on sleeves (visual)
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const px = side * (barLen / 2 - 18 - i * 4)
      addCyl(11 - i * 1.5, 2.2, px, barY, guideZ, 'x')
    }
  }

  // J-hooks
  addBox(post * 0.7, post * 0.5, post * 2.2, -uHalf, height * 0.5, frontZ - post * 1.2)
  addBox(post * 0.7, post * 0.5, post * 2.2, uHalf, height * 0.5, frontZ - post * 1.2)

  // Weight stacks (selectorized towers)
  const stackH = height * 0.55
  const stackW = post * 3.2
  addBox(stackW, stackH, post * 2.4, -stackX, post * 1.5, rearZ + post * 2)
  addBox(stackW, stackH, post * 2.4, stackX, post * 1.5, rearZ + post * 2)
  // Stack plate lines
  for (let i = 0; i < 8; i++) {
    const sy = post * 1.8 + i * (stackH / 9)
    addBox(stackW * 0.92, 1.2, post * 2.1, -stackX, sy, rearZ + post * 2)
    addBox(stackW * 0.92, 1.2, post * 2.1, stackX, sy, rearZ + post * 2)
  }

  // Lat seat + pad (front-center)
  addBox(uprightSpan * 0.35, post * 0.6, post * 3, 0, height * 0.22, frontZ - post * 4)
  addBox(uprightSpan * 0.28, post * 2.5, post * 0.8, 0, height * 0.22, frontZ - post * 5.5)

  // Cable trolleys (side handles)
  addBox(post * 0.9, post * 2.2, post * 0.9, -stackX, height * 0.55, rearZ + post * 4)
  addBox(post * 0.9, post * 2.2, post * 0.9, stackX, height * 0.55, rearZ + post * 4)

  const merged = mergeGeometries(geometries)
  for (const g of geometries) g.dispose()
  return merged
}

/** Jordan-style 4-tier dumbbell / kettlebell rack with loads on shelves. */
function buildDumbbellRackGeometry(
  width: number,
  height: number,
  depth: number
): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = []
  const addBox = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const g = new THREE.BoxGeometry(w, h, d)
    g.translate(x, y + h / 2, z)
    geometries.push(g)
  }
  const addCyl = (r: number, h: number, x: number, y: number, z: number, axis: 'y' | 'x' = 'y') => {
    const g = new THREE.CylinderGeometry(r, r, h, 14)
    if (axis === 'x') g.rotateZ(Math.PI / 2)
    g.translate(x, axis === 'y' ? y + h / 2 : y, z)
    geometries.push(g)
  }

  const post = Math.min(5, width * 0.04)
  const halfW = width / 2
  const halfD = depth / 2
  const shelfT = 2.2
  const tiers = 4
  const usableH = height - post * 2

  // Side frames (Jumpman-ish silhouette via thick posts + braces)
  for (const x of [-halfW + post, halfW - post]) {
    addBox(post, height * 0.95, post, x, 0, -halfD + post)
    addBox(post, height * 0.95, post, x, 0, halfD - post)
    // Diagonal brace
    addBox(post * 0.7, height * 0.7, post * 0.7, x, height * 0.15, 0)
  }
  // Top + bottom rails
  addBox(width - post, post * 0.8, post * 0.8, 0, height * 0.92, -halfD + post)
  addBox(width - post, post * 0.8, post * 0.8, 0, height * 0.92, halfD - post)
  addBox(width - post, post * 0.9, post * 0.9, 0, 0, 0)

  // Four forward-canted shelves
  for (let t = 0; t < tiers; t++) {
    const y = post * 1.2 + (t + 0.15) * (usableH / tiers)
    const cant = halfD * (0.15 + t * 0.02)
    addBox(width * 0.9, shelfT, depth * 0.72, 0, y, cant * 0.15)
    // Front lip
    addBox(width * 0.9, post * 0.9, shelfT, 0, y + shelfT, halfD * 0.55)

    if (t < 3) {
      // Dumbbell pairs on lower tiers
      const pairs = 3 + t
      for (let p = 0; p < pairs; p++) {
        const x = -halfW * 0.72 + (p + 0.5) * ((width * 0.8) / pairs)
        const headR = 4.5 + t * 0.8
        const handle = 14
        addCyl(1.1, handle, x, y + shelfT + headR, 0, 'x')
        addCyl(headR, 5, x - handle / 2, y + shelfT + headR, 0, 'x')
        addCyl(headR, 5, x + handle / 2, y + shelfT + headR, 0, 'x')
      }
    } else {
      // Top tier kettlebells
      const count = 6
      for (let k = 0; k < count; k++) {
        const x = -halfW * 0.7 + (k + 0.5) * ((width * 0.78) / count)
        const r = 5.5 + (k % 3) * 0.7
        addCyl(r, r * 1.35, x, y + shelfT, halfD * 0.05, 'y')
        // Handle arch (approx box)
        addBox(r * 0.45, r * 0.9, r * 0.35, x, y + shelfT + r * 1.35, halfD * 0.05)
      }
    }
  }

  const merged = mergeGeometries(geometries)
  for (const g of geometries) g.dispose()
  return merged
}

/** Peloton-style treadmill — deck, side rails, motor shroud, uprights, touchscreen. */
function buildTreadmillGeometry(
  width: number,
  height: number,
  depth: number
): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = []
  const addBox = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const g = new THREE.BoxGeometry(w, h, d)
    g.translate(x, y + h / 2, z)
    geometries.push(g)
  }
  const addCyl = (r: number, h: number, x: number, y: number, z: number, axis: 'y' | 'x' | 'z' = 'y') => {
    const g = new THREE.CylinderGeometry(r, r, h, 14)
    if (axis === 'x') g.rotateZ(Math.PI / 2)
    if (axis === 'z') g.rotateX(Math.PI / 2)
    g.translate(x, axis === 'y' ? y + h / 2 : y, z)
    geometries.push(g)
  }

  const halfW = width / 2
  const halfD = depth / 2
  const deckH = Math.min(20, height * 0.14)
  const beltW = width * 0.78
  const beltD = depth * 0.72
  const railT = Math.min(4, depth * 0.06)

  // Base / chassis
  addBox(width * 0.96, deckH * 0.55, depth * 0.92, 0, 0, 0)
  // Running deck slab
  addBox(beltW + railT * 2, deckH * 0.35, beltD + railT, 0, deckH * 0.5, depth * 0.02)
  // Belt surface (slightly proud)
  addBox(beltW, 1.2, beltD, 0, deckH * 0.85, depth * 0.02)
  // Side rails along belt
  addBox(railT, deckH * 0.7, beltD, -beltW / 2 - railT / 2, deckH * 0.45, depth * 0.02)
  addBox(railT, deckH * 0.7, beltD, beltW / 2 + railT / 2, deckH * 0.45, depth * 0.02)
  // Rear roller cap
  addCyl(deckH * 0.35, beltW * 0.95, 0, deckH * 0.55, halfD * 0.78, 'x')
  // Front motor shroud (west / −X end)
  const shroudW = width * 0.18
  addBox(shroudW, deckH * 1.15, depth * 0.88, -halfW + shroudW / 2, 0, 0)

  // Uprights at front of deck (screen end = −X)
  const post = Math.min(5, depth * 0.08)
  const uprightX = -halfW + shroudW * 0.55
  const uprightH = height * 0.72
  addBox(post, uprightH, post, uprightX, deckH, -halfD * 0.55)
  addBox(post, uprightH, post, uprightX, deckH, halfD * 0.55)
  // Crossbar / handle
  addCyl(1.6, depth * 0.7, uprightX, deckH + uprightH * 0.55, 0, 'z')
  // Side handrail stubs toward rear
  addCyl(1.3, depth * 0.35, uprightX + depth * 0.08, deckH + uprightH * 0.42, -halfD * 0.35, 'x')
  addCyl(1.3, depth * 0.35, uprightX + depth * 0.08, deckH + uprightH * 0.42, halfD * 0.35, 'x')

  // Console neck + 23.8" class touchscreen
  const screenH = Math.min(height * 0.28, 42)
  const screenW = Math.min(depth * 0.85, 55)
  const screenT = 2.5
  const screenY = deckH + uprightH * 0.78
  addBox(post * 1.2, height * 0.12, post * 0.8, uprightX, deckH + uprightH * 0.65, 0)
  addBox(screenT, screenH, screenW, uprightX - post, screenY, 0)
  // Screen bezel lip
  addBox(1.2, screenH * 0.92, screenW * 0.92, uprightX - post - 1.5, screenY + screenH * 0.04, 0)

  const merged = mergeGeometries(geometries)
  for (const g of geometries) g.dispose()
  return merged
}

/** Peloton Bike+ — flywheel, frame, saddle, bars, rotating touchscreen. */
function buildPelotonBikeGeometry(
  width: number,
  height: number,
  depth: number
): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = []
  const addBox = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const g = new THREE.BoxGeometry(w, h, d)
    g.translate(x, y + h / 2, z)
    geometries.push(g)
  }
  const addCyl = (r: number, h: number, x: number, y: number, z: number, axis: 'y' | 'x' | 'z' = 'y') => {
    const g = new THREE.CylinderGeometry(r, r, h, 16)
    if (axis === 'x') g.rotateZ(Math.PI / 2)
    if (axis === 'z') g.rotateX(Math.PI / 2)
    g.translate(x, axis === 'y' ? y + h / 2 : y, z)
    geometries.push(g)
  }

  const halfW = width / 2
  const halfD = depth / 2
  const tube = Math.min(3.2, width * 0.08)

  // Stabilizer feet (front + rear)
  addBox(width * 0.92, tube * 0.7, tube * 1.4, 0, 0, halfD * 0.85)
  addBox(width * 0.75, tube * 0.7, tube * 1.4, 0, 0, -halfD * 0.75)

  // Main spine (rear → front / −Z → +Z toward screen)
  addBox(tube * 1.1, tube * 1.1, depth * 0.72, 0, height * 0.22, -depth * 0.02)
  // Seat tube
  addCyl(tube * 0.55, height * 0.42, 0, height * 0.18, -halfD * 0.35, 'y')
  // Saddle
  addBox(width * 0.45, tube * 0.7, depth * 0.14, 0, height * 0.58, -halfD * 0.35)
  // Handlebar post
  addCyl(tube * 0.5, height * 0.38, 0, height * 0.2, halfD * 0.25, 'y')
  // Handlebars
  addCyl(1.4, width * 0.7, 0, height * 0.55, halfD * 0.25, 'x')
  addCyl(1.2, depth * 0.12, -width * 0.32, height * 0.52, halfD * 0.22, 'z')
  addCyl(1.2, depth * 0.12, width * 0.32, height * 0.52, halfD * 0.22, 'z')

  // Flywheel (front)
  const wheelR = Math.min(width * 0.42, depth * 0.22, height * 0.18)
  addCyl(wheelR, tube * 1.2, 0, wheelR * 1.05, halfD * 0.55, 'x')
  addCyl(wheelR * 0.55, tube * 1.5, 0, wheelR * 1.05, halfD * 0.55, 'x')
  // Belt guard / shroud
  addBox(width * 0.55, wheelR * 1.6, depth * 0.12, 0, tube, halfD * 0.42)

  // Screen mast + 23.8" touchscreen (faces +Z / rider)
  const mastH = height * 0.55
  addCyl(tube * 0.45, mastH, 0, height * 0.28, halfD * 0.12, 'y')
  const screenW = Math.min(width * 1.35, 52)
  const screenH = Math.min(height * 0.28, 40)
  addBox(screenW, screenH, 2.2, 0, height * 0.72, halfD * 0.18)
  addBox(screenW * 0.9, screenH * 0.85, 1.2, 0, height * 0.735, halfD * 0.18 + 1.4)

  // Pedal cranks (simple)
  addCyl(1.1, width * 0.35, 0, height * 0.28, 0, 'x')
  addBox(width * 0.12, 2, depth * 0.08, -width * 0.28, height * 0.26, tube)
  addBox(width * 0.12, 2, depth * 0.08, width * 0.28, height * 0.26, -tube)

  const merged = mergeGeometries(geometries)
  for (const g of geometries) g.dispose()
  return merged
}

function phong(hex: string, opts: Partial<THREE.MeshPhongMaterialParameters> = {}) {
  return new THREE.MeshPhongMaterial({
    color: new THREE.Color(`#${hex.replace(/^#/, '')}`),
    specular: new THREE.Color(0x222222),
    shininess: 18,
    side: THREE.DoubleSide,
    ...opts
  })
}

/**
 * PLYO WALL™ Elite — I-shaped square-tube frame + 73″×55″ pad between the uprights.
 * URL: FRAME_W (X=depth) × FRAME_H × FRAME_D (Z=width). Pad faces −X.
 *
 * Plan (top) is a capital I: front & rear flanges along Z, web spine along X.
 * Front elevation: two uprights + top/bottom rails with the pad in the opening.
 */
function buildPlyoWallGeometry(
  frameW: number,
  frameH: number,
  frameD: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const frame: THREE.BufferGeometry[] = []
  const pad: THREE.BufferGeometry[] = []
  const IN = 2.54
  const padFaceW = Math.min(55 * IN, frameD * 0.88)
  const padFaceH = Math.min(73 * IN, frameH * 0.82)
  const padT = 5.5
  const tube = Math.min(7, Math.max(5, Math.min(frameW, frameD) * 0.045))
  const halfW = frameW / 2
  const halfD = frameD / 2
  const frontX = -halfW + tube // pad plane / front flange
  const rearX = halfW - tube
  const uprightZ = padFaceW / 2 + tube * 0.55 // uprights just outside pad
  const flangeZ = frameD - tube // full-width I flanges

  // —— I flanges (plan): front & rear rails along Z ——
  pushBox(frame, tube, tube, flangeZ, frontX, 0, 0)
  pushBox(frame, tube, tube, flangeZ, rearX, 0, 0)
  // Web: two side spines along X connecting front→rear flanges
  pushBox(frame, frameW - tube, tube, tube, 0, 0, -uprightZ)
  pushBox(frame, frameW - tube, tube, tube, 0, 0, uprightZ)
  // Center spine (I web)
  pushBox(frame, frameW - tube * 2, tube * 0.85, tube * 0.85, 0, tube * 0.2, 0)

  // —— Front uprights (I stem rising from front flange) ——
  const uprightH = frameH * 0.96
  pushBox(frame, tube, uprightH, tube, frontX, 0, -uprightZ)
  pushBox(frame, tube, uprightH, tube, frontX, 0, uprightZ)
  // Top flange of the I (front elevation crossbar)
  pushBox(frame, tube, tube, uprightZ * 2 + tube, frontX, uprightH - tube, 0)
  // Mid rear brace (stability, stays open — not a box)
  pushBox(frame, tube * 0.75, tube * 0.75, uprightZ * 2, rearX, frameH * 0.42, 0)
  // Short rear upright stubs
  pushBox(frame, tube, frameH * 0.28, tube, rearX, 0, -uprightZ)
  pushBox(frame, tube, frameH * 0.28, tube, rearX, 0, uprightZ)

  // Casters at the four flange tips
  for (const x of [frontX, rearX]) {
    for (const z of [-halfD + tube * 1.2, halfD - tube * 1.2]) {
      pushCyl(frame, 3.2, 3.8, x, 0, z, 'x')
    }
  }

  // Training pad between front uprights — face −X (throwing lane)
  const padY = (frameH - padFaceH) * 0.38
  const padX = frontX - tube * 0.35 - padT / 2
  pushBox(pad, padT, padFaceH, padFaceW, padX, padY, 0)
  // Subtle face seams
  for (let i = 0; i < 3; i++) {
    pushBox(
      pad,
      1.0,
      padFaceH * 0.88,
      padFaceW * 0.015,
      padX - padT / 2 - 0.5,
      padY + padFaceH * 0.06,
      -padFaceW * 0.28 + i * (padFaceW * 0.28)
    )
  }

  // Single-group merge path is more reliable than multi-mat for item half-size;
  // keep two materials with explicit groups (frame + pad).
  const geometry = mergeGeometriesGrouped([
    { geoms: frame, materialIndex: 0 },
    { geoms: pad, materialIndex: 1 }
  ])
  for (const g of [...frame, ...pad]) g.dispose()
  return {
    geometry,
    materials: [phong(hex, { shininess: 45 }), phong('1c1917', { shininess: 6 })]
  }
}

/** Wall-mounted horizontal bat rack with hanging bats. Depth is off-wall. */
function buildBatRackGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const wood: THREE.BufferGeometry[] = []
  const bats: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const backT = Math.min(3, depth * 0.25)

  // Backboard
  pushBox(wood, width, height, backT, 0, 0, depth / 2 - backT / 2)
  // Peg rail
  pushBox(wood, width * 0.92, height * 0.12, depth * 0.35, 0, height * 0.55, 0)

  const count = Math.max(4, Math.round(width / 18))
  for (let i = 0; i < count; i++) {
    const x = -halfW * 0.85 + (i + 0.5) * ((width * 0.85) / count)
    // Peg
    pushCyl(wood, 1.1, depth * 0.55, x, height * 0.62, -depth * 0.05, 'z')
    // Bat hanging (barrel down-ish)
    const batLen = height * 0.85
    pushCyl(bats, 2.2, batLen * 0.55, x, height * 0.15, -depth * 0.15, 'y') // barrel
    pushCyl(bats, 1.3, batLen * 0.4, x, height * 0.15 + batLen * 0.55, -depth * 0.15, 'y') // handle
    pushCyl(bats, 2.0, 3, x, height * 0.15 + batLen * 0.95, -depth * 0.15, 'y') // knob
  }

  const geometry = mergeGeometriesGrouped([
    { geoms: wood, materialIndex: 0 },
    { geoms: bats, materialIndex: 1 }
  ])
  for (const g of [...wood, ...bats]) g.dispose()
  return {
    geometry,
    materials: [phong(hex, { shininess: 15 }), phong('f5f5f4', { shininess: 25 })]
  }
}

/**
 * MLB home plate pentagon. Front edge (−Z) faces pitcher; point (+Z) toward catcher.
 * width/depth typically 17″ (43.18 cm).
 */
function buildHomePlateGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const geoms: THREE.BufferGeometry[] = []
  const w = width
  const d = depth
  const h = Math.max(height, 1.5)
  // Pentagon in XZ: front (−Z) full width, back point at +Z
  // Vertices (CW from above): FL, FR, midR, tip, midL
  const y0 = 0
  const y1 = h
  const verts = [
    [-w / 2, -d / 2], // front left
    [w / 2, -d / 2], // front right
    [w / 2, d / 2 - w / 2], // back-right before cut (8.5" side → point starts)
    [0, d / 2], // tip (catcher)
    [-w / 2, d / 2 - w / 2] // back-left
  ]
  // Extrude prism
  const positions: number[] = []
  const pushTri = (a: number[], b: number[], c: number[], y: number) => {
    positions.push(a[0], y, a[1], b[0], y, b[1], c[0], y, c[1])
  }
  // Top face
  pushTri(verts[0], verts[1], verts[2], y1)
  pushTri(verts[0], verts[2], verts[3], y1)
  pushTri(verts[0], verts[3], verts[4], y1)
  // Bottom face (flip winding)
  pushTri(verts[0], verts[2], verts[1], y0)
  pushTri(verts[0], verts[3], verts[2], y0)
  pushTri(verts[0], verts[4], verts[3], y0)
  // Sides
  for (let i = 0; i < verts.length; i++) {
    const a = verts[i]
    const b = verts[(i + 1) % verts.length]
    positions.push(a[0], y0, a[1], b[0], y0, b[1], b[0], y1, b[1])
    positions.push(a[0], y0, a[1], b[0], y1, b[1], a[0], y1, a[1])
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.computeVertexNormals()
  geoms.push(g)

  const geometry = mergeGeometries(geoms)
  for (const x of geoms) x.dispose()
  return {
    geometry,
    materials: [phong(hex, { shininess: 35, specular: new THREE.Color(0x666666) })]
  }
}

/**
 * VEVOR-style 12×6 batting mat: red turf, centered MLB home plate, L/R batter’s boxes.
 * Pitcher toward −Z; plate point toward +Z (catcher).
 */
function buildHitMatGeometry(
  width: number,
  height: number,
  depth: number,
  turfHex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const turf: THREE.BufferGeometry[] = []
  const chalk: THREE.BufferGeometry[] = []
  const plate: THREE.BufferGeometry[] = []
  const h = Math.max(height, 2)
  const IN = 2.54

  // Turf slab
  pushBox(turf, width, h, depth, 0, 0, 0)

  // Official home plate 17″ at mat center, slightly proud
  const plateW = 17 * IN
  const plateBuilt = buildHomePlateGeometry(plateW, h * 0.85, plateW, 'f5f5f4')
  // merge homeplate geom into plate group at y = h (sitting on turf)
  {
    const src = plateBuilt.geometry
    const pos = src.getAttribute('position')
    const lifted = new THREE.BufferGeometry()
    const arr = new Float32Array(pos.count * 3)
    for (let i = 0; i < pos.count; i++) {
      arr[i * 3] = pos.getX(i)
      arr[i * 3 + 1] = pos.getY(i) + h
      arr[i * 3 + 2] = pos.getZ(i)
    }
    lifted.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    lifted.computeVertexNormals()
    plate.push(lifted)
    src.dispose()
    for (const m of plateBuilt.materials) m.dispose()
  }

  // Batter’s boxes — 4′ wide, ~full mat depth, 6″ off plate sides (official gap)
  const boxW = 4 * 12 * IN
  const gap = 6 * IN
  const plateHalf = plateW / 2
  const boxX = plateHalf + gap + boxW / 2
  const line = 2.2 // chalk line thickness
  const boxD = depth * 0.92
  const chalkY = h + 0.4

  const drawRectOutline = (cx: number, cz: number, rw: number, rd: number) => {
    pushBox(chalk, rw, line, line, cx, chalkY, cz - rd / 2)
    pushBox(chalk, rw, line, line, cx, chalkY, cz + rd / 2)
    pushBox(chalk, line, line, rd, cx - rw / 2, chalkY, cz)
    pushBox(chalk, line, line, rd, cx + rw / 2, chalkY, cz)
  }
  // RH batter (west / −X, third-base side); LH batter (east / +X)
  drawRectOutline(-boxX, 0, boxW, boxD)
  drawRectOutline(boxX, 0, boxW, boxD)
  // Mid stride / center line hint under plate front
  pushBox(chalk, line, line, depth * 0.2, 0, chalkY, -depth * 0.35)

  const geometry = mergeGeometriesGrouped([
    { geoms: turf, materialIndex: 0 },
    { geoms: chalk, materialIndex: 1 },
    { geoms: plate, materialIndex: 2 }
  ])
  for (const g of [...turf, ...chalk, ...plate]) g.dispose()
  return {
    geometry,
    materials: [
      phong(turfHex, { shininess: 6 }),
      phong('f8fafc', { shininess: 20 }),
      phong('f5f5f4', { shininess: 40, specular: new THREE.Color(0x888888) })
    ]
  }
}

function pushBox(
  target: THREE.BufferGeometry[],
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number
) {
  const g = new THREE.BoxGeometry(w, h, d)
  g.translate(x, y + h / 2, z)
  target.push(g)
}

function pushCyl(
  target: THREE.BufferGeometry[],
  r: number,
  h: number,
  x: number,
  y: number,
  z: number,
  axis: 'y' | 'x' | 'z' = 'y'
) {
  const g = new THREE.CylinderGeometry(r, r, h, 14)
  if (axis === 'x') g.rotateZ(Math.PI / 2)
  if (axis === 'z') g.rotateX(Math.PI / 2)
  g.translate(x, axis === 'y' ? y + h / 2 : y, z)
  target.push(g)
}

/**
 * Congruent L-sectional in bounding box BOUND_W × BOUND_D.
 * Seat depth ARM_D on both arms. Backs hug +Z (south) and +X (east);
 * open crook faces −X/−Z (toward room / TV).
 */
function buildLSofaGeometry(
  boundW: number,
  height: number,
  boundD: number,
  armD: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const body: THREE.BufferGeometry[] = []
  const cushion: THREE.BufferGeometry[] = []
  const halfW = boundW / 2
  const halfD = boundD / 2
  const arm = Math.min(armD, boundW * 0.95, boundD * 0.95)
  const seatH = height * 0.42
  const backH = height * 0.58
  const backT = Math.min(22, arm * 0.28)
  const armW = Math.min(16, arm * 0.18)

  // South run (full width along +Z wall)
  const southZ = halfD - arm / 2
  pushBox(body, boundW, seatH * 0.35, arm * 0.95, 0, 0, southZ)
  pushBox(body, boundW - armW * 0.5, seatH * 0.22, arm * 0.7, -armW * 0.1, seatH * 0.3, southZ - arm * 0.05)
  // South back along +Z outer edge
  pushBox(body, boundW, backH, backT, 0, seatH * 0.35, halfD - backT / 2)
  // West arm of south run
  pushBox(body, armW, height * 0.7, arm * 0.9, -halfW + armW / 2, seatH * 0.15, southZ)

  // East run (north of south arm — no double-fill at corner)
  const eastLen = boundD - arm
  const eastX = halfW - arm / 2
  const eastZ = -halfD + eastLen / 2
  pushBox(body, arm * 0.95, seatH * 0.35, eastLen, eastX, 0, eastZ)
  pushBox(body, arm * 0.7, seatH * 0.22, eastLen - armW * 0.3, eastX - arm * 0.05, seatH * 0.3, eastZ + armW * 0.1)
  // East back along +X outer edge
  pushBox(body, backT, backH, eastLen + arm * 0.15, halfW - backT / 2, seatH * 0.35, eastZ + arm * 0.05)
  // North arm of east run
  pushBox(body, arm * 0.9, height * 0.7, armW, eastX, seatH * 0.15, -halfD + armW / 2)

  // Corner back fill (continuous L back)
  pushBox(body, arm * 0.5, backH, arm * 0.5, halfW - arm * 0.35, seatH * 0.35, halfD - arm * 0.35)

  // South seat cushions
  const southCushions = Math.max(2, Math.round((boundW - arm) / 70))
  const scw = (boundW - armW * 1.5 - arm * 0.15) / southCushions
  for (let i = 0; i < southCushions; i++) {
    const x = -halfW + armW * 1.2 + (i + 0.5) * scw
    pushBox(cushion, scw * 0.9, seatH * 0.26, arm * 0.55, x, seatH * 0.52, southZ - arm * 0.06)
    pushBox(cushion, scw * 0.88, backH * 0.5, backT * 0.7, x, seatH * 0.55, halfD - backT * 0.7)
  }
  // East seat cushions
  const eastCushions = Math.max(1, Math.round(eastLen / 70))
  const ecw = (eastLen - armW * 1.2) / eastCushions
  for (let i = 0; i < eastCushions; i++) {
    const z = -halfD + armW * 1.2 + (i + 0.5) * ecw
    pushBox(cushion, arm * 0.55, seatH * 0.26, ecw * 0.9, eastX - arm * 0.06, seatH * 0.52, z)
    pushBox(cushion, backT * 0.7, backH * 0.5, ecw * 0.88, halfW - backT * 0.7, seatH * 0.55, z)
  }
  // Corner cushion
  pushBox(cushion, arm * 0.5, seatH * 0.26, arm * 0.5, eastX - arm * 0.05, seatH * 0.52, southZ - arm * 0.05)

  const geometry = mergeGeometriesGrouped([
    { geoms: body, materialIndex: 0 },
    { geoms: cushion, materialIndex: 1 }
  ])
  for (const g of [...body, ...cushion]) g.dispose()
  const base = phong(hex)
  const cush = phong(hex, { shininess: 8 })
  cush.color.offsetHSL(0, 0, 0.06)
  return { geometry, materials: [base, cush] }
}

/** Straight sofa run — seat cushions, back, arms. */
function buildSofaGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const body: THREE.BufferGeometry[] = []
  const cushion: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const halfD = depth / 2
  const seatH = height * 0.42
  const backH = height * 0.58
  const armW = Math.min(18, width * 0.08)

  // Base / skirt
  pushBox(body, width, seatH * 0.35, depth * 0.95, 0, 0, 0)
  // Seat deck
  pushBox(body, width - armW * 1.5, seatH * 0.25, depth * 0.72, 0, seatH * 0.3, depth * 0.05)
  // Back
  pushBox(body, width - armW * 0.5, backH, depth * 0.22, 0, seatH * 0.35, -halfD + depth * 0.12)
  // Arms
  pushBox(body, armW, height * 0.7, depth * 0.9, -halfW + armW / 2, seatH * 0.15, 0)
  pushBox(body, armW, height * 0.7, depth * 0.9, halfW - armW / 2, seatH * 0.15, 0)

  // Seat cushions (2–3)
  const cushions = width > 200 ? 3 : 2
  const cw = (width - armW * 2.2) / cushions
  for (let i = 0; i < cushions; i++) {
    const x = -halfW + armW * 1.1 + (i + 0.5) * cw
    pushBox(cushion, cw * 0.92, seatH * 0.28, depth * 0.58, x, seatH * 0.52, depth * 0.06)
    pushBox(cushion, cw * 0.9, backH * 0.55, depth * 0.14, x, seatH * 0.55, -halfD + depth * 0.2)
  }

  const geometry = mergeGeometriesGrouped([
    { geoms: body, materialIndex: 0 },
    { geoms: cushion, materialIndex: 1 }
  ])
  for (const g of [...body, ...cushion]) g.dispose()
  const base = phong(hex)
  const cush = phong(hex, { shininess: 8 })
  cush.color.offsetHSL(0, 0, 0.06)
  return { geometry, materials: [base, cush] }
}

/** Glass-front commercial fridge (Zephyr-style). */
function buildFridgeGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const body: THREE.BufferGeometry[] = []
  const glass: THREE.BufferGeometry[] = []
  const metal: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const halfD = depth / 2
  const wall = 4

  pushBox(body, width, height, depth - 3, 0, 0, -1.5)
  // Toe kick
  pushBox(body, width * 0.96, height * 0.06, depth * 0.9, 0, 0, 0)
  // Top canopy
  pushBox(body, width * 1.02, height * 0.04, depth * 1.02, 0, height * 0.96, 0)
  // Interior shelves hint
  for (let i = 0; i < 4; i++) {
    pushBox(metal, width * 0.75, 1.2, depth * 0.55, 0, height * 0.2 + i * (height * 0.16), -depth * 0.05)
  }
  // Glass door on +Z
  pushBox(glass, width * 0.88, height * 0.82, 2.5, 0, height * 0.1, halfD - 1)
  // Door frame
  pushBox(metal, width * 0.92, height * 0.04, 3, 0, height * 0.9, halfD - 1.2)
  pushBox(metal, width * 0.92, height * 0.04, 3, 0, height * 0.08, halfD - 1.2)
  pushBox(metal, wall, height * 0.82, 3, -halfW + wall, height * 0.1, halfD - 1.2)
  pushBox(metal, wall, height * 0.82, 3, halfW - wall, height * 0.1, halfD - 1.2)
  // Handle
  pushCyl(metal, 1.2, height * 0.35, halfW * 0.75, height * 0.35, halfD + 1, 'y')

  const geometry = mergeGeometriesGrouped([
    { geoms: body, materialIndex: 0 },
    { geoms: glass, materialIndex: 1 },
    { geoms: metal, materialIndex: 2 }
  ])
  for (const g of [...body, ...glass, ...metal]) g.dispose()
  return {
    geometry,
    materials: [
      phong(hex),
      phong('7dd3fc', { transparent: true, opacity: 0.4, depthWrite: false, shininess: 80 }),
      phong('9ca3af', { shininess: 50 })
    ]
  }
}

/** Base or wall cabinet with door reveals + toe-kick. */
function buildCabinetGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const body: THREE.BufferGeometry[] = []
  const door: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const isWall = height < 100 && depth < 45
  const toe = isWall ? 0 : Math.min(10, height * 0.12)

  pushBox(body, width, height - toe, depth, 0, toe, 0)
  if (toe > 0) pushBox(body, width * 0.92, toe, depth * 0.85, 0, 0, -depth * 0.02)

  const doors = Math.max(1, Math.round(width / 60))
  const dw = (width * 0.92) / doors
  for (let i = 0; i < doors; i++) {
    const x = -width * 0.46 + (i + 0.5) * dw
    pushBox(door, dw * 0.92, (height - toe) * 0.88, 1.8, x, toe + (height - toe) * 0.06, depth / 2 - 1)
    // Handle
    pushBox(door, 1.2, Math.min(12, height * 0.12), 2.5, x + dw * 0.28, toe + (height - toe) * 0.5, depth / 2 + 1)
  }

  const geometry = mergeGeometriesGrouped([
    { geoms: body, materialIndex: 0 },
    { geoms: door, materialIndex: 1 }
  ])
  for (const g of [...body, ...door]) g.dispose()
  const a = phong(hex)
  const b = phong(hex)
  b.color.offsetHSL(0, 0, 0.08)
  return { geometry, materials: [a, b] }
}

/** Kitchen island base with paneling. */
function buildIslandGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const body: THREE.BufferGeometry[] = []
  const accent: THREE.BufferGeometry[] = []
  const toe = Math.min(10, height * 0.12)
  pushBox(body, width, height - toe, depth, 0, toe, 0)
  pushBox(body, width * 0.94, toe, depth * 0.9, 0, 0, 0)
  // Side panels / seating overhang hint on long sides
  pushBox(accent, width * 0.98, height * 0.55, 2, 0, toe + height * 0.2, depth / 2 - 1)
  pushBox(accent, width * 0.98, height * 0.55, 2, 0, toe + height * 0.2, -depth / 2 + 1)
  // Door/drawer fronts on +Z
  const n = Math.max(2, Math.round(width / 70))
  const dw = (width * 0.9) / n
  for (let i = 0; i < n; i++) {
    const x = -width * 0.45 + (i + 0.5) * dw
    pushBox(accent, dw * 0.9, height * 0.35, 1.5, x, toe + height * 0.15, depth / 2 - 0.5)
    pushBox(accent, dw * 0.9, height * 0.28, 1.5, x, toe + height * 0.55, depth / 2 - 0.5)
  }
  const geometry = mergeGeometriesGrouped([
    { geoms: body, materialIndex: 0 },
    { geoms: accent, materialIndex: 1 }
  ])
  for (const g of [...body, ...accent]) g.dispose()
  const a = phong(hex)
  const b = phong(hex)
  b.color.offsetHSL(0, 0, 0.1)
  return { geometry, materials: [a, b] }
}

/** Countertop slab with slight edge lip. */
function buildCounterGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const body: THREE.BufferGeometry[] = []
  const h = Math.max(height, 3)
  pushBox(body, width, h * 0.75, depth, 0, 0, 0)
  pushBox(body, width * 1.01, h * 0.35, depth * 1.02, 0, h * 0.7, 0)
  const geometry = mergeGeometries(body)
  for (const g of body) g.dispose()
  return { geometry, materials: [phong(hex, { shininess: 40, specular: new THREE.Color(0x555555) })] }
}

/** Queen platform bed — frame, mattress, headboard (−Z), pillows. */
function buildBedGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const frame: THREE.BufferGeometry[] = []
  const bedding: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const halfD = depth / 2
  const frameH = Math.min(28, height * 0.35)
  const mattH = Math.min(22, height * 0.28)
  const headH = height
  const headT = Math.min(10, depth * 0.05)

  pushBox(frame, width * 0.98, frameH, depth - headT, 0, 0, headT * 0.3)
  // Headboard at −Z
  pushBox(frame, width, headH, headT, 0, 0, -halfD + headT / 2)
  // Mattress
  pushBox(bedding, width * 0.94, mattH, depth * 0.88, 0, frameH, headT * 0.4)
  // Pillows near headboard
  pushBox(bedding, width * 0.32, 12, 28, -halfW * 0.35, frameH + mattH, -halfD + headT + 22)
  pushBox(bedding, width * 0.32, 12, 28, halfW * 0.35, frameH + mattH, -halfD + headT + 22)

  const geometry = mergeGeometriesGrouped([
    { geoms: frame, materialIndex: 0 },
    { geoms: bedding, materialIndex: 1 }
  ])
  for (const g of [...frame, ...bedding]) g.dispose()
  return {
    geometry,
    materials: [phong(hex), phong('e7e5e4', { shininess: 6 })]
  }
}

/** Six-drawer dresser. */
function buildDresserGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const body: THREE.BufferGeometry[] = []
  const drawer: THREE.BufferGeometry[] = []
  const halfW = width / 2
  pushBox(body, width, height, depth, 0, 0, 0)
  pushBox(body, width * 1.01, 2, depth * 1.02, 0, height - 1, 0) // top
  const rows = 3
  const cols = 2
  const dw = (width * 0.88) / cols
  const dh = (height * 0.78) / rows
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -width * 0.44 + (c + 0.5) * dw
      const y = height * 0.12 + r * dh
      pushBox(drawer, dw * 0.92, dh * 0.82, 1.6, x, y, depth / 2 - 0.8)
      pushCyl(drawer, 1.1, 8, x, y + dh * 0.4, depth / 2 + 1, 'x')
    }
  }
  // Feet
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      pushBox(body, 6, 4, 6, sx * (halfW - 8), 0, sz * (depth / 2 - 8))
    }
  }
  const geometry = mergeGeometriesGrouped([
    { geoms: body, materialIndex: 0 },
    { geoms: drawer, materialIndex: 1 }
  ])
  for (const g of [...body, ...drawer]) g.dispose()
  const a = phong(hex)
  const b = phong(hex)
  b.color.offsetHSL(0.02, 0, 0.1)
  return { geometry, materials: [a, b] }
}

/** Toilet — bowl, tank (+Z), seat, flush plate. */
function buildToiletGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const porcelain: THREE.BufferGeometry[] = []
  const accent: THREE.BufferGeometry[] = []
  const halfD = depth / 2
  const bowlD = depth * 0.62
  const tankD = depth * 0.32

  // Bowl base + rim
  pushBox(porcelain, width * 0.85, height * 0.35, bowlD, 0, 0, -halfD + bowlD / 2 + 2)
  pushCyl(porcelain, Math.min(width, bowlD) * 0.38, height * 0.2, 0, height * 0.28, -halfD + bowlD / 2, 'y')
  pushBox(porcelain, width * 0.7, 4, bowlD * 0.75, 0, height * 0.42, -halfD + bowlD / 2)
  // Seat
  pushBox(porcelain, width * 0.65, 3, bowlD * 0.65, 0, height * 0.46, -halfD + bowlD / 2)
  // Tank
  pushBox(porcelain, width * 0.75, height * 0.48, tankD, 0, height * 0.4, halfD - tankD / 2)
  // Flush plate
  pushBox(accent, width * 0.35, height * 0.12, 1.5, 0, height * 0.7, halfD - 0.5)

  const geometry = mergeGeometriesGrouped([
    { geoms: porcelain, materialIndex: 0 },
    { geoms: accent, materialIndex: 1 }
  ])
  for (const g of [...porcelain, ...accent]) g.dispose()
  return {
    geometry,
    materials: [phong(hex, { shininess: 60, specular: new THREE.Color(0x888888) }), phong('0a0a0b')]
  }
}

/** Floating vanity with stone top, basin, brass faucet. */
function buildVanityGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const cab: THREE.BufferGeometry[] = []
  const stone: THREE.BufferGeometry[] = []
  const brass: THREE.BufferGeometry[] = []
  const floatGap = Math.min(28, height * 0.22)
  const cabH = height * 0.48
  const topH = Math.max(3.5, height * 0.04)

  pushBox(cab, width * 0.96, cabH, depth * 0.92, 0, floatGap, 0)
  // Door fronts
  const doors = 2
  const dw = (width * 0.88) / doors
  for (let i = 0; i < doors; i++) {
    const x = -width * 0.44 + (i + 0.5) * dw
    pushBox(cab, dw * 0.9, cabH * 0.85, 1.5, x, floatGap + cabH * 0.08, depth / 2 - 0.7)
    pushBox(brass, 1.2, 10, 2, x + dw * 0.25, floatGap + cabH * 0.45, depth / 2 + 1)
  }
  // Stone top
  pushBox(stone, width, topH, depth, 0, floatGap + cabH, 0)
  // Undermount basin (inset)
  pushCyl(stone, Math.min(width, depth) * 0.22, 8, 0, floatGap + cabH - 6, -depth * 0.05, 'y')
  // Faucet + spout
  const faucetY = floatGap + cabH + topH
  pushCyl(brass, 1.4, 18, 0, faucetY, -depth * 0.28, 'y')
  pushCyl(brass, 1.2, 12, 0, faucetY + 16, -depth * 0.15, 'z')

  const geometry = mergeGeometriesGrouped([
    { geoms: cab, materialIndex: 0 },
    { geoms: stone, materialIndex: 1 },
    { geoms: brass, materialIndex: 2 }
  ])
  for (const g of [...cab, ...stone, ...brass]) g.dispose()
  return {
    geometry,
    materials: [phong(hex), phong('2f3035', { shininess: 35 }), phong('b08d57', { shininess: 55 })]
  }
}

/** Residential furnace cabinet with vents and flue. */
function buildFurnaceGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const body: THREE.BufferGeometry[] = []
  const accent: THREE.BufferGeometry[] = []
  pushBox(body, width, height * 0.92, depth, 0, 0, 0)
  // Front door seam
  pushBox(accent, width * 0.85, height * 0.55, 1.5, 0, height * 0.2, depth / 2 - 0.7)
  // Louvers
  for (let i = 0; i < 5; i++) {
    pushBox(accent, width * 0.7, 2, 1.2, 0, height * 0.25 + i * 8, depth / 2 + 0.2)
  }
  // Top flue collar
  pushCyl(accent, Math.min(width, depth) * 0.12, height * 0.12, 0, height * 0.9, 0, 'y')
  // Side service panel
  pushBox(body, 1.5, height * 0.4, depth * 0.5, -width / 2 + 0.7, height * 0.3, 0)
  // Filter slot
  pushBox(accent, width * 0.6, height * 0.08, 2, 0, height * 0.08, depth / 2 - 0.5)

  const geometry = mergeGeometriesGrouped([
    { geoms: body, materialIndex: 0 },
    { geoms: accent, materialIndex: 1 }
  ])
  for (const g of [...body, ...accent]) g.dispose()
  return {
    geometry,
    materials: [phong(hex), phong('4b5563', { shininess: 30 })]
  }
}

/** Flat-panel TV with thin bezel and wall mount. */
function buildTvGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const body: THREE.BufferGeometry[] = []
  const screen: THREE.BufferGeometry[] = []
  const bezel = Math.max(1.5, Math.min(width, height) * 0.015)
  const panel = Math.max(depth * 0.55, 2.5)
  pushBox(body, width, height, panel, 0, 0, 0)
  pushBox(screen, width - bezel * 2, height - bezel * 2, 1.2, 0, bezel, panel / 2 + 0.4)
  // Mount bracket behind
  pushBox(body, width * 0.25, height * 0.2, Math.max(depth - panel, 2), 0, height * 0.4, -panel / 2 - 1)
  pushBox(body, width * 0.08, height * 0.08, 4, -width * 0.15, height * 0.45, -panel / 2 - 3)
  pushBox(body, width * 0.08, height * 0.08, 4, width * 0.15, height * 0.45, -panel / 2 - 3)

  const geometry = mergeGeometriesGrouped([
    { geoms: body, materialIndex: 0 },
    { geoms: screen, materialIndex: 1 }
  ])
  for (const g of [...body, ...screen]) g.dispose()
  return {
    geometry,
    materials: [
      phong(hex),
      phong('0b1220', { emissive: new THREE.Color(0x0a1628), emissiveIntensity: 0.15, shininess: 70 })
    ]
  }
}

/**
 * NuRecover Plunge–style ice bath: insulated shell, inflated top rim, visible
 * water, stainless corner poles / T-connectors, drain stub.
 */
function buildPlungeGeometry(
  width: number,
  height: number,
  depth: number,
  shellHex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const shellGeoms: THREE.BufferGeometry[] = []
  const waterGeoms: THREE.BufferGeometry[] = []
  const metalGeoms: THREE.BufferGeometry[] = []

  const add = (
    target: THREE.BufferGeometry[],
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number
  ) => {
    const g = new THREE.BoxGeometry(w, h, d)
    g.translate(x, y + h / 2, z)
    target.push(g)
  }
  const addCyl = (
    target: THREE.BufferGeometry[],
    r: number,
    h: number,
    x: number,
    y: number,
    z: number,
    axis: 'y' | 'x' | 'z' = 'y'
  ) => {
    const g = new THREE.CylinderGeometry(r, r, h, 14)
    if (axis === 'x') g.rotateZ(Math.PI / 2)
    if (axis === 'z') g.rotateX(Math.PI / 2)
    g.translate(x, axis === 'y' ? y + h / 2 : y, z)
    target.push(g)
  }

  const halfW = width / 2
  const halfD = depth / 2
  const wall = Math.min(5.5, Math.min(width, depth) * 0.08)
  const rim = Math.min(7, wall * 1.35)
  const floorT = Math.min(4, height * 0.1)
  const waterFill = height * 0.72 // leave ~6"+ headspace look

  // Outer shell walls + floor (open top)
  add(shellGeoms, width, floorT, depth, 0, 0, 0)
  add(shellGeoms, wall, height - rim * 0.3, depth, -halfW + wall / 2, floorT * 0.2, 0)
  add(shellGeoms, wall, height - rim * 0.3, depth, halfW - wall / 2, floorT * 0.2, 0)
  add(shellGeoms, width - wall * 2, height - rim * 0.3, wall, 0, floorT * 0.2, -halfD + wall / 2)
  add(shellGeoms, width - wall * 2, height - rim * 0.3, wall, 0, floorT * 0.2, halfD - wall / 2)

  // Inflated top rim (Oxford lip)
  add(shellGeoms, width, rim * 0.55, rim, 0, height - rim * 0.55, -halfD + rim / 2)
  add(shellGeoms, width, rim * 0.55, rim, 0, height - rim * 0.55, halfD - rim / 2)
  add(shellGeoms, rim, rim * 0.55, depth - rim * 2, -halfW + rim / 2, height - rim * 0.55, 0)
  add(shellGeoms, rim, rim * 0.55, depth - rim * 2, halfW - rim / 2, height - rim * 0.55, 0)
  // Corner rim bulbs
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      addCyl(
        shellGeoms,
        rim * 0.45,
        rim * 0.55,
        sx * (halfW - rim * 0.55),
        height - rim * 0.55,
        sz * (halfD - rim * 0.55),
        'y'
      )
    }
  }

  // Soft side banding (reads as insulated PVC panels)
  for (const bandY of [height * 0.28, height * 0.48]) {
    add(shellGeoms, 1.2, height * 0.06, depth * 0.92, -halfW - 0.4, bandY, 0)
    add(shellGeoms, 1.2, height * 0.06, depth * 0.92, halfW + 0.4, bandY, 0)
  }

  // Water volume inside
  const innerW = width - wall * 2.4
  const innerD = depth - wall * 2.4
  add(waterGeoms, innerW, waterFill - floorT, innerD, 0, floorT, 0)
  // Water surface highlight slab
  add(waterGeoms, innerW * 0.98, 1.2, innerD * 0.98, 0, waterFill - 0.5, 0)

  // Stainless corner poles + T-connectors (NuRecover frame)
  const poleR = 1.4
  const poleInset = wall + 1.5
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const px = sx * (halfW - poleInset)
      const pz = sz * (halfD - poleInset)
      addCyl(metalGeoms, poleR, height * 0.95, px, 0, pz, 'y')
      // T-connector near rim
      addCyl(metalGeoms, poleR * 1.35, poleR * 2.2, px, height * 0.82, pz, 'x')
      addCyl(metalGeoms, poleR * 1.35, poleR * 2.2, px, height * 0.82, pz, 'z')
    }
  }
  // Mid-span horizontal braces along long sides
  addCyl(metalGeoms, poleR * 0.85, width - poleInset * 2, 0, height * 0.45, -halfD + poleInset, 'x')
  addCyl(metalGeoms, poleR * 0.85, width - poleInset * 2, 0, height * 0.45, halfD - poleInset, 'x')

  // Drain valve stub on +X end
  addCyl(metalGeoms, 1.8, 6, halfW + 2, height * 0.18, 0, 'x')
  add(metalGeoms, 3, 3, 3, halfW + 5, height * 0.15, 0)

  // Hose ports toward chiller (+X / east)
  addCyl(metalGeoms, 1.5, 5, halfW + 1.5, height * 0.62, halfD * 0.25, 'x')
  addCyl(metalGeoms, 1.5, 5, halfW + 1.5, height * 0.62, -halfD * 0.25, 'x')

  const shellMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(`#${shellHex.replace(/^#/, '')}`),
    specular: new THREE.Color(0x446688),
    shininess: 28,
    side: THREE.DoubleSide
  })
  const waterMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0x38bdf8),
    specular: new THREE.Color(0xa5f3fc),
    shininess: 90,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    depthWrite: false
  })
  const metalMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0xc0c8d0),
    specular: new THREE.Color(0xffffff),
    shininess: 70,
    side: THREE.DoubleSide
  })

  const geometry = mergeGeometriesGrouped([
    { geoms: shellGeoms, materialIndex: 0 },
    { geoms: waterGeoms, materialIndex: 1 },
    { geoms: metalGeoms, materialIndex: 2 }
  ])
  for (const g of [...shellGeoms, ...waterGeoms, ...metalGeoms]) g.dispose()
  return { geometry, materials: [shellMat, waterMat, metalMat] }
}

/** Compact powder-coated chiller with grille, display, and hose stubs. */
function buildChillerGeometry(
  width: number,
  height: number,
  depth: number,
  bodyHex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const bodyGeoms: THREE.BufferGeometry[] = []
  const accentGeoms: THREE.BufferGeometry[] = []
  const metalGeoms: THREE.BufferGeometry[] = []

  const add = (
    target: THREE.BufferGeometry[],
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number
  ) => {
    const g = new THREE.BoxGeometry(w, h, d)
    g.translate(x, y + h / 2, z)
    target.push(g)
  }
  const addCyl = (
    target: THREE.BufferGeometry[],
    r: number,
    h: number,
    x: number,
    y: number,
    z: number,
    axis: 'y' | 'x' | 'z' = 'y'
  ) => {
    const g = new THREE.CylinderGeometry(r, r, h, 12)
    if (axis === 'x') g.rotateZ(Math.PI / 2)
    if (axis === 'z') g.rotateX(Math.PI / 2)
    g.translate(x, axis === 'y' ? y + h / 2 : y, z)
    target.push(g)
  }

  const halfW = width / 2
  const halfD = depth / 2

  // Main chassis
  add(bodyGeoms, width * 0.92, height * 0.88, depth * 0.92, 0, height * 0.06, 0)
  // Top cap
  add(bodyGeoms, width * 0.96, height * 0.08, depth * 0.96, 0, height * 0.9, 0)
  // Feet
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      add(bodyGeoms, 4, height * 0.06, 4, sx * (halfW * 0.7), 0, sz * (halfD * 0.7))
    }
  }

  // Front intake grille slots
  const slots = 6
  for (let i = 0; i < slots; i++) {
    const zy = height * 0.22 + i * ((height * 0.55) / slots)
    add(accentGeoms, width * 0.02, height * 0.04, depth * 0.7, -halfW * 0.9, zy, 0)
  }
  // Side vent
  for (let i = 0; i < 4; i++) {
    add(accentGeoms, width * 0.55, height * 0.035, 1.2, 0, height * 0.3 + i * 4.5, halfD * 0.9)
  }

  // Control panel / display
  add(accentGeoms, width * 0.35, height * 0.12, 1.5, halfW * 0.15, height * 0.72, -halfD * 0.9)
  add(metalGeoms, width * 0.22, height * 0.06, 1.2, halfW * 0.15, height * 0.74, -halfD * 0.92)

  // Hose stubs toward plunge (−X)
  addCyl(metalGeoms, 1.6, 7, -halfW - 2, height * 0.55, halfD * 0.2, 'x')
  addCyl(metalGeoms, 1.6, 7, -halfW - 2, height * 0.55, -halfD * 0.2, 'x')
  // Insulated hose segments
  addCyl(metalGeoms, 2.2, 10, -halfW - 8, height * 0.55, halfD * 0.2, 'x')
  addCyl(metalGeoms, 2.2, 10, -halfW - 8, height * 0.55, -halfD * 0.2, 'x')

  const bodyMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(`#${bodyHex.replace(/^#/, '')}`),
    specular: new THREE.Color(0x333333),
    shininess: 20,
    side: THREE.DoubleSide
  })
  const accentMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0x0ea5e9),
    emissive: new THREE.Color(0x0369a1),
    emissiveIntensity: 0.25,
    specular: new THREE.Color(0x88ccff),
    shininess: 40,
    side: THREE.DoubleSide
  })
  const metalMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0xd1d5db),
    specular: new THREE.Color(0xffffff),
    shininess: 60,
    side: THREE.DoubleSide
  })

  const geometry = mergeGeometriesGrouped([
    { geoms: bodyGeoms, materialIndex: 0 },
    { geoms: accentGeoms, materialIndex: 1 },
    { geoms: metalGeoms, materialIndex: 2 }
  ])
  for (const g of [...bodyGeoms, ...accentGeoms, ...metalGeoms]) g.dispose()
  return { geometry, materials: [bodyMat, accentMat, metalMat] }
}

/**
 * Dynamic Bellagio–style 3-person IR sauna: hemlock cabin, tempered glass door,
 * bench, and red-light / chromotherapy strips (emissive).
 */
function buildSaunaGeometry(
  width: number,
  height: number,
  depth: number,
  woodHex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const woodGeoms: THREE.BufferGeometry[] = []
  const glassGeoms: THREE.BufferGeometry[] = []
  const redGeoms: THREE.BufferGeometry[] = []

  const add = (
    target: THREE.BufferGeometry[],
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number
  ) => {
    const g = new THREE.BoxGeometry(w, h, d)
    g.translate(x, y + h / 2, z)
    target.push(g)
  }

  const wall = Math.min(6, width * 0.04)
  const halfW = width / 2
  const halfD = depth / 2
  const doorW = Math.min(width * 0.42, 70)
  const doorH = height * 0.78

  // Floor + roof
  add(woodGeoms, width, wall * 0.6, depth, 0, 0, 0)
  add(woodGeoms, width + 8, wall * 0.7, depth + 6, 0, height - wall * 0.7, -1) // slight roof overhang
  // Side walls
  add(woodGeoms, wall, height - wall, depth, -halfW + wall / 2, wall * 0.5, 0)
  add(woodGeoms, wall, height - wall, depth, halfW - wall / 2, wall * 0.5, 0)
  // Back wall (−Z)
  add(woodGeoms, width - wall * 2, height - wall, wall, 0, wall * 0.5, -halfD + wall / 2)
  // Front wall with door opening (+Z) — left/right/header
  const frontZ = halfD - wall / 2
  const sideDoor = (width - doorW) / 2
  add(woodGeoms, sideDoor - wall, height - wall, wall, -halfW + wall + (sideDoor - wall) / 2, wall * 0.5, frontZ)
  add(woodGeoms, sideDoor - wall, height - wall, wall, halfW - wall - (sideDoor - wall) / 2, wall * 0.5, frontZ)
  add(woodGeoms, doorW, height - wall - doorH, wall, 0, wall * 0.5 + doorH, frontZ)

  // Interior bench (rear)
  add(woodGeoms, width - wall * 3, wall * 1.1, depth * 0.32, 0, height * 0.28, -halfD + wall + depth * 0.18)
  add(woodGeoms, width - wall * 3, height * 0.22, wall * 0.8, 0, height * 0.28, -halfD + wall * 2)

  // Exterior vertical plank ribs (reads as hemlock cabin)
  for (let i = 0; i < 5; i++) {
    const x = -halfW + wall * 2 + (i + 0.5) * ((width - wall * 4) / 5)
    add(woodGeoms, 1.5, height * 0.9, 1.2, x, wall, -halfD - 0.4)
  }

  // Tempered glass door panel
  add(glassGeoms, doorW * 0.92, doorH * 0.96, 1.5, 0, wall * 0.8, frontZ + 0.5)
  // Side glass windows
  add(glassGeoms, wall * 0.4, height * 0.45, depth * 0.35, -halfW + wall * 0.3, height * 0.3, 0)
  add(glassGeoms, wall * 0.4, height * 0.45, depth * 0.35, halfW - wall * 0.3, height * 0.3, 0)

  // Red light therapy bars (back wall + ceiling strip) — ~663nm look
  add(redGeoms, width * 0.7, 3.5, 2.5, 0, height * 0.55, -halfD + wall + 2)
  add(redGeoms, width * 0.7, 3.5, 2.5, 0, height * 0.72, -halfD + wall + 2)
  add(redGeoms, width * 0.55, 2.2, 2.2, 0, height - wall * 1.5, 0)
  // Chromotherapy accent dots on ceiling
  for (const x of [-width * 0.2, 0, width * 0.2]) {
    add(redGeoms, 3, 1.5, 3, x, height - wall * 1.2, depth * 0.1)
  }

  const woodMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(`#${woodHex.replace(/^#/, '')}`),
    specular: new THREE.Color(0x333333),
    shininess: 12,
    side: THREE.DoubleSide
  })
  const glassMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0x88aacc),
    specular: new THREE.Color(0xffffff),
    shininess: 80,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false
  })
  const redMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0xff2a2a),
    emissive: new THREE.Color(0xcc1515),
    emissiveIntensity: 0.85,
    specular: new THREE.Color(0xff6666),
    shininess: 40,
    side: THREE.DoubleSide
  })

  const geometry = mergeGeometriesGrouped([
    { geoms: woodGeoms, materialIndex: 0 },
    { geoms: glassGeoms, materialIndex: 1 },
    { geoms: redGeoms, materialIndex: 2 }
  ])
  for (const g of [...woodGeoms, ...glassGeoms, ...redGeoms]) g.dispose()

  return { geometry, materials: [woodMat, glassMat, redMat] }
}

function mergeGeometriesGrouped(
  groups: { geoms: THREE.BufferGeometry[]; materialIndex: number }[]
): THREE.BufferGeometry {
  const positions: number[] = []
  const normals: number[] = []
  const outGroups: { start: number; count: number; materialIndex: number }[] = []

  for (const { geoms, materialIndex } of groups) {
    if (geoms.length === 0) continue
    const start = positions.length / 3
    for (const g of geoms) {
      g.computeVertexNormals()
      const pos = g.getAttribute('position')
      const nor = g.getAttribute('normal')
      const idx = g.getIndex()
      if (idx) {
        for (let i = 0; i < idx.count; i++) {
          const vi = idx.getX(i)
          positions.push(pos.getX(vi), pos.getY(vi), pos.getZ(vi))
          if (nor) normals.push(nor.getX(vi), nor.getY(vi), nor.getZ(vi))
        }
      } else {
        for (let i = 0; i < pos.count; i++) {
          positions.push(pos.getX(i), pos.getY(i), pos.getZ(i))
          if (nor) normals.push(nor.getX(i), nor.getY(i), nor.getZ(i))
        }
      }
    }
    const count = positions.length / 3 - start
    if (count > 0) outGroups.push({ start, count, materialIndex })
  }

  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  if (normals.length === positions.length) {
    out.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  } else {
    out.computeVertexNormals()
  }
  for (const g of outGroups) out.addGroup(g.start, g.count, g.materialIndex)
  return out
}

function mergeGeometries(geoms: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = []
  const normals: number[] = []
  for (const g of geoms) {
    g.computeVertexNormals()
    const pos = g.getAttribute('position')
    const nor = g.getAttribute('normal')
    const idx = g.getIndex()
    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        const vi = idx.getX(i)
        positions.push(pos.getX(vi), pos.getY(vi), pos.getZ(vi))
        if (nor) normals.push(nor.getX(vi), nor.getY(vi), nor.getZ(vi))
      }
    } else {
      for (let i = 0; i < pos.count; i++) {
        positions.push(pos.getX(i), pos.getY(i), pos.getZ(i))
        if (nor) normals.push(nor.getX(i), nor.getY(i), nor.getZ(i))
      }
    }
  }
  const out = new THREE.BufferGeometry()
  out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  if (normals.length === positions.length) {
    out.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  } else {
    out.computeVertexNormals()
  }
  return out
}

export function isProceduralUrl(url: string): boolean {
  return url.toLowerCase().startsWith('procedural:')
}
