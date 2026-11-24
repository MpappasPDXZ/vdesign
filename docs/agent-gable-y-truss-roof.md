# Agent how-to — standing-seam gable roof + Y-truss

Use this when coding another open-gable roof with a decorative Y-truss (chord + king post + two angled arms), like the pool-house east gable on `2713-S-224th` / `backyard`.

**Code:** `src/loaders/ProceduralLoader.ts` — `buildPoolHouseRoofGeometry` (`phroof`), `buildYTrussGeometry` (`ytruss`)  
**Reference items:** `PH standing-seam roof`, `PH gable Y-truss`

---

## 1. Two items, not one

| Role | Procedural URL | Notes |
|------|----------------|-------|
| Roof shell | `procedural:phroof:WIDTH:HEIGHT:DEPTH:HEX` | Standing-seam gable; ridge along local X |
| Gable truss | `procedural:ytruss:CHORD:ARM_LEN:THICK:HEX` | Decorative members in the **gable plane** |

Do **not** bake the truss into the roof mesh. Keep them separate so you can size/place the truss against posts and ridge without rebuilding seams.

---

## 2. `phroof` dimensions (cm)

```
procedural:phroof:WIDTH:HEIGHT:DEPTH:HEX
```

| Param | Meaning | Axis (local, rotation 0) |
|-------|---------|---------------------------|
| `WIDTH` | Ridge / building length | Local **X** (E–W on PH) |
| `HEIGHT` | Eave → ridge **rise** | Local **Y** |
| `DEPTH` | Eave-to-eave span (gable width) | Local **Z** (N–S on PH) |
| `HEX` | Panel color (e.g. `1a1a1a`) | |

**Pitch** is derived: `atan2(HEIGHT, DEPTH/2)`. Do not invent a separate pitch param.

**Placement**

- `rotation: 0` when ridge is E–W.
- `xpos/zpos` = plan center of the roof footprint.
- `ypos` = Item bbox center (after loader centering). Eave underside ≈ `ypos - halfSize.y`; ridge ≈ `ypos + halfSize.y`.

**Reference (PH):**

```text
procedural:phroof:498.34:100:405.76:1a1a1a
xpos 438.53  ypos 316.3  zpos 1005.84  rotation 0
```

---

## 3. `ytruss` members (cm)

```
procedural:ytruss:CHORD:ARM_LEN:THICK:HEX
```

| Param | Meaning |
|-------|---------|
| `CHORD` | Horizontal member length (local **X**) |
| `ARM_LEN` | Length of each **angled** arm (not vertical rise) |
| `THICK` | Member depth (~6–12); drives chord thickness too |
| `HEX` | **All** members — use white `f5f5f4` to match PH columns |

**Geometry (local, before item rotation)**

1. **Chord** — horizontal, bottom at local y≈0, span = `CHORD` along X.
2. **King post** — **one** straight post at x=0; tip height = `ARM_LEN * cos(40°)`. Bottom overlaps into the chord (~70% of chord thickness). Never add a second vertical on center (arm heels stacked on x=0 read as a broken/doubled king at the ridge).
3. **Two arms** — splayed **±40° from vertical**; heels on the **outer faces** of the king (`±0.55 * memberSize`), not at midspan x=0. Length = `ARM_LEN`.

`DEPTH` = member size cm, clamped to standard **4×4–6×6** (8.89–13.97). Chord and posts use that square section.

**Critical — bbox centering**

Item recenters every mesh on its bbox. Arms above the chord would otherwise **lift** the horizontal in world space. `buildYTrussGeometry` translates so bbox center stays on the **chord mid-height**. After that, **`ypos` = world Y of the chord center**. Do not “fix” a high chord by only raising `ypos` without checking clear width (see §5).

---

## 4. Orient the truss on the open gable

Truss local X = chord span. For an **east** open gable (chord N–S):

| Field | Value |
|-------|--------|
| `rotation` | `π/2` (maps local X → world ±Z) |
| `zpos` | Same as roof / opening centerline |
| `xpos` | Just **outside** the east post faces (gable plane) |
| `ypos` | Chord center (see §5) |

**Reference (PH east gable):**

```text
procedural:ytruss:345.76:114.54:8:f5f5f4
xpos 669.7  ypos 273.43  zpos 1005.84  rotation 1.5707963267948966
```

Posts NE/SE at `x ≈ 655.7`, outer east face ≈ `663.7` → truss `xpos ≈ 669.7`.

---

## 5. Fit truss to roof (do this math every time)

Measure from the **live** roof item when possible (`halfSize.y`, `position.y`):

```text
eaveY  ≈ roof.ypos - roof.halfSize.y
ridgeY ≈ roof.ypos + roof.halfSize.y
rise   ≈ ridgeY - eaveY          // should ≈ phroof HEIGHT
```

### Chord length

- Prefer **post outer-to-outer** (or island/opening depth), with a small inset (~4–8 cm each side).
- PH: column outer span `353.76` → chord `345.76`.
- At height fraction `f` above eave (`f = (chordTop - eaveY) / rise`), roof clear width ≈ `DEPTH * (1 - f)`.
- **If chord > clear width at that height, ends punch through the roof slopes.** Shorten chord or lower the chord — do not keep raising.

### Chord height (`ypos`)

- Target: chord near **plate / eave** (on or just above post tops), **not** mid-attic.
- `ypos` = chord mid-Y ≈ `eaveY + small_gap + chordH/2` (chordH ≈ 7 cm for thick 8).
- Raising the chord to “meet the roof line” while keeping a full-span chord is what caused poke-through. Fix with fit math, not eyeballing from a 3/4 camera.

### Arm length

```text
chordTop = ypos + chordH/2
armLen   = (ridgeY - tipMargin - chordTop) / cos(40°)
```

`tipMargin` ≈ 3–8 cm so tips sit **under** the ridge, not through the peak.

King post height is derived in the loader (`armLen * cos(40°)`); you only pass `ARM_LEN`.

---

## 6. Color

- Roof panels: dark metal (`1a1a1a`).
- **All** truss members (chord + king + both arms): white `f5f5f4` (same as PH columns). Set via the URL hex; default in loader is already white.

---

## 7. Save / reload (required)

Same as all plan agents — see `.cursor/rules/parallel-item-adds.mdc`:

1. `GET /api/plans?latest=1&slug=…` → note `mtimeMs`, `levelId`.
2. Edit **only** roof/truss (and posts if you own them); do not clobber peers.
3. `POST /api/plans` with `baseMtimeMs`, `levelId`, `merge: true`.
4. Browser: **Load latest** / Reload → **3D**. Verify: no slope punch-through, tips under ridge, chord on posts, white members.

Changing `model_url` dims/hex forces a new procedural mesh on reload. Moving `ypos` with a matching `baseMtimeMs` write replaces in place.

---

## 8. Recipe checklist (copy for a new building)

```text
[ ] Posts placed; note outer span + east/west face X (or N/S for other gables)
[ ] phroof WIDTH/HEIGHT/DEPTH from footprint + desired rise
[ ] Place phroof; read eaveY / ridgeY from item halfSize
[ ] ytruss CHORD = post outer span − inset
[ ] ytruss ypos = plate/eave chord mid (not mid-attic)
[ ] ytruss ARM_LEN from (ridge − margin − chordTop) / cos(40°)
[ ] rotation so chord lies in the open gable plane
[ ] xpos/zpos on the gable face, centered on opening
[ ] HEX f5f5f4 for truss; dark hex for roof
[ ] POST merge API → Reload → 3D verify
```

---

## 9. Anti-patterns (do not repeat)

| Bad | Why | Do instead |
|-----|-----|------------|
| Raise `ypos` until the chord “looks” on the roof line | Full-width chord mid-attic punches through slopes | Plate-level chord + armLen from ridge math |
| Arms pivoted at mid-member (X through chord) | Looks wrong; sticks below chord | Pivot on chord **top** only |
| Arm length = vertical rise | Arms overshoot sideways/up | `ARM_LEN` is member length; rise = `ARM_LEN * cos(40°)` |
| Brown truss on white columns | Owner wants white members | `f5f5f4` |
| One mesh for roof + truss | Untunable; reload-heavy | Separate `phroof` + `ytruss` |
| `writeFile` on `plans/*.json` | Clobbers parallel agents | `POST /api/plans` merge |
| Trusting camera L/R for gable “front” | Orbit lies | Anchor to posts + roof centerline |

---

## 10. PH worked numbers (sanity check)

| Piece | Value |
|-------|--------|
| Roof | `phroof:498.34:100:405.76:1a1a1a` @ `(438.53, 316.3, 1005.84)` rot 0 |
| Eave / ridge (approx) | ~263 / ~370 |
| Posts NE–SE outer | 353.76 cm N–S |
| Truss | `ytruss:345.76:114.54:8:f5f5f4` @ `(669.7, 273.43, 1005.84)` rot π/2 |
| Arms | ±40° from vertical; king = `114.54 * cos(40°)` |
