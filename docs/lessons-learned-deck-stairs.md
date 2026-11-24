# Lessons learned — backyard deck stairs (do not flip)

**Project:** `2713-S-224th` · level `backyard`  
**Status:** AUTHORITATIVE Owner lock (2026-11-24)  
**Agents:** `.cursor/rules/backyard-deck-stairs.mdc` (`alwaysApply: true`) · also `contract/BACKYARD-DESIGN-BRIEF.md`

---

## AUTHORITATIVE direction (only correct answer)

| | |
|---|---|
| **Descent** | **east → west** |
| **Lot fences** | **W2 (east property) → W6 (west property)** |
| **Site** | **pool → pool house** |
| **Top tread** | **east** — larger plan `x` |
| **Bottom tread** | **west** — smaller plan `x` |

**Hard verify:** after any stair edit, `xpos`-sorted treads must satisfy `last.ypos > first.ypos` (east higher than west).

Do **not** use left/right, elevation crops, or camera facing as direction. Those flip every session.

---

## What went wrong (root cause)

1. **Elevation L→R without site anchors**  
   Rear elevation is drawn looking north (left = west). “High on left” became west-high / east-low — **opposite** of this lock — and that wrong run was saved with descriptions like `descends L→R (west→east)`, which poisoned later agents.

2. **Camera-relative language**  
   Orbit / screenshots redefine left and right. Agents “fixed” stairs to the latest picture instead of W2→W6.

3. **No verify gate**  
   Saves did not assert east tread higher than west tread.

4. **Serial agent thrash**  
   Each session rewrote the flight from a different mental model and undid the previous one.

---

## Hard rules for agents

1. Site anchors only: **east → west · W2 → W6 · pool → pool house**.
2. Before stair work: state top/bottom with those anchors in one sentence.
3. After save: prove `east.ypos > west.ypos`. If false, you flipped — undo.
4. If a screenshot or sheet 2 disagrees, **keep this lock** — do not flip.
5. Prefer edit-in-place over delete/recreate when only rails/newels change.
6. Never write item text saying west→east, L→R, or left→right for this flight.

---

## Quick verify

```bash
curl -s 'http://localhost:3000/api/plans?latest=1&slug=2713-S-224th' | node -e '
let d=""; process.stdin.on("data",c=>d+=c); process.stdin.on("end",()=>{
  const p=JSON.parse(d), t=(p.project.items||[])
    .filter(i=>/^Deck stair tread /i.test(i.item_name||""))
    .sort((a,b)=>a.xpos-b.xpos);
  const west=t[0], east=t[t.length-1];
  const ok=east.ypos>west.ypos;
  console.log({westX:west.xpos,westY:west.ypos,eastX:east.xpos,eastY:east.ypos,ok});
  if(!ok) process.exit(1);
});'
```
