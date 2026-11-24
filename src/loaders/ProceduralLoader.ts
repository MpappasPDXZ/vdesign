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
 * procedural:pool:WIDTH:HEIGHT:DEPTH:HEXCOLOR — inground pool (coping, water, tile band, steps)
 * procedural:coverbox:WIDTH:HEIGHT:DEPTH:HEXCOLOR — automatic pool-cover housing lid
 * procedural:phroof:WIDTH:HEIGHT:DEPTH:HEXCOLOR — pool-house gable standing-seam roof
 * procedural:stonebar:WIDTH:HEIGHT:DEPTH:HEXCOLOR — L-shaped stacked-stone outdoor bar
 * procedural:phdoor:WIDTH:HEIGHT:DEPTH:HEXCOLOR — X-brace pool-house door with lites
 * procedural:ytruss:WIDTH:HEIGHT:DEPTH:HEXCOLOR — decorative Y gable timber truss
 * procedural:sofa:WIDTH:HEIGHT:DEPTH:HEXCOLOR — sofa run (cushions, arms, back)
 * procedural:lsofa:BOUND_W:HEIGHT:BOUND_D:ARM_D:HEXCOLOR — one congruent L-sectional
 *   Backs on +Z (south) and +X (east); open toward −X/−Z. ARM_D = seat depth both arms.
 * procedural:fridge:WIDTH:HEIGHT:DEPTH:HEXCOLOR — glass-front commercial fridge
 * procedural:cabinet:WIDTH:HEIGHT:DEPTH:HEXCOLOR — base/wall cabinet with doors + toe-kick
 * procedural:ssbase:WIDTH:HEIGHT:DEPTH:HEXCOLOR — outdoor base cab · stainless drawers on +X · stone/wood top
 * procedural:sswall:WIDTH:HEIGHT:DEPTH:HEXCOLOR — upper wall cab · stainless doors on +X
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
 * procedural:cypress:WIDTH:HEIGHT:DEPTH:HEX — Italian-cypress columnar evergreen (trunk + taper)
 * procedural:pine:WIDTH:HEIGHT:DEPTH:HEX — conical landscape pine (broader tiers than cypress)
 * procedural:shrub:WIDTH:HEIGHT:DEPTH:HEX — rounded landscape shrub
 * procedural:rock:WIDTH:HEIGHT:DEPTH:HEX — irregular landscape boulder
 * procedural:chaise:WIDTH:HEIGHT:DEPTH:HEX — outdoor lounge chaise (head/back −Z, feet +Z)
 * procedural:barstool:WIDTH:HEIGHT:DEPTH:HEX — 4-leg plastic low-back bar stool (seat faces +Z)
 * procedural:fan:DIAMETER:HEIGHT:DIAMETER:HEX — ceiling fan (blade span × overall drop incl. downrod)
 * procedural:acunit:WIDTH:HEIGHT:DEPTH:HEX — outdoor AC condenser (coil sides, top fan grille)
 * procedural:planter:WIDTH:HEIGHT:DEPTH:HEX — large concrete box planter (rim + soil)
 * procedural:palm:WIDTH:HEIGHT:DEPTH:HEX — container palm-like tree (trunk + fan fronds)
 * procedural:guardrun:SPAN:GUARD_H:AXIS:HEX — deck rail: top+bot + horizontal bars (not property fence)
 *   AXIS 0 = span along X, 1 = span along Z. Origin at mid-span; y=0 at bottom rail.
 * procedural:rakeguard:SPAN:DROP:GUARD_H:HEX — raked stair guard (span along X)
 *   +X end is high by DROP; y=0 at low-end bottom rail. One mesh replaces dozens of boxes.
 * procedural:rakehoriz:SPAN:DROP:GUARD_H:HEX — raked stair guard with horizontal members
 *   Same span/drop convention as rakeguard; end posts + 4 rake-parallel rails (no pickets).
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
      case 'pool': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid pool dimensions: ${url}`)
        }
        const built = buildPoolGeometry(width, height, depth, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'coverbox': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid coverbox dimensions: ${url}`)
        }
        const built = buildCoverBoxGeometry(width, height, depth, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'phroof': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid phroof dimensions: ${url}`)
        }
        const built = buildPoolHouseRoofGeometry(width, height, depth, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'stonebar': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid stonebar dimensions: ${url}`)
        }
        const built = buildStoneBarGeometry(width, height, depth, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'phdoor': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid phdoor dimensions: ${url}`)
        }
        const built = buildPoolHouseDoorGeometry(width, height, depth, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'ytruss': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid ytruss dimensions: ${url}`)
        }
        const built = buildYTrussGeometry(width, height, depth, hex)
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
      case 'ssbase':
      case 'sswall':
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
                : shape === 'ssbase'
                  ? buildSsBaseCabinetGeometry(width, height, depth, hex)
                  : shape === 'sswall'
                    ? buildSsWallCabinetGeometry(width, height, depth, hex)
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
      case 'cypress': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid cypress dimensions: ${url}`)
        }
        {
          const built = buildCypressGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'pine': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid pine dimensions: ${url}`)
        }
        {
          const built = buildPineGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'chaise': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid chaise dimensions: ${url}`)
        }
        {
          const built = buildChaiseGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'acunit': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid acunit dimensions: ${url}`)
        }
        {
          const built = buildAcUnitGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'barstool': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid barstool dimensions: ${url}`)
        }
        {
          const built = buildBarstoolGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'fan': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid fan dimensions: ${url}`)
        }
        {
          const built = buildCeilingFanGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'shrub': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid shrub dimensions: ${url}`)
        }
        {
          const built = buildShrubGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'planter': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid planter dimensions: ${url}`)
        }
        {
          const built = buildPlanterGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'palm': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid palm dimensions: ${url}`)
        }
        {
          const built = buildPalmGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'rock': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid rock dimensions: ${url}`)
        }
        {
          const built = buildRockGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
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
      case 'guardrun': {
        // procedural:guardrun:SPAN:GUARD_H:AXIS:HEX
        const span = parseFloat(parts[2])
        const guardH = parseFloat(parts[3])
        const axis = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([span, guardH].some((n) => Number.isNaN(n) || n <= 0) || Number.isNaN(axis)) {
          throw new Error(`Invalid guardrun dimensions: ${url}`)
        }
        {
          const built = buildGuardRunGeometry(span, guardH, axis !== 0, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'rakeguard': {
        // procedural:rakeguard:SPAN:DROP:GUARD_H:HEX
        const span = parseFloat(parts[2])
        const drop = parseFloat(parts[3])
        const guardH = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([span, guardH].some((n) => Number.isNaN(n) || n <= 0) || Number.isNaN(drop)) {
          throw new Error(`Invalid rakeguard dimensions: ${url}`)
        }
        {
          const built = buildRakeGuardGeometry(span, drop, guardH, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'rakehoriz': {
        // procedural:rakehoriz:SPAN:DROP:GUARD_H:HEX
        const span = parseFloat(parts[2])
        const drop = parseFloat(parts[3])
        const guardH = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([span, guardH].some((n) => Number.isNaN(n) || n <= 0) || Number.isNaN(drop)) {
          throw new Error(`Invalid rakehoriz dimensions: ${url}`)
        }
        {
          const built = buildRakeHorizGeometry(span, drop, guardH, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
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

/**
 * Outdoor base cabinet: carcass + stainless drawer bank on +X (faces into bar) + countertop.
 * WIDTH = E–W depth from wall, DEPTH = N–S run along wall.
 */
function buildSsBaseCabinetGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const body: THREE.BufferGeometry[] = []
  const steel: THREE.BufferGeometry[] = []
  const top: THREE.BufferGeometry[] = []
  const halfD = depth / 2
  const toe = Math.min(9, height * 0.1)
  const topH = Math.min(5, height * 0.06)
  const carcH = height - toe - topH

  // Carcass
  pushBox(body, width * 0.98, carcH, depth, 0, toe, 0)
  pushBox(body, width * 0.9, toe, depth * 0.88, 0, 0, 0)

  // Stainless drawer columns along +X face
  const cols = Math.max(2, Math.round(depth / 55))
  const colD = (depth * 0.92) / cols
  const rows = 3
  const rowH = (carcH * 0.88) / rows
  for (let c = 0; c < cols; c++) {
    const z = -halfD + depth * 0.04 + (c + 0.5) * colD
    for (let r = 0; r < rows; r++) {
      const y = toe + carcH * 0.06 + r * rowH
      pushBox(steel, 2.2, rowH * 0.82, colD * 0.88, width / 2 - 1.2, y, z)
      // Horizontal pull
      pushBox(steel, 2.8, 1.4, colD * 0.55, width / 2 + 0.6, y + rowH * 0.55, z)
    }
  }

  // Countertop over drawers
  pushBox(top, width + 3, topH * 0.7, depth + 4, 1, toe + carcH, 0)
  pushBox(top, width + 4, topH * 0.35, depth + 5, 1, toe + carcH + topH * 0.65, 0)

  const geometry = mergeGeometriesGrouped([
    { geoms: body, materialIndex: 0 },
    { geoms: steel, materialIndex: 1 },
    { geoms: top, materialIndex: 2 }
  ])
  for (const g of [...body, ...steel, ...top]) g.dispose()
  return {
    geometry,
    materials: [
      phong(hex || 'e8e4df', { shininess: 12 }),
      phong('c0c6cc', {
        shininess: 70,
        specular: new THREE.Color(0xffffff)
      }),
      phong('5c4033', { shininess: 30, specular: new THREE.Color(0x444444) })
    ]
  }
}

/**
 * Upper wall cabinet: stainless doors on +X. WIDTH = E–W depth, DEPTH = N–S run.
 */
function buildSsWallCabinetGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const body: THREE.BufferGeometry[] = []
  const steel: THREE.BufferGeometry[] = []
  const halfD = depth / 2

  pushBox(body, width * 0.98, height, depth, 0, 0, 0)
  // Top/bottom trim
  pushBox(body, width + 1, 2.5, depth + 1, 0, height - 1.2, 0)
  pushBox(body, width + 1, 2.5, depth + 1, 0, 0, 0)

  const doors = Math.max(2, Math.round(depth / 50))
  const dh = height * 0.86
  const dd = (depth * 0.92) / doors
  for (let i = 0; i < doors; i++) {
    const z = -halfD + depth * 0.04 + (i + 0.5) * dd
    pushBox(steel, 2, dh, dd * 0.9, width / 2 - 1, height * 0.07, z)
    // Vertical handle
    pushBox(steel, 2.6, Math.min(18, height * 0.22), 1.5, width / 2 + 0.5, height * 0.45, z + dd * 0.28)
  }

  const geometry = mergeGeometriesGrouped([
    { geoms: body, materialIndex: 0 },
    { geoms: steel, materialIndex: 1 }
  ])
  for (const g of [...body, ...steel]) g.dispose()
  return {
    geometry,
    materials: [
      phong(hex || 'd1d5db', { shininess: 40, specular: new THREE.Color(0x888888) }),
      phong('b8c0c8', {
        shininess: 75,
        specular: new THREE.Color(0xffffff)
      })
    ]
  }
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

/**
 * Outdoor split-system AC condenser — Carrier/Trane-style square cabinet.
 * Top discharge fan + grille, louvered coil faces, corner posts, feet, line-set stubs.
 * WIDTH×DEPTH footprint, HEIGHT overall (cabinet on feet).
 */
function buildAcUnitGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const cabinet: THREE.BufferGeometry[] = []
  const coil: THREE.BufferGeometry[] = []
  const grille: THREE.BufferGeometry[] = []
  const dark: THREE.BufferGeometry[] = []

  const W = Math.max(width, 50)
  const D = Math.max(depth, 50)
  const H = Math.max(height, 60)
  const halfW = W / 2
  const halfD = D / 2
  const footH = Math.min(8, H * 0.08)
  const topH = Math.min(6, H * 0.07)
  const bodyH = H - footH - topH
  const post = Math.max(3.2, Math.min(W, D) * 0.055)
  const skin = 1.8

  // Rubber/plastic feet
  for (const x of [-halfW + 8, halfW - 8]) {
    for (const z of [-halfD + 8, halfD - 8]) {
      pushBox(dark, 7, footH, 7, x, 0, z)
    }
  }

  // Corner posts (full cabinet height)
  for (const x of [-halfW + post / 2, halfW - post / 2]) {
    for (const z of [-halfD + post / 2, halfD - post / 2]) {
      pushBox(cabinet, post, bodyH + topH * 0.4, post, x, footH, z)
    }
  }

  // Solid service panel (−Z / toward house wall) + control box bump
  pushBox(cabinet, W - post * 2.2, bodyH * 0.92, skin, 0, footH + bodyH * 0.04, -halfD + skin / 2)
  pushBox(cabinet, W * 0.28, bodyH * 0.35, 4, halfW * 0.35, footH + bodyH * 0.4, -halfD + 3)
  // Brand badge plate
  pushBox(dark, W * 0.22, 6, 0.8, 0, footH + bodyH * 0.72, -halfD + skin + 0.5)

  // Louvered coil wraps on +X, −X, +Z (yard-facing)
  const louverPitch = 3.2
  const louverCount = Math.max(8, Math.floor(bodyH / louverPitch))
  const coilInset = post * 0.85
  for (let i = 0; i < louverCount; i++) {
    const y = footH + 4 + i * louverPitch
    // +Z face
    pushBox(coil, W - post * 2, 1.4, 1.2, 0, y, halfD - 1)
    // ±X faces
    pushBox(coil, 1.2, 1.4, D - post * 2, -halfW + 1, y, 0)
    pushBox(coil, 1.2, 1.4, D - post * 2, halfW - 1, y, 0)
  }
  // Coil mesh backing (darker bronze/copper look)
  pushBox(coil, W - post * 2.4, bodyH * 0.88, skin * 0.6, 0, footH + bodyH * 0.06, halfD - coilInset)
  pushBox(coil, skin * 0.6, bodyH * 0.88, D - post * 2.4, -halfW + coilInset, footH + bodyH * 0.06, 0)
  pushBox(coil, skin * 0.6, bodyH * 0.88, D - post * 2.4, halfW - coilInset, footH + bodyH * 0.06, 0)

  // Top pan
  pushBox(cabinet, W - 1, topH * 0.55, D - 1, 0, footH + bodyH, 0)

  // Top fan orifice ring + hub + blades
  const fanR = Math.min(W, D) * 0.36
  {
    const ring = new THREE.TorusGeometry(fanR, 1.6, 8, 32)
    ring.rotateX(Math.PI / 2)
    ring.translate(0, footH + bodyH + topH * 0.55, 0)
    grille.push(ring)
  }
  pushCyl(dark, fanR * 0.14, 4, 0, footH + bodyH + topH * 0.2, 0, 'y')
  // 3 fan blades
  for (let i = 0; i < 3; i++) {
    const ang = (i / 3) * Math.PI * 2
    const blade = new THREE.BoxGeometry(fanR * 1.55, 1.2, fanR * 0.28)
    blade.translate(fanR * 0.42, 0, 0)
    blade.rotateY(ang)
    blade.translate(0, footH + bodyH + topH * 0.65, 0)
    grille.push(blade)
  }
  // Wire grille bars (radial + rings)
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2
    const bar = new THREE.BoxGeometry(fanR * 1.9, 0.7, 0.7)
    bar.rotateY(ang)
    bar.translate(0, footH + bodyH + topH * 0.85, 0)
    grille.push(bar)
  }
  for (const rr of [0.35, 0.65, 0.95]) {
    const ring = new THREE.TorusGeometry(fanR * rr, 0.55, 6, 28)
    ring.rotateX(Math.PI / 2)
    ring.translate(0, footH + bodyH + topH * 0.85, 0)
    grille.push(ring)
  }

  // Line-set stubs on −Z (toward house)
  pushCyl(dark, 1.1, 14, -halfW * 0.25, footH + bodyH * 0.25, -halfD - 5, 'z')
  pushCyl(dark, 1.8, 14, halfW * 0.15, footH + bodyH * 0.22, -halfD - 5, 'z')
  // Electrical whip conduit
  pushCyl(dark, 1.3, 18, halfW * 0.55, footH + bodyH * 0.55, -halfD - 4, 'z')

  const geometry = mergeGeometriesGrouped([
    { geoms: cabinet, materialIndex: 0 },
    { geoms: coil, materialIndex: 1 },
    { geoms: grille, materialIndex: 2 },
    { geoms: dark, materialIndex: 3 }
  ])
  for (const g of [...cabinet, ...coil, ...grille, ...dark]) g.dispose()
  return {
    geometry,
    materials: [
      phong(hex || '6b7280', { shininess: 45, specular: new THREE.Color(0x999999) }),
      phong('5b6b5b', { shininess: 20 }), // coil fins
      phong('374151', { shininess: 60, specular: new THREE.Color(0xaaaaaa) }), // grille
      phong('1f2937', { shininess: 25 })
    ]
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

/**
 * Inground pool: concrete coping, plaster basin, waterline tile, water, shallow-end steps.
 * HEIGHT is visual shell height above deck (coping top); basin reads recessed via water fill.
 */
function buildPoolGeometry(
  width: number,
  height: number,
  depth: number,
  plasterHex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const concrete: THREE.BufferGeometry[] = []
  const plaster: THREE.BufferGeometry[] = []
  const tile: THREE.BufferGeometry[] = []
  const water: THREE.BufferGeometry[] = []
  const metal: THREE.BufferGeometry[] = []

  const halfW = width / 2
  const halfD = depth / 2
  const cope = Math.min(18, Math.min(width, depth) * 0.028)
  const wall = Math.min(14, cope * 0.75)
  const basinH = Math.max(height * 0.85, height - 6)
  const waterH = basinH * 0.72
  const floorT = Math.min(6, height * 0.12)

  // Outer concrete bond beam / coping ring
  pushBox(concrete, width, height * 0.22, cope, 0, basinH * 0.78, -halfD + cope / 2)
  pushBox(concrete, width, height * 0.22, cope, 0, basinH * 0.78, halfD - cope / 2)
  pushBox(concrete, cope, height * 0.22, depth - cope * 2, -halfW + cope / 2, basinH * 0.78, 0)
  pushBox(concrete, cope, height * 0.22, depth - cope * 2, halfW - cope / 2, basinH * 0.78, 0)
  // Coping cap (slightly proud)
  pushBox(concrete, width + 4, 4, depth + 4, 0, basinH + 1, 0)

  // Interior plaster walls + floor (open top)
  const innerW = width - cope * 2
  const innerD = depth - cope * 2
  pushBox(plaster, innerW, floorT, innerD, 0, 0, 0)
  pushBox(plaster, wall, basinH, innerD, -halfW + cope + wall / 2, 0, 0)
  pushBox(plaster, wall, basinH, innerD, halfW - cope - wall / 2, 0, 0)
  pushBox(plaster, innerW - wall * 2, basinH, wall, 0, 0, -halfD + cope + wall / 2)
  pushBox(plaster, innerW - wall * 2, basinH, wall, 0, 0, halfD - cope - wall / 2)

  // Waterline tile band
  const tileH = Math.min(12, basinH * 0.18)
  const tileY = waterH - tileH * 0.35
  pushBox(tile, 1.5, tileH, innerD - wall * 2, -halfW + cope + wall + 0.2, tileY, 0)
  pushBox(tile, 1.5, tileH, innerD - wall * 2, halfW - cope - wall - 0.2, tileY, 0)
  pushBox(tile, innerW - wall * 2, tileH, 1.5, 0, tileY, -halfD + cope + wall + 0.2)
  pushBox(tile, innerW - wall * 2, tileH, 1.5, 0, tileY, halfD - cope - wall - 0.2)

  // Water volume + surface highlight
  const ww = innerW - wall * 2.4
  const wd = innerD - wall * 2.4
  pushBox(water, ww, waterH - floorT, wd, 0, floorT, 0)
  pushBox(water, ww * 0.99, 1.4, wd * 0.99, 0, waterH - 0.5, 0)

  // Shallow-end steps at +X (east)
  const stepW = Math.min(90, ww * 0.22)
  const steps = 3
  for (let i = 0; i < steps; i++) {
    const sh = floorT + ((i + 1) / steps) * (waterH * 0.55)
    const sx = halfW - cope - wall - stepW / 2 - i * (stepW * 0.35)
    pushBox(plaster, stepW * 0.85, sh, wd * 0.55, sx, 0, 0)
  }

  // Skimmer faces mid long sides (−Z / +Z)
  pushBox(metal, 28, 10, 3, 0, waterH - 8, -halfD + cope + wall - 0.5)
  pushBox(metal, 28, 10, 3, 0, waterH - 8, halfD - cope - wall + 0.5)
  // Drain grate center
  pushBox(metal, 18, 1.2, 18, 0, floorT + 0.5, 0)

  const geometry = mergeGeometriesGrouped([
    { geoms: concrete, materialIndex: 0 },
    { geoms: plaster, materialIndex: 1 },
    { geoms: tile, materialIndex: 2 },
    { geoms: water, materialIndex: 3 },
    { geoms: metal, materialIndex: 4 }
  ])
  for (const g of [...concrete, ...plaster, ...tile, ...water, ...metal]) g.dispose()

  return {
    geometry,
    materials: [
      phong('9ca3af', { shininess: 12, specular: new THREE.Color(0x444444) }),
      phong(plasterHex || 'dbeafe', { shininess: 35, specular: new THREE.Color(0x88aacc) }),
      phong('e2e8f0', { shininess: 50, specular: new THREE.Color(0xffffff) }),
      phong('38bdf8', {
        transparent: true,
        opacity: 0.52,
        depthWrite: false,
        shininess: 95,
        specular: new THREE.Color(0xa5f3fc)
      }),
      phong('64748b', { shininess: 40 })
    ]
  }
}

/** Automatic pool-cover housing: aluminum lid spanning the short end of the pool. */
function buildCoverBoxGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const body: THREE.BufferGeometry[] = []
  const accent: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const halfD = depth / 2

  // Main lid slab
  pushBox(body, width, height * 0.55, depth, 0, height * 0.35, 0)
  // Side cheeks
  pushBox(body, 4, height, depth * 0.98, -halfW + 2, 0, 0)
  pushBox(body, 4, height, depth * 0.98, halfW - 2, 0, 0)
  // End plates (E–W faces)
  pushBox(body, width, height, 3, 0, 0, -halfD + 1.5)
  pushBox(body, width, height * 0.7, 3, 0, 0, halfD - 1.5)

  // Lid seam ribs
  const ribs = Math.max(3, Math.round(width / 35))
  for (let i = 0; i < ribs; i++) {
    const x = -halfW + 8 + (i + 0.5) * ((width - 16) / ribs)
    pushBox(accent, 1.2, height * 0.12, depth * 0.92, x, height * 0.78, 0)
  }
  // Handle / latch strip
  pushBox(accent, width * 0.35, 2, 2.5, 0, height * 0.9, halfD - 2)

  const geometry = mergeGeometriesGrouped([
    { geoms: body, materialIndex: 0 },
    { geoms: accent, materialIndex: 1 }
  ])
  for (const g of [...body, ...accent]) g.dispose()
  return {
    geometry,
    materials: [
      phong(hex || '94a3b8', { shininess: 55, specular: new THREE.Color(0xcccccc) }),
      phong('64748b', { shininess: 40 })
    ]
  }
}

/**
 * Pool-house gable roof: ridge along +X (E–W), standing-seam ribs, white fascia.
 * HEIGHT = ridge rise above eave plane (geometry sits with eaves at y=0).
 */
function buildPoolHouseRoofGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const metal: THREE.BufferGeometry[] = []
  const fascia: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const halfD = depth / 2
  const pitch = Math.atan2(height, halfD)
  const slopeLen = Math.hypot(halfD, height)
  const panelT = 3.2

  // North & south roof planes (rotated about X)
  for (const side of [-1, 1] as const) {
    const g = new THREE.BoxGeometry(width * 0.98, panelT, slopeLen)
    g.rotateX(side * pitch)
    g.translate(0, height / 2, side * (halfD / 2))
    metal.push(g)
  }

  // Standing-seam ribs along slope (keep below ridge — long boxes + rotateX used to spike as “antennas”)
  const seams = Math.max(6, Math.round(width / 55))
  const seamLen = slopeLen * 0.88
  for (let i = 0; i < seams; i++) {
    const x = -halfW + 12 + (i + 0.5) * ((width - 24) / seams)
    for (const side of [-1, 1] as const) {
      const g = new THREE.BoxGeometry(1.8, 3.2, seamLen)
      g.rotateX(side * pitch)
      // Bias toward eave so the uphill end stays under the ridge cap
      g.translate(x, height * 0.42 + 1.0, side * (halfD * 0.52))
      metal.push(g)
    }
  }

  // Ridge cap
  pushBox(metal, width * 0.99, 5, 8, 0, height - 1, 0)

  // White fascia along eaves only (no oversized barge spikes)
  pushBox(fascia, width + 6, 10, 3.5, 0, 1, -halfD - 0.5)
  pushBox(fascia, width + 6, 10, 3.5, 0, 1, halfD + 0.5)
  // Thin gable barge boards flush to roof ends
  pushBox(fascia, 3.5, height * 0.55, 8, -halfW + 1, height * 0.2, 0)
  pushBox(fascia, 3.5, height * 0.55, 8, halfW - 1, height * 0.2, 0)
  // Soffit under eaves
  pushBox(fascia, width * 0.98, 2, 12, 0, 0.2, -halfD + 4)
  pushBox(fascia, width * 0.98, 2, 12, 0, 0.2, halfD - 4)

  const geometry = mergeGeometriesGrouped([
    { geoms: metal, materialIndex: 0 },
    { geoms: fascia, materialIndex: 1 }
  ])
  for (const g of [...metal, ...fascia]) g.dispose()
  return {
    geometry,
    materials: [
      phong(hex || '1a1a1a', { shininess: 45, specular: new THREE.Color(0x666666) }),
      phong('f5f5f4', { shininess: 8 })
    ]
  }
}

/**
 * L-shaped stacked-stone outdoor bar (ref photo).
 * WIDTH = E–W thickness (≈30″), DEPTH = N–S run (bartender aisle to the −X / shared wall).
 * Short return at −Z (north / open face) extends +X (east toward pool).
 */
function buildStoneBarGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const stoneA: THREE.BufferGeometry[] = []
  const stoneB: THREE.BufferGeometry[] = []
  const stoneC: THREE.BufferGeometry[] = []
  const wood: THREE.BufferGeometry[] = []
  const edge: THREE.BufferGeometry[] = []

  const halfW = width / 2
  const halfD = depth / 2
  const returnLen = Math.min(width * 1.6, depth * 0.45)
  const courseH = Math.max(6.5, height / 12)

  const masses: { w: number; d: number; x: number; z: number }[] = [
    // Main N–S run (guest face +X / east)
    { w: width, d: depth, x: 0, z: 0 },
    // North return toward pool (+X) at open face (−Z)
    { w: returnLen, d: width * 0.92, x: halfW + returnLen / 2 - 2, z: -halfD + width * 0.4 }
  ]

  for (const m of masses) {
    const courses = Math.max(6, Math.round(height / courseH))
    for (let c = 0; c < courses; c++) {
      const y = c * courseH
      const h = Math.min(courseH * 0.82, height - y)
      const target = c % 3 === 0 ? stoneA : c % 3 === 1 ? stoneB : stoneC
      // Offset courses so joints don't align (stacked stone, not siding)
      const xOff = (c % 2 === 0 ? -1 : 1) * (2.2 + (c % 3))
      pushBox(target, m.w * 0.97, h, m.d * 0.97, m.x + xOff * 0.15, y, m.z)
      const joints = 2 + (c % 3)
      for (let j = 0; j < joints; j++) {
        const along = m.d > m.w
        if (along) {
          const jz = m.z - m.d * 0.38 + ((j + 0.35) / joints) * m.d * 0.75
          pushBox(target, m.w * 0.55, h * 0.9, 1.2, m.x + (c % 2) * 2, y, jz)
        } else {
          const jx = m.x - m.w * 0.38 + ((j + 0.35) / joints) * m.w * 0.75
          pushBox(target, 1.2, h * 0.9, m.d * 0.55, jx, y, m.z + (c % 2) * 2)
        }
      }
    }
  }

  // Wood top + white edge over L
  const topW = width + returnLen * 0.9
  const topD = depth + 8
  const topX = returnLen * 0.32
  pushBox(wood, topW, 5.5, topD, topX, height, 0)
  pushBox(edge, topW + 3.5, 2.6, topD + 3.5, topX, height + 5.2, 0)

  const geometry = mergeGeometriesGrouped([
    { geoms: stoneA, materialIndex: 0 },
    { geoms: stoneB, materialIndex: 1 },
    { geoms: stoneC, materialIndex: 2 },
    { geoms: wood, materialIndex: 3 },
    { geoms: edge, materialIndex: 4 }
  ])
  for (const g of [...stoneA, ...stoneB, ...stoneC, ...wood, ...edge]) g.dispose()

  const base = hex || 'a89880'
  return {
    geometry,
    materials: [
      phong(base, { shininess: 6 }),
      phong('7a6a58', { shininess: 6 }),
      phong('c4b49a', { shininess: 6 }),
      phong('5c4033', { shininess: 28, specular: new THREE.Color(0x444444) }),
      phong('f5f5f4', { shininess: 18 })
    ]
  }
}

/** Dark wood X-brace door with 6-lite upper grid and black strap hinges. */
function buildPoolHouseDoorGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const wood: THREE.BufferGeometry[] = []
  const glass: THREE.BufferGeometry[] = []
  const iron: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const t = Math.max(depth, 4)

  pushBox(wood, width, height, t, 0, 0, 0)
  // Upper 6-lite grid
  const liteTop = height * 0.62
  const liteH = height * 0.32
  const paneW = (width - 10) / 3
  const paneH = (liteH - 6) / 2
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const x = -halfW + 5 + (col + 0.5) * paneW
      const y = liteTop + 3 + (row + 0.5) * paneH
      pushBox(glass, paneW * 0.72, paneH * 0.7, t * 0.4, x, y, t * 0.15)
    }
  }
  // Mullions
  pushBox(wood, width * 0.92, 2.5, t * 1.05, 0, liteTop + liteH / 2, 0)
  pushBox(wood, 2.5, liteH, t * 1.05, -paneW * 0.5, liteTop, 0)
  pushBox(wood, 2.5, liteH, t * 1.05, paneW * 0.5, liteTop, 0)
  pushBox(wood, width * 0.92, 3, t * 1.05, 0, liteTop, 0)

  // X-brace lower panel
  const lowH = height * 0.55
  const brace = new THREE.BoxGeometry(width * 0.72, 4, t * 1.1)
  brace.rotateZ(Math.atan2(lowH * 0.7, width * 0.55))
  brace.translate(0, lowH * 0.45, 0)
  wood.push(brace)
  const brace2 = new THREE.BoxGeometry(width * 0.72, 4, t * 1.1)
  brace2.rotateZ(-Math.atan2(lowH * 0.7, width * 0.55))
  brace2.translate(0, lowH * 0.45, 0)
  wood.push(brace2)
  // Lower rail
  pushBox(wood, width * 0.92, 4, t * 1.05, 0, lowH * 0.08, 0)
  pushBox(wood, width * 0.92, 4, t * 1.05, 0, height * 0.58, 0)

  // Strap hinges (−X) + handle (+X)
  for (const hy of [height * 0.25, height * 0.72]) {
    pushBox(iron, 14, 3.5, 1.5, -halfW + 7, hy, t * 0.55)
    pushBox(iron, 3, 3.5, 1.5, -halfW + 1.5, hy, t * 0.55)
  }
  pushCyl(iron, 1.6, 12, halfW - 6, height * 0.42, t * 0.6, 'y')

  const geometry = mergeGeometriesGrouped([
    { geoms: wood, materialIndex: 0 },
    { geoms: glass, materialIndex: 1 },
    { geoms: iron, materialIndex: 2 }
  ])
  for (const g of [...wood, ...glass, ...iron]) g.dispose()
  return {
    geometry,
    materials: [
      phong(hex || '3b2f2f', { shininess: 22 }),
      phong('bae6fd', {
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
        shininess: 80,
        specular: new THREE.Color(0xffffff)
      }),
      phong('1a1a1a', { shininess: 50, specular: new THREE.Color(0x888888) })
    ]
  }
}

/**
 * Decorative east-gable Y-truss (local X = span, Y = up, thin Z):
 *   1) horizontal chord = WIDTH
 *   2) one center king post (straight) from inside the chord up to tip height
 *   3) two arms splayed ±40° from vertical, heels on the **outer faces** of the king
 *      (never stacked on x=0 — that read as a doubled/broken king at the ridge)
 *
 * DEPTH is nominal member size in cm: clamp to standard 4×4–6×6 (8.89–13.97).
 * All members share one color (default white). Bbox center stays on chord mid-height.
 */
function buildYTrussGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const wood: THREE.BufferGeometry[] = []
  // Standard dressed lumber: 4×4 (3.5″) … 6×6 (5.5″)
  const S = Math.min(13.97, Math.max(8.89, depth))
  const chordH = S
  const W = Math.max(width, S * 4)

  // Horizontal chord — bottom at y=0
  pushBox(wood, W, chordH, S, 0, 0, 0)

  const ang = (40 * Math.PI) / 180
  const len = Math.max(height, S)
  const kingH = len * Math.cos(ang)

  // Single king post: bears into the chord, tip at arm tip height
  const kingOverlap = chordH * 0.7
  pushBox(wood, S, kingH + kingOverlap, S, 0, chordH - kingOverlap, 0)

  // Arms heel on king outer faces (not at x=0) so they don't double the king
  const heelX = S * 0.55
  for (const side of [-1, 1] as const) {
    const g = new THREE.BoxGeometry(S, len, S)
    g.translate(0, len / 2, 0)
    g.rotateZ(side * ang)
    g.translate(side * heelX, chordH, 0)
    wood.push(g)
  }

  const geometry = mergeGeometries(wood)
  for (const g of wood) g.dispose()

  geometry.computeBoundingBox()
  const bb = geometry.boundingBox!
  const chordMidY = chordH / 2
  const bbMidY = 0.5 * (bb.min.y + bb.max.y)
  geometry.translate(0, chordMidY - bbMidY, 0)

  return { geometry, materials: [phong(hex || 'f5f5f4', { shininess: 12 })] }
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

/**
 * Italian-cypress look — tall narrow taper of stacked cylinders + thin trunk.
 * Bound box = WIDTH × HEIGHT × DEPTH (cm). Foliage color from HEX.
 */
/**
 * Outdoor lounge chaise — head/back toward −Z, feet toward +Z (face the pool from north).
 * WIDTH = across, DEPTH = overall length, HEIGHT = backrest tip.
 */
function buildChaiseGeometry(
  width: number,
  height: number,
  depth: number,
  frameHex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const frame: THREE.BufferGeometry[] = []
  const cushion: THREE.BufferGeometry[] = []
  const W = Math.max(width, 50)
  const H = Math.max(height, 30)
  const D = Math.max(depth, 140)
  const halfW = W / 2
  const halfD = D / 2
  const seatH = Math.min(H * 0.38, 18)
  const frameT = 3.2
  const legH = Math.max(seatH * 0.55, 8)
  const seatLen = D * 0.62
  const backLen = D * 0.34

  // Legs
  const legInsetX = halfW - 6
  const legInsetZ = halfD - 10
  for (const x of [-legInsetX, legInsetX]) {
    for (const z of [-legInsetZ * 0.85, legInsetZ * 0.55]) {
      pushCyl(frame, 1.6, legH, x, 0, z, 'y')
    }
  }
  // Side rails
  pushBox(frame, frameT, 3, D * 0.92, -halfW + frameT, legH * 0.85, 0)
  pushBox(frame, frameT, 3, D * 0.92, halfW - frameT, legH * 0.85, 0)
  // Cross slats under seat
  for (let i = 0; i < 5; i++) {
    const z = -halfD + D * 0.12 + i * (seatLen / 5)
    pushBox(frame, W - 8, 2, 2.5, 0, legH * 0.9, z)
  }

  // Seat cushion (flat, toward +Z / feet)
  const seatZ = -halfD + backLen * 0.55 + seatLen / 2
  pushBox(cushion, W * 0.88, seatH * 0.7, seatLen * 0.92, 0, legH + 1, seatZ)

  // Reclined back cushion — hinged at seat; +rotateX lifts −Z end toward sky
  const backAngle = 0.55
  {
    const g = new THREE.BoxGeometry(W * 0.86, seatH * 0.65, backLen)
    g.translate(0, seatH * 0.32, -backLen / 2)
    g.rotateX(backAngle)
    g.translate(0, legH + seatH * 0.55, -halfD + backLen * 0.72)
    cushion.push(g)
  }
  // Back frame rails
  {
    for (const side of [-1, 1] as const) {
      const g = new THREE.BoxGeometry(frameT, 3, backLen * 0.95)
      g.translate(0, 1.5, -backLen * 0.45)
      g.rotateX(backAngle)
      g.translate(side * (halfW - 5), legH + seatH * 0.4, -halfD + backLen * 0.7)
      frame.push(g)
    }
  }
  // Head pillow — up the reclined back (not flat on the deck)
  {
    const g = new THREE.BoxGeometry(W * 0.55, seatH * 0.45, 14)
    g.translate(0, seatH * 0.5, -backLen * 0.75)
    g.rotateX(backAngle)
    g.translate(0, legH + seatH * 0.55, -halfD + backLen * 0.72)
    cushion.push(g)
  }

  const geometry = mergeGeometriesGrouped([
    { geoms: frame, materialIndex: 0 },
    { geoms: cushion, materialIndex: 1 }
  ])
  for (const g of [...frame, ...cushion]) g.dispose()
  // Reclined back dips below y=0; without this, floor centering puts legs on top.
  geometry.computeBoundingBox()
  const minY = geometry.boundingBox?.min.y ?? 0
  if (minY < 0) geometry.translate(0, -minY, 0)
  // User: bottom→top (handled above) then yaw 180°.
  geometry.rotateY(Math.PI)
  geometry.computeVertexNormals()
  return {
    geometry,
    materials: [
      phong(frameHex || '3f3f46', { shininess: 35, specular: new THREE.Color(0x666666) }),
      phong('f5f5f4', { shininess: 6 })
    ]
  }
}

/**
 * Plastic resin bar-height stool — low back, molded seat, faces +Z.
 * WIDTH = across, DEPTH = front-to-back, HEIGHT = overall (seat ~72% of H).
 */
function buildBarstoolGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const shell: THREE.BufferGeometry[] = []
  const metal: THREE.BufferGeometry[] = []
  const W = Math.max(width, 38)
  const H = Math.max(height, 90)
  const D = Math.max(depth, 42)
  const seatH = H * 0.72
  const seatT = Math.min(5, H * 0.05)
  const backH = H - seatH
  const halfW = W / 2
  const halfD = D / 2

  // Four splayed legs (not a pedestal) + cross stretchers / footrest
  const legR = Math.min(1.8, W * 0.035)
  const insetTop = Math.min(6, W * 0.12)
  const insetBot = Math.min(3, W * 0.06)
  const legTopY = seatH - seatT
  const corners: [number, number][] = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1]
  ]
  for (const [sx, sz] of corners) {
    const x0 = sx * (halfW - insetTop)
    const z0 = sz * (halfD * 0.72 - insetTop * 0.5)
    const x1 = sx * (halfW - insetBot)
    const z1 = sz * (halfD * 0.78 - insetBot * 0.3)
    // Approximate splay with a vertical cylinder at mid footprint + slight offset
    const xm = (x0 + x1) / 2
    const zm = (z0 + z1) / 2
    pushCyl(metal, legR, legTopY, xm, 0, zm, 'y')
    // Foot pad
    pushCyl(metal, legR * 1.6, 1.2, x1, 0, z1, 'y')
  }
  // Footrest ring / rails ~1/3 up
  const railY = seatH * 0.32
  const railX = halfW - insetBot - 2
  const railZ = halfD * 0.72 - 2
  pushCyl(metal, 0.9, railX * 2, 0, railY, railZ, 'x')
  pushCyl(metal, 0.9, railX * 2, 0, railY, -railZ, 'x')
  pushCyl(metal, 0.9, railZ * 2, railX, railY, 0, 'z')
  pushCyl(metal, 0.9, railZ * 2, -railX, railY, 0, 'z')

  // Molded seat pan
  pushBox(shell, W * 0.92, seatT, D * 0.78, 0, seatH - seatT, D * 0.02)
  // Slight waterfall front lip
  pushBox(shell, W * 0.88, seatT * 0.7, 3, 0, seatH - seatT * 1.4, halfD * 0.62)

  // Low back shell (toward −Z; sit facing +Z)
  pushBox(shell, W * 0.86, backH * 0.85, 3.2, 0, seatH, -halfD * 0.55)
  pushBox(shell, W * 0.7, backH * 0.35, 2.4, 0, seatH + backH * 0.55, -halfD * 0.52)

  const geometry = mergeGeometriesGrouped([
    { geoms: shell, materialIndex: 0 },
    { geoms: metal, materialIndex: 1 }
  ])
  for (const g of [...shell, ...metal]) g.dispose()
  const plastic = phong(hex || 'f8fafc', {
    shininess: 80,
    specular: new THREE.Color(0xffffff)
  })
  const legs = phong('64748b', { shininess: 55, specular: new THREE.Color(0xaaaaaa) })
  return { geometry, materials: [plastic, legs] }
}

/**
 * Ceiling / patio fan. WIDTH≈DEPTH = blade span (e.g. 52″). HEIGHT = canopy→blade drop.
 * Origin at blade plane; canopy near y=HEIGHT.
 */
function buildCeilingFanGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const metal: THREE.BufferGeometry[] = []
  const wood: THREE.BufferGeometry[] = []
  const span = Math.max(width, depth, 100)
  const H = Math.max(height, 50)
  const bladeLen = span * 0.42
  const bladeW = Math.min(14, span * 0.08)
  const motorR = Math.min(12, span * 0.08)
  const rodH = Math.max(H * 0.55, 40)
  const motorY = H - rodH - motorR * 0.3

  pushCyl(metal, motorR * 1.1, 3, 0, H - 3, 0, 'y')
  pushCyl(metal, 1.6, rodH, 0, motorY + motorR, 0, 'y')
  pushCyl(metal, motorR, motorR * 1.4, 0, motorY, 0, 'y')
  pushCyl(metal, motorR * 0.7, 4, 0, motorY + motorR * 0.9, 0, 'y')

  const n = 5
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2
    const g = new THREE.BoxGeometry(bladeW, 1.8, bladeLen)
    g.translate(0, 0, bladeLen / 2 + motorR * 0.6)
    g.rotateY(ang)
    g.translate(0, motorY + 2, 0)
    wood.push(g)
  }

  const geometry = mergeGeometriesGrouped([
    { geoms: metal, materialIndex: 0 },
    { geoms: wood, materialIndex: 1 }
  ])
  for (const g of [...metal, ...wood]) g.dispose()
  return {
    geometry,
    materials: [
      phong(hex || '4b5563', { shininess: 55, specular: new THREE.Color(0x888888) }),
      phong('5c4033', { shininess: 18 })
    ]
  }
}

/**
 * Large cast-concrete box planter — thick walls, lipped rim, soil fill on top.
 * WIDTH×DEPTH footprint, HEIGHT overall.
 */
function buildPlanterGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const concrete: THREE.BufferGeometry[] = []
  const soil: THREE.BufferGeometry[] = []
  const W = Math.max(width, 50)
  const D = Math.max(depth, 50)
  const H = Math.max(height, 40)
  const wall = Math.min(8, Math.min(W, D) * 0.12)
  const rim = Math.min(5, H * 0.1)
  const soilH = Math.min(10, H * 0.18)

  // Outer shell
  pushBox(concrete, W, H - rim, D, 0, 0, 0)
  // Rim lip (slightly wider)
  pushBox(concrete, W + 4, rim, D + 4, 0, H - rim, 0)
  // Hollow cue: inner well darker soil
  pushBox(soil, W - wall * 2, soilH, D - wall * 2, 0, H - rim - soilH * 0.3, 0)

  const geometry = mergeGeometriesGrouped([
    { geoms: concrete, materialIndex: 0 },
    { geoms: soil, materialIndex: 1 }
  ])
  for (const g of [...concrete, ...soil]) g.dispose()
  return {
    geometry,
    materials: [
      phong(hex || 'a8a29e', { shininess: 12, specular: new THREE.Color(0x555555) }),
      phong('3f2e1f', { shininess: 4 })
    ]
  }
}

/**
 * Midwest “patio palm” — trunk + radiating fan fronds (bring indoors for winter).
 * Not a true palm species mesh; reads as palm-like leaves for container tropical look.
 * WIDTH/DEPTH = frond span, HEIGHT = overall including trunk.
 */
function buildPalmGeometry(
  width: number,
  height: number,
  depth: number,
  foliageHex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const trunkGeoms: THREE.BufferGeometry[] = []
  const frondGeoms: THREE.BufferGeometry[] = []
  const W = Math.max(width, 80)
  const D = Math.max(depth, 80)
  const H = Math.max(height, 200)
  const span = Math.min(W, D)

  const trunkH = H * 0.55
  const trunkRBot = Math.max(span * 0.045, 5)
  const trunkRTop = trunkRBot * 0.65
  {
    const g = new THREE.CylinderGeometry(trunkRTop, trunkRBot, trunkH, 12)
    g.translate(0, trunkH / 2, 0)
    trunkGeoms.push(g)
  }
  // Fibrous crown shaft
  pushCyl(trunkGeoms, trunkRTop * 1.15, H * 0.06, 0, trunkH * 0.92, 0, 'y')

  // Fan fronds — tapered cones (not box blades) radiating from crown
  const frondCount = 16
  const frondLen = span * 0.52
  const frondW = Math.max(6, span * 0.055)
  const crownY = trunkH + H * 0.02
  for (let i = 0; i < frondCount; i++) {
    const yaw = (i / frondCount) * Math.PI * 2 + (i % 2) * 0.07
    const lift = -0.42 - (i % 4) * 0.06
    // Cone tip at outer end; base toward crown
    const g = new THREE.ConeGeometry(frondW * 0.55, frondLen, 7, 1, false)
    g.rotateX(Math.PI / 2) // tip → +Z
    g.translate(0, 0, frondLen / 2 + trunkRTop * 0.6)
    g.rotateX(lift)
    g.rotateY(yaw)
    g.translate(0, crownY, 0)
    frondGeoms.push(g)
  }
  // Shorter upright spears at crown
  for (let i = 0; i < 6; i++) {
    const yaw = (i / 6) * Math.PI * 2 + 0.15
    const g = new THREE.ConeGeometry(frondW * 0.35, frondLen * 0.4, 6, 1, false)
    g.rotateX(Math.PI / 2)
    g.translate(0, 0, frondLen * 0.18)
    g.rotateX(-1.05)
    g.rotateY(yaw)
    g.translate(0, crownY + 6, 0)
    frondGeoms.push(g)
  }

  const foliageMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(`#${foliageHex}`),
    specular: new THREE.Color(0x1a2e1a),
    shininess: 8,
    side: THREE.DoubleSide
  })
  const trunkMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0x6b5344),
    specular: new THREE.Color(0x333333),
    shininess: 6,
    side: THREE.DoubleSide
  })

  const geometry = mergeGeometriesGrouped([
    { geoms: frondGeoms, materialIndex: 0 },
    { geoms: trunkGeoms, materialIndex: 1 }
  ])
  for (const g of [...frondGeoms, ...trunkGeoms]) g.dispose()
  return { geometry, materials: [foliageMat, trunkMat] }
}

/**
 * Christmas-tree pine — stacked ConeGeometry tiers (wide base → tip), not a solid column.
 * Each tier overhangs the one above so the silhouette reads as classic layered pine.
 */
function buildPineGeometry(
  width: number,
  height: number,
  depth: number,
  foliageHex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const foliageGeoms: THREE.BufferGeometry[] = []
  const trunkGeoms: THREE.BufferGeometry[] = []

  const W = Math.max(width, 40)
  const D = Math.max(depth, 40)
  const H = Math.max(height, 160)
  const rMax = Math.min(W, D) / 2

  // Clear bole ~half the prior “stilt” height — rocks still readable, not floating canopy.
  // ~16% of height, at least ~0.9m.
  const trunkH = Math.min(Math.max(H * 0.16, 90), H * 0.22)
  const trunkR = Math.max(rMax * 0.07, 3.5)
  {
    const g = new THREE.CylinderGeometry(trunkR * 0.7, trunkR * 1.15, trunkH, 10)
    g.translate(0, trunkH / 2, 0)
    trunkGeoms.push(g)
  }

  // Foliage starts near top of trunk
  const tiers = 6
  const canopyTop = H
  const canopyBot = trunkH * 0.88
  const canopyH = Math.max(canopyTop - canopyBot, H * 0.55)
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1) // 0 = bottom, 1 = tip
    const radius = rMax * (1 - t * 0.88)
    const coneH = canopyH * (0.28 - t * 0.03)
    const yBase = canopyBot + t * canopyH * 0.78
    const g = new THREE.ConeGeometry(Math.max(radius, 3), Math.max(coneH, 12), 16)
    g.translate(0, yBase + coneH / 2, 0)
    foliageGeoms.push(g)
  }

  const foliageMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(`#${foliageHex}`),
    specular: new THREE.Color(0x1a2e1a),
    shininess: 5,
    side: THREE.DoubleSide
  })
  const trunkMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0x6b4423),
    specular: new THREE.Color(0x222222),
    shininess: 4,
    side: THREE.DoubleSide
  })

  const geometry = mergeGeometriesGrouped([
    { geoms: foliageGeoms, materialIndex: 0 },
    { geoms: trunkGeoms, materialIndex: 1 }
  ])
  for (const g of [...foliageGeoms, ...trunkGeoms]) g.dispose()
  return { geometry, materials: [foliageMat, trunkMat] }
}

function buildCypressGeometry(
  width: number,
  height: number,
  depth: number,
  foliageHex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const foliageGeoms: THREE.BufferGeometry[] = []
  const trunkGeoms: THREE.BufferGeometry[] = []

  const addCyl = (
    dest: THREE.BufferGeometry[],
    rTop: number,
    rBot: number,
    h: number,
    x: number,
    y: number,
    z: number,
    segs = 14
  ) => {
    const g = new THREE.CylinderGeometry(Math.max(rTop, 0.4), Math.max(rBot, 0.4), h, segs)
    g.translate(x, y + h / 2, z)
    dest.push(g)
  }

  const W = Math.max(width, 20)
  const D = Math.max(depth, 20)
  const H = Math.max(height, 120)
  const rMax = Math.min(W, D) / 2

  const trunkH = Math.min(H * 0.1, 28)
  const trunkR = Math.max(rMax * 0.12, 2.2)
  addCyl(trunkGeoms, trunkR * 0.85, trunkR, trunkH, 0, 0, 0, 10)

  // Columnar taper — Italian cypress silhouette (narrow, pointed tip)
  const foliageH = H - trunkH * 0.55
  const bands = 7
  let y = trunkH * 0.45
  for (let i = 0; i < bands; i++) {
    const t0 = i / bands
    const t1 = (i + 1) / bands
    // Wider near base of canopy, needle tip at top
    const rBot = rMax * (1 - t0 * 0.88)
    const rTop = rMax * (1 - t1 * 0.92)
    const h = foliageH / bands
    // Slight vertical squash so bands nest visually
    addCyl(foliageGeoms, rTop, rBot, h * 1.05, 0, y - h * 0.04, 0, 12)
    y += h
  }
  // Soft tip sphere
  {
    const tipR = Math.max(rMax * 0.08, 2)
    const tip = new THREE.SphereGeometry(tipR, 10, 8)
    tip.translate(0, H - tipR * 0.35, 0)
    foliageGeoms.push(tip)
  }

  const foliageMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(`#${foliageHex}`),
    specular: new THREE.Color(0x1a2e1a),
    shininess: 6,
    side: THREE.DoubleSide
  })
  const trunkMat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(0x5c4033),
    specular: new THREE.Color(0x222222),
    shininess: 4,
    side: THREE.DoubleSide
  })

  const geometry = mergeGeometriesGrouped([
    { geoms: foliageGeoms, materialIndex: 0 },
    { geoms: trunkGeoms, materialIndex: 1 }
  ])
  for (const g of [...foliageGeoms, ...trunkGeoms]) g.dispose()
  return { geometry, materials: [foliageMat, trunkMat] }
}

/** Rounded landscape shrub — overlapping spheres. */
function buildShrubGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const geoms: THREE.BufferGeometry[] = []
  const W = Math.max(width, 20)
  const D = Math.max(depth, 20)
  const H = Math.max(height, 20)
  const rx = W / 2
  const rz = D / 2
  const ry = H / 2

  const addSphere = (sx: number, sy: number, sz: number, x: number, y: number, z: number) => {
    const g = new THREE.SphereGeometry(1, 12, 10)
    g.scale(sx, sy, sz)
    g.translate(x, y, z)
    geoms.push(g)
  }

  addSphere(rx * 0.95, ry * 0.9, rz * 0.95, 0, ry * 0.95, 0)
  addSphere(rx * 0.55, ry * 0.55, rz * 0.55, rx * 0.35, ry * 0.7, rz * 0.15)
  addSphere(rx * 0.5, ry * 0.5, rz * 0.5, -rx * 0.3, ry * 0.65, -rz * 0.2)
  addSphere(rx * 0.45, ry * 0.48, rz * 0.45, rx * 0.1, ry * 1.15, -rz * 0.25)
  addSphere(rx * 0.4, ry * 0.42, rz * 0.4, -rx * 0.15, ry * 1.05, rz * 0.3)

  const mat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(`#${hex}`),
    specular: new THREE.Color(0x1a2e1a),
    shininess: 5,
    side: THREE.DoubleSide
  })
  const geometry = mergeGeometriesGrouped([{ geoms, materialIndex: 0 }])
  for (const g of geoms) g.dispose()
  return { geometry, materials: [mat] }
}

/** Irregular boulder — stretched/offset spheres. */
function buildRockGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const geoms: THREE.BufferGeometry[] = []
  const W = Math.max(width, 15)
  const D = Math.max(depth, 15)
  const H = Math.max(height, 10)
  const rx = W / 2
  const rz = D / 2
  const ry = H / 2

  const addBlob = (sx: number, sy: number, sz: number, x: number, y: number, z: number) => {
    const g = new THREE.SphereGeometry(1, 10, 8)
    g.scale(sx, sy, sz)
    g.translate(x, y, z)
    geoms.push(g)
  }

  addBlob(rx * 0.95, ry * 0.85, rz * 0.9, 0, ry * 0.85, 0)
  addBlob(rx * 0.55, ry * 0.5, rz * 0.6, rx * 0.35, ry * 0.55, rz * 0.1)
  addBlob(rx * 0.5, ry * 0.55, rz * 0.45, -rx * 0.3, ry * 0.6, -rz * 0.15)
  addBlob(rx * 0.4, ry * 0.35, rz * 0.5, rx * 0.05, ry * 1.15, -rz * 0.2)

  const mat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(`#${hex}`),
    specular: new THREE.Color(0x444444),
    shininess: 12,
    side: THREE.DoubleSide
  })
  const geometry = mergeGeometriesGrouped([{ geoms, materialIndex: 0 }])
  for (const g of geoms) g.dispose()
  return { geometry, materials: [mat] }
}

/**
 * Straight deck guard — modern horizontal bars between newels (matches rakehoriz look).
 * Local: span on X (axisZ=false) or Z (axisZ=true); y=0 at bottom rail center.
 * Property-line fences are floorplan walls (vertical pickets) — do NOT use this for those.
 * IMPORTANT: Item recenters on bbox — saved `ypos` must be MESH CENTER.
 */
function buildGuardRunGeometry(
  span: number,
  guardH: number,
  axisZ: boolean,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const geoms: THREE.BufferGeometry[] = []
  const half = span / 2
  const newelW = 8.89
  const inset = newelW * 0.55
  const railSpan = Math.max(span - inset * 2, span * 0.85)
  const topRailT = 4
  const botRailT = 3.2
  const barT = 1.4
  const barCount = 7
  const topY = guardH
  const botY = 0

  const pushLevelRail = (y: number, thick: number) => {
    const g = axisZ
      ? new THREE.BoxGeometry(thick, thick, railSpan)
      : new THREE.BoxGeometry(railSpan, thick, thick)
    g.translate(0, y, 0)
    geoms.push(g)
  }

  pushLevelRail(topY, topRailT)
  pushLevelRail(botY, botRailT)
  for (let i = 1; i <= barCount; i++) {
    const y = topY - (i / (barCount + 1)) * (topY - botY)
    pushLevelRail(y, barT)
  }

  // Slim mid vertical support (reference-style)
  {
    const h = Math.max(topY - botY - topRailT, 10)
    const g = new THREE.BoxGeometry(1.2, h, 1.2)
    g.translate(0, (topY + botY) / 2, 0)
    geoms.push(g)
  }

  // End newels + caps
  const newelH = guardH + 10
  for (const s of [-half, half]) {
    const g = new THREE.BoxGeometry(newelW, newelH, newelW)
    if (axisZ) g.translate(0, newelH / 2, s)
    else g.translate(s, newelH / 2, 0)
    geoms.push(g)
    const cap = new THREE.ConeGeometry(newelW * 0.55, 5, 4)
    cap.rotateY(Math.PI / 4)
    if (axisZ) cap.translate(0, newelH + 2.5, s)
    else cap.translate(s, newelH + 2.5, 0)
    geoms.push(cap)
  }

  const mat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(`#${hex}`),
    specular: new THREE.Color(0x222222),
    shininess: 28,
    side: THREE.DoubleSide
  })
  const geometry = mergeGeometries(geoms)
  for (const g of geoms) g.dispose()
  return { geometry, materials: [mat] }
}

/**
 * Raked stair guard — top/bot rails follow DROP across SPAN (along X); +X is high end.
 * y=0 at the low-end (−X) bottom rail; pickets are vertical between rails.
 */
function buildRakeGuardGeometry(
  span: number,
  drop: number,
  guardH: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const geoms: THREE.BufferGeometry[] = []
  const railT = 3
  const picketW = 2.5
  const half = span / 2
  const segs = Math.max(8, Math.round(span / 28))

  const topYAt = (x: number) => {
    const t = (x + half) / span // 0 at −X (low), 1 at +X (high)
    return guardH + t * drop
  }
  const botYAt = (x: number) => topYAt(x) - guardH

  // Segmented rails approximate the rake (items only support Y rotation)
  for (let i = 0; i < segs; i++) {
    const x0 = -half + (span * i) / segs
    const x1 = -half + (span * (i + 1)) / segs
    const xm = (x0 + x1) / 2
    const len = x1 - x0
    for (const yOf of [topYAt, botYAt]) {
      const y = yOf(xm)
      const g = new THREE.BoxGeometry(len, railT, railT)
      g.translate(xm, y, 0)
      geoms.push(g)
    }
  }

  const picketStep = Math.max(span / 14, 20)
  for (let x = -half + picketStep * 0.5; x <= half - picketStep * 0.25; x += picketStep) {
    const top = topYAt(x)
    const bot = botYAt(x)
    const h = Math.max(top - bot, 20)
    const g = new THREE.BoxGeometry(picketW, h, picketW)
    g.translate(x, (top + bot) / 2, 0)
    geoms.push(g)
  }

  // Newels at ends
  const newelW = 8.89
  for (const x of [-half, half]) {
    const top = topYAt(x) + 5
    const bot = Math.max(botYAt(x) - 8, 0)
    const h = Math.max(top - bot, 40)
    const g = new THREE.BoxGeometry(newelW, h, newelW)
    g.translate(x, bot + h / 2, 0)
    geoms.push(g)
  }

  const mat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(`#${hex}`),
    specular: new THREE.Color(0x222222),
    shininess: 20,
    side: THREE.DoubleSide
  })
  const geometry = mergeGeometries(geoms)
  for (const g of geoms) g.dispose()
  return { geometry, materials: [mat] }
}

/**
 * Modern horizontal-member raked stair guard — like a cable-rail panel on a rake:
 * end newels + continuous rake-parallel top/bottom rails + thin bars between them.
 * One long box per rail (rotated to the slope) — never short axis-aligned dashes.
 * Same convention as rakeguard: span along X, +X high by DROP; y=0 at low-end bottom rail.
 * IMPORTANT: Item recenters on bbox — saved ypos must be mesh center.
 */
function buildRakeHorizGeometry(
  span: number,
  drop: number,
  guardH: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const geoms: THREE.BufferGeometry[] = []
  const half = span / 2
  const newelW = 8.89
  const rakeLen = Math.hypot(span, drop)
  const rakeAng = Math.atan2(drop, span) // rotateZ: +X high
  const inset = newelW * 0.55 // clear newel faces
  const railSpan = Math.max(rakeLen - inset * 2, rakeLen * 0.85)
  const barCount = 7 // thin horizontals between top & bottom (reference-style)
  const topRailT = 4
  const botRailT = 3.2
  const barT = 1.4

  const topYAt = (x: number) => {
    const t = (x + half) / span
    return guardH + t * drop
  }
  const botYAt = (x: number) => topYAt(x) - guardH

  /** One continuous member on the rake, offset down from the top rail (parallel). */
  const pushRakeRail = (offsetDown: number, thick: number) => {
    const y0 = topYAt(-half) - offsetDown
    const y1 = topYAt(half) - offsetDown
    const g = new THREE.BoxGeometry(railSpan, thick, thick)
    g.rotateZ(rakeAng)
    g.translate(0, (y0 + y1) / 2, 0)
    geoms.push(g)
  }

  // Top + bottom rails (thicker), then evenly spaced bars between — full post-to-post
  pushRakeRail(0, topRailT)
  pushRakeRail(guardH, botRailT)
  for (let i = 1; i <= barCount; i++) {
    pushRakeRail((i / (barCount + 1)) * guardH, barT)
  }

  // Slim mid vertical (reference crush/support) — between rails only
  {
    const x = 0
    const top = topYAt(x) - topRailT * 0.5
    const bot = botYAt(x) + botRailT * 0.5
    const h = Math.max(top - bot, 10)
    const g = new THREE.BoxGeometry(1.2, h, 1.2)
    g.translate(x, (top + bot) / 2, 0)
    geoms.push(g)
  }

  // End posts (newels) — rails frame into these
  for (const x of [-half, half]) {
    const top = topYAt(x) + 8
    const bot = Math.max(botYAt(x) - 10, 0)
    const h = Math.max(top - bot, 40)
    const g = new THREE.BoxGeometry(newelW, h, newelW)
    g.translate(x, bot + h / 2, 0)
    geoms.push(g)
    // Simple pyramid cap
    const cap = new THREE.ConeGeometry(newelW * 0.55, 5, 4)
    cap.rotateY(Math.PI / 4)
    cap.translate(x, top + 2.5, 0)
    geoms.push(cap)
  }

  const mat = new THREE.MeshPhongMaterial({
    color: new THREE.Color(`#${hex}`),
    specular: new THREE.Color(0x222222),
    shininess: 28,
    side: THREE.DoubleSide
  })
  const geometry = mergeGeometries(geoms)
  for (const g of geoms) g.dispose()
  return { geometry, materials: [mat] }
}

export function isProceduralUrl(url: string): boolean {
  return url.toLowerCase().startsWith('procedural:')
}
