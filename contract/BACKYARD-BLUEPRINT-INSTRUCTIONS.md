# Backyard blueprint — creation instructions (for agent)

Use this when building the **exterior backyard** plan in vdesign so the **house is visible** (rear elevation / walk-out mass), not just a flat yard pad.

**Companion brief:** [`BACKYARD-DESIGN-BRIEF.md`](./BACKYARD-DESIGN-BRIEF.md)  
**Graphics:** [`exterior-refs/`](./exterior-refs/) especially `02-rear-and-front-elevations.png`, `03-left-and-right-elevations.png`, `06-main-level-covered-deck.png`

**Orientation (locked):** looking at the back of the home, **home = north**. Rear lot line = **south**. West / east as labeled on the site sketch.

---

## 0. Do not invent lot depth

| Dimension | Value | Notes |
|-----------|-------|--------|
| Rear lot line (south, neighbor) | **85.000′** | Width of south property line |
| **Back of house width** | **854″ = 71.167′** | North edge of yard / rear façade (Owner-confirmed) |
| House → rear lot (west edge) | **59.934′** | Back of house to south lot line |
| House → rear lot (east edge) | **57.171′** | Back of house to south lot line |
| Rear **setback** (lot line → dashed setback) | **25.00′** | **Not** house-to-lot depth |
| Side setbacks | **5.00′** typ. | From side property lines |

Yard envelope (plan): irregular trapezoid — south edge **85′**, north edge (house back) **854″ (71.167′)**, depth ~57–60′.

### Fence / wall schedule (from Owner blueprint diagram)

**Diagram orientation:** house at bottom = **north** (home north); top fence = **south** (neighbor). All corners **90°** (E–W / N–S only — no diagonals).

| Wall # | Length | Axis | Role |
|--------|--------|------|------|
| **1** | **813″** | E–W | South fence (rear lot / neighbor) |
| **2** | **652″** | N–S | East fence |
| **3** | **118″** | E–W | SE return (fence ↔ house) |
| **4** | **744″** | E–W | House south / street-side mass (shown) |
| **5** | **110″** | E–W | SW return (fence ↔ house) |
| **6** | **643″** | N–S | West fence |
| **7** | **549″** | E–W | Back of house (west run) |
| **8** | **305″** | E–W | Back of house (east run, at deck) |
| **9** | **234″** | N–S | House east side |
| **10** | **234″** | N–S | House west side |
| **11** | **149″** | N–S | Covered deck west |
| **12** | **249″** | E–W | Covered deck south (outer) |
| **13** | **56″** | E–W | Deck → stairs jog |
| **14** | **149″** | N–S | Covered deck east |
| **16** | **96″** | N–S | Stairs run |

**Checks:** `#7 + #8 = 549 + 305 = 854″` (back of house). `#11 = #14 = 149″` (deck depth). No **#15** on diagram.

**Angles:** every joint **90°**. Match axis in table when drawing.

---

## 1. What “see the house” means

Always draw enough of the **north boundary** that a viewer recognizes the rear of the home:

1. **Rear foundation / walk-out wall** (basement story exposed at patio grade)  
2. **Main-level rear wall** + **covered deck** + stairs  
3. **Second-level mass / gables** (at least silhouette)  
4. Key openings: dining **slider** to deck, basement rear windows/doors per elevations  

Do **not** represent the house as only a single thin line. Prefer a **hatched rear footprint + extruded height stack** (or 3D mass) using the heights below.

**Primary underlays:**  
- `exterior-refs/02-rear-and-front-elevations.png` (rear elevation)  
- `exterior-refs/06-main-level-covered-deck.png` (deck plan)  
- User site crop / sheet 10 for lot lines  

---

## 2. Height of the home from the backyard

Backyard at the walk-out is **lower** than the street/front. Heights stack from **lower patio / backyard grade** upward.

### Confirmed / contract-backed story heights

| Segment | Height | Source |
|---------|--------|--------|
| Basement / walk-out walls | **9′** | Specs — basement level walls 9′ |
| Main level walls | **9′** (also 18′ volumes where noted) | Specs |
| Second level walls | **8′** | Specs |
| Rear elevation floor-to-floor (drawn) | Main → 2nd ≈ **9′-1″**; 2nd floor → 2nd plate ≈ **8′-1″** | Sheet 2 rear elevation |

### Owner-confirmed overall height (from backyard)

| | |
|--|--|
| **House height (backyard)** | **411″ = 34.2′** |

Use **34.2′** as the overall rear height from backyard grade to top of house (ridge / high point). Story stack below is for massing detail only.

### Practical modeling stack (from backyard patio grade)

| Datum | Approx. AFF from **lower backyard / patio grade** |
|-------|-----------------------------------------------------|
| Lower patio / turf grade (walk-out) | **0′-0″** |
| Top of basement / main floor line | **≈ 9′-0″ to 9′-3″** |
| Covered deck walking surface | ≈ main floor (deck at main level) |
| Second floor line | **≈ 18′-1″ to 18′-3″** (9′ + 9′-1″) |
| Second plate / eave band | **≈ 26′-2″ to 26′-4″** (prior + 8′-1″) |
| **Top of house (Owner-confirmed)** | **34.2′ (411″)** |

**Short answer for Q&A:**  
From the **backyard**, overall house height is **34.2′ (411″)**.

**Deck:** main-level covered deck (~**19′ × 11′** + 4×4 projections per specs) sits ~**9′** above lower patio; stairs connect deck → patio.

---

## 3. Blueprint build sequence (agent checklist)

### A. Lot frame (2D plan, looking north at house)

1. Draw **south lot line** = **85.000′**.  
2. From the **north house-back line**, offset south:  
   - west corner **59.934′**  
   - east corner **57.171′**  
3. Close side lot lines (west/east).  
4. Draw dashed **25′-0″ rear setback** north of the south lot line.  
5. Draw **5′-0″** side setbacks.

### B. House rear (must be visible)

1. Trace **rear building line** (north edge of yard) — overall width **854″ (71.167′)** (Owner-confirmed); include jogs from sheet 6 / elevations as needed.  
2. Place **covered deck** on the rear (TimberTech Silver Maple, black Omarail) per specs + sheet 6.  
3. Place **stairs** from deck down to lower patio (west side of rear elevation).  
4. Extrude or annotate verticals:  
   - walk-out wall **9′**  
   - main **9′**  
   - second **8′**  
   - overall height **34.2′ (411″)** from patio grade (Owner-confirmed)  
5. Match materials callouts lightly: Hardi lap / B&B, black clad openings, stone where elevations show.

### C. Yard program (inside setbacks)

1. Lower **concrete patio** under/near deck (within **2,100 sf** exterior concrete allowance with drive/walks).  
2. Remainder: **Fescue sod** (contract) unless Owner CO for turf.  
3. Keep **A/C**, downspouts, sill cocks, retaining (per contractor) clear.  
4. Landscape beds / retaining within **$10k** allowance; irrigation **5-zone + drip** ($3,700).

### D. Save / verify

1. **Save Plan** after geometry is stable.  
2. Verify: house rear readable in 2D + 3D; lot depths 59.934′ / 57.171′; south line 85′; setback 25′ not confused with yard depth.

---

## 4. Hard rules for the agent

1. **Home = north** when describing backyard views.  
2. Never substitute **25′ setback** for house→lot depth.  
3. Always include **visible house rear** (walk-out + deck + upper mass).  
4. Prefer contract **specs** for deck size/materials; prefer **site dimensions** the Owner confirmed for lot.  
5. Do **not** pull geometry from `before turf and garage expansion/` unless Owner explicitly says to.

---

## 5. Quick reference — height (backyard)

**Q: What is the height of the home from the backyard?**  

**A:** **411″ = 34.2′** (Owner-confirmed overall height from backyard).  

Story breakdown for modeling: ~9′ walk-out + ~9′ main + ~8′ second + roof to **34.2′** total.
