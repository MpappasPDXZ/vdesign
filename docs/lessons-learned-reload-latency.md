# Lessons learned — Reload latency (60s+ → sub-second path)

**Date:** 2026-11-24  
**Symptom:** Reload made the app unusable (~1 minute). Agents kept waiting on refresh.

## What was actually slow

API fetch was fine (~50ms, ~400KB). The stall was **client-side after JSON arrived**:

| Cause | Effect |
|-------|--------|
| ~258 stair/Omarail items as individual `procedural:box` pickets/segments | Main-thread mesh build × hundreds on every Reload |
| `persistPlanNow` after items went idle (including Reload) | Full `exportSerialized` + **top-down WebGL thumbnail** + IndexedDB write |
| `setItemsLoading` on every item start/end | Hundreds of React re-renders |
| Sync `ProceduralLoader` → load counter returns to 0 after each item | Idle handler ran repeatedly without debounce |
| `await blueprintStorage.upsert(...)` on Reload | Large IDB write blocked the apply path |

## Fixes shipped

1. Consolidated rails → `procedural:guardrun` / `procedural:rakeguard` (backyard items ~414 → ~163).
2. Reload / level-apply sets `suppressPersistAfterLoadRef` — **no** thumbnail/`persistPlanNow` after Reload (recovery snapshot only).
3. Debounced items-idle settle; batched `itemsLoading` React updates.
4. IndexedDB upsert on Reload is **background** (not awaited).
5. Console profile: `[vdesign reload profile]` / `window.__vdesignReloadProfile`.

## Agent rule

See `.cursor/rules/reload-latency.mdc` (`alwaysApply`). **Do not** rebuild railings as one box per picket.
