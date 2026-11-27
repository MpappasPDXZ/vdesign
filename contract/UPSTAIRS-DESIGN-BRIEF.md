# Upstairs / upper level design brief — 2713 S 224th St

**Project:** Sanctuary Ridge Lot #90 · Omaha, NE 68022  
**Owners:** Matt & Sarah Pappas  
**Builder:** Pohlad Custom Homes, Inc.  
**Plans:** Good Life / Advanced House Plans · Project **#2310** · dated **05/27/26**  
**Contract date:** 7/1/26 (specs header also shows 6/30/2026)

This brief is everything we should know about the **second / upper level** when modeling or finishing it. Compiled from `contract/*` (finish schedule, specs, architectural sheet 7) and the in-app underlay at `public/projects/2713-s-224th-upstairs/floor-plan.png`.

**vdesign level id:** `upstairs` on home slug `2713-S-224th`.

---

## Source documents

| File | Role |
|------|------|
| `UL 2713 S 224 Street pdf.xls.pdf` | **Upper Level Room Finish Schedule** (authoritative per-room finishes) |
| `2713 S 224  Specs.pdf` | Materials, plumbing fixtures, HVAC, electrical, trim, tile, cabinets |
| `2310-Pohlad-Sanctury Ridge 90-Final-052726.pdf` **Sheet 7** | Second Level Floor Plan (geometry, labels, framing notes) |
| `ML 2713 S 224 Street pdf.xls.pdf` | Main-level finish schedule (master suite lives here — **not** upstairs) |
| `2713 S 224 MASTER LEGAL CONTRACT-2.pdf` | Scope: ~3,231 sf 1½-story + 1,325 sf basement |

**Extracts / images**

| Path | Contents |
|------|----------|
| `contract/_extract/text/UL 2713 S 224 Street pdf.xls.txt` | OCR of UL finish schedule |
| `contract/_extract/images/ul-finish-p01.png` | Rendered UL finish schedule |
| `contract/_extract/images/sanctuary-ridge-p07.png` | Sheet 7 second-level plan |
| `public/projects/2713-s-224th-upstairs/floor-plan.png` | App underlay (same sheet crop) |

---

## Program snapshot

- **Story type:** 1½-story. Master bedroom / master bath / master closet are on the **main** level. Upstairs is secondary bedrooms + loft + laundry + baths.
- **Wall height (specs):** Second-level walls **8′** (main 9′ / 18′ entry vault; basement 9′).
- **Sheet 7 note:** Ceilings / walls on this level **8′-1⅛″** high unless noted otherwise; header height **6′-9½″** unless noted.
- **Studs (specs):** Second level **8′ SPF 2×4 @ 16″ o.c.** Exterior envelope on plan often called as **2×6** (and some **2×8**) where marked; plumbing walls at baths called **2×6**.
- **Subfloor:** ¾″ oxboard Sturd-I-Floor @ 2nd level, T&G, glued and nailed.
- **Area:** Sheet 7 area schedule text is hard to read from renders (~1,200–1,700 sf depending on OCR). Treat **sheet 7 polygon** as geometry truth; do not invent sf.
- **Open to below:** Large void over great room / entry with loft railing; **(3) 8×8 wood beams** in the vaulted loft / family volume (specs: Family room box vault with **3 Pine beams**).
- **Stairs:** Down **16 risers** from upper landing; California tuck carpet from main → second (specs). Handrail / newels birch stained (PCH); iron balusters with integrated wood; MDF skirt boards painted.

---

## Room inventory

### Authoritative list (UL finish schedule)

| Room | Floor | Ceiling | Notes on schedule |
|------|-------|---------|-------------------|
| **Family Room / Loft** | Carpet | **Smooth** | Drywall beams; premium base/casing |
| **Entry** (upper) | Wood | **Smooth** | Drywall beams; premium trim |
| **Hall #2** | Carpet | Textured | Standard trim on schedule |
| **Bedroom #2** + closet | Carpet | Textured | |
| **Bedroom #3** + closet | Carpet | Textured | |
| **Bath Room #3** | Tile | Textured | Cabinets paint · granite · 4″ granite splash · note **4′ FIBERGLASS STALL** |
| **Bedroom #4** + closet | Carpet | Textured | |
| **Bath Room #4** | Tile | Textured | Note **5′ FIBERGLASS STALL** |
| **Bedroom #5** + closet | Carpet | Textured | Listed on schedule + specs (windows / fan wiring) |
| **Laundry** | Tile | Textured | Cabinets paint · granite · 4″ splash · **STAINLESS SINK** |
| **Furnace Room** | Unfinished | Textured | Unfinished walls |
| **Steps** | Carpet | **Smooth** | Premium trim · **WOOD OPEN END CAPS** |

All listed rooms: painted walls, **1″ chamfer** corners.

### Architectural sheet 7 / current model layout

West → east:

1. **Bedroom #2** (NW) — carpet · closet with rod & shelf · door to J&J  
2. **J&J Bath** (between BR2 / BR3) — tile · **V72** double vanity · private stool · **5′-0″ fiberglass shower/tub stall** · pocket door to BR3  
3. **Bedroom #3** (SW) — carpet · closet · two small casements (~**C2947** / 29×47 class)  
4. **Bedroom #4** (N center bump) — carpet · closet · window ~**58×59**  
5. **Bath #3** (hall bath, by BR4) — tile · single vanity (**V36**) · stool · **36″×48″ fiberglass shower stall**  
6. **Hall #2** — carpet · ~3′-8″ wide · concealed girder truss notes  
7. **Laundry** — tile · washer + dryer · folding counter · sink · rod & shelf  
8. **W.I.C.** (south of laundry) — carpet · rod & shelf · shoe shelves · ~7′ wide  
9. **Furnace** — furnace w/ drain pan · adjacent to W.I.C.  
10. **Loft / Family** — carpet · railing at open-to-below · **(3) 8×8 beams** · large fixed window (~**108×53 FXD**) on north open volume  
11. **Stairs** — DN 16 risers · landing · open to below  

**Bedroom #5 discrepancy (important):**  
UL finish schedule and Specs (window + ceiling-fan wiring) name **Bedroom #5**. Sheet 7 / current `upstairs` areas label three sleeping rooms (#2–#4) plus a carpeted **W.I.C.** south of laundry — **no separate “Bedroom #5” area**. When finishing or modeling, confirm whether the W.I.C. (or an adjacent bay) is schedule Bedroom #5 / #5 closet, or whether BR5 was removed in a plan revision. Do not silently drop fan wiring / window for BR5 without Owner confirmation.

---

## Bath naming reconciliation

Three documents use different names for the same two rooms:

| Physical room (sheet 7) | Specs plumbing name | UL finish schedule name | Stall |
|-------------------------|---------------------|-------------------------|-------|
| **J&J** between BR2 & BR3 (V72, 5′ tub/shower) | **Shared / Bath #3** | **Bath Room #4** (schedule says 5′ stall) | **5′ fiberglass tub & shower**, smooth white walls |
| **Hall bath** by BR4 (V36, 36×48 shower) | **Bath #4** | **Bath Room #3** (schedule says 4′ stall) | **4′ fiberglass shower** (+ glass door per specs) |

**Fixture / door authority = Specs** (signed proposal). Use plan geometry for placement; map finishes as:

- **J&J = Specs Shared/Bath #3** — dual sinks, 5′ tub/shower, **no** Alumax shower door (N/A on Bath #3 in shower-door section — matches tub/shower).  
- **Hall bath = Specs Bath #4** — sink(s), 4′ stall, **4′ Alumax 350 Deluxe semi-frameless bi-pass sliding door in black**.

UL schedule stall sizes track the **physical** stalls but **swap the Bath #3 / #4 labels** relative to Specs. Prefer Specs names in plumbing notes; prefer sheet labels (J&J / Bath #3) in plan talk.

### Plumbing fixtures (Specs)

**Shared / Bath #3 (J&J)**

- Faucets (2): Delta **567LF-PP** chrome  
- Sinks (2): undermount rectangular (granite supplier)  
- Stool: PF1400TWH tank + PF5112WHM round bowl + PFTSWEC1000WH seat (white)  
- Tub/shower: **5′ fiberglass tub & shower**, smooth white walls  
- Valve: Delta **T14467-PP**

**Bath #4 (hall)**

- Faucet(s): Delta **567LF-PP** chrome  
- Sink(s): undermount rectangular (granite supplier)  
- Stool: same PF round set as above  
- Shower: **4′ fiberglass shower stall**, smooth white walls  
- Valve: Delta **T14267-PP**  
- Door: **4′ Alumax 350** black semi-frameless bi-pass  

**Mirrors:** Bath #3 & #4 vanities — ¼″ clear glass, no frame.  
**Accessories:** each bath — 1 tissue holder + 1 towel bar (allowance).  
**Exhaust:** AE 80 cfm fans; baths included in the six exhaust locations.

### Cabinetry / counters (Specs)

Both upstairs baths + laundry:

- **3 cm quartz** standard edge  
- **4″ quartz backsplash**  
- Paint-grade **shaker** doors, melamine drawers/shelves, soft-close, ½″ overlay  
- Bath bowls: white rectangle undermount china (granite supplier)  
- Laundry: stainless undermount sink (granite supplier) + **36″ uppers** + **4¼″ shaker crown**

---

## Laundry

- Floor: **tile** (denshield under — specs).  
- Sink: **22×24½″ stainless undermount**; faucet Moen pullout **7585** chrome.  
- Single-lever **washer box** in Laundry (also one in Master Closet on main).  
- Owner-supplied washer/dryer (specs: “All washer and dryers by owner”); electrical provides **2 washer** circuits and **220 V for (2) dryers** house-wide.  
- Plan: side-by-side W/D, folding counter, rod & shelf.

---

## Bedrooms #2–#5

| Topic | Spec |
|-------|------|
| Floor | Carpet + pad (allowance $19/sf mat+tax; 6 lb / 7⁄16″ pad) |
| Ceiling | Light **textured** (smooth only at Family/entry/steps) |
| Trim (specs catch-all) | “All other rooms” → **MDF #473 2¼″ casing** + **#L433 3¼″ base**, painted — matches UL bedrooms |
| Closets | Wood rod & shelf; 1×4 MDF + particle board shelving; poles; Shoot-N-Go-White |
| Ceiling fans | **Wired only** in BR #2, #3, #4, #5 (and master on main) — fans themselves not listed as furnished |
| Door hardware | Kwikset Halifax levers **black**, rectangle rose; privacy on bedrooms & baths |
| Interior doors | Mercer (Madison) 1-panel hollow core, painted; heights/widths **per print** (common **2868**, closets **2468**, some **2668** / pocket) |

### Windows (Specs schedule — upper)

| Location | Size / type | Notes |
|----------|-------------|-------|
| Upper Entry | 58×59 Picture | Fixed |
| Bedroom #2 | 58×59 2-wide | of |
| Bedroom #3 | 29×47 (×2) | f / o · GBG |
| Bedroom #4 | 58×59 2-wide | o |
| Bedroom #5 | 29×47 | o |
| Stairwell (house) | 71×47 Picture; 71×108 Picture | Fixed (upper stair volume) |

Plan also shows large **108×53 FXD** at the open-to-below / loft north wall.

---

## Family Room / Loft + upper entry + steps

| Topic | Spec / schedule |
|-------|-----------------|
| Vault | **Box vault** with **3 Pine beams** (specs); schedule “DRYWALL BEAMS”; plan **8×8 WOOD BEAMS** |
| Ceiling finish | **Smooth** (Family, upper entry, steps). All other 2nd-floor ceilings **light textured**. |
| Floor | Loft / Family: **carpet**. Upper entry: **wood** (same Silvian / Luonto engineered program as main wood rooms — entry is on the wood list conceptually via “Entry”; confirm upper landing vs main). Steps: **carpet**, California tuck, wood open end caps. |
| Trim | Specs put **upper hall**, **family room**, and **steps** in the premium set: **#412 3½″ casing** + **#512 5″ base**, painted. UL schedule marks Family / Entry / Steps premium; Hall #2 as standard (#L433 / #473) — **prefer Specs for upper hall** if they conflict. |
| Insulation | Vault ceilings **R-38 batt**; attic **R-38 blow**; cold floor / joist ends as specs table. |

Rail at open-to-below: continuous with stair system (birch rail/newel stained; iron + wood balusters). Iron baluster allowance $1,000.

---

## Furnace / mechanical (second level)

| Item | Spec |
|------|------|
| Furnace | Lennox **93% ML193UH070XE36BK** |
| AC | Lennox up to 13.9 SEER **ML13KC1-036** |
| Humidifier | AprilAire **500M** (one of two house units) |
| Thermostat | Lennox **E40** digital (one of two) |
| Floor drain | Yes — second-floor furnace room (and basement) |
| Plan | Furnace with drain pan in dedicated unfinished room |

House also has main/basement furnace **ML193UH090XE48CK** + matching larger AC — not upstairs equipment.

---

## Finishes cheat sheet (upper)

| Finish | Where upstairs |
|--------|----------------|
| **Carpet** | Family/Loft, Hall #2, BR2–5 (+ closets), Steps |
| **Tile** | Bath #3 (schedule), Bath #4 (schedule), Laundry — denshield under |
| **Wood** | Upper Entry (schedule) |
| **Unfinished** | Furnace room floor/walls |
| **Smooth ceiling** | Family/Loft, Entry, Steps |
| **Textured ceiling** | Everything else on 2nd floor |
| **1″ chamfer** corners | Throughout schedule |
| **Paint** | Walls: primer + 2 coats Cashmere flat; textured ceilings Shoot-N-Go-White; trim/doors painted per designer |

**Not on upstairs:** master suite, kitchen, powder (#2), great-room fireplace, barn doors, exercise carpet tile (basement).

---

## Electrical / low-voltage (upper-relevant)

- Decorator switches; standard plugs light white.  
- Ceiling-fan boxes: BR2–5 (+ master).  
- Recessed cans: **68 interior 6″** house-wide per electrical plan (white baffles included).  
- Exhaust fans: baths as above.  
- Cat5e / RG6 / punch-down panel house-wide (allowances).  
- Lighting fixture allowance **$5,000** (fixtures + bulbs + tax) — designer selects.

---

## Structural notes from sheet 7 (modeling)

- Many bays: **2×6 rafters & CJs @ 24″ o.c.**  
- **Concealed girder truss per manuf.** across hall / mid-span.  
- Headers: e.g. **(2) 1¾″ × 11⅞″ LVL** at large openings / open-to-below.  
- Specs joists: **2×8 or 2×6 SPF/Hem-Fir @ 24″ o.c.**; trusses at builder discretion.  
- Floor structure below: **11⅞″ I-joist @ 16″ o.c.** (house floors).  
- Exterior dimensions to face of sheathing; interior to framing edge (sheet notes).

---

## Allowances that touch upstairs

| Allowance | Amount / rate |
|-----------|----------------|
| Carpet + pad | $19.00 / sf mat+tax |
| Tile | $6.00 / sf mat+tax |
| Granite/quartz | $19,000 included (designer) |
| Cabinets | $31,372 mat+install (whole house) |
| Electrical fixtures | $5,000 |
| Plumbing fixtures | $5,941 |
| Bath hardware | $500 |
| Door hardware | $1,500 |
| Cabinet hardware | $700 |
| Iron balusters | $1,000 |
| Phone/cable/Wi-Fi | $1,600 |

---

## Modeling checklist (vdesign)

Current `upstairs` areas: Bedroom #2, J&J Bath, Bedroom #3, Bedroom #4, Bath #3, Hall, Laundry, W.I.C., Loft, Open to Below, Stairs — **items empty**; walls already drawn.

When fitting out:

1. Resolve **Bedroom #5 vs W.I.C.** against sheet 7 labels before adding furniture.  
2. Map **J&J → Specs Bath #3** fixtures; **hall Bath #3 → Specs Bath #4** fixtures/door.  
3. Floors: carpet vs tile vs unfinished per table above.  
4. Ceilings: smooth only loft/entry/steps; textured elsewhere; show **3 pine/8×8 beams** in loft vault.  
5. Laundry quartz run + stainless sink + W/D placeholders (owner appliances).  
6. Fan boxes in bedrooms (no fan fixture unless selected).  
7. Furnace room unfinished + floor drain.  
8. Do not pull master-bath / kitchen specs onto this level.  
9. Keep Reload item count sane — prefer consolidated procedurals over per-picket boxes (see `.cursor/rules/reload-latency.mdc`).

---

## Quick “do not confuse”

| Wrong | Right |
|-------|--------|
| Master is upstairs | Master is **main** level |
| Specs Bath #3 = hall bath | Specs Bath #3 = **J&J** (5′ tub/shower) |
| UL schedule Bath #3 label for fixtures | Use **Specs** for fixtures; schedule for finishes + stall size on the labeled row |
| Smooth ceilings everywhere upstairs | Only Family/Loft, Entry, Steps |
| Premium trim in every upper bedroom | Premium: Family, Entry, Steps (+ Specs upper hall); bedrooms use **#473 / #L433** |
| Washer/dryer furnished | **Owner-supplied**; hookups + circuits only |

---

## Related

- Main-level finishes: `ML 2713 S 224 Street pdf.xls.pdf`  
- Exterior / deck: `contract/BACKYARD-DESIGN-BRIEF.md`  
- Parallel plan agents: `.cursor/rules/parallel-item-adds.mdc` (`levelId: 'upstairs'`)
