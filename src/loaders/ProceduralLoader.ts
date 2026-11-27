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
 * procedural:tub:WIDTH:HEIGHT:DEPTH:HEXCOLOR — standard alcove bathtub (rim, basin, water)
 * procedural:fstub:WIDTH:HEIGHT:DEPTH:HEXCOLOR — freestanding soaking tub · back on −Z · deck faucet
 * procedural:showerdoor:WIDTH:HEIGHT:DEPTH:HEXCOLOR — frameless glass shower door (+Z face)
 * procedural:showerbench:WIDTH:HEIGHT:DEPTH:HEXCOLOR — L corner bench (backs on −X/−Z)
 * procedural:showerhead:WIDTH:HEIGHT:DEPTH:HEXCOLOR — wall arm + round head (arm along +Z)
 * procedural:valvetrim:PLATE_D:LEVER_LEN:HEXCOLOR — pressure-balance valve trim, round plate on +Z face, two levers
 * procedural:handshower:BAR_LEN:ARM_LEN:HEXCOLOR — vertical slide bar + hand-shower head projecting +Z
 * procedural:chiller:WIDTH:HEIGHT:DEPTH:HEXCOLOR — compact chiller Pro beside plunge
 * procedural:pool:WIDTH:HEIGHT:DEPTH:HEXCOLOR — inground pool (coping, water, tile band, steps)
 * procedural:coverbox:WIDTH:HEIGHT:DEPTH:HEXCOLOR — automatic pool-cover housing lid
 * procedural:phroof:WIDTH:HEIGHT:DEPTH:HEXCOLOR — pool-house gable standing-seam roof
 * procedural:stonebar:WIDTH:HEIGHT:DEPTH:HEXCOLOR — L-shaped stacked-stone outdoor bar
 * procedural:phdoor:WIDTH:HEIGHT:DEPTH:HEXCOLOR — X-brace pool-house door with lites
 * procedural:barndoor:WIDTH:HEIGHT:DEPTH:HEXCOLOR — custom barn leaf · planks · black strap + rollers
 * procedural:barntrack:LENGTH:HEIGHT:DEPTH:HEXCOLOR — black sliding barn-door track + mounts
 * procedural:garagedoor:WIDTH:HEIGHT:DEPTH:HEXCOLOR — craftsman OHD (two leaves, brown, 4 black-framed lites per leaf)
 * procedural:entrydbl:WIDTH:HEIGHT:DEPTH:HEXCOLOR — front entry double doors (black clad glass)
 * procedural:slider:WIDTH:HEIGHT:DEPTH:HEXCOLOR — Pella-style sliding patio (black clad, 2-lite)
 * procedural:bcasement:WIDTH:HEIGHT:DEPTH:HEXCOLOR — black-clad double casement (office)
 * procedural:bfixed:WIDTH:HEIGHT:DEPTH:HEXCOLOR — black-clad single-lite fixed (basement bar FXD)
 * procedural:bfarm:WIDTH:HEIGHT:DEPTH:HEXCOLOR — farmhouse fixed 2-over-1 (high lite, no center mullion)
 * procedural:ytruss:WIDTH:HEIGHT:DEPTH:HEXCOLOR — decorative Y gable timber truss
 * procedural:sofa:WIDTH:HEIGHT:DEPTH:HEXCOLOR — sofa run (cushions, arms, back)
 * procedural:lsofa:BOUND_W:HEIGHT:BOUND_D:ARM_D:HEXCOLOR — one congruent L-sectional
 *   Backs on +Z (south) and +X (east); open toward −X/−Z. ARM_D = seat depth both arms.
 * procedural:fridge:WIDTH:HEIGHT:DEPTH:HEXCOLOR — glass-front commercial fridge
 * procedural:frenchdoor:WIDTH:HEIGHT:DEPTH:HEXCOLOR — French-door fridge (dual doors + freezer drawer, face +Z)
 * procedural:farmsink:WIDTH:HEIGHT:DEPTH:HEXCOLOR — undivided farm apron sink (open top, apron on +Z)
 * procedural:gooseneck:HEIGHT:REACH:HEXCOLOR — pull-down gooseneck faucet (spout toward +Z, base at −Z)
 * procedural:saylor:HEIGHT:REACH:HEXCOLOR — Delta 536 Saylor single-hole lav faucet (spout +Z, lever +X, y=0 deck)
 * procedural:highline:WIDTH:HEIGHT:DEPTH:HEXCOLOR — Kohler Highline Curve two-piece elongated (lofted bowl, rounded tank, seat ring; tank +Z, left-hand lever on tank front)
 * procedural:in2ition:WIDTH:HEIGHT:DEPTH:HEXCOLOR — Delta In2ition 2-in-1 head on a 5½″ arm (flange −Z, head +Z)
 * procedural:saylortrim:PLATE_D:LEVER_LEN:HEXCOLOR — Delta Monitor 17 single lever + temp dial (plate face +Z)
 * procedural:cabinet:WIDTH:HEIGHT:DEPTH:HEXCOLOR — base/wall cabinet with doors + toe-kick
 * procedural:cabdrawers:WIDTH:HEIGHT:DEPTH:HEXCOLOR — base cabinet · 3-drawer stack (paint grade)
 * procedural:kfridgewall:WIDTH:HEIGHT:DEPTH:HEXCOLOR — Titan dual-fridge + coffee-nook wall (112″ elev)
 * procedural:bsmtbar:WIDTH:HEIGHT:DEPTH:HEXCOLOR — basement bar elevation (BSMT BAR · BIRCH, 165¼″×104¾″×25½″)
 *   Face +Z. L/R appl-panel fridges · center coffee nook + machine · glass above · full-width flip-up top.
 * procedural:range:WIDTH:HEIGHT:DEPTH:HEXCOLOR — Monogram-style 48″ dual-fuel (6+griddle, dual oven)
 * procedural:woodhood:WIDTH:HEIGHT:DEPTH:HEXCOLOR — coastal-modern wood hood (apron + chimney, face +Z)
 * procedural:sshood:WIDTH:HEIGHT:DEPTH:HEXCOLOR — pro stainless canopy hood (wider than range, face +Z)
 * procedural:dishwasher:WIDTH:HEIGHT:DEPTH:HEXCOLOR — GE Profile-style 24″ DW (pocket handle, face +Z)
 * procedural:wallovenmono:WIDTH:HEIGHT:DEPTH:HEXCOLOR — Monogram 30″ single wall oven (black glass control band + door, stainless handle bar, face +Z)
 * procedural:micromono:WIDTH:HEIGHT:DEPTH:HEXCOLOR — Monogram-style 30″ microwave (black glass window + control panel, face +Z)
 * procedural:cabframe:WIDTH:HEIGHT:DEPTH:DRAWER_H:TOE:HEXCOLOR — frame-and-panel cabinet (2 doors, optional
 *   bottom drawer when DRAWER_H > 0). Frame proud of carcass, panels recessed, vertical door pulls, horizontal drawer pull.
 * procedural:bowltop:WIDTH:DEPTH:THK:BOWL_DIA:BOWL_DEPTH:BOWL_Z:HEXCOLOR — granite vanity top with a round
 *   cut-out and a porcelain bowl recessed into it (top surface at Y=0; BOWL_Z = bowl center offset along depth)
 * procedural:vesselsink:WIDTH:HEIGHT:DEPTH:HEXCOLOR — Stainless single bowl sitting on top of a counter (rim lip, drain). Base at Y=0 = counter top
* procedural:washtower:WIDTH:HEIGHT:DEPTH:HEXCOLOR — LG single-unit wash tower (dryer over washer, round doors, face +Z)
 * procedural:openshelf:WIDTH:HEIGHT:DEPTH:HEXCOLOR — open face-frame shelf unit (no doors)
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
 * procedural:ustairs:WELL_W:WELL_D:FLIGHT_W:TOTAL_RISE:RISERS:HEXCOLOR[:flipns]
 *   flipns — top landing SW (upstairs loft arrival). Place ypos ≈ −TOTAL_RISE/2 so top sits on this floor and the run hangs from below.
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
 * procedural:swivelchair:WIDTH:HEIGHT:DEPTH:HEX — barrel-back upholstered swivel chair (Payton-style: 30×31×36″; seat faces +Z, back −Z)
 * procedural:roundtable:DIA:HEIGHT:HEX — 36″ round wood-top table on a pedestal base (top at HEIGHT)
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
 * procedural:vehicle:WIDTH:HEIGHT:DEPTH:HEX:STYLE — parked vehicle as furniture (one mesh)
 *   WIDTH = body width (X), HEIGHT = overall height (Y), DEPTH = overall length nose→tail (Z).
 *   Nose faces +Z. STYLE: suv | truck | jeep (default suv).
 * procedural:shakerbase:WIDTH:HEIGHT:DEPTH:HEX:MODE[:DOORS] — detailed shaker base cabinet (face +Z).
 *   MODE: doors | sink (hollow, false front) | drawers (3) | open (face-frame shelves).
 *   DEPTH is OVERALL incl. door + 3 cm pull projection (open: no pull). Toe kick 10.16 cm.
 * procedural:shakerwall:WIDTH:HEIGHT:DEPTH:HEX[:DOORS[:CROWN[:L|R]]] — shaker upper w/ stepped crown.
 *   HEIGHT includes CROWN; DEPTH overall incl. door + pull. L/R = pull edge for a single door.
 * procedural:counterx:WIDTH:THK:DEPTH:HEX:CUT_W:CUT_D:CUT_X:CUT_Z:SPLASH_H:FLAGS — slab with rounded
 *   undermount cutout (0 = none) + back/side splash. FLAGS: 1 back(−Z) · 2 left(−X) · 4 right(+X).
 *   Slab bottom at Y=0; splash rises above THK (bbox is THK+SPLASH_H tall).
 * procedural:lsink:OPEN_W:HEIGHT:OPEN_D:HEX — undermount acrylic laundry sink (rim at Y=HEIGHT).
 * procedural:pulldown:HEIGHT:REACH:HEX — PROFLO Loftus-style pull-down kitchen faucet + escutcheon (spout +Z).
 * procedural:frontload:WIDTH:HEIGHT:DEPTH:HEX:KIND — GE front-load washer|dryer (porthole door, console; face +Z).
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
    if (parts[0] !== 'procedural' || parts.length < 5) {
      throw new Error(`Invalid procedural URL: ${url}`)
    }

    const shape = parts[1]
    let opacity = 1
    let hex = '888888'
    let geometry: THREE.BufferGeometry
    let materialsOverride: THREE.Material[] | null = null

    switch (shape) {
      case 'ustairs': {
        // procedural:ustairs:WELL_W:WELL_D:FLIGHT_W:TOTAL_RISE:RISERS:HEX[:flipns]
        // Optional flipns: swap N/S so top landing is SW (upstairs) instead of NW (basement default).
        if (parts.length < 8) {
          throw new Error(`Invalid ustairs URL: ${url}`)
        }
        const wellW = parseFloat(parts[2])
        const wellD = parseFloat(parts[3])
        const flightW = parseFloat(parts[4])
        const totalRise = parseFloat(parts[5])
        const risers = Math.max(4, Math.round(parseFloat(parts[6])))
        hex = parts[7].replace(/^#/, '')
        const flipNS = /flipns/i.test(parts[8] || '')
        if ([wellW, wellD, flightW, totalRise].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid ustairs dimensions: ${url}`)
        }
        geometry = buildUStairsGeometry(wellW, wellD, flightW, totalRise, risers, flipNS)
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
      case 'tub': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        opacity = parts[6] != null ? parseFloat(parts[6]) : 1
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid tub dimensions: ${url}`)
        }
        const built = buildTubGeometry(width, height, depth, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'fstub': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid fstub dimensions: ${url}`)
        }
        {
          const built = buildFreestandingTubGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'showerdoor': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid showerdoor dimensions: ${url}`)
        }
        {
          const built = buildShowerDoorGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'showerbench': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid showerbench dimensions: ${url}`)
        }
        {
          const built = buildShowerBenchGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'in2ition':
      case 'showerhead': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid showerhead dimensions: ${url}`)
        }
        {
          const built =
            shape === 'in2ition'
              ? buildIn2itionGeometry(width, height, depth, hex)
              : buildShowerHeadGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'saylortrim':
      case 'valvetrim': {
        // procedural:valvetrim|saylortrim:PLATE_D:LEVER_LEN:HEX
        const plateD = parseFloat(parts[2])
        const leverLen = parseFloat(parts[3])
        hex = parts[4].replace(/^#/, '')
        if ([plateD, leverLen].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid ${shape} dimensions: ${url}`)
        }
        {
          const built =
            shape === 'saylortrim'
              ? buildSaylorTrimGeometry(plateD, leverLen, hex)
              : buildValveTrimGeometry(plateD, leverLen, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'handshower': {
        // procedural:handshower:BAR_LEN:ARM_LEN:HEX
        const barLen = parseFloat(parts[2])
        const armLen = parseFloat(parts[3])
        hex = parts[4].replace(/^#/, '')
        if ([barLen, armLen].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid handshower dimensions: ${url}`)
        }
        {
          const built = buildHandShowerGeometry(barLen, armLen, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
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
      case 'barndoor': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid barndoor dimensions: ${url}`)
        }
        {
          const built = buildBarnDoorGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'barntrack': {
        const length = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([length, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid barntrack dimensions: ${url}`)
        }
        {
          const built = buildBarnTrackGeometry(length, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'garagedoor': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid garagedoor dimensions: ${url}`)
        }
        const built = buildCraftsmanGarageDoorGeometry(width, height, depth, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'entrydbl': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid entrydbl dimensions: ${url}`)
        }
        const built = buildEntryDoubleDoorGeometry(width, height, depth, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'slider': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid slider dimensions: ${url}`)
        }
        const built = buildSlidingPatioGeometry(width, height, depth, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'bcasement': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid bcasement dimensions: ${url}`)
        }
        const built = buildBlackCasementGeometry(width, height, depth, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'bfixed': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid bfixed dimensions: ${url}`)
        }
        const built = buildBlackFixedGeometry(width, height, depth, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'bfarm': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid bfarm dimensions: ${url}`)
        }
        const built = buildFarmhouseFixedGeometry(width, height, depth, hex)
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
      case 'cabdrawers':
      case 'kfridgewall':
      case 'bsmtbar':
      case 'range':
      case 'woodhood':
      case 'openshelf':
      case 'ssbase':
      case 'sswall':
      case 'island':
      case 'counter':
      case 'bed':
      case 'dresser':
      case 'highline':
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
                : shape === 'cabdrawers'
                  ? buildCabDrawersGeometry(width, height, depth, hex)
                  : shape === 'kfridgewall'
                    ? buildKitchenFridgeWallGeometry(width, height, depth, hex)
                    : shape === 'bsmtbar'
                      ? buildBsmtBarWallGeometry(width, height, depth, hex)
                      : shape === 'range'
                      ? buildRangeGeometry(width, height, depth, hex)
                      : shape === 'woodhood'
                        ? buildWoodHoodGeometry(width, height, depth, hex)
                        : shape === 'openshelf'
                          ? buildOpenShelfGeometry(width, height, depth, hex)
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
                                    : shape === 'highline'
                                      ? buildHighlineGeometry(width, height, depth, hex)
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
      case 'sshood': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid sshood dimensions: ${url}`)
        }
        {
          const built = buildSsHoodGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'farmsink': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid farmsink dimensions: ${url}`)
        }
        {
          const built = buildFarmSinkGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'gooseneck':
      case 'saylor': {
        const height = parseFloat(parts[2])
        const reach = parseFloat(parts[3])
        hex = parts[4].replace(/^#/, '')
        if ([height, reach].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid ${shape} dimensions: ${url}`)
        }
        {
          const built =
            shape === 'saylor'
              ? buildSaylorFaucetGeometry(height, reach, hex)
              : buildGooseneckGeometry(height, reach, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'frenchdoor': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid frenchdoor dimensions: ${url}`)
        }
        {
          const built = buildFrenchDoorFridgeGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'cabframe': {
        // procedural:cabframe:WIDTH:HEIGHT:DEPTH:DRAWER_H:TOE:HEX
        const [width, height, depth, drawerH, toe] = parts.slice(2, 7).map((p) => parseFloat(p))
        hex = parts[7].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0) || Number.isNaN(drawerH) || Number.isNaN(toe) || drawerH < 0 || toe < 0) {
          throw new Error(`Invalid cabframe dimensions: ${url}`)
        }
        {
          const built = buildFramedCabinetGeometry(width, height, depth, drawerH, toe, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'bowltop': {
        // procedural:bowltop:WIDTH:DEPTH:THK:BOWL_DIA:BOWL_DEPTH:BOWL_Z:HEX
        const [width, depth, thk, bowlDia, bowlDepth, bowlZ] = parts.slice(2, 8).map((p) => parseFloat(p))
        hex = parts[8].replace(/^#/, '')
        if ([width, depth, thk, bowlDia, bowlDepth].some((n) => Number.isNaN(n) || n <= 0) || Number.isNaN(bowlZ)) {
          throw new Error(`Invalid bowltop dimensions: ${url}`)
        }
        {
          const built = buildBowlTopGeometry(width, depth, thk, bowlDia, bowlDepth, bowlZ, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'vesselsink': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid vesselsink dimensions: ${url}`)
        }
        {
          const built = buildVesselSinkGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'shakerbase':
      case 'shakerwall':
      case 'frontload': {
        // shakerbase:W:H:D:HEX:MODE[:DOORS] · shakerwall:W:H:D:HEX[:DOORS[:CROWN[:L|R]]] · frontload:W:H:D:HEX:KIND
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = (parts[5] ?? '').replace(/^#/, '')
        if (!hex || [width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid ${shape} dimensions: ${url}`)
        }
        const built =
          shape === 'shakerbase'
            ? buildShakerBaseGeometry(width, height, depth, hex, parts[6] || 'doors', parseInt(parts[7] ?? '0', 10) || 0)
            : shape === 'shakerwall'
              ? buildShakerWallGeometry(
                  width,
                  height,
                  depth,
                  hex,
                  parseInt(parts[6] ?? '0', 10) || 0,
                  parseFloat(parts[7] ?? '0') || 0,
                  parts[8] === 'L' ? 'L' : 'R'
                )
              : buildFrontLoadGeometry(width, height, depth, hex, parts[6] === 'dryer' ? 'dryer' : 'washer')
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'counterx': {
        // counterx:W:THK:D:HEX:CUT_W:CUT_D:CUT_X:CUT_Z:SPLASH_H:FLAGS
        const [width, thk, depth] = parts.slice(2, 5).map((p) => parseFloat(p))
        hex = (parts[5] ?? '').replace(/^#/, '')
        const [cutW, cutD, cutX, cutZ, splashH] = parts.slice(6, 11).map((p) => parseFloat(p) || 0)
        const flags = parseInt(parts[11] ?? '1', 10) || 0
        if (!hex || [width, thk, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid counterx dimensions: ${url}`)
        }
        const built = buildCounterXGeometry(width, thk, depth, hex, cutW, cutD, cutX, cutZ, splashH, flags)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'lsink': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = (parts[5] ?? '').replace(/^#/, '')
        if (!hex || [width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid lsink dimensions: ${url}`)
        }
        const built = buildLaundrySinkGeometry(width, height, depth, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'pulldown': {
        const height = parseFloat(parts[2])
        const reach = parseFloat(parts[3])
        hex = (parts[4] ?? '').replace(/^#/, '')
        if (!hex || [height, reach].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid pulldown dimensions: ${url}`)
        }
        const built = buildPulldownFaucetGeometry(height, reach, hex)
        geometry = built.geometry
        materialsOverride = built.materials
        break
      }
      case 'washtower': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid washtower dimensions: ${url}`)
        }
        {
          const built = buildWashTowerGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'wallovenmono':
      case 'micromono': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid ${shape} dimensions: ${url}`)
        }
        {
          const built =
            shape === 'wallovenmono'
              ? buildMonoWallOvenGeometry(width, height, depth, hex)
              : buildMonoMicrowaveGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'dishwasher': {
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid dishwasher dimensions: ${url}`)
        }
        {
          const built = buildDishwasherGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
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
      case 'swivelchair': {
        // procedural:swivelchair:WIDTH:HEIGHT:DEPTH:HEX
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid swivelchair dimensions: ${url}`)
        }
        {
          const built = buildSwivelChairGeometry(width, height, depth, hex)
          geometry = built.geometry
          materialsOverride = built.materials
        }
        break
      }
      case 'roundtable': {
        // procedural:roundtable:DIA:HEIGHT:HEX
        const dia = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        hex = parts[4].replace(/^#/, '')
        if ([dia, height].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid roundtable dimensions: ${url}`)
        }
        {
          const built = buildRoundTableGeometry(dia, height, hex)
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
      case 'vehicle': {
        // procedural:vehicle:WIDTH:HEIGHT:DEPTH:HEX:STYLE
        // WIDTH=body width (X), HEIGHT=overall (Y), DEPTH=length nose→tail (Z). Nose +Z.
        const width = parseFloat(parts[2])
        const height = parseFloat(parts[3])
        const depth = parseFloat(parts[4])
        hex = parts[5].replace(/^#/, '')
        const style = (parts[6] || 'suv').toLowerCase().replace(/[^a-z]/g, '')
        if ([width, height, depth].some((n) => Number.isNaN(n) || n <= 0)) {
          throw new Error(`Invalid vehicle dimensions: ${url}`)
        }
        {
          const built = buildVehicleGeometry(width, height, depth, hex, style)
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
  risers: number,
  flipNS = false
): THREE.BufferGeometry {
  // Default (basement): open west (−X). Lower = south W→E, mid = SE, upper = north E→W, top = NW.
  // flipNS (upstairs): lower = north W→E, mid = NE, upper = south E→W, top = SW.
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
  const lowerZ = flipNS ? northZ : southZ
  const upperZ = flipNS ? southZ : northZ
  const lowerCount = Math.floor(risers / 2)
  const upperCount = risers - lowerCount

  // Lower flight: west → east along lowerZ
  for (let i = 0; i < lowerCount; i++) {
    const y0 = i * rise
    const x0 = -wellW / 2 + (i + 0.5) * tread
    addBox(tread * 0.92, Math.max(rise * 0.9, 2), fw, x0, y0, lowerZ)
  }

  // Mid landing (east) + east turn slab
  const midY = lowerCount * rise
  addBox(landing, Math.max(rise * 0.45, 3), fw, wellW / 2 - landing / 2, midY, lowerZ)
  addBox(landing * 0.95, Math.max(rise * 0.4, 3), wellD - fw * 0.5, wellW / 2 - landing / 2, midY, 0)

  // Upper flight: east → west along upperZ
  for (let i = 0; i < upperCount; i++) {
    const y0 = (lowerCount + i) * rise
    const x0 = wellW / 2 - landing - (i + 0.5) * tread
    addBox(tread * 0.92, Math.max(rise * 0.9, 2), fw, x0, y0, upperZ)
  }

  // Top landing (west end of upper flight)
  const topY = risers * rise
  addBox(landing, Math.max(rise * 0.4, 3), fw, -wellW / 2 + landing / 2, topY, upperZ)

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

/** Box centered at (x, y, z) — for frames/glass authored in center-space. */
function pushBoxAt(
  target: THREE.BufferGeometry[],
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number
) {
  const g = new THREE.BoxGeometry(w, h, d)
  g.translate(x, y, z)
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

/**
 * Parked vehicle furniture. Local +Z = nose, X = width, Y = up from garage slab.
 * STYLE: suv (Escalade), truck (F-150 Tremor SuperCrew + bed), jeep (Wrangler + spare).
 */
function buildVehicleGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string,
  style: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const body: THREE.BufferGeometry[] = []
  const glass: THREE.BufferGeometry[] = []
  const rubber: THREE.BufferGeometry[] = []
  const trim: THREE.BufferGeometry[] = []
  const accent: THREE.BufferGeometry[] = []

  const halfW = width / 2
  const halfD = depth / 2
  const isTruck = style === 'truck' || style === 'tremor' || style === 'f150'
  const isJeep = style === 'jeep' || style === 'wrangler'

  if (isTruck) {
    buildPickupTruckParts(width, height, depth, body, glass, rubber, trim, accent)
  } else if (isJeep) {
    buildJeepParts(width, height, depth, body, glass, rubber, trim, accent)
  } else {
    buildSuvParts(width, height, depth, body, glass, rubber, trim, accent)
  }

  const geometry = mergeGeometriesGrouped([
    { geoms: body, materialIndex: 0 },
    { geoms: glass, materialIndex: 1 },
    { geoms: rubber, materialIndex: 2 },
    { geoms: trim, materialIndex: 3 },
    { geoms: accent, materialIndex: 4 }
  ])
  for (const g of [...body, ...glass, ...rubber, ...trim, ...accent]) g.dispose()

  const bodyMat = phong(hex || '111111', {
    shininess: isTruck ? 65 : 55,
    specular: new THREE.Color(isTruck ? 0x888888 : 0x666666)
  })
  const glassMat = phong('0f172a', {
    shininess: 80,
    specular: new THREE.Color(0xffffff),
    transparent: true,
    opacity: 0.55,
    depthWrite: false
  })
  const rubberMat = phong('111111', { shininess: 8, specular: new THREE.Color(0x222222) })
  const trimMat = phong(isTruck ? '1a1a1a' : 'c0c0c0', {
    shininess: 70,
    specular: new THREE.Color(0xffffff)
  })
  // Tremor orange accent (grille bar / bedside badge)
  const accentMat = phong('e85d04', { shininess: 40, specular: new THREE.Color(0xffaa66) })

  return { geometry, materials: [bodyMat, glassMat, rubberMat, trimMat, accentMat] }
}

/**
 * Full-size SUV (Escalade) — simple long greenhouse silhouette.
 * Nose +Z: short hood → long cabin → vertical rear (−Z).
 */
function buildSuvParts(
  width: number,
  height: number,
  depth: number,
  body: THREE.BufferGeometry[],
  glass: THREE.BufferGeometry[],
  rubber: THREE.BufferGeometry[],
  trim: THREE.BufferGeometry[],
  _accent: THREE.BufferGeometry[]
) {
  const halfW = width / 2
  const halfD = depth / 2

  const wheelR = Math.min(height * 0.155, width * 0.19, 34)
  const wheelW = Math.min(width * 0.12, 26)
  const frameY = wheelR * 0.45

  // Escalade: short nose, long cabin (hood 18% | cabin 82%)
  const hoodLen = depth * 0.18
  const cabLen = depth * 0.82
  const hoodZ = halfD - hoodLen / 2
  const cabZ = -halfD + cabLen / 2

  const rockerH = Math.min(18, height * 0.09)
  const hoodH = height * 0.26
  const cabBodyH = height * 0.34
  const greenH = height * 0.4

  // Lower body slab
  pushBox(body, width * 0.9, rockerH, depth * 0.96, 0, frameY, 0)
  // Hood
  const hoodY = frameY + rockerH * 0.55
  pushBox(body, width * 0.88, hoodH, hoodLen * 0.92, 0, hoodY, hoodZ)

  // Chrome grille block + horizontal bar (Escalade cue)
  const grilleW = width * 0.72
  const grilleH = hoodH * 0.9
  const grilleY = hoodY + hoodH * 0.05
  pushBox(trim, grilleW, grilleH, 5, 0, grilleY, halfD - 2)
  pushBox(trim, grilleW * 0.92, Math.max(3, grilleH * 0.14), 3, 0, grilleY + grilleH * 0.15, halfD)
  // Headlight bars
  const lampW = width * 0.1
  pushBox(trim, lampW, grilleH * 0.55, 4, -halfW + lampW * 1.15, grilleY + grilleH * 0.15, halfD - 1)
  pushBox(trim, lampW, grilleH * 0.55, 4, halfW - lampW * 1.15, grilleY + grilleH * 0.15, halfD - 1)
  // Bumper
  pushBox(trim, width * 0.94, rockerH * 0.95, 14, 0, 4, halfD - 5)

  // Long cabin + greenhouse
  const cabBottom = frameY + rockerH * 0.45
  pushBox(body, width * 0.92, cabBodyH, cabLen * 0.98, 0, cabBottom, cabZ)
  const greenY = cabBottom + cabBodyH * 0.82
  pushBox(body, width * 0.86, greenH * 0.72, cabLen * 0.9, 0, greenY, cabZ - cabLen * 0.02)
  // Windshield + continuous side glass + rear glass
  pushBox(glass, width * 0.72, greenH * 0.65, 3, 0, greenY + greenH * 0.12, cabZ + cabLen * 0.42)
  pushBox(glass, 2.5, greenH * 0.58, cabLen * 0.75, -halfW + 4, greenY + greenH * 0.1, cabZ)
  pushBox(glass, 2.5, greenH * 0.58, cabLen * 0.75, halfW - 4, greenY + greenH * 0.1, cabZ)
  pushBox(glass, width * 0.68, greenH * 0.55, 2.5, 0, greenY + greenH * 0.1, cabZ - cabLen * 0.46)

  // Rear bumper
  pushBox(trim, width * 0.9, rockerH * 0.85, 12, 0, 3, -halfD + 4)
  // Vertical taillight stubs
  pushBox(trim, 8, cabBodyH * 0.7, 5, -halfW + 7, cabBottom + cabBodyH * 0.15, -halfD + 2)
  pushBox(trim, 8, cabBodyH * 0.7, 5, halfW - 7, cabBottom + cabBodyH * 0.15, -halfD + 2)

  // Wheels
  const track = width * 0.78
  const wheelbase = depth * 0.58
  const wx = track / 2
  const fronts = halfD - (depth - wheelbase) / 2 - wheelR * 0.2
  const rears = -halfD + (depth - wheelbase) / 2 + wheelR * 0.22
  for (const z of [fronts, rears]) {
    pushCyl(rubber, wheelR, wheelW, -wx, wheelR, z, 'x')
    pushCyl(rubber, wheelR, wheelW, wx, wheelR, z, 'x')
    pushCyl(trim, wheelR * 0.55, wheelW * 0.35, -wx, wheelR, z, 'x')
    pushCyl(trim, wheelR * 0.55, wheelW * 0.35, wx, wheelR, z, 'x')
  }
}

/**
 * Wrangler Unlimited 4-door — simple boxy silhouette.
 * Nose +Z: short hood → upright cab → rear spare (−Z).
 */
function buildJeepParts(
  width: number,
  height: number,
  depth: number,
  body: THREE.BufferGeometry[],
  glass: THREE.BufferGeometry[],
  rubber: THREE.BufferGeometry[],
  trim: THREE.BufferGeometry[],
  _accent: THREE.BufferGeometry[]
) {
  const halfW = width / 2
  const halfD = depth / 2

  // Tall stance, big tires
  const wheelR = Math.min(height * 0.19, width * 0.23, 38)
  const wheelW = Math.min(width * 0.13, 28)
  const frameY = wheelR * 0.48

  // Length: hood 22% | cab 78% (boxy Unlimited — no separate bed)
  const hoodLen = depth * 0.22
  const cabLen = depth * 0.78
  const hoodZ = halfD - hoodLen / 2
  const cabZ = -halfD + cabLen / 2

  const rockerH = Math.min(18, height * 0.09)
  const hoodH = height * 0.28
  const cabBodyH = height * 0.32
  const greenH = height * 0.4

  // Tub / lower body
  pushBox(body, width * 0.9, rockerH, depth * 0.94, 0, frameY, 0)
  // Hood (short, flat)
  const hoodY = frameY + rockerH * 0.55
  pushBox(body, width * 0.86, hoodH, hoodLen * 0.9, 0, hoodY, hoodZ)

  // 7-slot grille (few vertical bars only)
  const grilleW = width * 0.55
  const grilleH = hoodH * 0.95
  const grilleY = hoodY + hoodH * 0.05
  pushBox(trim, grilleW, grilleH, 4, 0, grilleY, halfD - 2)
  const slotW = grilleW * 0.08
  for (let i = -3; i <= 3; i++) {
    pushBox(trim, slotW, grilleH * 0.78, 2, i * (grilleW * 0.12), grilleY, halfD)
  }
  // Round-ish headlight blocks
  const lamp = Math.min(width * 0.1, grilleH * 0.7)
  pushBox(trim, lamp, lamp, 4, -halfW + lamp * 1.2, grilleY + grilleH * 0.05, halfD - 1)
  pushBox(trim, lamp, lamp, 4, halfW - lamp * 1.2, grilleY + grilleH * 0.05, halfD - 1)
  // Bumper
  pushBox(trim, width * 0.92, rockerH * 0.9, 12, 0, 4, halfD - 4)

  // Upright greenhouse (boxy Wrangler cue)
  const cabBottom = frameY + rockerH * 0.45
  pushBox(body, width * 0.9, cabBodyH, cabLen * 0.96, 0, cabBottom, cabZ)
  const greenY = cabBottom + cabBodyH * 0.85
  pushBox(body, width * 0.86, greenH * 0.75, cabLen * 0.88, 0, greenY, cabZ - cabLen * 0.02)
  // Flat windshield + side glass + rear glass
  pushBox(glass, width * 0.72, greenH * 0.7, 3, 0, greenY + greenH * 0.12, cabZ + cabLen * 0.42)
  pushBox(glass, 2.5, greenH * 0.6, cabLen * 0.7, -halfW + 4, greenY + greenH * 0.1, cabZ)
  pushBox(glass, 2.5, greenH * 0.6, cabLen * 0.7, halfW - 4, greenY + greenH * 0.1, cabZ)
  pushBox(glass, width * 0.65, greenH * 0.55, 2.5, 0, greenY + greenH * 0.1, cabZ - cabLen * 0.45)

  // Fender flares (simple pads over wheels)
  const track = width * 0.78
  const wheelbase = depth * 0.56
  const wx = track / 2
  const fronts = halfD - (depth - wheelbase) / 2 - wheelR * 0.2
  const rears = -halfD + (depth - wheelbase) / 2 + wheelR * 0.25
  for (const z of [fronts, rears]) {
    pushBox(body, width * 0.08, wheelR * 0.85, wheelR * 1.5, -halfW + 3, wheelR * 0.65, z)
    pushBox(body, width * 0.08, wheelR * 0.85, wheelR * 1.5, halfW - 3, wheelR * 0.65, z)
  }

  // Rear bumper + spare tire (signature Wrangler)
  pushBox(trim, width * 0.88, rockerH * 0.85, 10, 0, 3, -halfD + 3)
  const spareR = Math.min(wheelR * 1.05, 34)
  const spareY = frameY + rockerH + spareR * 0.35
  pushCyl(rubber, spareR, wheelW * 0.65, 0, spareY, -halfD + 5, 'z')
  pushCyl(trim, spareR * 0.45, wheelW * 0.3, 0, spareY, -halfD + 7, 'z')

  // Wheels
  for (const z of [fronts, rears]) {
    pushCyl(rubber, wheelR, wheelW, -wx, wheelR, z, 'x')
    pushCyl(rubber, wheelR, wheelW, wx, wheelR, z, 'x')
    pushCyl(trim, wheelR * 0.55, wheelW * 0.35, -wx, wheelR, z, 'x')
    pushCyl(trim, wheelR * 0.55, wheelW * 0.35, wx, wheelR, z, 'x')
  }
}

/**
 * SuperCrew short-bed pickup (F-150 Tremor) — simple readable silhouette.
 * Nose +Z: hood → long cab → open bed → tailgate (−Z).
 * Few boxes: clear cab/bed step-down, big tires, flat grille + orange bar.
 */
function buildPickupTruckParts(
  width: number,
  height: number,
  depth: number,
  body: THREE.BufferGeometry[],
  glass: THREE.BufferGeometry[],
  rubber: THREE.BufferGeometry[],
  trim: THREE.BufferGeometry[],
  accent: THREE.BufferGeometry[]
) {
  const halfW = width / 2
  const halfD = depth / 2

  // Tremor: taller tires / stance
  const wheelR = Math.min(height * 0.19, width * 0.22, 40)
  const wheelW = Math.min(width * 0.13, 30)
  const frameY = wheelR * 0.5

  // SuperCrew 5.5′ bed: long cab, short bed (hood 17% | cab 54% | bed 29%)
  const hoodLen = depth * 0.17
  const cabLen = depth * 0.54
  const bedLen = depth * 0.29
  const hoodZ = halfD - hoodLen / 2
  const cabZ = halfD - hoodLen - cabLen / 2
  const bedZ = -halfD + bedLen / 2

  const rockerH = Math.min(20, height * 0.09)
  const hoodH = height * 0.24
  const cabBodyH = height * 0.34
  const greenH = height * 0.38
  const bedRailH = height * 0.2
  const wallT = Math.min(8, width * 0.035)

  // Chassis under hood+cab only (bed reads open)
  pushBox(body, width * 0.86, rockerH, hoodLen + cabLen, 0, frameY, halfD - (hoodLen + cabLen) / 2)
  pushBox(body, width * 0.8, rockerH * 0.75, bedLen * 0.92, 0, frameY - 1, bedZ)

  // Hood
  const hoodY = frameY + rockerH * 0.55
  pushBox(body, width * 0.88, hoodH, hoodLen * 0.92, 0, hoodY, hoodZ)

  // Flat grille + Tremor orange bar (no honeycomb grid)
  const grilleW = width * 0.7
  const grilleH = hoodH * 0.9
  const grilleY = hoodY + hoodH * 0.05
  pushBox(trim, grilleW, grilleH, 5, 0, grilleY, halfD - 2)
  pushBox(accent, grilleW * 0.9, Math.max(3.5, grilleH * 0.12), 3, 0, grilleY + grilleH * 0.2, halfD)
  // Headlight blocks
  const lampW = width * 0.09
  pushBox(trim, lampW, grilleH * 0.95, 4, -halfW + lampW * 1.15, grilleY, halfD - 1.5)
  pushBox(trim, lampW, grilleH * 0.95, 4, halfW - lampW * 1.15, grilleY, halfD - 1.5)
  // Bumper
  pushBox(trim, width * 0.94, rockerH, 14, 0, 4, halfD - 5)

  // SuperCrew cab (long greenhouse)
  const cabBottom = frameY + rockerH * 0.45
  pushBox(body, width * 0.92, cabBodyH, cabLen * 0.98, 0, cabBottom, cabZ)
  const greenY = cabBottom + cabBodyH * 0.82
  pushBox(body, width * 0.84, greenH * 0.7, cabLen * 0.9, 0, greenY, cabZ - cabLen * 0.02)
  // Windshield + continuous side glass + backlight
  pushBox(glass, width * 0.7, greenH * 0.65, 3, 0, greenY + greenH * 0.12, cabZ + cabLen * 0.42)
  pushBox(glass, 2.5, greenH * 0.58, cabLen * 0.72, -halfW + 4, greenY + greenH * 0.1, cabZ)
  pushBox(glass, 2.5, greenH * 0.58, cabLen * 0.72, halfW - 4, greenY + greenH * 0.1, cabZ)
  pushBox(glass, width * 0.68, greenH * 0.5, 2.5, 0, greenY + greenH * 0.1, cabZ - cabLen * 0.46)

  // Open bed — step down from cab roof
  const bedFloorY = frameY + rockerH * 0.15
  pushBox(trim, width * 0.84, 5, bedLen * 0.88, 0, bedFloorY, bedZ)
  pushBox(body, wallT, bedRailH, bedLen * 0.88, -halfW + wallT * 1.5, bedFloorY, bedZ)
  pushBox(body, wallT, bedRailH, bedLen * 0.88, halfW - wallT * 1.5, bedFloorY, bedZ)
  // Bulkhead + tailgate
  pushBox(body, width * 0.9, bedRailH * 1.05, wallT * 1.4, 0, bedFloorY, bedZ + bedLen * 0.46)
  pushBox(body, width * 0.88, bedRailH * 0.95, wallT * 1.4, 0, bedFloorY, -halfD + wallT * 1.2)
  // Taillight stubs
  pushBox(trim, 8, bedRailH * 0.85, 5, -halfW + 7, bedFloorY + 2, -halfD + 3)
  pushBox(trim, 8, bedRailH * 0.85, 5, halfW - 7, bedFloorY + 2, -halfD + 3)
  pushBox(trim, width * 0.9, rockerH * 0.85, 12, 0, 3, -halfD + 4)

  // Wheels — wide track, long wheelbase
  const track = width * 0.8
  const wheelbase = depth * 0.66
  const wx = track / 2
  const fronts = halfD - (depth - wheelbase) / 2 - wheelR * 0.12
  const rears = -halfD + (depth - wheelbase) / 2 + wheelR * 0.18
  for (const z of [fronts, rears]) {
    pushCyl(rubber, wheelR, wheelW, -wx, wheelR, z, 'x')
    pushCyl(rubber, wheelR, wheelW, wx, wheelR, z, 'x')
    pushCyl(trim, wheelR * 0.55, wheelW * 0.35, -wx, wheelR, z, 'x')
    pushCyl(trim, wheelR * 0.55, wheelW * 0.35, wx, wheelR, z, 'x')
  }
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

/**
 * French-door refrigerator (Frigidaire Gallery–style).
 * Face +Z: dual fresh-food doors over a full-width freezer drawer + bar handles.
 */
function buildFrenchDoorFridgeGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const body: THREE.BufferGeometry[] = []
  const doors: THREE.BufferGeometry[] = []
  const accent: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const halfD = depth / 2
  const toe = Math.min(10, height * 0.055)
  const doorT = Math.min(5.5, depth * 0.08)
  const gap = 1.2
  const freezerH = height * 0.28
  const freshH = height - freezerH - toe - gap
  const freshY = toe + freezerH + gap
  const doorZ = halfD - doorT / 2
  const cabD = depth - doorT - 1

  // Cabinet body (set back behind doors)
  pushBox(body, width * 0.98, height - toe, cabD, 0, toe, -doorT * 0.35)
  pushBox(body, width * 0.94, toe, cabD * 0.92, 0, 0, -doorT * 0.2)

  // Freezer drawer (+Z)
  const fzW = width * 0.96
  pushBox(doors, fzW, freezerH - gap, doorT, 0, toe, doorZ)
  // Drawer handle bar
  pushBox(accent, fzW * 0.55, 2.2, 2.4, 0, toe + freezerH * 0.72, halfD + 1.2)

  // Dual French doors
  const doorW = (width - gap * 3) / 2
  const leftX = -halfW + gap + doorW / 2
  const rightX = halfW - gap - doorW / 2
  pushBox(doors, doorW, freshH, doorT, leftX, freshY, doorZ)
  pushBox(doors, doorW, freshH, doorT, rightX, freshY, doorZ)
  // Vertical bar handles near center stile
  const handleH = freshH * 0.55
  const handleY = freshY + freshH * 0.22
  pushBox(accent, 2.2, handleH, 2.6, leftX + doorW * 0.38, handleY, halfD + 1.4)
  pushBox(accent, 2.2, handleH, 2.6, rightX - doorW * 0.38, handleY, halfD + 1.4)
  // Water dispenser hint on left door
  pushBox(accent, doorW * 0.28, freshH * 0.22, 1.2, leftX - doorW * 0.08, freshY + freshH * 0.35, halfD - 0.2)
  // Top hinge caps
  pushBox(accent, width * 0.98, 2.5, depth * 0.2, 0, height - 1.5, -halfD * 0.15)

  const geometry = mergeGeometriesGrouped([
    { geoms: body, materialIndex: 0 },
    { geoms: doors, materialIndex: 1 },
    { geoms: accent, materialIndex: 2 }
  ])
  for (const g of [...body, ...doors, ...accent]) g.dispose()
  const shell = phong(hex, { shininess: 55, specular: new THREE.Color(0x666666) })
  const face = phong(hex, { shininess: 70, specular: new THREE.Color(0x888888) })
  face.color.offsetHSL(0, 0, 0.04)
  const trim = phong('1a1a1c', { shininess: 80, specular: new THREE.Color(0x999999) })
  return { geometry, materials: [shell, face, trim] }
}

/**
 * Undivided farm apron sink. Y=0 at the sink bottom, open top.
 * Apron (front) faces +Z; basin depth runs along Z, length along X.
 */
function buildFarmSinkGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const shell: THREE.BufferGeometry[] = []
  const basin: THREE.BufferGeometry[] = []
  const drain: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const halfD = depth / 2
  const wall = 2.5
  const floorT = 2

  // Apron front (+Z) — full height, with a proud top lip
  pushBox(shell, width, height, wall, 0, 0, halfD - wall / 2)
  pushBox(shell, width + 1.2, 1.2, wall + 1, 0, height - 1.2, halfD - wall / 2 + 0.5)
  // Back wall (−Z) + end walls
  pushBox(shell, width, height, wall, 0, 0, -halfD + wall / 2)
  pushBox(shell, wall, height, depth, -halfW + wall / 2, 0, 0)
  pushBox(shell, wall, height, depth, halfW - wall / 2, 0, 0)
  // Basin floor + drain (no divider — undivided)
  pushBox(basin, width - wall * 2, floorT, depth - wall * 2, 0, 0, 0)
  pushCyl(drain, 3.2, 0.6, 0, floorT, 0)

  const geometry = mergeGeometriesGrouped([
    { geoms: shell, materialIndex: 0 },
    { geoms: basin, materialIndex: 1 },
    { geoms: drain, materialIndex: 2 }
  ])
  for (const g of [...shell, ...basin, ...drain]) g.dispose()
  return {
    geometry,
    materials: [
      phong(hex, { shininess: 70, specular: new THREE.Color(0x888888) }),
      phong('d6d3cf', { shininess: 40 }),
      phong('3f3f46', { shininess: 60 })
    ]
  }
}

/**
 * Pull-down gooseneck faucet (Ridgeway-style). Base at −Z, spout head at +Z.
 * Y=0 at base plate bottom. Brushed-gold finish.
 */
function buildGooseneckGeometry(
  height: number,
  reach: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const gold: THREE.BufferGeometry[] = []
  const R = reach / 2
  const yc = height - R // arc center height so the top of the arc = height
  const up = new THREE.Vector3(0, 1, 0)

  // Straight segment between two points (cylinder oriented a→b)
  const seg = (a: THREE.Vector3, b: THREE.Vector3, r: number) => {
    const dir = b.clone().sub(a)
    const len = dir.length()
    const g = new THREE.CylinderGeometry(r, r, len, 8)
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize()))
    g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2)
    gold.push(g)
  }

  // Base plate (2-1/16″ dia) + body column
  pushCyl(gold, 2.6, 1.8, 0, 0, -R)
  pushCyl(gold, 1.5, yc - 1.8, 0, 1.8, -R)
  // Gooseneck arc in the YZ plane: base (−Z) → over the top → spout (+Z)
  const N = 16
  for (let k = 0; k < N; k++) {
    const t0 = (Math.PI * k) / N
    const t1 = (Math.PI * (k + 1)) / N
    const a = new THREE.Vector3(0, yc + R * Math.sin(t0), -R * Math.cos(t0))
    const b = new THREE.Vector3(0, yc + R * Math.sin(t1), -R * Math.cos(t1))
    seg(a, b, 1.5)
  }
  // Pull-down spout + head at the front end
  pushCyl(gold, 1.4, 14, 0, yc - 14, R)
  pushCyl(gold, 2.2, 4.5, 0, yc - 18.5, R)
  // Side lever
  pushCyl(gold, 0.7, 7, 0, 8, -R, 'x')

  const geometry = mergeGeometriesGrouped([{ geoms: gold, materialIndex: 0 }])
  for (const g of gold) g.dispose()
  return {
    geometry,
    materials: [phong(hex, { shininess: 90, specular: new THREE.Color(0xffe2a0) })]
  }
}

/**
 * Titan kitchen dual-fridge + coffee-nook wall (112″ elev).
 * Face on +Z. L/R appl-panel fridge towers; center coffee nook (counter +
 * machine) with glass cabinets above; one full-width flip-up cabinet on top.
 * Y=0 at floor.
 */
function buildKitchenFridgeWallGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const paint: THREE.BufferGeometry[] = []
  const drawer: THREE.BufferGeometry[] = []
  const glass: THREE.BufferGeometry[] = []
  const birch: THREE.BufferGeometry[] = []
  const metal: THREE.BufferGeometry[] = []
  const stone: THREE.BufferGeometry[] = []

  const sx = width / (112 * 2.54)
  const sy = height / (108.25 * 2.54)
  const inX = (inches: number) => inches * 2.54 * sx
  const inY = (inches: number) => inches * 2.54 * sy

  const filler = inX(2)
  const fridgeW = inX(35.8125)
  const stile = inX(1.5)
  const centerW = inX(33.375)
  const flipH = inY(21.25) // full-width flip-up top
  const counterH = inY(36)
  const nookH = inY(18) // clear coffee recess above counter
  const fridgeH = height - flipH // towers stop under flip-up
  const glassH = Math.max(inY(12), fridgeH - counterH - nookH)
  const toe = Math.min(inY(4), counterH * 0.12)
  const halfW = width / 2
  const halfD = depth / 2
  const frontZ = halfD - 1.2
  const ret = Math.min(inX(6), depth * 0.22)

  let x = -halfW
  const fillerL = x + filler / 2
  x += filler
  const fridgeL = x + fridgeW / 2
  x += fridgeW
  const stileL = x + stile / 2
  x += stile
  const centerX = x + centerW / 2
  x += centerW
  const stileR = x + stile / 2
  x += stile
  const fridgeR = x + fridgeW / 2
  x += fridgeW
  const fillerR = x + filler / 2

  // Fillers + stiles up to underside of flip-up
  pushBox(paint, filler, fridgeH, depth, fillerL, 0, 0)
  pushBox(paint, filler, fridgeH, depth, fillerR, 0, 0)
  pushBox(paint, stile, fridgeH, depth, stileL, 0, 0)
  pushBox(paint, stile, fridgeH, depth, stileR, 0, 0)

  const buildFridgeTower = (cx: number) => {
    pushBox(paint, fridgeW, fridgeH, depth - 2, cx, 0, -1)
    pushBox(paint, ret, fridgeH, 2.2, cx - fridgeW / 2 + ret / 2, 0, frontZ)
    pushBox(paint, ret, fridgeH, 2.2, cx + fridgeW / 2 - ret / 2, 0, frontZ)
    const panelW = fridgeW - ret * 2 - 1.5
    pushBox(paint, panelW, fridgeH - toe - 4, 1.8, cx, toe + 2, frontZ + 0.4)
    pushBox(metal, 1.6, fridgeH * 0.55, 2.4, cx + panelW * 0.42, toe + fridgeH * 0.2, frontZ + 2)
    pushBox(paint, fridgeW * 0.96, toe, depth * 0.88, cx, 0, -depth * 0.02)
  }
  buildFridgeTower(fridgeL)
  buildFridgeTower(fridgeR)

  // ——— Center: drawers below · counter · open coffee nook · glass above ———
  pushBox(paint, centerW, counterH - toe, depth, centerX, toe, 0)
  pushBox(paint, centerW * 0.94, toe, depth * 0.88, centerX, 0, -depth * 0.02)
  {
    const faceH = counterH - toe - 3.2 // leave room for counter slab
    const t5 = inY(5)
    const t101 = inY(10.125)
    const sum = t5 + t101 + t101
    const scale = faceH / sum
    const banks = [t101 * scale, t101 * scale, t5 * scale]
    const gap = 0.35
    let y = toe + gap
    for (const h of banks) {
      pushBox(drawer, centerW * 0.9, h - gap, 1.8, centerX, y, frontZ)
      pushBox(drawer, centerW * 0.5, 1.3, 2.1, centerX, y + (h - gap) * 0.72, frontZ + 1.4)
      y += h + gap
    }
  }
  // Counter slab (stone) — top at counterH
  const slab = 3.2
  pushBox(stone, centerW + 1.5, slab, depth + 2, centerX, counterH - slab, 1)

  // Nook recess: back wall + side returns (open on +Z)
  const nookY = counterH
  const nookD = depth * 0.72
  pushBox(paint, centerW, nookH, 2.5, centerX, nookY, -halfD + 1.5) // back
  pushBox(paint, 2.2, nookH, nookD, centerX - centerW / 2 + 1.1, nookY, -halfD + nookD / 2 + 1)
  pushBox(paint, 2.2, nookH, nookD, centerX + centerW / 2 - 1.1, nookY, -halfD + nookD / 2 + 1)
  // Underside of glass bank (nook ceiling)
  pushBox(paint, centerW, 2, nookD, centerX, nookY + nookH - 2, -halfD + nookD / 2 + 1)

  // Espresso / coffee machine on counter
  {
    const mw = inX(11)
    const mh = inY(13.5)
    const md = Math.min(depth * 0.45, inX(10))
    const mz = -halfD + md / 2 + 8
    pushBox(metal, mw, mh * 0.55, md, centerX, nookY, mz) // body
    pushBox(metal, mw * 0.92, mh * 0.28, md * 0.7, centerX, nookY + mh * 0.55, mz - md * 0.05) // hoppers
    pushBox(metal, mw * 0.35, mh * 0.12, md * 0.25, centerX, nookY + mh * 0.82, mz + md * 0.15) // group
    pushCyl(metal, 1.4, md * 0.35, centerX + mw * 0.28, nookY + mh * 0.35, mz + md * 0.35, 'z') // steam wand
    // Cup on drip tray
    pushCyl(stone, 2.2, 4.5, centerX - mw * 0.15, nookY + 1, mz + md * 0.4, 'y')
  }

  // Glass cabinets above nook (up to flip-up)
  const gy = nookY + nookH
  pushBox(birch, centerW * 0.96, glassH, depth * 0.85, centerX, gy, -depth * 0.04)
  pushBox(birch, centerW * 0.88, 1.8, depth * 0.7, centerX, gy + glassH * 0.45, 0)
  pushBox(paint, centerW, 3.2, 2, centerX, gy, frontZ)
  pushBox(paint, centerW, 3.2, 2, centerX, gy + glassH - 3.2, frontZ)
  pushBox(paint, 3.2, glassH, 2, centerX - centerW / 2 + 1.6, gy, frontZ)
  pushBox(paint, 3.2, glassH, 2, centerX + centerW / 2 - 1.6, gy, frontZ)
  pushBox(paint, 2, glassH * 0.92, 2, centerX, gy + glassH * 0.04, frontZ + 0.3)
  const leafW = (centerW - 3.2 * 2 - 2.2) / 2
  pushBox(glass, leafW, glassH * 0.86, 1.4, centerX - leafW / 2 - 1.1, gy + glassH * 0.07, frontZ + 0.6)
  pushBox(glass, leafW, glassH * 0.86, 1.4, centerX + leafW / 2 + 1.1, gy + glassH * 0.07, frontZ + 0.6)

  // ——— Full-width flip-up top (2 doors, horizontal pulls) ———
  const fy = fridgeH
  pushBox(paint, width, flipH, depth * 1.02, 0, fy, 0)
  const doorGap = 1.2
  const doorW = (width * 0.96 - doorGap) / 2
  const doorH = flipH * 0.88
  const doorY = fy + flipH * 0.06
  for (const dx of [-doorW / 2 - doorGap / 2, doorW / 2 + doorGap / 2]) {
    pushBox(paint, doorW, doorH, 1.8, dx, doorY, frontZ + 0.3)
    // Horizontal lift-up pull near bottom of door
    pushBox(metal, doorW * 0.55, 1.5, 2.2, dx, doorY + doorH * 0.18, frontZ + 2)
  }
  // Center stile between flip doors
  pushBox(paint, doorGap + 0.8, doorH * 0.95, 2, 0, doorY, frontZ + 0.5)

  const geometry = mergeGeometriesGrouped([
    { geoms: paint, materialIndex: 0 },
    { geoms: drawer, materialIndex: 1 },
    { geoms: glass, materialIndex: 2 },
    { geoms: birch, materialIndex: 3 },
    { geoms: metal, materialIndex: 4 },
    { geoms: stone, materialIndex: 5 }
  ])
  for (const g of [...paint, ...drawer, ...glass, ...birch, ...metal, ...stone]) g.dispose()
  const paintMat = phong(hex || 'f5f5f4', { shininess: 35, specular: new THREE.Color(0x888888) })
  const drawerMat = phong(hex || 'f5f5f4')
  drawerMat.color.offsetHSL(0, 0, 0.05)
  return {
    geometry,
    materials: [
      paintMat,
      drawerMat,
      phong('b8d4e8', {
        shininess: 90,
        specular: new THREE.Color(0xffffff),
        transparent: true,
        opacity: 0.38,
        depthWrite: false
      }),
      phong('d4c4a8', { shininess: 20, specular: new THREE.Color(0x666666) }),
      phong('9ca3af', { shininess: 70, specular: new THREE.Color(0xffffff) }),
      phong('e8e4df', { shininess: 55, specular: new THREE.Color(0xaaaaaa) })
    ]
  }
}

/**
 * Basement bar elevation (BSMT BAR · BIRCH) — 165¼″ × 104¾″ × 25½″, face +Z, y=0 floor.
 * L→R: #52 end · 24″ panel-ready fridge (#60) + open shelves + 3″ top · #53 ·
 * base #54 (2 drawers | drawer+rollouts) · #55 sink (false front + doors) ·
 * #56 (drawer+trash | 2 LOCK drawers) · #57 · #58 (drawer + rollouts, glass-door cabinet,
 * wine rack, 3″ top) · #59 end. Base carcass 34¾″ × 24″ deep; towers 25½″ deep.
 * Countertop + sink are separate items.
 */
function buildBsmtBarWallGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const paint: THREE.BufferGeometry[] = []
  const drawer: THREE.BufferGeometry[] = []
  const glass: THREE.BufferGeometry[] = []
  const metal: THREE.BufferGeometry[] = []
  const dark: THREE.BufferGeometry[] = []
  const wine: THREE.BufferGeometry[] = []

  const sx = width / (165.25 * 2.54)
  const sy = height / (104.75 * 2.54)
  const sz = depth / (25.5 * 2.54)
  const X = (i: number) => i * 2.54 * sx
  const Y = (i: number) => i * 2.54 * sy
  const Z = (i: number) => i * 2.54 * sz
  const halfW = width / 2
  const halfD = depth / 2
  const backZ = -halfD
  const frontT = halfD // tower faces
  const baseD = Z(24)
  const frontB = backZ + baseD // base faces
  const baseH = Y(34.75)
  const toe = Y(4)
  const toeIn = Z(3)
  const gap = 0.3
  const fT = 1.9

  const w52 = X(2)
  const wFr = X(24)
  const w53 = X(1.5)
  const w54 = X(40.125)
  const w55 = X(30)
  const w56 = X(40.125)
  const w57 = X(1.5)
  const w58 = X(24)
  const w59 = X(2)
  const e52 = -halfW
  const eFr = e52 + w52
  const e53 = eFr + wFr
  const e54 = e53 + w53
  const e55 = e54 + w54
  const e56 = e55 + w55
  const e57 = e56 + w56
  const e58 = e57 + w57
  const e59 = e58 + w58
  const mid = (a: number, w: number) => a + w / 2

  // Full-height end panels / stiles
  pushBox(paint, w52, height, depth, mid(e52, w52), 0, 0)
  pushBox(paint, w53, height, depth, mid(e53, w53), 0, 0)
  pushBox(paint, w57, height, depth, mid(e57, w57), 0, 0)
  pushBox(paint, w59, height, depth, mid(e59, w59), 0, 0)

  const front = (
    list: THREE.BufferGeometry[],
    cx: number,
    w: number,
    y0: number,
    h: number,
    zFace: number
  ) => pushBox(list, w - gap, h - gap, fT, cx, y0 + gap / 2, zFace - fT / 2 + 0.5)
  const pullH = (cx: number, y: number, w: number, zFace: number) =>
    pushBox(metal, w, 1.1, 1.5, cx, y, zFace + 0.5)
  const pullV = (cx: number, y0: number, h: number, zFace: number) =>
    pushBox(metal, 1.1, h, 1.5, cx, y0, zFace + 0.5)
  const lock = (cx: number, y: number, zFace: number) =>
    pushBox(metal, 1.6, 1.6, 1.0, cx, y, zFace + 0.4)

  // ——— Left tower: fridge (#60) · open shelves · 3″ top ———
  {
    const cx = mid(eFr, wFr)
    const fy1 = Y(70)
    pushBox(dark, wFr, fy1, 1.2, cx, 0, backZ + 0.6)
    pushBox(dark, wFr * 0.97, fy1 - Y(1), baseD - 4, cx, Y(0.5), backZ + (baseD - 4) / 2)
    const zF = backZ + Z(24.5)
    const seam = eFr + wFr * 0.74
    const lw = seam - eFr - gap
    const rw = eFr + wFr - seam - gap
    pushBox(paint, lw, fy1 - Y(2), fT, eFr + gap / 2 + lw / 2, Y(1), zF - fT / 2 + 0.5)
    pushBox(paint, rw, fy1 - Y(2), fT, seam + gap / 2 + rw / 2, Y(1), zF - fT / 2 + 0.5)
    pullV(seam - 2.5, Y(26), Y(30), zF)
    pullV(seam + 1.6, Y(26), Y(30), zF)
    // Roof of fridge niche + open shelf bay
    pushBox(paint, wFr, Y(2), depth, cx, fy1, 0)
    const oy0 = fy1 + Y(2)
    const oy1 = Y(99.75)
    pushBox(paint, wFr, oy1 - oy0, 1.2, cx, oy0, backZ + 0.6)
    pushBox(paint, wFr, 1.9, depth * 0.9, cx, Y(85.5), backZ + (depth * 0.9) / 2)
    pushBox(paint, wFr, Y(2), depth, cx, oy1, 0)
    pushBox(paint, wFr + X(0.6), Y(3), depth, cx, Y(101.75), 0)
  }

  // ——— Base run #54 · #55 · #56 ———
  {
    const runW = w54 + w55 + w56
    pushBox(paint, runW, baseH - toe, baseD, e54 + runW / 2, toe, backZ + baseD / 2)
    pushBox(dark, runW * 0.98, toe, baseD - toeIn, e54 + runW / 2, 0, backZ + (baseD - toeIn) / 2)

    const wh = X(18.5625)
    const edge = X(0.75)
    const doorY = Y(4.5)
    const doorH = Y(21.75)
    const drY = Y(28)
    const drH = Y(5)
    const stY1 = Y(4.5)
    const stY2 = Y(19.375)
    const stH = Y(13.375)

    const twoDrawers = (cx: number, withLock: boolean) => {
      for (const y of [stY1, stY2]) {
        front(drawer, cx, wh, y, stH, frontB)
        pullH(cx, y + stH * 0.78, wh * 0.35, frontB)
        if (withLock) lock(cx, y + stH * 0.5, frontB)
      }
    }
    const drawerOverDoor = (cx: number, pull: 'side' | 'top', sideX: number) => {
      front(drawer, cx, wh, drY, drH, frontB)
      pullH(cx, drY + drH * 0.5, wh * 0.35, frontB)
      front(paint, cx, wh, doorY, doorH, frontB)
      if (pull === 'side') pullV(sideX, doorY + doorH * 0.55, Y(8), frontB)
      else pullH(cx, doorY + doorH * 0.88, wh * 0.4, frontB)
    }

    // #54
    const c54L = e54 + edge + wh / 2
    const c54R = e55 - edge - wh / 2
    twoDrawers(c54L, false)
    drawerOverDoor(c54R, 'side', c54R - wh / 2 + X(1.5))

    // #55 sink: false front + double doors
    const c55 = mid(e55, w55)
    const sw = w55 - X(3)
    front(drawer, c55, sw, drY, drH, frontB)
    pullH(c55, drY + drH * 0.5, X(8), frontB)
    const leaf = sw / 2
    front(paint, c55 - leaf / 2 - gap / 2, leaf, doorY, doorH, frontB)
    front(paint, c55 + leaf / 2 + gap / 2, leaf, doorY, doorH, frontB)
    pullV(c55 - 2.2, doorY + doorH * 0.55, Y(8), frontB)
    pullV(c55 + 2.2, doorY + doorH * 0.55, Y(8), frontB)

    // #56
    const c56L = e56 + edge + wh / 2
    const c56R = e57 - edge - wh / 2
    drawerOverDoor(c56L, 'top', c56L)
    twoDrawers(c56R, true)
  }

  // ——— Right tower #58: base · glass-door cabinet · wine rack · 3″ top ———
  {
    const cx = mid(e58, w58)
    pushBox(paint, w58, baseH - toe, depth, cx, toe, 0)
    pushBox(dark, w58 * 0.96, toe, depth - toeIn, cx, 0, backZ + (depth - toeIn) / 2)
    const fw = w58 - X(1.5)
    const drY = Y(28)
    const drH = Y(5)
    front(drawer, cx, fw, drY, drH, frontT)
    pullH(cx, drY + drH * 0.5, fw * 0.35, frontT)
    front(paint, cx, fw, Y(4.5), Y(21.75), frontT)
    pullV(cx - fw / 2 + X(1.5), Y(4.5) + Y(21.75) * 0.55, Y(8), frontT)

    // Glass-door cabinet (35¼″)
    const gy0 = baseH
    const gy1 = Y(70)
    const gH = gy1 - gy0
    pushBox(paint, w58, 1.8, depth, cx, gy0, 0)
    pushBox(paint, w58, 1.8, depth, cx, gy1 - 1.8, 0)
    pushBox(paint, w58, gH, 1.2, cx, gy0, backZ + 0.6)
    for (const f of [0.34, 0.67]) {
      pushBox(paint, w58, 1.0, depth * 0.9, cx, gy0 + gH * f, backZ + (depth * 0.9) / 2)
    }
    const dw = w58 - X(1)
    const sw = X(2.5)
    const rh = Y(2.5)
    const zc = frontT - fT / 2 + 0.5
    pushBox(paint, dw, rh, fT, cx, gy0 + 0.5, zc)
    pushBox(paint, dw, rh, fT, cx, gy1 - rh - 0.5, zc)
    pushBox(paint, sw, gH - 1, fT, cx - dw / 2 + sw / 2, gy0 + 0.5, zc)
    pushBox(paint, sw, gH - 1, fT, cx + dw / 2 - sw / 2, gy0 + 0.5, zc)
    pushBox(glass, dw - 2 * sw, gH - 1 - 2 * rh, 0.6, cx, gy0 + 0.5 + rh, frontT - 0.9)
    pullV(cx - dw / 2 + sw / 2, gy0 + gH * 0.45, Y(10), frontT)

    // Wine rack (31¾″ bay) + 3″ top
    const wy0 = Y(70)
    const wy1 = Y(101.75)
    pushBox(paint, w58, Y(1.5), depth, cx, wy0, 0)
    pushBox(paint, w58, Y(2), depth, cx, wy1 - Y(2), 0)
    pushBox(paint, w58, wy1 - wy0, 1.2, cx, wy0, backZ + 0.6)
    const r0 = wy0 + Y(1.5)
    const rH = wy1 - Y(2) - r0
    const rD = depth * 0.86
    for (let i = 1; i <= 4; i++) {
      pushBox(wine, 1.0, rH, rD, e58 + (w58 * i) / 5, r0, backZ + rD / 2)
    }
    for (let k = 1; k <= 4; k++) {
      pushBox(wine, w58, 0.9, rD, cx, r0 + (rH * k) / 5 - 0.45, backZ + rD / 2)
    }
    pushBox(paint, w58 + X(0.6), Y(3), depth, cx, wy1, 0)
  }

  const geometry = mergeGeometriesGrouped([
    { geoms: paint, materialIndex: 0 },
    { geoms: drawer, materialIndex: 1 },
    { geoms: glass, materialIndex: 2 },
    { geoms: metal, materialIndex: 3 },
    { geoms: dark, materialIndex: 4 },
    { geoms: wine, materialIndex: 5 }
  ])
  for (const g of [...paint, ...drawer, ...glass, ...metal, ...dark, ...wine]) g.dispose()
  const paintMat = phong(hex || 'c9b896', { shininess: 30, specular: new THREE.Color(0x666666) })
  const drawerMat = phong(hex || 'c9b896', { shininess: 30, specular: new THREE.Color(0x666666) })
  drawerMat.color.offsetHSL(0, 0, 0.035)
  return {
    geometry,
    materials: [
      paintMat,
      drawerMat,
      phong('b8d4e8', {
        shininess: 90,
        specular: new THREE.Color(0xffffff),
        transparent: true,
        opacity: 0.35,
        depthWrite: false
      }),
      phong('9ca3af', { shininess: 70, specular: new THREE.Color(0xffffff) }),
      phong('3a3732'),
      phong('b08a5a', { shininess: 20 })
    ]
  }
}

/**
 * Paint-grade 3-drawer base (Titan kitchen #9/#10).
 * Face on +Z. Toe-kick + drawers: ~5″ / 10⅛″ / 10⅛″ of clear face.
 */
function buildCabDrawersGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const body: THREE.BufferGeometry[] = []
  const drawer: THREE.BufferGeometry[] = []
  const toe = Math.min(10.16, height * 0.12) // ~4″
  const faceH = height - toe
  const halfW = width / 2

  pushBox(body, width, faceH, depth, 0, toe, 0)
  pushBox(body, width * 0.92, toe, depth * 0.85, 0, 0, -depth * 0.04)

  // Titan face: top 5″, middle 10⅛″, bottom 10⅛″ (scaled to clear height)
  const t5 = 5 * 2.54
  const t101 = 10.125 * 2.54
  const sum = t5 + t101 + t101
  const scale = faceH / sum
  const hTop = t5 * scale
  const hMid = t101 * scale
  const hBot = t101 * scale
  const gap = 0.35
  const frontZ = depth / 2 - 1
  let y = toe + gap
  const banks = [
    { h: hBot, y0: y },
    { h: hMid, y0: (y += hBot + gap) },
    { h: hTop, y0: (y += hMid + gap) }
  ]
  for (const d of banks) {
    pushBox(drawer, width * 0.92, d.h - gap, 1.8, 0, d.y0, frontZ)
    // Horizontal bar pull
    pushBox(drawer, width * 0.55, 1.4, 2.2, 0, d.y0 + (d.h - gap) * 0.72, frontZ + 1.5)
  }
  // Side stiles hint
  pushBox(body, 2.2, faceH * 0.96, 2, -halfW + 1.2, toe, frontZ + 0.2)
  pushBox(body, 2.2, faceH * 0.96, 2, halfW - 1.2, toe, frontZ + 0.2)

  const geometry = mergeGeometriesGrouped([
    { geoms: body, materialIndex: 0 },
    { geoms: drawer, materialIndex: 1 }
  ])
  for (const g of [...body, ...drawer]) g.dispose()
  const a = phong(hex || 'f5f5f4')
  const b = phong(hex || 'f5f5f4')
  b.color.offsetHSL(0, 0, 0.06)
  return { geometry, materials: [a, b] }
}

/**
 * Monogram ZDP486-style 48″ dual-fuel pro range.
 * Front face +Z: dual side-by-side ovens (narrow L / wide R), brass-accent knobs,
 * center display, 6 burners + right griddle on cooktop. Y=0 at floor.
 */
function buildRangeGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const steel: THREE.BufferGeometry[] = []
  const glass: THREE.BufferGeometry[] = []
  const iron: THREE.BufferGeometry[] = []
  const brass: THREE.BufferGeometry[] = []
  const display: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const halfD = depth / 2
  const steelHex = hex && hex !== '2a2a2a' ? hex : 'c8ccd0'
  const toe = Math.max(6, height * 0.07)
  const cookH = Math.max(4.5, height * 0.055)
  const railH = Math.max(9, height * 0.11)
  const ovenTop = height - cookH - railH
  const ovenH = ovenTop - toe - 2
  const faceZ = halfD - 0.8

  // ——— Body / toe / side panels ———
  pushBox(steel, width, toe * 0.85, depth * 0.92, 0, 0, -depth * 0.01)
  pushBox(steel, width, ovenH + railH + cookH * 0.35, depth, 0, toe, 0)
  // Side skins (slightly proud)
  pushBox(steel, 1.2, height - toe * 0.3, depth * 0.98, -halfW + 0.6, toe * 0.15, 0)
  pushBox(steel, 1.2, height - toe * 0.3, depth * 0.98, halfW - 0.6, toe * 0.15, 0)

  // ——— Dual oven doors (narrow left ~36%, wide right ~62%) ———
  const gap = 1.6
  const leftW = width * 0.34
  const rightW = width * 0.58
  const leftCx = -halfW + leftW / 2 + width * 0.035
  const rightCx = halfW - rightW / 2 - width * 0.035
  const doorY = toe + 1.5
  const doorH = ovenH - 2
  for (const { cx, dw } of [
    { cx: leftCx, dw: leftW },
    { cx: rightCx, dw: rightW }
  ]) {
    // Door frame (stainless)
    pushBox(steel, dw, doorH, 2.2, cx, doorY, faceZ)
    // Black glass lite
    const gInsetX = dw * 0.1
    const gInsetY = doorH * 0.1
    pushBox(
      glass,
      dw - gInsetX * 2,
      doorH - gInsetY * 2 - 4,
      1.2,
      cx,
      doorY + gInsetY + 2,
      faceZ + 1.2
    )
    // Inner window reveal
    pushBox(steel, dw - gInsetX * 2 + 1.5, 1.2, 1.4, cx, doorY + doorH - gInsetY - 1, faceZ + 1.5)
    pushBox(steel, dw - gInsetX * 2 + 1.5, 1.2, 1.4, cx, doorY + gInsetY + 1, faceZ + 1.5)
    // Tubular handle (per door — leave a clear gap at the mullion)
    const handleY = doorY + doorH - Math.min(7, doorH * 0.12)
    const handleW = dw * 0.72
    pushCyl(steel, 1.7, handleW, cx - handleW / 2, handleY, faceZ + 5.2, 'x')
    pushBox(steel, 2.4, 2.4, 4.2, cx - handleW / 2 + 2.2, handleY - 1.2, faceZ + 2)
    pushBox(steel, 2.4, 2.4, 4.2, cx + handleW / 2 - 2.2, handleY - 1.2, faceZ + 2)
  }
  // Center mullion between ovens
  pushBox(steel, gap + 1.2, doorH + 2, 2.4, (leftCx + rightCx) / 2 + (rightW - leftW) * 0.02, doorY, faceZ + 0.3)

  // Kick / brand rail under right oven — "MONOGRAM" as plaque dashes
  const brandY = toe * 0.35
  const brandZ = faceZ + 0.6
  pushBox(steel, rightW * 0.55, 2.2, 1.2, rightCx, brandY, brandZ)
  for (let i = 0; i < 8; i++) {
    pushBox(brass, 1.6, 0.7, 0.6, rightCx - rightW * 0.2 + i * 3.2, brandY + 0.7, brandZ + 0.5)
  }

  // ——— Control rail (front of cooktop) ———
  const railY = toe + ovenH + 1
  pushBox(steel, width * 0.98, railH, depth * 0.22, 0, railY, halfD - depth * 0.12)
  // Bevel / drip edge
  pushBox(steel, width * 0.96, 1.5, depth * 0.08, 0, railY + railH - 1, halfD - depth * 0.02)

  // Center digital display + buttons
  const dispW = Math.min(22, width * 0.14)
  const dispH = railH * 0.42
  pushBox(display, dispW, dispH, 1.5, 0, railY + railH * 0.38, faceZ + 0.5)
  pushBox(steel, dispW + 2, dispH + 2, 1.2, 0, railY + railH * 0.35, faceZ)
  for (let i = -2; i <= 2; i++) {
    pushCyl(steel, 0.7, 0.8, i * 3.2, railY + railH * 0.18, faceZ + 1.2, 'z')
  }

  // Knobs — 5 left of display, 5 right (Monogram pro layout); brass center fin
  const knobR = Math.min(3.4, width * 0.022)
  const knobY = railY + railH * 0.48
  const knobZ = faceZ + 2.2
  const leftKnobXs = [-0.42, -0.32, -0.22, -0.14, -0.08].map((t) => t * width)
  const rightKnobXs = [0.08, 0.14, 0.22, 0.32, 0.42].map((t) => t * width)
  for (const kx of [...leftKnobXs, ...rightKnobXs]) {
    pushCyl(steel, knobR, 2.2, kx, knobY, knobZ, 'z')
    pushCyl(brass, knobR * 0.35, 2.6, kx, knobY, knobZ + 0.2, 'z')
    // Pointer tick
    pushBox(brass, knobR * 0.35, knobR * 1.1, 0.5, kx, knobY + knobR * 0.35, knobZ + 2.4)
  }

  // ——— Cooktop ———
  const topY = height - cookH
  pushBox(steel, width * 0.98, cookH * 0.55, depth * 0.88, 0, topY, -depth * 0.02)
  // Burner zone (left ~62%) + griddle (right ~32%)
  const burnZoneW = width * 0.62
  const burnCx = -halfW + burnZoneW / 2 + width * 0.04
  const gridW = width * 0.3
  const gridCx = halfW - gridW / 2 - width * 0.04
  const topZ0 = -halfD + depth * 0.18
  const topZ1 = halfD - depth * 0.22

  // Cast-iron continuous grates (3 columns × 2 burners)
  const colXs = [-0.32, 0, 0.32].map((t) => burnCx + t * burnZoneW * 0.85)
  const rowZs = [0.28, -0.22].map((t) => (topZ0 + topZ1) / 2 + t * (topZ1 - topZ0))
  for (const bx of colXs) {
    // Longitudinal grate bars
    for (let i = 0; i < 5; i++) {
      const gz = topZ0 + ((i + 0.5) / 5) * (topZ1 - topZ0)
      pushBox(iron, burnZoneW * 0.28, 1.2, 1.1, bx, topY + cookH * 0.55, gz)
    }
    // Cross bars
    for (const rz of rowZs) {
      pushBox(iron, burnZoneW * 0.3, 1.1, depth * 0.12, bx, topY + cookH * 0.5, rz)
    }
  }
  // Burner caps
  for (const bx of colXs) {
    for (const bz of rowZs) {
      pushCyl(iron, Math.min(7.5, width * 0.045), 1.4, bx, topY + cookH * 0.62, bz, 'y')
      pushCyl(steel, Math.min(3.2, width * 0.02), 1.0, bx, topY + cookH * 0.75, bz, 'y')
    }
  }

  // Stainless griddle plate + front grease trough + lid lip
  pushBox(steel, gridW * 0.92, 1.8, (topZ1 - topZ0) * 0.92, gridCx, topY + cookH * 0.55, (topZ0 + topZ1) / 2)
  pushBox(iron, gridW * 0.88, 0.6, 2.2, gridCx, topY + cookH * 0.7, topZ1 - 3)
  // Griddle cover (tilted-ish as thin plate parked up)
  pushBox(steel, gridW * 0.9, 1.2, (topZ1 - topZ0) * 0.5, gridCx, topY + cookH * 0.9, topZ0 + 8)

  // Backsplash / island trim at rear of cooktop
  pushBox(steel, width * 0.96, Math.min(8, height * 0.06), 2.5, 0, topY + cookH * 0.3, -halfD + 2)

  const geometry = mergeGeometriesGrouped([
    { geoms: steel, materialIndex: 0 },
    { geoms: glass, materialIndex: 1 },
    { geoms: iron, materialIndex: 2 },
    { geoms: brass, materialIndex: 3 },
    { geoms: display, materialIndex: 4 }
  ])
  for (const g of [...steel, ...glass, ...iron, ...brass, ...display]) g.dispose()
  return {
    geometry,
    materials: [
      phong(steelHex, { shininess: 85, specular: new THREE.Color(0xffffff) }),
      phong('0a0a0a', {
        shininess: 120,
        specular: new THREE.Color(0x666666),
        transparent: true,
        opacity: 0.92
      }),
      phong('1a1a1a', { shininess: 25, specular: new THREE.Color(0x333333) }),
      phong('b8923a', { shininess: 90, specular: new THREE.Color(0xffe2a0) }),
      phong('1e2930', { shininess: 40, emissive: new THREE.Color(0x1a3040), emissiveIntensity: 0.35 })
    ]
  }
}

/**
 * GE Profile-style 24″ built-in dishwasher (PDP755 look):
 * fingerprint-resistant stainless door, recessed pocket handle, top-control
 * (no front buttons), status LED, black toe-kick. Face +Z. Y=0 at floor.
 */
function buildDishwasherGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const steel: THREE.BufferGeometry[] = []
  const dark: THREE.BufferGeometry[] = []
  const accent: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const halfD = depth / 2
  const steelHex = hex || 'c0c5ca'
  const toe = Math.max(8, height * 0.1)
  const doorH = height - toe - 1.5
  const faceZ = halfD - 0.6

  // Body / tub shell
  pushBox(steel, width * 0.98, height - toe * 0.15, depth * 0.96, 0, toe * 0.1, -depth * 0.01)
  // Black toe-kick
  pushBox(dark, width * 0.96, toe * 0.92, depth * 0.88, 0, 0, -depth * 0.02)

  // Door panel (full stainless face)
  pushBox(steel, width * 0.94, doorH, 2.4, 0, toe + 0.8, faceZ)
  // Subtle vertical grain ribs (fingerprint-resistant look)
  const ribs = 9
  for (let i = 0; i < ribs; i++) {
    const rx = -width * 0.42 + ((i + 0.5) / ribs) * width * 0.84
    pushBox(accent, 0.35, doorH * 0.92, 0.5, rx, toe + doorH * 0.08, faceZ + 1.3)
  }

  // Recessed pocket handle — centered, mid-upper door (GE Profile style)
  const pocketW = Math.min(28, width * 0.42)
  const pocketH = Math.max(3.2, height * 0.035)
  const pocketY = toe + doorH * 0.52
  // Pocket cavity (dark recess)
  pushBox(dark, pocketW, pocketH, 2.8, 0, pocketY, faceZ - 0.2)
  // Upper lip of pocket
  pushBox(steel, pocketW + 1.5, 1.1, 1.6, 0, pocketY + pocketH * 0.55, faceZ + 1.0)
  // Lower grip edge
  pushBox(steel, pocketW + 0.8, 0.9, 2.0, 0, pocketY - pocketH * 0.35, faceZ + 0.6)

  // Status LED strip above pocket (small horizontal indicator)
  pushBox(accent, Math.min(10, width * 0.14), 0.7, 0.6, 0, pocketY + pocketH + 2.2, faceZ + 1.5)

  // Top edge control hint (hidden top-control — thin dark strip at door top)
  pushBox(dark, width * 0.88, 1.2, 1.8, 0, toe + doorH - 1.5, faceZ + 0.4)

  // Side reveals / install flanges
  pushBox(dark, 0.8, doorH * 0.98, depth * 0.5, -halfW + 0.5, toe + 0.5, -depth * 0.05)
  pushBox(dark, 0.8, doorH * 0.98, depth * 0.5, halfW - 0.5, toe + 0.5, -depth * 0.05)

  // Bottom door seal line
  pushBox(dark, width * 0.9, 0.6, 1.2, 0, toe + 1.2, faceZ + 1.0)

  const geometry = mergeGeometriesGrouped([
    { geoms: steel, materialIndex: 0 },
    { geoms: dark, materialIndex: 1 },
    { geoms: accent, materialIndex: 2 }
  ])
  for (const g of [...steel, ...dark, ...accent]) g.dispose()
  return {
    geometry,
    materials: [
      phong(steelHex, { shininess: 88, specular: new THREE.Color(0xffffff) }),
      phong('141414', { shininess: 30, specular: new THREE.Color(0x333333) }),
      phong('9aa3aa', { shininess: 70, specular: new THREE.Color(0xcccccc) })
    ]
  }
}

/**
 * Pro stainless canopy hood — wide canopy (meant wider than the range),
 * under-lights, baffle filters, grease trough, tall chimney. Face +Z. Y=0 at canopy lip.
 */
function buildSsHoodGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const steel: THREE.BufferGeometry[] = []
  const dark: THREE.BufferGeometry[] = []
  const glass: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const halfD = depth / 2
  const steelHex = hex || 'c8ccd0'
  const canopyH = Math.max(22, Math.min(height * 0.32, 42))
  const chimneyH = height - canopyH
  const lip = Math.max(3.5, canopyH * 0.12)

  // ——— Wide canopy shell ———
  pushBox(steel, width, canopyH * 0.55, depth * 0.95, 0, lip, -depth * 0.02)
  // Front apron face (proud)
  pushBox(steel, width * 1.0, canopyH * 0.5, 2.8, 0, lip + 1, halfD - 1.2)
  // Angled-look front bevel (stepped)
  pushBox(steel, width * 0.98, canopyH * 0.22, depth * 0.35, 0, lip + canopyH * 0.45, halfD * 0.35)
  pushBox(steel, width * 0.92, canopyH * 0.18, depth * 0.22, 0, lip + canopyH * 0.62, halfD * 0.05)
  // Bottom lip / grease trough
  pushBox(steel, width * 1.02, lip, depth * 1.0, 0, 0, 0)
  pushBox(dark, width * 0.94, 1.6, depth * 0.7, 0, lip * 0.35, -depth * 0.05)

  // Side cheeks (canopy wider silhouette)
  pushBox(steel, 3.2, canopyH - 2, depth * 0.92, -halfW + 1.6, 1, 0)
  pushBox(steel, 3.2, canopyH - 2, depth * 0.92, halfW - 1.6, 1, 0)

  // Baffle filter bank (dark slots under canopy)
  const filters = 4
  const fw = (width * 0.7) / filters
  for (let i = 0; i < filters; i++) {
    const fx = -width * 0.35 + (i + 0.5) * fw
    pushBox(dark, fw * 0.88, 1.2, depth * 0.45, fx, lip + 2.5, -depth * 0.08)
    // Baffle ribs
    for (let r = 0; r < 3; r++) {
      pushBox(steel, fw * 0.8, 0.7, 1.1, fx, lip + 3.2, -depth * 0.2 + r * (depth * 0.12))
    }
  }

  // Under-cabinet LED strips
  for (const side of [-0.28, 0.28] as const) {
    pushBox(glass, width * 0.28, 1.0, 2.2, side * width, lip + 1.2, halfD * 0.55)
  }

  // Control / heat lamps strip on front lip
  pushBox(dark, width * 0.35, 2.4, 2.0, 0, lip + canopyH * 0.28, halfD + 0.4)
  for (const lx of [-0.12, 0, 0.12] as const) {
    pushCyl(glass, 1.1, 1.4, lx * width, lip + canopyH * 0.28, halfD + 1.6, 'z')
  }

  // ——— Tall chimney (rises to crown) ———
  const stackW = Math.min(width * 0.42, 70)
  const stackD = depth * 0.55
  pushBox(steel, stackW, chimneyH * 0.92, stackD, 0, canopyH, -depth * 0.12)
  // Chimney side reveals / seams
  pushBox(dark, 0.6, chimneyH * 0.88, stackD * 0.98, -stackW / 2 + 0.4, canopyH + 2, -depth * 0.12)
  pushBox(dark, 0.6, chimneyH * 0.88, stackD * 0.98, stackW / 2 - 0.4, canopyH + 2, -depth * 0.12)
  // Front chimney face with horizontal seams
  const seams = 5
  for (let i = 1; i < seams; i++) {
    const sy = canopyH + (chimneyH * 0.92 * i) / seams
    pushBox(dark, stackW * 0.92, 0.55, 0.8, 0, sy, -depth * 0.12 + stackD / 2 - 0.3)
  }
  // Top duct collar / ceiling trim
  pushBox(steel, stackW * 1.08, 4.5, stackD * 1.1, 0, height - 5, -depth * 0.12)
  pushBox(steel, stackW * 0.7, 3, stackD * 0.7, 0, height - 2, -depth * 0.12)

  // Canopy-to-chimney transition collar
  pushBox(steel, Math.min(width * 0.55, stackW * 1.35), 5, depth * 0.7, 0, canopyH - 1, -depth * 0.08)

  const geometry = mergeGeometriesGrouped([
    { geoms: steel, materialIndex: 0 },
    { geoms: dark, materialIndex: 1 },
    { geoms: glass, materialIndex: 2 }
  ])
  for (const g of [...steel, ...dark, ...glass]) g.dispose()
  return {
    geometry,
    materials: [
      phong(steelHex, { shininess: 95, specular: new THREE.Color(0xffffff) }),
      phong('1a1a1a', { shininess: 40, specular: new THREE.Color(0x555555) }),
      phong('dceeff', {
        shininess: 100,
        transparent: true,
        opacity: 0.75,
        emissive: new THREE.Color(0xaaccff),
        emissiveIntensity: 0.45
      })
    ]
  }
}

/**
 * Coastal-modern wood range hood — grand apron that spans between wall cabinets,
 * tapered chimney to crown, vertical oak boards, corbels, black liner. Face +Z.
 * Y=0 at apron underside (align with adjacent wall-cab bottoms).
 */
function buildWoodHoodGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const oak: THREE.BufferGeometry[] = []
  const accent: THREE.BufferGeometry[] = []
  const liner: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const halfD = depth / 2
  const oakHex = hex || 'd7c4a3'
  // Proportions: deep apron (~38% H), chimney fills the rest to crown
  const apronH = Math.max(28, height * 0.38)
  const chimneyH = height - apronH
  const shelfT = Math.max(5.5, height * 0.045)
  const boardT = 1.15
  const nBoards = Math.max(7, Math.round(width / 14))

  // ——— Apron body (full width — butts into flanking cabinets) ———
  pushBox(oak, width, apronH - shelfT, depth * 0.92, 0, shelfT, -depth * 0.02)
  // Thick floating mantel / light rail at bottom
  pushBox(oak, width * 1.01, shelfT, depth * 1.02, 0, 0, depth * 0.02)
  // Front bullnose lip
  pushBox(accent, width * 1.01, shelfT * 0.55, 2.2, 0, shelfT * 0.15, halfD + 0.6)

  // Vertical board cladding on apron face (+Z)
  const boardW = (width * 0.96) / nBoards
  for (let i = 0; i < nBoards; i++) {
    const bx = -width * 0.48 + (i + 0.5) * boardW
    pushBox(oak, boardW * 0.9, apronH - shelfT - 2, boardT, bx, shelfT + 1, halfD - 0.4)
    // Reveal shadow line
    if (i < nBoards - 1) {
      pushBox(accent, 0.45, apronH - shelfT - 3, 0.6, bx + boardW * 0.5, shelfT + 1.5, halfD - 0.1)
    }
  }
  // Top rail of apron (under chimney)
  pushBox(accent, width * 0.98, 3.2, depth * 0.88, 0, apronH - 3.2, -depth * 0.02)

  // Side returns / ears — full-height rails that seat into flanking cabinets
  pushBox(oak, 4.5, height - 2, depth * 0.95, -halfW + 2.25, 1, 0)
  pushBox(oak, 4.5, height - 2, depth * 0.95, halfW - 2.25, 1, 0)
  // Apron end caps (connect look)
  pushBox(accent, 2.2, apronH - shelfT, depth * 0.98, -halfW + 1.1, shelfT, 0)
  pushBox(accent, 2.2, apronH - shelfT, depth * 0.98, halfW - 1.1, shelfT, 0)

  // Corbels under mantel (grand coastal — chunky scrolled blocks)
  for (const side of [-1, 1] as const) {
    const cx = side * (halfW * 0.72)
    pushBox(oak, 7, shelfT + 10, depth * 0.55, cx, 0, halfD * 0.15)
    pushBox(oak, 5.5, 6, depth * 0.4, cx, shelfT + 2, halfD * 0.28)
    pushBox(accent, 4, 3.5, 3, cx, shelfT + 0.5, halfD * 0.45)
  }

  // Black metal liner recess (functional hood mouth)
  pushBox(liner, width * 0.72, 3.5, depth * 0.55, 0, shelfT + 0.5, -depth * 0.05)
  pushBox(liner, width * 0.68, apronH * 0.35, 1.5, 0, shelfT + apronH * 0.15, halfD - depth * 0.35)

  // ——— Full-width chimney body (reads continuous with flanking cabs) ———
  const bodyH = chimneyH * 0.72
  pushBox(oak, width * 0.995, bodyH, depth * 0.88, 0, apronH, -depth * 0.03)
  // Vertical boards continue up the face
  const cn = Math.max(7, Math.round(width / 14))
  const cw = (width * 0.96) / cn
  for (let i = 0; i < cn; i++) {
    const bx = -width * 0.48 + (i + 0.5) * cw
    pushBox(oak, cw * 0.9, bodyH - 2, boardT, bx, apronH + 1, halfD * 0.78)
    if (i < cn - 1) {
      pushBox(accent, 0.4, bodyH - 4, 0.55, bx + cw * 0.5, apronH + 2, halfD * 0.82)
    }
  }
  // Mid belt / light reveal (breaks the tall face)
  pushBox(accent, width * 1.0, 2.8, depth * 0.9, 0, apronH + bodyH * 0.55, -depth * 0.02)

  // Upper stepped chase (grand, but still wide enough to read connected)
  const chaseH = chimneyH - bodyH
  pushBox(oak, width * 0.88, chaseH * 0.55, depth * 0.72, 0, apronH + bodyH, -depth * 0.05)
  pushBox(oak, width * 0.72, chaseH * 0.45, depth * 0.58, 0, apronH + bodyH + chaseH * 0.55, -depth * 0.08)
  pushBox(accent, width * 0.9, 1.6, depth * 0.75, 0, apronH + bodyH + chaseH * 0.55 - 1.6, -depth * 0.03)

  // Crown / light rail at top — ties into adjacent cabinet crowns
  pushBox(oak, width * 0.995, 5.5, depth * 0.7, 0, height - 5.5, -depth * 0.05)
  pushBox(accent, width * 1.0, 2.4, depth * 0.76, 0, height - 2.4, -depth * 0.03)
  pushBox(accent, width * 0.92, 1.8, depth * 0.5, 0, height - 7.4, halfD * 0.1)

  const geometry = mergeGeometriesGrouped([
    { geoms: oak, materialIndex: 0 },
    { geoms: accent, materialIndex: 1 },
    { geoms: liner, materialIndex: 2 }
  ])
  for (const g of [...oak, ...accent, ...liner]) g.dispose()
  const light = phong(oakHex, { shininess: 28, specular: new THREE.Color(0x887766) })
  const dark = phong(oakHex, { shininess: 35, specular: new THREE.Color(0x665544) })
  dark.color.offsetHSL(0.02, 0.05, -0.12)
  return {
    geometry,
    materials: [
      light,
      dark,
      phong('1a1a1a', { shininess: 60, specular: new THREE.Color(0x444444) })
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
  // Shallow depth = wall cabinet (no toe), including tall 51″ Titan uppers
  const isWall = depth <= 40
  const toe = isWall ? 0 : Math.min(10, height * 0.12)

  pushBox(body, width, height - toe, depth, 0, toe, 0)
  if (toe > 0) pushBox(body, width * 0.92, toe, depth * 0.85, 0, 0, -depth * 0.02)

  const doors = Math.max(1, Math.round(width / 55))
  const dw = (width * 0.92) / doors
  for (let i = 0; i < doors; i++) {
    const x = -width * 0.46 + (i + 0.5) * dw
    pushBox(door, dw * 0.92, (height - toe) * 0.88, 1.8, x, toe + (height - toe) * 0.06, depth / 2 - 1)
    // Handle
    pushBox(door, 1.2, Math.min(14, height * 0.12), 2.5, x + dw * 0.28, toe + (height - toe) * 0.5, depth / 2 + 1)
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
 * Open face-frame shelf unit (office uppers). Open on +Z.
 * Y=0 at unit bottom (pushBox bottom-origin). 2″ stiles, rails, back, 3 shelves.
 */
function buildOpenShelfGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const frame: THREE.BufferGeometry[] = []
  const shelf: THREE.BufferGeometry[] = []
  const stile = Math.min(5.08, width * 0.05) // ~2″
  const rail = Math.min(5.08, height * 0.04)
  const back = Math.min(1.2, depth * 0.08)
  const shelfT = Math.min(2.2, height * 0.03)
  const halfW = width / 2
  const halfD = depth / 2

  // Sides + bottom/top rails (carcass) — y is bottom of each box
  pushBox(frame, stile, height, depth, -halfW + stile / 2, 0, 0)
  pushBox(frame, stile, height, depth, halfW - stile / 2, 0, 0)
  pushBox(frame, width - stile * 2, rail, depth, 0, 0, 0)
  pushBox(frame, width - stile * 2, rail, depth, 0, height - rail, 0)
  // Back panel
  pushBox(frame, width - stile * 0.4, height, back, 0, 0, -halfD + back / 2)

  // Adjustable shelves — ~1 per 14″ of clear height (pantry towers ≈7)
  const innerH = height - rail * 2
  const shelfCount = Math.max(3, Math.min(8, Math.round(innerH / 35.5)))
  for (let i = 1; i <= shelfCount; i++) {
    const y = rail + (innerH * i) / (shelfCount + 1) - shelfT / 2
    pushBox(shelf, width - stile * 2 - 0.4, shelfT, depth - back - 1.5, 0, y, back * 0.3)
  }

  const geometry = mergeGeometriesGrouped([
    { geoms: frame, materialIndex: 0 },
    { geoms: shelf, materialIndex: 1 }
  ])
  for (const g of [...frame, ...shelf]) g.dispose()
  const a = phong(hex)
  const b = phong(hex)
  b.color.offsetHSL(0, 0, 0.06)
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
/**
 * Delta 536-CZMPU-DST Saylor single-hole lav faucet.
 * Deck at y=0, spout toward +Z, lever on +X.
 * HEIGHT is deck-to-top (8⅜″), REACH is spout (5³⁄₁₆″). Outlet at 4½″.
 */
function buildSaylorFaucetGeometry(
  height: number,
  reach: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const metal: THREE.BufferGeometry[] = []
  const bodyR = height * 0.13
  const spoutY = height * (4.5 / 8.375)
  pushCyl(metal, bodyR * 1.35, height * 0.07, 0, 0, 0)
  pushCyl(metal, bodyR, height * 0.9, 0, height * 0.07, 0)
  pushCyl(metal, bodyR * 0.42, reach, 0, spoutY, reach / 2, 'z')
  pushCyl(metal, bodyR * 0.55, height * 0.1, 0, spoutY - height * 0.08, reach, 'y')
  pushCyl(metal, bodyR * 0.28, height * 0.42, bodyR * 0.7, height * 0.7, 0, 'x')
  const geometry = mergeGeometriesGrouped([{ geoms: metal, materialIndex: 0 }])
  for (const g of metal) g.dispose()
  return {
    geometry,
    materials: [phong(hex || 'c5a572', { shininess: 80, specular: new THREE.Color(0xffe4b0) })]
  }
}

/**
 * Kohler K-43979 Highline two-piece elongated (left-hand lever) with
 * K-4636 Cachet closed-front seat and lid. Tank on +Z, bowl toward −Z.
 * Nominal 18″ × 31⅛″ × 29⁵⁄₁₆″, rim at 16½″. Scaled to the given box.
 */
/** Superellipse half-profile helper: returns sgn(v)*|v|^p */
function superPow(v: number, p: number) {
  return Math.sign(v) * Math.pow(Math.abs(v), p)
}

/**
 * Extrude a plan polygon (points [x, z]) upward from yBase by height. Holes optional.
 * Plan is authored in world X/Z; returned geometry is non-indexed and Y-up.
 */
function extrudePlanY(
  outer: [number, number][],
  holes: [number, number][][],
  yBase: number,
  height: number
): THREE.BufferGeometry {
  const shape = new THREE.Shape(outer.map(([x, z]) => new THREE.Vector2(x, -z)))
  for (const h of holes) shape.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, -z))))
  const g = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 40 })
  g.rotateX(-Math.PI / 2)
  g.translate(0, yBase, 0)
  return g
}

/** Rounded rectangle in plan: x ∈ [-hw, hw], z ∈ [z0, z1], corner radius r. */
function roundedPlanRect(hw: number, z0: number, z1: number, r: number, seg = 8): [number, number][] {
  const pts: [number, number][] = []
  const corners: [number, number, number][] = [
    [hw - r, z1 - r, 0],
    [-hw + r, z1 - r, Math.PI / 2],
    [-hw + r, z0 + r, Math.PI],
    [hw - r, z0 + r, (3 * Math.PI) / 2]
  ]
  for (const [cx, cz, a0] of corners) {
    for (let k = 0; k <= seg; k++) {
      const a = a0 + (k / seg) * (Math.PI / 2)
      pts.push([cx + r * Math.cos(a), cz + r * Math.sin(a)])
    }
  }
  return pts
}

/**
 * Kohler K-43979 Highline two-piece elongated (spec sheet): 18″ W, 31⅛″ H, 29⁵⁄₁₆″ D, bowl rim 16½″,
 * seat with bowl 17³⁄₁₆″, 12″ rough-in. Bowl footprint, tank size and lever are estimated from the photos.
 * Tank at +Z (against wall).
 * Room-facing side of the tank is −Z; left-hand trip lever sits on its front face.
 * Bowl is a lofted elongated surface (outer shell + rim + inner bowl), seat is a ring.
 */
function buildHighlineGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const porc: THREE.BufferGeometry[] = []
  const seat: THREE.BufferGeometry[] = []
  const metal: THREE.BufferGeometry[] = []
  // Inch scale = K-43979 spec sheet: 18″ W × 31⅛″ H × 29⁵⁄₁₆″ D (matches the item's width/height/depth)
  const X = (i: number) => (i / 18) * width
  const Y = (i: number) => (i / 31.125) * height
  const Z = (i: number) => (i / 29.3125) * depth
  const half = depth / 2
  const NB = 2.4 // superellipse exponent: rounded-front elongated bowl
  const SEG = 72

  // Bowl footprint (outer): half width 7.0″, half length 10.75″, center 11.25″ from front.
  const a = X(7.0)
  const b = Z(10.75)
  const bowlZ = -half + Z(11.25)
  const rimY = Y(16.5)

  // Loft profile: [scale, y-fraction of bowl height]. Outer shell → rim → inner wall → water.
  const profile: [number, number][] = [
    [0.8, 0.0], // flat footprint at floor (trapway skirt)
    [0.84, 0.035],
    [0.93, 0.1],
    [0.99, 0.18],
    [1.0, 0.27],
    [1.0, 0.38],
    [1.0, 0.45],
    [0.995, 0.5],
    [0.985, 0.53], // outer rim edge
    [0.91, 0.535], // inner rim edge (flat rim top)
    [0.89, 0.5],
    [0.87, 0.44],
    [0.845, 0.4] // water surface
  ]
  const rings: number[][] = []
  for (const [s, f] of profile) {
    const y = f * height
    const ring: number[] = []
    for (let j = 0; j < SEG; j++) {
      const th = (j / SEG) * Math.PI * 2
      ring.push(
        a * s * superPow(Math.cos(th), 2 / NB),
        y,
        bowlZ + b * s * superPow(Math.sin(th), 2 / NB)
      )
    }
    rings.push(ring)
  }
  const bowlPos: number[] = []
  const bowlIdx: number[] = []
  // Center vertices for caps
  const capOuter = bowlPos.length / 3
  bowlPos.push(0, profile[0][1] * height, bowlZ)
  for (const ring of rings) bowlPos.push(...ring)
  const ringBase = (r: number) => 1 + r * SEG // vertex index of ring r, segment 0
  const lastRing = rings.length - 1
  const capInner = bowlPos.length / 3
  bowlPos.push(0, profile[lastRing][1] * height, bowlZ)
  // Outer base cap (fan from center to ring 0)
  for (let j = 0; j < SEG; j++) {
    bowlIdx.push(capOuter, ringBase(0) + ((j + 1) % SEG), ringBase(0) + j)
  }
  // Strips between consecutive rings
  for (let r = 0; r < lastRing; r++) {
    for (let j = 0; j < SEG; j++) {
      const j1 = (j + 1) % SEG
      const p0 = ringBase(r) + j
      const p1 = ringBase(r) + j1
      const q0 = ringBase(r + 1) + j
      const q1 = ringBase(r + 1) + j1
      bowlIdx.push(p0, q0, p1, p1, q0, q1)
    }
  }
  // Inner bottom (water) cap
  for (let j = 0; j < SEG; j++) {
    bowlIdx.push(capInner, ringBase(lastRing) + j, ringBase(lastRing) + ((j + 1) % SEG))
  }
  const bowlGeom = new THREE.BufferGeometry()
  bowlGeom.setAttribute('position', new THREE.Float32BufferAttribute(bowlPos, 3))
  bowlGeom.setIndex(bowlIdx)
  bowlGeom.computeVertexNormals()
  porc.push(bowlGeom)

  // Seat ring: closed-lid footprint, sits on the rim (16.5″ → 17.19″)
  const seatT = Y(0.9)
  const ellipsePts = (ax: number, bz: number, cz: number, n = 56): [number, number][] => {
    const out: [number, number][] = []
    for (let j = 0; j < n; j++) {
      const th = (j / n) * Math.PI * 2
      out.push([ax * superPow(Math.cos(th), 2 / NB), cz + bz * superPow(Math.sin(th), 2 / NB)])
    }
    return out
  }
  // Seat ring under a closed lid (lid down covers the bowl opening)
  seat.push(
    extrudePlanY(
      ellipsePts(a * 1.03, b * 1.03, bowlZ),
      [ellipsePts(a * 0.8, b * 0.8, bowlZ)],
      rimY,
      seatT
    )
  )
  const lidT = Y(0.6)
  const lidTop = rimY + seatT + lidT
  seat.push(extrudePlanY(ellipsePts(a * 1.03, b * 1.03, bowlZ), [], rimY + seatT, lidT))

  // Low hinge caps at the rear of the lid (flush-profile, not posts)
  for (const sx of [-1, 1]) {
    pushCyl(metal, X(0.9), Y(0.4), sx * a * 0.6, lidTop, bowlZ + b * 0.8, 'y')
  }

  // Tank: 14.2″ wide, 7.5″ deep, from 16.6″ to 31.1″, tank front at −Z
  const tankHW = X(7.1)
  const tankZ0 = half - Z(7.5)
  const tankZ1 = half
  const tankYb = Y(16.6)
  const tankH = Y(31.1) - tankYb
  porc.push(extrudePlanY(roundedPlanRect(tankHW, tankZ0, tankZ1, X(2.0), 8), [], tankYb, tankH))

  // Tank top lip: overhangs the front and sides like the Lowe's tank cover
  porc.push(
    extrudePlanY(roundedPlanRect(tankHW + X(0.6), tankZ0 - Z(0.8), tankZ1 + Z(0.2), X(2.2), 8), [], Y(30.2), Y(0.9))
  )

  // Left-hand trip lever: upper-left of the tank front face (room-facing, −Z). Left = +X when facing the bowl.
  // Pivot escutcheon on the face, lever arm stands out toward the room, handle turns toward the left.
  // Paddle lever: flat rectangular blade standing off the tank face, as on the Lowe's unit
  const leverX = X(4.6)
  const leverY = Y(26.8)
  pushBox(metal, X(3.0), Y(1.1), Z(1.0), leverX, leverY - Y(0.55), tankZ0 - Z(0.5))

  const geometry = mergeGeometriesGrouped([
    { geoms: porc, materialIndex: 0 },
    { geoms: seat, materialIndex: 1 },
    { geoms: metal, materialIndex: 2 }
  ])
  for (const g of [...porc, ...seat, ...metal]) g.dispose()
  return {
    geometry,
    materials: [
      phong(hex || 'f7f7f5', { shininess: 70, specular: new THREE.Color(0xdddddd) }),
      phong('ffffff', { shininess: 60, specular: new THREE.Color(0xcccccc) }),
      phong('c5c8cc', { shininess: 90, specular: new THREE.Color(0xffffff) })
    ]
  }
}

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

/** Frameless glass shower door — panel on +Z, slim hardware. */
function buildShowerDoorGeometry(
  width: number,
  height: number,
  depth: number,
  _hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const glass: THREE.BufferGeometry[] = []
  const metal: THREE.BufferGeometry[] = []
  const t = Math.max(1.2, Math.min(depth, 3))
  pushBox(glass, width * 0.92, height * 0.94, t, 0, height * 0.03, 0)
  // Hinge stile + handle
  pushBox(metal, 2.2, height * 0.96, t + 1, -width * 0.45, height * 0.02, 0)
  pushBox(metal, 2.2, height * 0.96, t + 1, width * 0.45, height * 0.02, 0)
  pushCyl(metal, 1.1, 18, width * 0.28, height * 0.48, t / 2 + 2, 'y')
  const geometry = mergeGeometriesGrouped([
    { geoms: glass, materialIndex: 0 },
    { geoms: metal, materialIndex: 1 }
  ])
  for (const g of [...glass, ...metal]) g.dispose()
  return {
    geometry,
    materials: [
      phong('c8e0f0', {
        shininess: 90,
        specular: new THREE.Color(0xffffff),
        transparent: true,
        opacity: 0.35,
        depthWrite: false
      }),
      phong('9ca3af', { shininess: 60, specular: new THREE.Color(0xffffff) })
    ]
  }
}

/**
 * L-shaped corner shower bench for NE corner (rot 0):
 * backs hug +X (east wall) and −Z (north wall).
 * WIDTH = span along north wall (−X), DEPTH = span along east wall (+Z).
 */
function buildShowerBenchGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const body: THREE.BufferGeometry[] = []
  const seat = Math.min(height * 0.22, 8)
  const seatY = height - seat
  const arm = Math.min(45, Math.min(width, depth) * 0.4) // ~18″ seat depth
  const halfW = width / 2
  const halfD = depth / 2
  // Arm along north (−Z): full width, against north
  pushBox(body, width, seatY, arm, 0, 0, -halfD + arm / 2)
  pushBox(body, width, seat, arm + 1, 0, seatY, -halfD + arm / 2)
  // Arm along east (+X): remaining depth south, against east
  const southLen = Math.max(depth - arm, arm)
  pushBox(body, arm, seatY, southLen, halfW - arm / 2, 0, -halfD + arm + southLen / 2)
  pushBox(body, arm + 1, seat, southLen, halfW - arm / 2, seatY, -halfD + arm + southLen / 2)
  const geometry = mergeGeometriesGrouped([{ geoms: body, materialIndex: 0 }])
  for (const g of body) g.dispose()
  return {
    geometry,
    materials: [phong(hex || 'd6d3d1', { shininess: 25, specular: new THREE.Color(0x888888) })]
  }
}

/** Wall-mount shower arm (+Z into room) + round head. */
function buildShowerHeadGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const metal: THREE.BufferGeometry[] = []
  const armLen = Math.max(depth * 0.7, 12)
  const headR = Math.min(width, height) * 0.35
  // Flange on −Z (wall)
  pushCyl(metal, 3.5, 1.5, 0, height * 0.5, -depth / 2 + 1, 'z')
  // Arm
  pushCyl(metal, 1.4, armLen, 0, height * 0.5, -depth / 2 + 2 + armLen / 2, 'z')
  // Head disk facing down slightly
  pushCyl(metal, headR, 2.5, 0, height * 0.5 - 2, -depth / 2 + 2 + armLen, 'y')
  pushCyl(metal, headR * 0.85, 1.2, 0, height * 0.5 - 4, -depth / 2 + 2 + armLen, 'y')
  const geometry = mergeGeometriesGrouped([{ geoms: metal, materialIndex: 0 }])
  for (const g of metal) g.dispose()
  return {
    geometry,
    materials: [phong(hex || 'c0c5ca', { shininess: 80, specular: new THREE.Color(0xffffff) })]
  }
}

/**
 * Delta T17235 In2ition: 5½″ arm off the −Z wall, 6″ fixed head, docked hand shower.
 * WIDTH × HEIGHT × DEPTH is the head-and-arm box (nominal 6″ × 6¹³⁄₁₆″ × 9½″).
 */
function buildIn2itionGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const metal: THREE.BufferGeometry[] = []
  const zWall = -depth / 2
  const armLen = depth * 0.58
  pushCyl(metal, width * 0.22, 1.4, 0, 0, zWall + 0.7, 'z')
  pushCyl(metal, 1.15, armLen, 0, 0, zWall + 1.4 + armLen / 2, 'z')
  const zHead = zWall + 1.4 + armLen
  pushCyl(metal, width * 0.5, 2.4, 0, height * 0.08, zHead, 'y')
  pushCyl(metal, width * 0.4, 0.7, 0, height * 0.08 - 1.6, zHead, 'y')
  pushCyl(metal, width * 0.16, height * 0.42, 0, -height * 0.12, zHead - 1.2, 'y')
  pushCyl(metal, width * 0.22, height * 0.16, 0, -height * 0.38, zHead - 1.2, 'y')
  const geometry = mergeGeometriesGrouped([{ geoms: metal, materialIndex: 0 }])
  for (const g of metal) g.dispose()
  return {
    geometry,
    materials: [phong(hex || 'c5a572', { shininess: 80, specular: new THREE.Color(0xffe4b0) })]
  }
}

/** Delta Monitor 17 Saylor trim: one lever (volume + temperature) and a small dial. Face +Z. */
function buildSaylorTrimGeometry(
  plateD: number,
  leverLen: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const metal: THREE.BufferGeometry[] = []
  const dial: THREE.BufferGeometry[] = []
  const R = plateD / 2
  pushCyl(metal, R, 1.3, 0, 0, 0.65, 'z')
  pushCyl(metal, R * 0.22, 3.4, 0, 0, 2.8, 'z')
  pushBoxAt(metal, R * 0.16, leverLen, 1.8, 0, -leverLen / 2, 4.6)
  pushCyl(dial, R * 0.14, 0.5, 0, R * 0.42, 1.7, 'z')
  const geometry = mergeGeometriesGrouped([
    { geoms: metal, materialIndex: 0 },
    { geoms: dial, materialIndex: 1 }
  ])
  for (const g of [...metal, ...dial]) g.dispose()
  return {
    geometry,
    materials: [
      phong(hex || 'c5a572', { shininess: 85, specular: new THREE.Color(0xffe4b0) }),
      phong('8b3a3a', { shininess: 40 })
    ]
  }
}

/** Pressure-balance valve trim: round plate on +Z face, two knobs with levers (Delta Tetra style). */
function buildValveTrimGeometry(
  plateD: number,
  leverLen: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const metal: THREE.BufferGeometry[] = []
  const R = plateD / 2
  // Round escutcheon plate (back at z=0, front at z=1)
  pushCyl(metal, R, 1.0, 0, 0, 0.5, 'z')
  // Two handle knobs stacked vertically, each with a lever running outward (+X)
  const knobs = [
    { y: R * 0.28, kr: R * 0.2 },
    { y: -R * 0.2, kr: R * 0.26 }
  ]
  for (const k of knobs) {
    pushCyl(metal, k.kr, 4, 0, k.y, 3.0, 'z')
    const lh = R * 0.14
    pushBoxAt(metal, leverLen, lh, 2.2, leverLen / 2, k.y, 6.0)
  }
  const geometry = mergeGeometriesGrouped([{ geoms: metal, materialIndex: 0 }])
  for (const g of metal) g.dispose()
  return {
    geometry,
    materials: [phong(hex || 'a88b5c', { shininess: 90, specular: new THREE.Color(0xffe2a0) })]
  }
}

/** Wall slide bar (vertical, along Y) with hand-shower cradle and head projecting +Z. */
function buildHandShowerGeometry(
  barLen: number,
  armLen: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const metal: THREE.BufferGeometry[] = []
  // Vertical slide bar, centered on y=0 (bbox-centered)
  pushCyl(metal, 1.1, barLen, 0, -barLen / 2, 0, 'y')
  // End knobs
  pushCyl(metal, 1.6, 1.6, 0, -barLen / 2 - 0.8, 0, 'y')
  pushCyl(metal, 1.6, 1.6, 0, barLen / 2 - 0.8, 0, 'y')
  // Slider bracket around the bar
  pushCyl(metal, 2.2, 3.5, 0, -1.75, 0.6, 'y')
  // Hand-shower arm projecting into the room (+Z)
  pushCyl(metal, 1.2, armLen, 0, 0, armLen / 2, 'z')
  // Hand-shower head (puck facing +Z)
  pushCyl(metal, 4.5, 3.5, 0, 0, armLen + 1.75, 'z')
  const geometry = mergeGeometriesGrouped([{ geoms: metal, materialIndex: 0 }])
  for (const g of metal) g.dispose()
  return {
    geometry,
    materials: [phong(hex || 'a88b5c', { shininess: 90, specular: new THREE.Color(0xffe2a0) })]
  }
}

/** Flat-back (−Y in shape / −Z world) rounded-front D footprint. */
function makeTubDShape(w: number, d: number, cornerR: number): THREE.Shape {
  const shape = new THREE.Shape()
  const hw = w / 2
  const hd = d / 2
  const r = Math.min(cornerR, hw * 0.42, hd * 0.55)
  shape.moveTo(-hw + r, -hd)
  shape.lineTo(hw - r, -hd)
  shape.quadraticCurveTo(hw, -hd, hw, -hd + r)
  shape.lineTo(hw, hd - r)
  shape.quadraticCurveTo(hw, hd, hw - r, hd)
  shape.lineTo(-hw + r, hd)
  shape.quadraticCurveTo(-hw, hd, -hw, hd - r)
  shape.lineTo(-hw, -hd + r)
  shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd)
  return shape
}

/** Extrude footprint (optionally hollow) into Y-up tub space. */
function pushTubExtrude(
  target: THREE.BufferGeometry[],
  w: number,
  d: number,
  h: number,
  y0: number,
  cornerR: number,
  wallT?: number
) {
  const shape = makeTubDShape(w, d, cornerR)
  if (wallT != null && wallT > 0) {
    const hole = makeTubDShape(w - wallT * 2, d - wallT * 2, cornerR * 0.82)
    shape.holes.push(hole)
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: h,
    bevelEnabled: false,
    curveSegments: 18
  })
  geo.rotateX(-Math.PI / 2)
  geo.scale(1, 1, -1)
  geo.translate(0, y0, 0)
  geo.computeVertexNormals()
  target.push(geo)
}

/**
 * Freestanding soaking tub (back-to-wall) — sculpted glossy acrylic reference.
 * WIDTH along wall, DEPTH into room. Back flush on −Z; deck faucet on rear rim.
 */
function buildFreestandingTubGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const body: THREE.BufferGeometry[] = []
  const water: THREE.BufferGeometry[] = []
  const chrome: THREE.BufferGeometry[] = []
  const dark: THREE.BufferGeometry[] = []
  const halfD = depth / 2
  const rim = Math.min(6.5, Math.min(width, depth) * 0.085)
  const wallT = Math.min(5.5, rim * 0.85)
  const floorT = Math.min(3.8, height * 0.09)
  const waterH = height * 0.48
  const cornerR = Math.min(width, depth) * 0.3

  // Single smooth hollow shell (flat back, rounded front) + slight top flare rim
  const shellH = height - rim * 0.7
  pushTubExtrude(body, width * 0.97, depth * 0.97, shellH, 0, cornerR * 0.95, wallT)
  // Soft undercut flare at top of skirt (thin outer wrap, no fill)
  pushTubExtrude(
    body,
    width * 1.02,
    depth * 1.02,
    height * 0.16,
    height * 0.78,
    cornerR * 1.02,
    wallT * 0.55
  )

  // Basin floor + water
  const innerW = width - wallT * 2.15
  const innerD = depth - wallT * 2.15
  pushTubExtrude(body, innerW, innerD, floorT, 0, cornerR * 0.72)
  pushTubExtrude(water, innerW * 0.9, innerD * 0.9, Math.max(2, waterH - floorT), floorT, cornerR * 0.68)

  // Top deck rim (ring only)
  pushTubExtrude(
    body,
    width * 1.04,
    depth * 1.04,
    rim * 0.7,
    height - rim * 0.7,
    cornerR * 1.06,
    rim * 1.2
  )

  // Overflow slit on interior back
  pushBox(dark, width * 0.22, 1.15, 1.5, 0, height * 0.68, -halfD + wallT + 2.5)

  // ——— Deck faucet: square chrome U-spout (reference) ———
  const fy = height - rim * 0.1
  const fz = -halfD + rim * 0.4
  pushBox(chrome, 7.5, 0.85, 7.5, 0, fy, fz)
  pushBox(chrome, 5.4, 0.55, 5.4, 0, fy + 0.85, fz)
  pushBox(chrome, 2.15, 21, 2.15, 0, fy + 1.1, fz)
  pushBox(chrome, 2.15, 2.15, 13, 0, fy + 20.8, fz + 5.5)
  pushBox(chrome, 2.15, 9, 2.15, 0, fy + 14.2, fz + 11.2)
  pushBox(chrome, 2.7, 1.3, 3.4, 0, fy + 12.8, fz + 12.8)
  pushBox(chrome, 5.8, 1.45, 1.45, 5.8, fy + 5.5, fz)

  // Hand shower left
  const hx = -width * 0.13
  pushBox(chrome, 2.5, 1.1, 2.5, hx, fy, fz)
  pushCyl(chrome, 0.5, 8.5, hx, fy + 1, fz, 'y')
  const wand = new THREE.CylinderGeometry(1.05, 2.35, 5.2, 14)
  wand.rotateZ(-0.6)
  wand.translate(hx - 2.2, fy + 10.5, fz + 3.2)
  chrome.push(wand)
  pushCyl(chrome, 0.38, 13, hx - 5.5, fy + 3.5, fz + 5, 'z')

  const geometry = mergeGeometriesGrouped([
    { geoms: body, materialIndex: 0 },
    { geoms: water, materialIndex: 1 },
    { geoms: chrome, materialIndex: 2 },
    { geoms: dark, materialIndex: 3 }
  ])
  for (const g of [...body, ...water, ...chrome, ...dark]) g.dispose()

  return {
    geometry,
    materials: [
      phong(hex || 'f8f8f8', { shininess: 120, specular: new THREE.Color(0xffffff) }),
      phong('7dd3fc', {
        shininess: 100,
        specular: new THREE.Color(0xe0f2fe),
        transparent: true,
        opacity: 0.4,
        depthWrite: false
      }),
      phong('d0d5da', { shininess: 130, specular: new THREE.Color(0xffffff) }),
      phong('111111', { shininess: 35 })
    ]
  }
}

/**
 * Standard alcove bathtub — apron front (+Z), rim, basin, water.
 * WIDTH along wall, DEPTH front-to-back (into room when back on −Z).
 */
function buildTubGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const body: THREE.BufferGeometry[] = []
  const water: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const halfD = depth / 2
  const rim = Math.min(8, Math.min(width, depth) * 0.08)
  const apron = Math.min(4, depth * 0.08)
  const floorT = Math.min(5, height * 0.12)
  const waterH = height * 0.55

  // Outer shell / apron
  pushBox(body, width, height, depth, 0, 0, 0)
  // Carve look: inner basin void via thinner inner walls (stacked rim + floor)
  pushBox(body, width - rim * 2, floorT, depth - rim * 2 - apron, 0, 0, -apron * 0.3)
  // Top rim deck
  pushBox(body, width, rim * 0.55, rim, 0, height - rim * 0.55, -halfD + rim / 2)
  pushBox(body, width, rim * 0.55, rim, 0, height - rim * 0.55, halfD - rim / 2)
  pushBox(body, rim, rim * 0.55, depth - rim * 2, -halfW + rim / 2, height - rim * 0.55, 0)
  pushBox(body, rim, rim * 0.55, depth - rim * 2, halfW - rim / 2, height - rim * 0.55, 0)
  // Front apron lip
  pushBox(body, width * 0.98, height * 0.92, apron * 0.7, 0, 0, halfD - apron * 0.35)

  // Water
  pushBox(
    water,
    width - rim * 2.4,
    waterH - floorT,
    depth - rim * 2.4 - apron,
    0,
    floorT,
    -apron * 0.2
  )

  const geometry = mergeGeometriesGrouped([
    { geoms: body, materialIndex: 0 },
    { geoms: water, materialIndex: 1 }
  ])
  for (const g of [...body, ...water]) g.dispose()
  const shell = phong(hex, { shininess: 55, specular: new THREE.Color(0x888888) })
  const waterMat = phong('38bdf8', { shininess: 90, specular: new THREE.Color(0xa5f3fc) })
  waterMat.transparent = true
  waterMat.opacity = 0.5
  waterMat.depthWrite = false
  return { geometry, materials: [shell, waterMat] }
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
/**
 * Front entry double doors — black clad frames, full glass each leaf,
 * high horizontal mullion, center meeting stile, long pulls (photo match).
 */
function buildEntryDoubleDoorGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const frame: THREE.BufferGeometry[] = []
  const glass: THREE.BufferGeometry[] = []
  const metal: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const t = Math.max(depth, 5)
  const frameHex = hex || '0a0a0a'
  const stile = Math.max(width * 0.035, 5.5)
  const rail = Math.max(height * 0.04, 5.5)
  const topLiteH = Math.max(height * 0.12, 14)
  const mullionY = height / 2 - rail - topLiteH / 2
  const leafW = (width - stile) / 2

  // Perimeter only — no full RO slab (that filled the opening solid black).
  // Rails/stiles still span width×height so InWall hole matches the RO.
  // Use pushBoxAt (center coords) — pushBox’s y+h/2 would skew tall stiles vs short rails.
  for (const side of [-1, 1] as const) {
    const cx = side * (leafW / 2 + stile / 2)
    // Leaf frame
    pushBoxAt(frame, leafW, rail, t, cx, height / 2 - rail / 2, 0) // top
    pushBoxAt(frame, leafW, rail, t, cx, -height / 2 + rail / 2, 0) // bottom
    pushBoxAt(frame, stile, height - rail * 2, t, cx - leafW / 2 + stile / 2, 0, 0) // outer
    pushBoxAt(frame, stile, height - rail * 2, t, cx + leafW / 2 - stile / 2, 0, 0) // inner
    // High horizontal mullion (two-lite look)
    pushBoxAt(frame, leafW - stile * 2, rail * 0.7, t * 1.05, cx, mullionY, 0)
    // Glass — upper lite + lower lite
    const glassW = leafW - stile * 2.2
    const upperH = topLiteH - rail * 0.4
    const lowerH = height - rail * 2 - topLiteH - rail * 0.5
    pushBoxAt(glass, glassW, upperH, t * 0.25, cx, height / 2 - rail - upperH / 2, t * 0.1)
    pushBoxAt(glass, glassW, lowerH, t * 0.25, cx, -height / 2 + rail + lowerH / 2, t * 0.1)
    // Long vertical pull near center meeting stile
    const pullX = cx - side * (leafW / 2 - stile - 3)
    pushBoxAt(metal, 1.8, height * 0.42, 2.2, pullX, height * 0.02, t * 0.55)
  }
  // Center meeting stile
  pushBoxAt(frame, stile * 0.85, height, t * 1.05, 0, 0, 0)

  const geometry = mergeGeometriesGrouped([
    { geoms: frame, materialIndex: 0 },
    { geoms: glass, materialIndex: 1 },
    { geoms: metal, materialIndex: 2 }
  ])
  for (const g of [...frame, ...glass, ...metal]) g.dispose()
  return {
    geometry,
    materials: [
      phong(frameHex, { shininess: 35, specular: new THREE.Color(0x444444) }),
      phong('b8dcf5', {
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        shininess: 100,
        specular: new THREE.Color(0xffffff)
      }),
      phong('111111', { shininess: 60, specular: new THREE.Color(0x999999) })
    ]
  }
}

/**
 * Pella Contemporary sliding patio — black clad frame, two overlapping single-lite panels,
 * interlock stile, recessed pulls. WIDTH × HEIGHT = RO; DEPTH ≈ jamb depth.
 */
function buildSlidingPatioGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const frame: THREE.BufferGeometry[] = []
  const glass: THREE.BufferGeometry[] = []
  const metal: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const t = Math.max(depth, 8)
  const frameHex = hex || '0a0a0a'
  const stile = Math.max(Math.min(width * 0.03, 6), 4)
  const rail = Math.max(Math.min(height * 0.045, 7), 4.5)
  // Outer fixed frame (head / sill / jambs)
  pushBoxAt(frame, width, rail * 1.15, t, 0, height / 2 - rail * 0.55, 0)
  pushBoxAt(frame, width, rail * 1.15, t, 0, -height / 2 + rail * 0.55, 0)
  pushBoxAt(frame, stile * 1.1, height, t, -halfW + stile * 0.55, 0, 0)
  pushBoxAt(frame, stile * 1.1, height, t, halfW - stile * 0.55, 0, 0)

  // Two sliding panels — fixed left (−X), operable right (+X), slight Z offset + overlap
  const panelW = width * 0.52
  const panelH = height - rail * 2.2
  const panelT = t * 0.42
  const panels: { cx: number; z: number }[] = [
    { cx: -halfW + panelW * 0.48, z: -t * 0.12 },
    { cx: halfW - panelW * 0.48, z: t * 0.12 }
  ]
  for (const { cx, z } of panels) {
    pushBoxAt(frame, panelW, rail, panelT, cx, panelH / 2 - rail / 2, z) // top
    pushBoxAt(frame, panelW, rail, panelT, cx, -panelH / 2 + rail / 2, z) // bottom
    pushBoxAt(frame, stile, panelH - rail * 2, panelT, cx - panelW / 2 + stile / 2, 0, z)
    pushBoxAt(frame, stile, panelH - rail * 2, panelT, cx + panelW / 2 - stile / 2, 0, z)
    const gW = panelW - stile * 2.2
    const gH = panelH - rail * 2.2
    pushBoxAt(glass, gW, gH, panelT * 0.35, cx, 0, z + panelT * 0.08)
  }
  // Interlock / meeting stile + recessed pulls on operable panel
  pushBoxAt(frame, stile * 0.7, panelH * 0.92, panelT * 1.15, 0, 0, 0)
  const pullX = halfW - panelW * 0.48 - panelW / 2 + stile + 4
  pushBoxAt(metal, 2.2, height * 0.28, 1.6, pullX, 0, t * 0.35)
  pushBoxAt(metal, 2.2, height * 0.28, 1.6, -pullX, 0, -t * 0.35)

  const geometry = mergeGeometriesGrouped([
    { geoms: frame, materialIndex: 0 },
    { geoms: glass, materialIndex: 1 },
    { geoms: metal, materialIndex: 2 }
  ])
  for (const g of [...frame, ...glass, ...metal]) g.dispose()
  return {
    geometry,
    materials: [
      phong(frameHex, { shininess: 40, specular: new THREE.Color(0x555555) }),
      phong('b8dcf5', {
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
        shininess: 100,
        specular: new THREE.Color(0xffffff)
      }),
      phong('111111', { shininess: 70, specular: new THREE.Color(0xaaaaaa) })
    ]
  }
}

/**
 * Black-clad single-lite fixed — slim perimeter frame, no mullion (basement bar 108×26 FXD).
 */
function buildBlackFixedGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const frame: THREE.BufferGeometry[] = []
  const glass: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const t = Math.max(depth, 6)
  const frameHex = hex || '0a0a0a'
  const stile = Math.max(Math.min(width * 0.025, 5.5), 3.5)
  const rail = Math.max(Math.min(height * 0.12, 5.5), 3.5)

  pushBoxAt(frame, width, rail, t, 0, height / 2 - rail / 2, 0)
  pushBoxAt(frame, width, rail, t, 0, -height / 2 + rail / 2, 0)
  pushBoxAt(frame, stile, height, t, -halfW + stile / 2, 0, 0)
  pushBoxAt(frame, stile, height, t, halfW - stile / 2, 0, 0)

  const glassW = width - stile * 2
  const glassH = height - rail * 2
  pushBoxAt(glass, glassW, glassH, t * 0.3, 0, 0, t * 0.12)

  const geometry = mergeGeometriesGrouped([
    { geoms: frame, materialIndex: 0 },
    { geoms: glass, materialIndex: 1 }
  ])
  for (const g of [...frame, ...glass]) g.dispose()
  return {
    geometry,
    materials: [
      phong(frameHex, { shininess: 35, specular: new THREE.Color(0x444444) }),
      phong('b8dcf5', {
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        shininess: 100,
        specular: new THREE.Color(0xffffff)
      })
    ]
  }
}

/**
 * Farmhouse fixed 2-over-1 — perimeter + high lite rail, no center mullion (garage 2965 photo).
 */
function buildFarmhouseFixedGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const frame: THREE.BufferGeometry[] = []
  const glass: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const t = Math.max(depth, 6)
  const frameHex = hex || '0a0a0a'
  const stile = Math.max(Math.min(width * 0.055, 5.5), 3.8)
  const rail = Math.max(Math.min(height * 0.045, 5), 4)
  const topLiteH = Math.max(height * 0.18, 14)
  const railY = height / 2 - rail - topLiteH

  pushBoxAt(frame, width, rail, t, 0, height / 2 - rail / 2, 0)
  pushBoxAt(frame, width, rail, t, 0, -height / 2 + rail / 2, 0)
  pushBoxAt(frame, stile, height, t, -halfW + stile / 2, 0, 0)
  pushBoxAt(frame, stile, height, t, halfW - stile / 2, 0, 0)
  // High lite rail + vertical muntin in top lite (2-over-1)
  pushBoxAt(frame, width - stile * 2, rail * 0.85, t * 1.05, 0, railY + rail * 0.4, 0)
  pushBoxAt(frame, stile * 0.55, topLiteH - rail * 0.3, t * 1.02, 0, height / 2 - rail - topLiteH / 2, 0)

  const glassW = width - stile * 2.2
  const upperH = topLiteH - rail * 0.55
  const lowerH = height - rail * 2 - topLiteH - rail * 0.35
  const paneW = (glassW - stile * 0.55) / 2
  for (const side of [-1, 1] as const) {
    pushBoxAt(
      glass,
      paneW,
      upperH,
      t * 0.28,
      side * (paneW / 2 + stile * 0.28),
      height / 2 - rail - upperH / 2,
      t * 0.12
    )
  }
  pushBoxAt(glass, glassW, lowerH, t * 0.28, 0, -height / 2 + rail + lowerH / 2, t * 0.12)

  const geometry = mergeGeometriesGrouped([
    { geoms: frame, materialIndex: 0 },
    { geoms: glass, materialIndex: 1 }
  ])
  for (const g of [...frame, ...glass]) g.dispose()
  return {
    geometry,
    materials: [
      phong(frameHex, { shininess: 35, specular: new THREE.Color(0x444444) }),
      phong('b8dcf5', {
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        shininess: 100,
        specular: new THREE.Color(0xffffff)
      })
    ]
  }
}

/**
 * Black-clad double fixed/casement — center mullion, high lite with GBG (garage 3571 FXD-2 photo).
 */
function buildBlackCasementGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const frame: THREE.BufferGeometry[] = []
  const glass: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const t = Math.max(depth, 6)
  const frameHex = hex || '0a0a0a'
  const stile = Math.max(width * 0.03, 4)
  const rail = Math.max(height * 0.045, 4.5)
  const topLiteH = Math.max(height * 0.18, 14)
  const mullionY = height / 2 - rail - topLiteH
  const leafW = width / 2

  // Perimeter only — no full RO slab (that filled the opening solid black).
  pushBoxAt(frame, width, rail, t, 0, height / 2 - rail / 2, 0)
  pushBoxAt(frame, width, rail, t, 0, -height / 2 + rail / 2, 0)
  pushBoxAt(frame, stile, height, t, -halfW + stile / 2, 0, 0)
  pushBoxAt(frame, stile, height, t, halfW - stile / 2, 0, 0)
  // Center meeting stile + high rail
  pushBoxAt(frame, stile * 0.95, height - rail * 2, t * 1.05, 0, 0, 0)
  pushBoxAt(frame, width - stile * 2, rail * 0.8, t * 1.05, 0, mullionY + rail * 0.35, 0)
  // GBG: vertical muntin in each top lite (photo: 4 small panes across top)
  for (const side of [-1, 1] as const) {
    const cx = side * (leafW / 2)
    pushBoxAt(
      frame,
      stile * 0.45,
      topLiteH - rail * 0.35,
      t * 1.02,
      cx,
      height / 2 - rail - topLiteH / 2,
      0
    )
  }

  for (const side of [-1, 1] as const) {
    const cx = side * (leafW / 2)
    const glassW = leafW - stile * 1.7
    const upperH = topLiteH - rail * 0.45
    const lowerH = height - rail * 2 - topLiteH - rail * 0.4
    const paneW = (glassW - stile * 0.45) / 2
    for (const sub of [-1, 1] as const) {
      pushBoxAt(
        glass,
        paneW,
        upperH,
        t * 0.28,
        cx + sub * (paneW / 2 + stile * 0.22),
        height / 2 - rail - upperH / 2,
        t * 0.12
      )
    }
    pushBoxAt(glass, glassW, lowerH, t * 0.28, cx, -height / 2 + rail + lowerH / 2, t * 0.12)
  }

  const geometry = mergeGeometriesGrouped([
    { geoms: frame, materialIndex: 0 },
    { geoms: glass, materialIndex: 1 }
  ])
  for (const g of [...frame, ...glass]) g.dispose()
  return {
    geometry,
    materials: [
      phong(frameHex, { shininess: 35, specular: new THREE.Color(0x444444) }),
      phong('b8dcf5', {
        transparent: true,
        opacity: 0.32,
        depthWrite: false,
        shininess: 100,
        specular: new THREE.Color(0xffffff)
      })
    ]
  }
}

/**
 * Custom sliding barn door (office specs: 3′×8′ black hardware).
 * Local +Z is the face; top rollers stick above the leaf for a track.
 */
function buildBarnDoorGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const wood: THREE.BufferGeometry[] = []
  const iron: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const t = Math.max(depth, 3.5)
  const plankN = 5
  const gap = 0.35
  const plankW = (width - gap * (plankN - 1)) / plankN

  // Vertical planks
  for (let i = 0; i < plankN; i++) {
    const x = -halfW + plankW / 2 + i * (plankW + gap)
    pushBox(wood, plankW, height, t, x, 0, 0)
  }
  // Perimeter + mid rails (face overlay)
  pushBox(wood, width * 0.98, 5.5, t * 1.12, 0, height - 5.5, 0)
  pushBox(wood, width * 0.98, 5.5, t * 1.12, 0, 0, 0)
  pushBox(wood, width * 0.98, 4.5, t * 1.12, 0, height * 0.48, 0)
  pushBox(wood, 4.2, height * 0.96, t * 1.12, -halfW + 2.2, height * 0.02, 0)
  pushBox(wood, 4.2, height * 0.96, t * 1.12, halfW - 2.2, height * 0.02, 0)

  // Z-brace (flat stock on face)
  const braceSpan = width * 0.72
  const braceRise = height * 0.38
  for (const sign of [1, -1] as const) {
    const g = new THREE.BoxGeometry(braceSpan, 3.2, t * 0.55)
    g.translate(0, 0, t * 0.45)
    g.rotateZ(sign * Math.atan2(braceRise, braceSpan * 0.85))
    g.translate(0, height * 0.28, 0)
    wood.push(g)
  }

  // Top roller hangers (black) — sit above leaf into track
  for (const side of [-1, 1] as const) {
    const hx = side * (halfW * 0.55)
    pushBox(iron, 7, 3.2, 2.2, hx, height + 0.4, t * 0.15)
    pushCyl(iron, 1.5, 3.8, hx, height + 5.2, t * 0.15, 'x')
    pushBox(iron, 2.2, 6, 1.6, hx, height - 2, t * 0.55)
  }
  // Strap accents + edge pull
  for (const hy of [height * 0.22, height * 0.72]) {
    pushBox(iron, 16, 2.8, 1.2, -halfW + 9, hy, t * 0.6)
    pushBox(iron, 2.4, 2.8, 1.2, -halfW + 1.4, hy, t * 0.6)
  }
  pushCyl(iron, 1.35, 14, halfW - 5.5, height * 0.45, t * 0.65, 'y')
  pushCyl(iron, 2.1, 2.2, halfW - 5.5, height * 0.45 + 7, t * 0.65, 'y')

  const geometry = mergeGeometriesGrouped([
    { geoms: wood, materialIndex: 0 },
    { geoms: iron, materialIndex: 1 }
  ])
  for (const g of [...wood, ...iron]) g.dispose()
  // Bbox mid on leaf (rollers poke above — keep item ypos = height/2)
  geometry.computeBoundingBox()
  const bb = geometry.boundingBox!
  const leafMidY = height / 2
  const bbMidY = 0.5 * (bb.min.y + bb.max.y)
  geometry.translate(0, leafMidY - bbMidY, 0)

  return {
    geometry,
    materials: [
      phong(hex || '2a2a2a', { shininess: 18, specular: new THREE.Color(0x333333) }),
      phong('0a0a0a', { shininess: 55, specular: new THREE.Color(0x999999) })
    ]
  }
}

/**
 * Craftsman overhead garage door (16′×8′ two-car OHD = two 8′ leaves).
 * Brown leaves · raised-panel relief rails · top row of 4 glass lites per leaf with
 * black lite frames · black center seam. Both faces decorated. Origin at bottom-center.
 */
function buildCraftsmanGarageDoorGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const wood: THREE.BufferGeometry[] = []
  const frame: THREE.BufferGeometry[] = []
  const glass: THREE.BufferGeometry[] = []
  const t = Math.max(depth, 4)
  const leafN = 2
  const leafW = width / leafN
  const seamW = 2.4
  const margin = 5
  const litesPerLeaf = 4
  const barW = 3.2
  const winH = height * 0.22
  const winTop = height / 2 - height * 0.07
  const winBottom = winTop - winH
  const winCY = (winTop + winBottom) / 2
  const availW = leafW - margin * 2

  for (let i = 0; i < leafN; i++) {
    const cx = -width / 2 + leafW * (i + 0.5)
    // Brown leaf (solid body, behind lites)
    pushBoxAt(wood, leafW - seamW, height, t, cx, 0, 0)
    // Raised-panel relief rails (brown, slightly proud)
    for (const ry of [winBottom - 22, -height / 2 + height * 0.2, -height / 2 + height * 0.5 - 4]) {
      pushBoxAt(wood, availW, 4.5, t + 1.6, cx, ry, 0)
    }
    // Stiles at leaf edges (brown relief)
    for (const sx of [-1, 1] as const) {
      pushBoxAt(wood, 4.5, height - 10, t + 1.2, cx + sx * (leafW / 2 - margin / 2 - 1), 0, 0)
    }
    // Glass lites + black frames across the top row
    const cellW = availW / litesPerLeaf
    for (let k = 0; k < litesPerLeaf; k++) {
      const lx = cx - availW / 2 + cellW * (k + 0.5)
      const glassW = cellW - barW
      const glassH = winH - barW * 2
      // Black frame: four bars around each lite, proud on both faces
      pushBoxAt(frame, cellW, barW, t + 2, lx, winTop - barW / 2, 0)
      pushBoxAt(frame, cellW, barW, t + 2, lx, winBottom + barW / 2, 0)
      pushBoxAt(frame, barW, winH, t + 2, lx - cellW / 2 + barW / 2, winCY, 0)
      pushBoxAt(frame, barW, winH, t + 2, lx + cellW / 2 - barW / 2, winCY, 0)
      // Glass sits in the frame, on each face (in front of the brown leaf)
      for (const side of [1, -1] as const) {
        pushBoxAt(glass, glassW, glassH, 0.6, lx, winCY, side * (t / 2 + 0.5))
      }
    }
  }
  // Black center seam between leaves
  pushBoxAt(frame, seamW, height, t + 2, 0, 0, 0)

  const geometry = mergeGeometriesGrouped([
    { geoms: wood, materialIndex: 0 },
    { geoms: frame, materialIndex: 1 },
    { geoms: glass, materialIndex: 2 }
  ])
  for (const g of [...wood, ...frame, ...glass]) g.dispose()
  geometry.translate(0, height / 2, 0)

  return {
    geometry,
    materials: [
      phong(hex || '6b4a2b', { shininess: 22, specular: new THREE.Color(0x333333) }),
      phong('0a0a0a', { shininess: 60, specular: new THREE.Color(0x999999) }),
      phong('b8dcf5', {
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
        shininess: 100,
        specular: new THREE.Color(0xffffff)
      })
    ]
  }
}

/** Black barn-door track: rail + wall mounts + end stops. LENGTH along local X. */
function buildBarnTrackGeometry(
  length: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const iron: THREE.BufferGeometry[] = []
  const halfL = length / 2
  const railH = Math.max(height * 0.55, 2.2)
  const railD = Math.max(depth * 0.7, 2.4)
  pushBox(iron, length, railH, railD, 0, height * 0.2, 0)
  // Inner running channel lip
  pushBox(iron, length * 0.98, 1.1, railD * 0.45, 0, height * 0.2 + railH * 0.35, railD * 0.35)
  const mounts = Math.max(3, Math.round(length / 55))
  for (let i = 0; i < mounts; i++) {
    const x = -halfL + ((i + 0.5) / mounts) * length
    pushBox(iron, 3.2, height * 0.9, 1.4, x, 0, -depth * 0.35)
    pushBox(iron, 8, 1.6, 1.2, x, height * 0.55, -depth * 0.15)
  }
  // End stops
  for (const side of [-1, 1] as const) {
    pushBox(iron, 2.5, height * 0.85, depth * 0.9, side * (halfL - 1.4), 0, 0)
  }
  const geometry = mergeGeometriesGrouped([{ geoms: iron, materialIndex: 0 }])
  for (const g of iron) g.dispose()
  geometry.computeBoundingBox()
  const bb = geometry.boundingBox!
  geometry.translate(0, height / 2 - 0.5 * (bb.min.y + bb.max.y), 0)
  return {
    geometry,
    materials: [phong(hex || '0a0a0a', { shininess: 60, specular: new THREE.Color(0xaaaaaa) })]
  }
}

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
/**
 * Barrel-back swivel chair. Seat faces +Z, back wraps the −Z side.
 * Back = half-elliptic shell (vertical axis) so the back is curved in plan, like a barrel chair.
 * Base = swivel disc + column, seat = upholstered cushion.
 */
function buildSwivelChairGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const body: THREE.BufferGeometry[] = []
  const base: THREE.BufferGeometry[] = []
  const seatH = Math.min(height * 0.66, 52) // 20″ seat on a 31″ chair
  const seatT = Math.min(10, height * 0.12)
  const backH = height - seatH
  const halfD = depth / 2

  // Swivel base: disc at floor + column up to the seat
  const baseR = Math.min(33, width * 0.44) // 26″ swivel base
  pushCyl(base, baseR, 4, 0, 0, 0, 'y')
  pushCyl(base, 3.5, seatH - 4, 0, 4, 0, 'y')

  // Seat cushion, sits forward of the back
  const backT = depth * 0.14
  const seatD = depth * 0.7
  const seatZ = -halfD + backT + seatD / 2
  pushBox(body, width * 0.9, seatT, seatD, 0, seatH, seatZ)

  // Barrel back: outer half-ellipse surface on the −Z side, rising from the seat
  const back = new THREE.CylinderGeometry(1, 1, backH, 32, 1, true, Math.PI / 2, Math.PI)
  back.scale(width / 2, 1, halfD)
  back.translate(0, seatH + backH / 2, 0)
  body.push(back)

  const geometry = mergeGeometriesGrouped([
    { geoms: body, materialIndex: 0 },
    { geoms: base, materialIndex: 1 }
  ])
  for (const g of [...body, ...base]) g.dispose()
  return {
    geometry,
    materials: [phong(hex, { shininess: 6 }), phong('3f3a33', { shininess: 30 })]
  }
}

/**
 * 36″ round wood-top table: thick round top, pedestal column, round foot.
 */
function buildRoundTableGeometry(
  dia: number,
  height: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const top: THREE.BufferGeometry[] = []
  const base: THREE.BufferGeometry[] = []
  const topT = Math.min(4, height * 0.09)
  const footR = dia * 0.34
  pushCyl(base, footR, 2.5, 0, 0, 0, 'y')
  pushCyl(base, dia * 0.07, height - topT - 2.5, 0, 2.5, 0, 'y')
  pushCyl(top, dia / 2, topT, 0, height - topT, 0, 'y')

  const geometry = mergeGeometriesGrouped([
    { geoms: top, materialIndex: 0 },
    { geoms: base, materialIndex: 1 }
  ])
  for (const g of [...top, ...base]) g.dispose()
  return {
    geometry,
    materials: [phong(hex, { shininess: 28 }), phong('2f2f33', { shininess: 40 })]
  }
}

function buildBarstoolGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const shell: THREE.BufferGeometry[] = []
  const metal: THREE.BufferGeometry[] = []
  const W = Math.max(width, 38)
  const H = Math.max(height, 60)
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

/**
 * Monogram 30″ single wall oven (ZTSX1DPSZSS look): stainless front, black glass
 * control band across the top, full-width stainless handle bar, large black glass
 * door, stainless kick. Face +Z. Y=0 at bottom (Item recenters the bbox).
 */
function buildMonoWallOvenGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const steel: THREE.BufferGeometry[] = []
  const glass: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const halfD = depth / 2
  const steelHex = hex && hex !== '2a2a2a' ? hex : 'c8ccd0'

  // Body + stainless front plate (flush at +Z)
  pushBox(steel, width, height, depth * 0.94, 0, 0, -depth * 0.03)
  pushBox(steel, width, height, 1.0, 0, 0, halfD - 0.5)

  // Top control band — black glass in a thin stainless surround
  const kickH = height * 0.05
  const ctlY = height * 0.79
  const ctlH = height * 0.18
  pushBox(steel, width * 0.94, ctlH, 0.8, 0, ctlY, halfD + 0.1)
  pushBox(glass, width * 0.88, ctlH * 0.8, 0.6, 0, ctlY + ctlH * 0.1, halfD + 0.3)

  // Stainless handle bar (full width) with two standoff brackets
  const barY = height * 0.745
  const barR = Math.max(1.1, height * 0.018)
  pushCyl(steel, barR, width * 0.92, 0, barY, halfD + 2.2, 'x')
  for (const sx of [-halfW * 0.88, halfW * 0.88]) {
    pushBox(steel, 2.0, barR * 2, 2.4, sx, barY - barR, halfD + 1.0)
  }

  // Large door — stainless frame + black glass lite
  const doorH = height * 0.66
  const doorY = kickH + height * 0.01
  pushBox(steel, width * 0.94, doorH + 1, 1.0, 0, doorY - 0.5, halfD)
  pushBox(glass, width * 0.86, doorH * 0.92, 0.6, 0, doorY + doorH * 0.04, halfD + 0.5)

  // Kick strip under the door
  pushBox(steel, width * 0.96, kickH * 0.6, 1.2, 0, 0.2, halfD - 0.2)

  const geometry = mergeGeometriesGrouped([
    { geoms: steel, materialIndex: 0 },
    { geoms: glass, materialIndex: 1 }
  ])
  for (const g of [...steel, ...glass]) g.dispose()
  return {
    geometry,
    materials: [
      phong(steelHex, { shininess: 85, specular: new THREE.Color(0xffffff) }),
      phong('0a0a0b', { shininess: 120, specular: new THREE.Color(0x666666) })
    ]
  }
}

/**
 * Monogram-style 30″ microwave to stack above the wall oven: stainless front,
 * black glass window on the left, black glass display + push buttons on the right,
 * stainless handle bar across the top of the window. Face +Z. Y=0 at bottom.
 */
function buildMonoMicrowaveGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const steel: THREE.BufferGeometry[] = []
  const glass: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const halfD = depth / 2
  const steelHex = hex && hex !== '2a2a2a' ? hex : 'c8ccd0'

  // Body + stainless front plate
  pushBox(steel, width, height, depth * 0.94, 0, 0, -depth * 0.03)
  pushBox(steel, width, height, 1.0, 0, 0, halfD - 0.5)

  // Window (left ~66%) — stainless frame + black glass
  const doorW = width * 0.66
  const doorCx = -halfW + width * 0.04 + doorW / 2
  const winY = height * 0.12
  const winH = height * 0.7
  pushBox(steel, doorW + 1.2, winH + 1.2, 0.8, doorCx, winY - 0.6, halfD + 0.1)
  pushBox(glass, doorW - 1.4, winH - 1.4, 0.6, doorCx, winY + 0.7, halfD + 0.5)

  // Handle bar across the top of the window + brackets
  const barY = height * 0.9
  const barR = Math.max(0.9, height * 0.02)
  pushCyl(steel, barR, doorW * 0.9, doorCx, barY, halfD + 1.6, 'x')
  for (const sx of [-doorW * 0.42, doorW * 0.42]) {
    pushBox(steel, 1.8, barR * 2, 2.0, doorCx + sx, barY - barR, halfD + 0.8)
  }

  // Control column (right ~24%) — black display + four push buttons
  const panelW = width * 0.24
  const panelCx = halfW - width * 0.03 - panelW / 2
  pushBox(steel, panelW * 0.92, height * 0.26, 0.8, panelCx, height * 0.69, halfD + 0.1)
  pushBox(glass, panelW * 0.8, height * 0.2, 0.6, panelCx, height * 0.72, halfD + 0.5)
  const btnR = Math.max(0.7, width * 0.009)
  for (const t of [0.5, 0.4, 0.3, 0.2]) {
    pushCyl(steel, btnR, 0.8, panelCx, height * t, halfD + 1.0, 'z')
  }

  const geometry = mergeGeometriesGrouped([
    { geoms: steel, materialIndex: 0 },
    { geoms: glass, materialIndex: 1 }
  ])
  for (const g of [...steel, ...glass]) g.dispose()
  return {
    geometry,
    materials: [
      phong(steelHex, { shininess: 85, specular: new THREE.Color(0xffffff) }),
      phong('0a0a0b', { shininess: 120, specular: new THREE.Color(0x666666) })
    ]
  }
}

/**
 * LG single-unit wash tower (WKEX300HBA / WKGX301HBA look): dark stainless body,
 * dryer on top with a round tinted door, center control strip, washer below with
 * a round front-load door, and a kick drawer. Face +Z. Y=0 at bottom.
 */
/**
 * Stainless single bowl resting on a counter. Base at Y=0 (counter top).
 * Walls ~1cm thick, floor ~1cm, rim lip on top, dark drain in the floor.
 */
/**
 * Frame-and-panel cabinet. Front faces +Z. Y=0 at the bottom of the toe kick.
 * Carcass is flush at depth/2; frame members stand 1.6 cm proud; panels sit 1.0 cm behind the frame.
 * Doors: 2 overlay doors over the full width. Optional drawer (DRAWER_H) at the bottom.
 */
function buildFramedCabinetGeometry(
  width: number,
  height: number,
  depth: number,
  drawerH: number,
  toe: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const body: THREE.BufferGeometry[] = []
  const frame: THREE.BufferGeometry[] = []
  const panel: THREE.BufferGeometry[] = []
  const FT = 1.6 // frame thickness, proud of carcass front
  const PT = 0.6 // panel thickness
  const GAP = 0.3 // reveal between doors / top / bottom
  const STILE = 5.08 // 2″ door frame member
  const zFront = depth / 2

  // Carcass + toe kick platform
  pushBox(body, width, height - toe, depth, 0, toe, 0)
  if (toe > 0) pushBox(body, width * 0.92, toe, depth * 0.85, 0, 0, -depth * 0.02)

  // Frame-and-panel face: four frame members + recessed panel behind them.
  const addFrame = (cx: number, yb: number, w: number, h: number, stile: number) => {
    const zf = zFront + FT / 2
    pushBox(frame, stile, h, FT, cx - w / 2 + stile / 2, yb, zf)
    pushBox(frame, stile, h, FT, cx + w / 2 - stile / 2, yb, zf)
    pushBox(frame, w - stile * 2, stile, FT, cx, yb, zf)
    pushBox(frame, w - stile * 2, stile, FT, cx, yb + h - stile, zf)
    pushBox(panel, w - stile * 2 + 0.2, h - stile * 2 + 0.2, PT, cx, yb + stile - 0.1, zFront + PT / 2)
  }
  // Pull: small bar standing off the frame face (vertical or horizontal)
  const pullZ = zFront + FT + 0.8

  // Doors
  const doorTop = height - GAP
  const doorYb = toe + (drawerH > 0 ? drawerH + GAP : GAP)
  const doorH = doorTop - doorYb
  const n = Math.max(1, Math.round(width / 55))
  const dw = width / n
  for (let i = 0; i < n; i++) {
    const cx = -width / 2 + (i + 0.5) * dw
    const w = dw - GAP
    addFrame(cx, doorYb, w, doorH, STILE)
    // Vertical pull at the meeting-edge side of each door
    const px = cx + (i === 0 ? 1 : -1) * (w / 2 - 4.5)
    const py = drawerH > 0 ? doorTop - 8 - 10 : doorYb + 8
    pushBox(frame, 1.3, 10, 1.6, px, py, pullZ)
  }

  // Drawer front (full width) with horizontal pull
  if (drawerH > 0) {
    addFrame(0, toe + 0.2, width - 0.4, drawerH - 0.4, 3.81)
    pushBox(frame, 10.16, 1.3, 1.6, 0, toe + drawerH / 2 - 0.65, pullZ)
  }

  const geometry = mergeGeometriesGrouped([
    { geoms: [...body, ...frame], materialIndex: 0 },
    { geoms: panel, materialIndex: 1 }
  ])
  for (const g of [...body, ...frame, ...panel]) g.dispose()
  const a = phong(hex, { shininess: 25 })
  const b = phong(hex, { shininess: 25 })
  b.color.offsetHSL(0, 0, -0.035)
  return { geometry, materials: [a, b] }
}

/**
 * Granite vanity top with a round cut-out and a porcelain bowl recessed into it.
 * Local: width along X, depth along Z, top surface at Y=0, slab below to −THK.
 * Bowl bottom at −(THK + BOWL_DEPTH). Bowl center at Z = BOWL_Z.
 */
function buildBowlTopGeometry(
  width: number,
  depth: number,
  thk: number,
  bowlDia: number,
  bowlDepth: number,
  bowlZ: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const stone: THREE.BufferGeometry[] = []
  const porc: THREE.BufferGeometry[] = []
  const drain: THREE.BufferGeometry[] = []
  const R = bowlDia / 2

  // Slab: rectangle in shape XY (shape y → world Z), hole = bowl opening, extruded down −Y.
  const shape = new THREE.Shape()
  shape.moveTo(-width / 2, -depth / 2)
  shape.lineTo(width / 2, -depth / 2)
  shape.lineTo(width / 2, depth / 2)
  shape.lineTo(-width / 2, depth / 2)
  shape.lineTo(-width / 2, -depth / 2)
  const hole = new THREE.Path()
  hole.absarc(0, bowlZ, R, 0, Math.PI * 2, false)
  shape.holes.push(hole)
  const slab = new THREE.ExtrudeGeometry(shape, { depth: thk, bevelEnabled: false, curveSegments: 48 })
  slab.rotateX(Math.PI / 2)
  stone.push(slab)

  // Bowl shell (double-sided so the inside reads from above) + floor + drain
  const bowlTotal = thk + bowlDepth
  const shell = new THREE.CylinderGeometry(R, R * 0.96, bowlDepth, 48, 1, true)
  shell.translate(0, -thk - bowlDepth / 2, bowlZ)
  porc.push(shell)
  const floor = new THREE.CircleGeometry(R * 0.96, 48)
  floor.rotateX(-Math.PI / 2)
  floor.translate(0, -bowlTotal, bowlZ)
  porc.push(floor)
  const dr = new THREE.CylinderGeometry(2.2, 2.2, 0.6, 16)
  dr.translate(0, -bowlTotal + 0.3, bowlZ)
  drain.push(dr)

  const geometry = mergeGeometriesGrouped([
    { geoms: stone, materialIndex: 0 },
    { geoms: porc, materialIndex: 1 },
    { geoms: drain, materialIndex: 2 }
  ])
  for (const g of [...stone, ...porc, ...drain]) g.dispose()
  return {
    geometry,
    materials: [
      phong(hex || 'c9c3b8', { shininess: 70, specular: new THREE.Color(0x999999) }),
      phong('f5f5f4', { shininess: 90, specular: new THREE.Color(0xffffff), side: THREE.DoubleSide }),
      phong('2a2d31', { shininess: 40 })
    ]
  }
}

function buildVesselSinkGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const shell: THREE.BufferGeometry[] = []
  const basin: THREE.BufferGeometry[] = []
  const drain: THREE.BufferGeometry[] = []
  const halfW = width / 2
  const halfD = depth / 2
  const wall = 1.0
  const floorT = 1.0

  // Outer walls (full height) + top rim lip
  pushBox(shell, width, height, wall, 0, 0, halfD - wall / 2)
  pushBox(shell, width, height, wall, 0, 0, -halfD + wall / 2)
  pushBox(shell, wall, height, depth, -halfW + wall / 2, 0, 0)
  pushBox(shell, wall, height, depth, halfW - wall / 2, 0, 0)
  pushBox(shell, width + 1.0, 0.8, depth + 1.0, 0, height - 0.8, 0)

  // Basin floor (inside) + drain
  pushBox(basin, width - wall * 2, floorT, depth - wall * 2, 0, 0, 0)
  pushCyl(drain, 2.2, 0.4, 0, floorT, 0)

  const geometry = mergeGeometriesGrouped([
    { geoms: shell, materialIndex: 0 },
    { geoms: basin, materialIndex: 1 },
    { geoms: drain, materialIndex: 2 }
  ])
  for (const g of [...shell, ...basin, ...drain]) g.dispose()
  return {
    geometry,
    materials: [
      phong(hex, { shininess: 90, specular: new THREE.Color(0xdddddd) }),
      phong('b9bec4', { shininess: 80, specular: new THREE.Color(0xdddddd) }),
      phong('2a2d31', { shininess: 40 })
    ]
  }
}

function buildWashTowerGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const body: THREE.BufferGeometry[] = []
  const glass: THREE.BufferGeometry[] = []
  const ring: THREE.BufferGeometry[] = []
  const halfD = depth / 2
  const bodyHex = hex && hex !== '2a2a2a' ? hex : '23262b'

  // Cabinet body + front plate (flush at +Z)
  pushBox(body, width, height, depth * 0.96, 0, 0, -depth * 0.02)
  pushBox(body, width, height, 1.0, 0, 0, halfD - 0.5)

  // Chrome band between dryer and control strip
  pushBox(ring, width * 0.98, 1.2, 1.4, 0, height * 0.545, halfD + 0.2)

  // Center control strip — black display band
  pushBox(glass, width * 0.9, height * 0.05, 0.6, 0, height * 0.48, halfD + 0.2)

  // Round front-load doors: dryer (top) and washer (bottom)
  const doorR = width * 0.4
  for (const cy of [height * 0.72, height * 0.25]) {
    pushCyl(glass, doorR * 0.9, 0.8, 0, cy, halfD + 0.4, 'z')
    const torus = new THREE.TorusGeometry(doorR, 1.4, 12, 48)
    torus.translate(0, cy, halfD + 0.8)
    ring.push(torus)
  }

  // Kick drawer along the bottom
  pushBox(body, width * 0.94, height * 0.06, 1.0, 0, height * 0.01, halfD - 0.2)
  pushBox(ring, width * 0.5, 0.8, 1.2, 0, height * 0.035, halfD + 0.4)

  const geometry = mergeGeometriesGrouped([
    { geoms: body, materialIndex: 0 },
    { geoms: glass, materialIndex: 1 },
    { geoms: ring, materialIndex: 2 }
  ])
  for (const g of [...body, ...glass, ...ring]) g.dispose()
  return {
    geometry,
    materials: [
      phong(bodyHex, { shininess: 60, specular: new THREE.Color(0x444444) }),
      phong('0c0e11', { shininess: 140, specular: new THREE.Color(0x888888) }),
      phong('a9aeb4', { shininess: 90, specular: new THREE.Color(0xffffff) })
    ]
  }
}

/* ───────────────────────── Laundry detail pack ─────────────────────────
 * shakerbase · shakerwall · counterx · lsink · pulldown · frontload
 * Each is ONE merged mesh (reload-latency rule). Item recenters the bbox, so every
 * builder keeps hardware inside the stated overall DEPTH (pulls end exactly at +Z = D/2).
 */

const LP_PULL = 3.0 // bar-pull projection past the door face
const LP_DOOR = 1.9 // door / drawer-front thickness (3/4")

function lpShade(hex: string, dl: number): string {
  const c = new THREE.Color(`#${hex.replace(/^#/, '')}`)
  c.offsetHSL(0, 0, dl)
  return c.getHexString()
}

/** Cylinder between two points. */
function lpSeg(arr: THREE.BufferGeometry[], a: THREE.Vector3, b: THREE.Vector3, r: number, radial = 14) {
  const dir = new THREE.Vector3().subVectors(b, a)
  const len = dir.length()
  if (len < 1e-4) return
  const g = new THREE.CylinderGeometry(r, r, len, radial, 1)
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()))
  const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5)
  g.translate(mid.x, mid.y, mid.z)
  arr.push(g)
}

/** Shaker door/drawer front: 4-piece frame + recessed center panel. Front face at zFace. */
function lpShakerFront(
  frame: THREE.BufferGeometry[],
  panel: THREE.BufferGeometry[],
  cx: number,
  yb: number,
  w: number,
  h: number,
  zFace: number,
  stile: number
) {
  const s = Math.min(stile, w * 0.3, h * 0.45)
  const zc = zFace - LP_DOOR / 2
  pushBox(frame, s, h, LP_DOOR, cx - w / 2 + s / 2, yb, zc)
  pushBox(frame, s, h, LP_DOOR, cx + w / 2 - s / 2, yb, zc)
  pushBox(frame, w - 2 * s, s, LP_DOOR, cx, yb, zc)
  pushBox(frame, w - 2 * s, s, LP_DOOR, cx, yb + h - s, zc)
  const recess = 0.9
  const pt = LP_DOOR - recess
  pushBox(panel, w - 2 * s + 0.3, h - 2 * s + 0.3, pt, cx, yb + s - 0.15, zFace - LP_DOOR + pt / 2)
  // thin inner bead around the panel opening
  const bead = 0.35
  const iw = w - 2 * s
  const ih = h - 2 * s
  pushBox(frame, iw, bead, 0.5, cx, yb + s, zFace - 0.25)
  pushBox(frame, iw, bead, 0.5, cx, yb + s + ih - bead, zFace - 0.25)
  pushBox(frame, bead, ih - 2 * bead, 0.5, cx - iw / 2 + bead / 2, yb + s + bead, zFace - 0.25)
  pushBox(frame, bead, ih - 2 * bead, 0.5, cx + iw / 2 - bead / 2, yb + s + bead, zFace - 0.25)
}

/** Satin bar pull: bar + two posts. Bar's outer face ends exactly zFace + LP_PULL. */
function lpBarPull(
  arr: THREE.BufferGeometry[],
  cx: number,
  cy: number,
  zFace: number,
  len: number,
  vertical: boolean
) {
  const r = 0.55
  const rp = 0.42
  const postL = LP_PULL - r
  const zBar = zFace + LP_PULL - r
  if (vertical) {
    pushCyl(arr, r, len, cx, cy - len / 2, zBar)
    pushCyl(arr, rp, postL, cx, cy + len * 0.36, zFace + postL / 2, 'z')
    pushCyl(arr, rp, postL, cx, cy - len * 0.36, zFace + postL / 2, 'z')
  } else {
    pushCyl(arr, r, len, cx, cy, zBar, 'x')
    pushCyl(arr, rp, postL, cx - len * 0.36, cy, zFace + postL / 2, 'z')
    pushCyl(arr, rp, postL, cx + len * 0.36, cy, zFace + postL / 2, 'z')
  }
}

function lpCabinetMaterials(hex: string): THREE.Material[] {
  return [
    phong(hex, { shininess: 22 }),
    phong(lpShade(hex, -0.045), { shininess: 14 }),
    phong('b9bec5', { shininess: 70, specular: new THREE.Color(0x999999) }),
    phong(lpShade(hex, -0.34), { shininess: 4 })
  ]
}

function buildShakerBaseGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string,
  mode: string,
  doorsArg: number
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const paint: THREE.BufferGeometry[] = []
  const panel: THREE.BufferGeometry[] = []
  const hw: THREE.BufferGeometry[] = []
  const shadow: THREE.BufferGeometry[] = []

  const toe = 10.16
  const open = mode === 'open'
  const zBack = -depth / 2
  const zFace = depth / 2 - (open ? 0 : LP_PULL)
  const zC = open ? zFace - LP_DOOR : zFace - LP_DOOR - 0.1 // carcass front plane
  const ch = height - toe
  const midZ = (zC + zBack) / 2
  const edge = 0.15
  const gap = 0.4

  // Toe kick (recessed 7 cm behind the carcass front)
  const zToe = zC - 7.0
  pushBox(shadow, width, toe, zToe - zBack, 0, 0, (zToe + zBack) / 2)

  if (mode === 'doors' || mode === 'drawers') {
    pushBox(paint, width, ch, zC - zBack, 0, toe, midZ)
  } else {
    const t = 1.9
    pushBox(paint, t, ch, zC - zBack, -width / 2 + t / 2, toe, midZ)
    pushBox(paint, t, ch, zC - zBack, width / 2 - t / 2, toe, midZ)
    pushBox(paint, width - 2 * t, ch, 1.0, 0, toe, zBack + 0.5)
    pushBox(paint, width - 2 * t, t, zC - zBack - 1.0, 0, toe, (zC + zBack + 1.0) / 2)
    if (open) {
      pushBox(paint, width - 2 * t, t, zC - zBack - 1.0, 0, toe + ch * 0.5, (zC + zBack + 1.0) / 2)
      pushBox(paint, width - 2 * t, t, zC - zBack - 1.0, 0, height - t, (zC + zBack + 1.0) / 2)
      // face frame (flush at zFace)
      const fs = 3.8
      pushBox(paint, fs, ch, LP_DOOR, -width / 2 + fs / 2, toe, zFace - LP_DOOR / 2)
      pushBox(paint, fs, ch, LP_DOOR, width / 2 - fs / 2, toe, zFace - LP_DOOR / 2)
      pushBox(paint, width - 2 * fs, fs, LP_DOOR, 0, height - fs, zFace - LP_DOOR / 2)
      pushBox(paint, width - 2 * fs, fs * 0.7, LP_DOOR, 0, toe, zFace - LP_DOOR / 2)
      pushBox(paint, width - 2 * fs, fs * 0.7, LP_DOOR, 0, toe + ch * 0.5 - fs * 0.35 + t / 2, zFace - LP_DOOR / 2)
    } else {
      // sink: top stretchers (front/back) — middle stays open for the basin
      pushBox(paint, width - 2 * t, t, 7.6, 0, height - t, zC - 3.8)
      pushBox(paint, width - 2 * t, t, 7.6, 0, height - t, zBack + 1.0 + 3.8)
    }
  }

  if (!open) {
    // reveal shadow plate behind the fronts
    pushBox(shadow, width, ch, 0.1, 0, toe, zC + 0.05)
    const top = height - edge
    const bottom = toe + edge
    const fw = width - 2 * edge

    if (mode === 'drawers') {
      // 5″ / 10⅛″ / 10⅛″ proportions
      const total = top - bottom - 2 * gap
      const hs = [5 / 25.25, 10.125 / 25.25, 10.125 / 25.25].map((r) => r * total)
      let yTop = top
      for (const h of hs) {
        const yb = yTop - h
        lpShakerFront(paint, panel, 0, yb, fw, h, zFace, h < 18 ? 4.4 : 5.7)
        lpBarPull(hw, 0, yb + h / 2, zFace, Math.min(16, fw * 0.3), false)
        yTop = yb - gap
      }
    } else {
      const dh = 14.0
      const dyb = top - dh
      lpShakerFront(paint, panel, 0, dyb, fw, dh, zFace, 4.4)
      if (mode !== 'sink') lpBarPull(hw, 0, dyb + dh / 2, zFace, Math.min(16, fw * 0.3), false)
      const n = doorsArg > 0 ? doorsArg : width < 70 ? 1 : 2
      const dw = (fw - (n - 1) * gap) / n
      const dybDoor = bottom
      const dhDoor = dyb - gap - bottom
      for (let i = 0; i < n; i++) {
        const cx = -width / 2 + edge + dw / 2 + i * (dw + gap)
        lpShakerFront(paint, panel, cx, dybDoor, dw, dhDoor, zFace, 5.7)
        const px = n === 1 ? cx + dw / 2 - 4.2 : i === 0 ? cx + dw / 2 - 4.2 : cx - dw / 2 + 4.2
        lpBarPull(hw, px, dybDoor + dhDoor - 11, zFace, 12.7, true)
      }
    }
  }

  const geometry = mergeGeometriesGrouped([
    { geoms: paint, materialIndex: 0 },
    { geoms: panel, materialIndex: 1 },
    { geoms: hw, materialIndex: 2 },
    { geoms: shadow, materialIndex: 3 }
  ])
  return { geometry, materials: lpCabinetMaterials(hex) }
}

function buildShakerWallGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string,
  doorsArg: number,
  crown: number,
  pullSide: 'L' | 'R'
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const paint: THREE.BufferGeometry[] = []
  const panel: THREE.BufferGeometry[] = []
  const hw: THREE.BufferGeometry[] = []
  const shadow: THREE.BufferGeometry[] = []

  const bh = height - crown
  const zBack = -depth / 2
  const zFace = depth / 2 - LP_PULL
  const zC = zFace - LP_DOOR - 0.1
  const edge = 0.15
  const gap = 0.4

  pushBox(paint, width, bh, zC - zBack, 0, 0, (zC + zBack) / 2)
  pushBox(shadow, width, bh, 0.1, 0, 0, zC + 0.05)

  const n = doorsArg > 0 ? doorsArg : width < 55 ? 1 : 2
  const fw = width - 2 * edge
  const dw = (fw - (n - 1) * gap) / n
  const yb = edge
  const dh = bh - 2 * edge
  for (let i = 0; i < n; i++) {
    const cx = -width / 2 + edge + dw / 2 + i * (dw + gap)
    lpShakerFront(paint, panel, cx, yb, dw, dh, zFace, 5.7)
    let px: number
    if (n === 1) px = pullSide === 'L' ? cx - dw / 2 + 4.2 : cx + dw / 2 - 4.2
    else px = i === 0 ? cx + dw / 2 - 4.2 : cx - dw / 2 + 4.2
    lpBarPull(hw, px, yb + 12, zFace, 12.7, true)
  }

  if (crown > 0) {
    // stepped cornice, all inside the nominal envelope
    const c1 = crown * 0.36
    const c2 = crown * 0.3
    const c3 = crown - c1 - c2
    pushBox(paint, width, c1, zFace - 1.4 - zBack, 0, bh, (zFace - 1.4 + zBack) / 2)
    pushBox(paint, width, c2, zFace - 0.7 - zBack, 0, bh + c1, (zFace - 0.7 + zBack) / 2)
    pushBox(paint, width, c3, zFace - zBack, 0, bh + c1 + c2, (zFace + zBack) / 2)
    // shadow line under the cornice
    pushBox(shadow, width - 0.2, 0.25, zFace - 1.3 - zBack, 0, bh - 0.05, (zFace - 1.3 + zBack) / 2)
  }

  const geometry = mergeGeometriesGrouped([
    { geoms: paint, materialIndex: 0 },
    { geoms: panel, materialIndex: 1 },
    { geoms: hw, materialIndex: 2 },
    { geoms: shadow, materialIndex: 3 }
  ])
  return { geometry, materials: lpCabinetMaterials(hex) }
}

function buildCounterXGeometry(
  width: number,
  thk: number,
  depth: number,
  hex: string,
  cutW: number,
  cutD: number,
  cutX: number,
  cutZ: number,
  splashH: number,
  flags: number
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const stone: THREE.BufferGeometry[] = []
  const hw = width / 2
  const hd = depth / 2
  const outer: [number, number][] = [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd]
  ]
  const holes: [number, number][][] = []
  if (cutW > 0 && cutD > 0) {
    holes.push(
      roundedPlanRect(cutW / 2, cutZ - cutD / 2, cutZ + cutD / 2, 1.6, 6).map(([x, z]) => [x + cutX, z] as [number, number])
    )
  }
  stone.push(extrudePlanY(outer, holes, 0, thk))

  if (splashH > 0) {
    const st = 1.9
    const back = (flags & 1) !== 0
    if (back) pushBox(stone, width, splashH, st, 0, thk, -hd + st / 2)
    const sideLen = depth - (back ? st : 0)
    const sideZ = back ? st / 2 : 0
    if (flags & 2) pushBox(stone, st, splashH, sideLen, -hw + st / 2, thk, sideZ)
    if (flags & 4) pushBox(stone, st, splashH, sideLen, hw - st / 2, thk, sideZ)
  }
  const geometry = mergeGeometriesGrouped([{ geoms: stone, materialIndex: 0 }])
  return { geometry, materials: [phong(hex, { shininess: 55, specular: new THREE.Color(0x444444) })] }
}

function buildLaundrySinkGeometry(
  openW: number,
  height: number,
  openD: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const acrylic: THREE.BufferGeometry[] = []
  const chrome: THREE.BufferGeometry[] = []
  const dark: THREE.BufferGeometry[] = []
  const wall = 0.9
  const floorT = 0.9
  const ow = openW / 2
  const od = openD / 2
  // basin shell + floor
  const shellOuter = roundedPlanRect(ow + wall, -od - wall, od + wall, 3.6)
  const shellInner = roundedPlanRect(ow, -od, od, 2.8)
  acrylic.push(extrudePlanY(shellOuter, [shellInner], floorT, height - floorT - 0.9))
  acrylic.push(extrudePlanY(shellOuter, [], 0, floorT))
  // top flange (25″ × 22″ overall for the Medford)
  const fx = 3.81
  const fz = 6.19
  acrylic.push(
    extrudePlanY(roundedPlanRect(ow + fx, -od - fz, od + fz, 5), [roundedPlanRect(ow, -od, od, 2.8)], height - 0.9, 0.9)
  )
  // rear-biased drain with chrome ring
  const dz = -od + 9
  pushCyl(chrome, 4.3, 0.35, 0, floorT, dz)
  pushCyl(dark, 2.5, 0.45, 0, floorT, dz)
  // overflow-style slot on the rear wall
  pushBox(dark, 6.5, 1.3, 0.25, 0, height - 7, -od + 0.1)
  return {
    geometry: mergeGeometriesGrouped([
      { geoms: acrylic, materialIndex: 0 },
      { geoms: chrome, materialIndex: 1 },
      { geoms: dark, materialIndex: 2 }
    ]),
    materials: [
      phong(hex, { shininess: 95, specular: new THREE.Color(0x777777) }),
      phong('d6dae0', { shininess: 120, specular: new THREE.Color(0xffffff) }),
      phong('4b5058', { shininess: 10 })
    ]
  }
}

function buildPulldownFaucetGeometry(
  height: number,
  reach: number,
  hex: string
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const chrome: THREE.BufferGeometry[] = []
  const dark: THREE.BufferGeometry[] = []
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

  // Escutcheon (10⅝″ × 2⅝″) + base collar + tapered neck
  chrome.push(extrudePlanY(roundedPlanRect(13.5, -3.34, 3.34, 3.0, 6), [], 0, 0.8))
  pushCyl(chrome, 2.75, 1.6, 0, 0.8, 0)
  {
    const neck = new THREE.CylinderGeometry(1.7, 2.45, 3.6, 24)
    neck.translate(0, 2.4 + 1.8, 0)
    chrome.push(neck)
  }

  // Column + high-arc spout
  const tube = 1.3
  const R = reach / 2
  const y1 = height - tube - R
  lpSeg(chrome, V(0, 5.8, 0), V(0, y1, 0), tube, 18)
  const pts: THREE.Vector3[] = []
  const N = 22
  for (let i = 0; i <= N; i++) {
    const phi = (i / N) * Math.PI
    pts.push(V(0, y1 + R * Math.sin(phi), R * (1 - Math.cos(phi))))
  }
  for (let i = 0; i < N; i++) lpSeg(chrome, pts[i], pts[i + 1], tube, 16)
  for (const p of pts) {
    const s = new THREE.SphereGeometry(tube, 10, 6)
    s.translate(p.x, p.y, p.z)
    chrome.push(s)
  }

  // Pull-down head: collar at arc end, body, dark spray face (outlet 8-7/16″ above deck)
  const outletY = 21.43
  const headTop = y1 + 0.4
  pushCyl(chrome, 1.85, 1.8, 0, headTop - 1.8, reach)
  pushCyl(chrome, 1.55, headTop - 1.8 - outletY, 0, outletY, reach)
  pushCyl(dark, 1.3, 0.3, 0, outletY - 0.28, reach)
  pushCyl(chrome, 1.65, 0.5, 0, outletY, reach)

  // Lever handle on +X, rising 23°, with boss at the column
  pushCyl(chrome, 1.55, 2.4, 1.3, 7.0, 0, 'x')
  lpSeg(chrome, V(2.3, 7.0, 0), V(14.7, 12.3, 0), 0.85, 14)
  {
    const tip = new THREE.SphereGeometry(0.85, 12, 8)
    tip.translate(14.7, 12.3, 0)
    chrome.push(tip)
  }

  return {
    geometry: mergeGeometriesGrouped([
      { geoms: chrome, materialIndex: 0 },
      { geoms: dark, materialIndex: 1 }
    ]),
    materials: [
      phong(hex, { shininess: 140, specular: new THREE.Color(0xffffff) }),
      phong('30343a', { shininess: 20 })
    ]
  }
}

function buildFrontLoadGeometry(
  width: number,
  height: number,
  depth: number,
  hex: string,
  kind: 'washer' | 'dryer'
): { geometry: THREE.BufferGeometry; materials: THREE.Material[] } {
  const body: THREE.BufferGeometry[] = []
  const chrome: THREE.BufferGeometry[] = []
  const glass: THREE.BufferGeometry[] = []
  const panel: THREE.BufferGeometry[] = []
  const steel: THREE.BufferGeometry[] = []
  const dark: THREE.BufferGeometry[] = []
  const disp: THREE.BufferGeometry[] = []

  const PROTR = 3.0
  const zBack = -depth / 2
  const zFront = depth / 2 - PROTR
  const bodyD = zFront - zBack
  const foot = 2.5
  const consoleH = 12.0
  const cy = (height - consoleH + foot) / 2 // door center height
  const holeR = 19.05 // 15″ drum opening
  const drumD = 34

  // Body: plan-extruded plate with the round drum opening
  const shape = new THREE.Shape()
  shape.moveTo(-width / 2, foot)
  shape.lineTo(width / 2, foot)
  shape.lineTo(width / 2, height)
  shape.lineTo(-width / 2, height)
  shape.closePath()
  const hole = new THREE.Path()
  hole.absarc(0, cy, holeR, 0, Math.PI * 2, false)
  shape.holes.push(hole)
  const bodyG = new THREE.ExtrudeGeometry(shape, { depth: bodyD, bevelEnabled: false, curveSegments: 56 })
  bodyG.translate(0, 0, zBack)
  body.push(bodyG)
  pushBox(body, width, height - foot, 0.8, 0, foot, zBack + 0.4) // rear cover
  pushBox(dark, width - 2.5, foot, bodyD - 3.0, 0, 0, (zBack + 1.5 + zFront - 1.5) / 2) // kick

  // Drum (open shell + dark back) seen through the door
  {
    const drum = new THREE.CylinderGeometry(holeR - 0.15, holeR - 0.15, drumD, 56, 1, true)
    drum.rotateX(Math.PI / 2)
    drum.translate(0, cy, zFront - drumD / 2)
    steel.push(drum)
    const back = new THREE.CircleGeometry(holeR - 0.15, 56)
    back.translate(0, cy, zFront - drumD)
    dark.push(back)
    // 3 drum lifters
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 2
      const lx = Math.cos(a) * (holeR - 1.2)
      const ly = Math.sin(a) * (holeR - 1.2)
      pushBoxAt(steel, 2.4, 2.4, drumD * 0.7, lx, cy + ly, zFront - drumD * 0.5)
    }
  }
  // Rubber gasket + chrome bezel + smoked dome glass
  {
    const gasket = new THREE.TorusGeometry(holeR + 0.9, 1.1, 10, 56)
    gasket.translate(0, cy, zFront - 0.1)
    dark.push(gasket)
    const bezel = new THREE.TorusGeometry(24.2, 2.2, 14, 64)
    bezel.translate(0, cy, zFront + 0.7)
    chrome.push(bezel)
    const capR = 90
    const theta = Math.asin(21.6 / capR)
    const dome = new THREE.SphereGeometry(capR, 56, 8, 0, Math.PI * 2, 0, theta)
    dome.rotateX(Math.PI / 2)
    dome.translate(0, cy, zFront + 0.1 - capR * Math.cos(theta))
    glass.push(dome)
    // hinge knuckles on the left
    pushBoxAt(dark, 1.6, 6.0, 1.2, -24.6, cy + 14, zFront + 0.8)
    pushBoxAt(dark, 1.6, 6.0, 1.2, -24.6, cy - 14, zFront + 0.8)
  }

  // Console: black glass band, dial, display, buttons
  {
    const py = height - consoleH + 1.0
    const ph = consoleH - 3.0
    const pc = py + ph / 2
    const zp = zFront + 0.3
    pushBox(panel, width - 6, ph, 0.6, 0, py, zp)
    pushCyl(chrome, 4.5, 1.5, 0, pc, zFront + 0.6 + 0.75, 'z')
    pushCyl(dark, 3.5, 0.5, 0, pc, zFront + 0.6 + 1.5 + 0.2, 'z')
    pushBoxAt(chrome, 0.7, 2.6, 0.2, 0, pc + 3.0, zFront + 0.6 + 1.5 + 0.55) // dial indicator
    const dx = kind === 'washer' ? 16 : -18
    pushBoxAt(disp, 9.5, 3.2, 0.3, dx, pc, zFront + 0.75)
    if (kind === 'washer') {
      pushBoxAt(dark, 16, 4.4, 0.4, -24, pc, zFront + 0.8) // SmartDispense window
      pushBoxAt(chrome, 11, 0.5, 0.3, -24, pc - 2.6, zFront + 0.95)
    }
    const bx = kind === 'washer' ? 27 : 24
    for (let i = -1; i <= 1; i++) pushCyl(chrome, 1.1, 0.5, bx + i * 3.6, pc, zFront + 0.6 + 0.25 + 0.0, 'z')
  }

  return {
    geometry: mergeGeometriesGrouped([
      { geoms: body, materialIndex: 0 },
      { geoms: chrome, materialIndex: 1 },
      { geoms: steel, materialIndex: 4 },
      { geoms: dark, materialIndex: 5 },
      { geoms: panel, materialIndex: 3 },
      { geoms: disp, materialIndex: 6 },
      { geoms: glass, materialIndex: 2 }
    ]),
    materials: [
      phong(hex, { shininess: 45, specular: new THREE.Color(0x555555) }),
      phong('d2d6dc', { shininess: 130, specular: new THREE.Color(0xffffff) }),
      phong('1b2230', {
        shininess: 140,
        specular: new THREE.Color(0xffffff),
        transparent: true,
        opacity: 0.5,
        depthWrite: false
      }),
      phong('0d0f12', { shininess: 120, specular: new THREE.Color(0x888888) }),
      phong('b5bac2', { shininess: 80, specular: new THREE.Color(0xaaaaaa) }),
      phong('1a1c20', { shininess: 10 }),
      phong('7fe7e0', { shininess: 30, emissive: new THREE.Color(0x1e6f6a) })
    ]
  }
}

export function isProceduralUrl(url: string): boolean {
  return url.toLowerCase().startsWith('procedural:')
}
