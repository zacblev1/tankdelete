---
phase: 04-game-polish
plan: 01
subsystem: game-feedback
tags: [scoring, achievements, particles, gamification, ui]

dependency_graph:
  requires:
    - react-hot-toast (package)
    - THREE.InstancedMesh API
    - Particles.tsx pattern (pre-allocated objects)
  provides:
    - useScore hook (score state management)
    - ScoreCounter component (animated display)
    - achievements.ts (Tron-themed milestone definitions)
    - useAchievements hook (toast triggering)
    - AchievementToast component (custom toast UI)
    - useExplosionPool hook (explosion lifecycle)
    - ExplosionParticles component (voxel shatter system)
  affects:
    - App.tsx (wiring in Plan 02)
    - Game feedback loop (polish layer)

tech_stack:
  added:
    - react-hot-toast custom toast API
    - requestAnimationFrame for score animation
    - InstancedMesh particle pooling (explosions)
  patterns:
    - Pre-allocated Vector3/Matrix4 objects in useFrame (GC optimization)
    - Session-scoped state management (score never resets)
    - Staggered toast queueing (2-second spacing for simultaneous achievements)
    - Scale-based particle spawning (20-500 particles per file)

key_files:
  created:
    - src/hooks/useScore.ts (score state, 1 point per MB freed)
    - src/components/HUD/ScoreCounter.tsx (rAF animated counter)
    - src/components/HUD/ScoreCounter.css (Tron styling, top-right fixed)
    - src/lib/achievements.ts (3 achievements: Derezzer, Grid Cleaner, System Purge)
    - src/hooks/useAchievements.ts (threshold detection, toast triggering)
    - src/components/HUD/AchievementToast.tsx (trophy icon, slide-in animation)
    - src/components/HUD/AchievementToast.css (neon glow, cubic-bezier animation)
    - src/hooks/useExplosionPool.ts (spawn/despawn lifecycle, cleanup on unmount)
    - src/components/Scene/ExplosionParticles.tsx (2000 particle budget, voxel cubes)
  modified: []

decisions:
  - "Session-scoped scoring: Score never resets during gameplay, tracks lifetime progress"
  - "ScoreCounter animation: 2ms per point (max 1 second) with ease-out cubic for smooth transitions"
  - "Three Tron-themed achievements: Derezzer (100MB), Grid Cleaner (1GB), System Purge (10GB)"
  - "Staggered toast queueing: 2-second spacing prevents simultaneous achievement overlaps"
  - "Scale-based particle spawning: 20 particles (tiny files) to 500 particles (huge files)"
  - "Max 2000 particle budget: Enforced across all simultaneous explosions for performance"
  - "Half-gravity particle physics: 4.9 m/s² (instead of 9.8) for floaty digital feel"
  - "1-1.5 second particle lifetime: Randomized for organic dissolve effect"
  - "Explosion completion detection: 2.5 second timeout + no active particles check"

metrics:
  duration_minutes: 2
  tasks_completed: 2
  files_created: 9
  files_modified: 0
  commits: 2
  completed_at: "2026-02-16T19:53:35Z"
---

# Phase 04 Plan 01: Game Polish Artifacts Summary

**One-liner:** Created scoring system with animated counter, Tron-themed achievement toasts, and voxel shatter explosion particles using InstancedMesh pooling.

## Objective Achievement

Successfully created all 7 scoring/achievement files and 2 explosion particle files as standalone artifacts. No existing files modified - all wiring deferred to Plan 02 per design.

**Output:**
- 3 hooks: useScore, useAchievements, useExplosionPool
- 3 UI components with CSS: ScoreCounter, AchievementToast (with react-hot-toast integration)
- 1 data module: achievements.ts (3 Tron-themed milestones)
- 1 particle system: ExplosionParticles (InstancedMesh with 2000 particle budget)

## Tasks Executed

### Task 1: Create score hook, score counter component, and achievement system

**Status:** Complete
**Commit:** 28fe7d1
**Files:** 7 created

**Implementation:**
- `useScore`: Session-scoped state with score and totalBytesFreed tracking. `addPoints(bytesFreed)` calculates points via `Math.floor(bytesFreed / (1024 * 1024))` (1 point per MB).
- `ScoreCounter`: requestAnimationFrame-based animation with ease-out cubic easing. Duration scales with score change (2ms per point, max 1 second). Uses `font-variant-numeric: tabular-nums` to prevent layout shift.
- `ScoreCounter.css`: Fixed top-right positioning, dark translucent background, cyan neon border with multi-layer box-shadow glow, matching existing HUD styling at z-index 1000.
- `achievements.ts`: Defines `Achievement` interface and exports `ACHIEVEMENTS` array with exactly 3 Tron-themed entries matching user specification.
- `useAchievements`: Watches totalBytesFreed, triggers `toast.custom()` with `createElement(AchievementToast)` when thresholds crossed. Queues simultaneous achievements with 2-second staggered timing.
- `AchievementToast`: Trophy emoji with cyan drop-shadow, "ACHIEVEMENT UNLOCKED" label, achievement name. Slide-in animation via `visible` prop toggling CSS class.
- `AchievementToast.css`: Dark Tron background, cyan border with triple-layer neon glow, cubic-bezier(0.16, 1, 0.3, 1) slide-in animation.

**Verification:** All 7 files compile with `npx tsc --noEmit`. Imports resolve correctly (useAchievements → achievements.ts).

**Deviations:** Initial TypeScript error with JSX in `.ts` file → fixed by using `createElement()` from React instead of JSX syntax (Rule 1 - Bug fix).

### Task 2: Create explosion particle system with InstancedMesh pooling

**Status:** Complete
**Commit:** 55d689c
**Files:** 2 created

**Implementation:**
- `useExplosionPool`: Manages `Explosion[]` state with id tracking via `useRef` counter (avoids re-render). `spawn()` clones position, stores color/scale/spawnTime. `despawn(id)` filters array. Cleanup useEffect clears explosions on unmount.
- `ExplosionParticles`: Single InstancedMesh with 2000 max particles. Pre-allocated particle data array (active, explosionId, position, velocity, color, baseScale, life, maxLife). Pre-allocated temp objects (tempMatrix, tempPosition, tempQuaternion, tempScale) following Particles.tsx pattern.
- **useFrame logic:**
  - Spawn particles on explosion's first frame: count scales with file scale (20-500 range)
  - Random scatter velocity: outward in XZ plane (angle 0-2π, speed 2-5), upward bias (0.5-2.0)
  - Update loop: apply half-gravity (4.9 m/s²), advance position by velocity, advance life
  - Fade scale: `baseScale * (1 - life/maxLife)` for dissolve effect
  - Completion check: explosion age > 2.5s and no active particles → call onExplosionComplete
  - Mark instanceMatrix and instanceColor needsUpdate
- **Material:** meshStandardMaterial with vertexColors, emissive white (0.5 intensity), toneMapped false for bloom
- **Color initialization:** useEffect sets all instance colors on mount, triggers needsUpdate

**Verification:** Both files compile. ExplosionParticles follows same InstancedMesh pattern as existing Particles.tsx (useFrame with pre-allocated objects, instanceMatrix.needsUpdate).

**Deviations:** None - executed exactly as planned.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript JSX compilation error in useAchievements.ts**
- **Found during:** Task 1 verification
- **Issue:** JSX syntax `<AchievementToast ... />` not supported in `.ts` file (only `.tsx`), causing TypeScript parsing errors
- **Fix:** Changed to `createElement(AchievementToast, { achievement, visible })` to avoid JSX syntax while maintaining functionality
- **Files modified:** src/hooks/useAchievements.ts
- **Commit:** Included in Task 1 commit (28fe7d1)

## Success Criteria Verification

✅ **useScore.addPoints(524288000) returns 500:** Calculation is `Math.floor(524288000 / (1024 * 1024)) = 500` points (500MB)

✅ **ScoreCounter animates between values with rAF:** Implemented with requestAnimationFrame, ease-out cubic easing, duration scaling (2ms per point, max 1s)

✅ **ACHIEVEMENTS array has exactly 3 entries:**
- Derezzer (100MB = 100 * 1024 * 1024)
- Grid Cleaner (1GB = 1024 * 1024 * 1024)
- System Purge (10GB = 10 * 1024 * 1024 * 1024)

✅ **useAchievements triggers toast when threshold crossed:** useEffect watches totalBytesFreed, triggers `toast.custom()` with 2-second staggered timing

✅ **ExplosionParticles accepts explosions array and renders InstancedMesh with per-instance colors:** Props typed correctly, InstancedMesh with vertexColors material, setColorAt() called per particle

✅ **All files pass TypeScript compilation:** Final `npx tsc --noEmit` runs without errors

## Integration Notes for Plan 02

**Wiring requirements:**
1. App.tsx: Add `useScore()` and `useAchievements(totalBytesFreed)` hooks
2. App.tsx: Pass `score` to `<ScoreCounter targetScore={score} />`
3. App.tsx: Add `useExplosionPool()` hook
4. App.tsx: Call `explosionPool.spawn(position, color, scale)` on file deletion (before de-rez animation)
5. Scene: Render `<ExplosionParticles explosions={explosionPool.explosions} onExplosionComplete={explosionPool.despawn} />`
6. Deletion callback: Call `scoreHook.addPoints(bytesFreed)` after successful deletion

**No modifications needed to created files** - all exports are ready for integration.

## Self-Check: PASSED

**Created files verified:**
```
✓ FOUND: src/hooks/useScore.ts
✓ FOUND: src/components/HUD/ScoreCounter.tsx
✓ FOUND: src/components/HUD/ScoreCounter.css
✓ FOUND: src/lib/achievements.ts
✓ FOUND: src/hooks/useAchievements.ts
✓ FOUND: src/components/HUD/AchievementToast.tsx
✓ FOUND: src/components/HUD/AchievementToast.css
✓ FOUND: src/hooks/useExplosionPool.ts
✓ FOUND: src/components/Scene/ExplosionParticles.tsx
```

**Commits verified:**
```
✓ FOUND: 28fe7d1 (Task 1: scoring and achievement system)
✓ FOUND: 55d689c (Task 2: explosion particle system)
```

All artifacts created, all commits present, no missing files.
