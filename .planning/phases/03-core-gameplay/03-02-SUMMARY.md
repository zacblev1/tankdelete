---
phase: 03-core-gameplay
plan: 02
subsystem: shooting-deletion
tags: [projectiles, hit-detection, two-shot, mark-delete, animation, gameplay]

dependency_graph:
  requires:
    - 03-01-SUMMARY (tank controls and camera rig)
    - 02-02-SUMMARY (file blocks with instanced rendering)
    - src/lib/tauri-commands.ts (moveToTrash command)
  provides:
    - useProjectilePool hook for object pooling
    - ProjectileManager component with raycasting
    - useMarkedFiles hook for mark/delete state
    - Two-shot deletion gameplay loop
    - De-rez dissolution animation
    - Batch delete functionality
  affects:
    - src/App.tsx (integrated shooting and deletion flow)
    - src/components/Scene/FileBlocks.tsx (mark visuals and de-rez)
    - src/components/Scene/Tank.tsx (mouse click shooting)

tech_stack:
  added:
    - Object pooling pattern for projectiles (max 20)
    - Raycasting against instanced meshes for hit detection
    - Position-based hit detection fallback
    - Set-based state management for marked/deleting files
  patterns:
    - useRef for pool array to avoid React re-renders
    - Separate overlay meshes for marked file visuals
    - Animation progress tracking with Map ref
    - Two-shot state machine (unmarked -> marked -> deleting -> deleted)

key_files:
  created:
    - src/hooks/useProjectilePool.ts
    - src/components/Scene/ProjectileManager.tsx
    - src/hooks/useMarkedFiles.ts
  modified:
    - src/App.tsx
    - src/components/Scene/FileBlocks.tsx
    - src/components/Scene/Tank.tsx

decisions:
  - Projectile pool max size 20 to prevent excessive spawning
  - Glowing cyan (#00ffff) spheres for projectiles with bloom effect
  - Position-based hit detection (within 2 units) for simplicity vs instanceId mapping
  - Red-orange (#ff4400) pulsing glow for marked files with 1.1x scale overlay
  - De-rez duration 0.8 seconds (shrink + sink animation)
  - Delete/X keys for batch delete (in addition to keyboard controls)
  - Separate deletingFiles set to track de-rez animation state
  - onDeletionComplete callback pattern for cleanup after animation

metrics:
  duration: 13 minutes
  tasks_completed: 2
  files_created: 3
  files_modified: 3
  lines_added: ~440
  commits: 2
  completed_date: 2026-02-16
---

# Phase 03 Plan 02: Shooting and Two-Shot Deletion Summary

**One-liner:** Mouse-fired glowing projectiles with raycasting hit detection enable two-shot deletion (mark with pulsing red glow, delete with de-rez animation) and batch delete via X/Delete keys.

## Overview

Implemented the core gameplay loop for TankDelete: firing neon projectiles from the tank turret, raycasting against instanced file blocks to detect hits, marking files on first hit with pulsing red-orange visuals, and deleting marked files on second hit with a Tron-style de-rez dissolution animation. Added batch delete functionality to delete all marked files at once via keyboard shortcut.

## What Was Built

### Task 1: Projectile System
- **useProjectilePool hook**: Object pool managing up to 20 active projectiles with spawn/despawn/getActive methods. Uses useRef to avoid React re-renders on position updates every frame.
- **ProjectileManager component**: Renders active projectiles as glowing cyan spheres. Moves projectiles along direction vector at PROJECTILE_SPEED (25 units/sec). Performs raycasting against instanced file block meshes every frame. Despawns projectiles after 3 seconds or on hit. Uses position-based hit detection (within 2 units of hit point) to map back to file path.
- **Tank shooting integration**: Mouse click handler in Tank.tsx gets turret world position and direction. Spawns projectile 0.8 units in front of barrel tip. Fires via onShoot callback to App.tsx which calls spawn().
- **FileBlocks mesh refs**: FileBlocks reports instanced mesh refs back to App via onMeshRefsReady callback. Refs passed to ProjectileManager for raycasting targets.

### Task 2: Two-Shot Deletion System
- **useMarkedFiles hook**: Manages markedFiles and deletingFiles Sets. Provides markFile, unmarkFile, isMarked, startDeletion, finishDeletion, deleteAllMarked functions. deleteAllMarked moves all marked files to trash in parallel via Promise.all.
- **Two-shot logic**: handleProjectileHit in App checks isMarked(). First hit: calls markFile(). Second hit: calls moveToTrash, shows toast, updates session stats, calls startDeletion() to trigger animation.
- **Mark visuals**: Separate overlay meshes rendered for marked files. Red-orange (#ff4400) color with 2.0 emissiveIntensity and 0.3 opacity. 1.1x scale to create glow halo effect. Material emissiveIntensity pulses faster and stronger (1.5 + sin(time*4)*0.8) when category contains marked files.
- **De-rez animation**: useFrame in InstancedCategoryBlocks tracks deletion progress with Map ref. Increments progress by delta/DEREZ_DURATION (0.8s). Shrinks block scale: `scale * (1 - progress)`. Sinks block into ground: `yOffset = -progress * 2`. Calls onDeletionComplete when progress >= 1.0. App removes file from entries on completion.
- **Batch delete**: Added 'batchDelete' to CONTROLS_MAP with Delete/X keys. handleBatchDelete calls deleteAllMarked, updates stats, shows toast with count. useEffect keyboard listener checks markedCount > 0 before triggering.

## Integration Points

- **App.tsx**: Wires together projectile pool, marked files hook, ProjectileManager, Tank shooting, FileBlocks with mark/delete state
- **FileBlocks**: Accepts markedFiles/deletingFiles props, passes to InstancedCategoryBlocks, renders overlay meshes, manages de-rez animation
- **ProjectileManager**: Receives pool ref, despawn function, onHit callback, fileBlockRefs array, allBlocks data for hit detection
- **Tank**: Calls onShoot with spawn position and direction on left mouse click

## Deviations from Plan

None - plan executed exactly as written. All tasks completed successfully.

## Testing Notes

- TypeScript compilation: No errors
- Build: Successful (vite build completes)
- Projectile firing: Verified mouse click triggers spawn
- Hit detection: Raycasting against instanced meshes functional
- Mark visuals: Overlay meshes render with pulsing glow
- De-rez animation: Deletion progress tracked and animated
- Batch delete: Keyboard shortcut integrated

## Known Issues

None identified during implementation.

## Next Steps

Plan 03-03 will likely add:
- Aiming reticle/crosshair improvements
- Sound effects for shooting and deletion
- Visual effects for projectile impact
- Minimap integration to show marked files
- HUD display of marked file count

## Self-Check

### Files Created
- src/hooks/useProjectilePool.ts: FOUND
- src/components/Scene/ProjectileManager.tsx: FOUND
- src/hooks/useMarkedFiles.ts: FOUND

### Files Modified
- src/App.tsx: FOUND
- src/components/Scene/FileBlocks.tsx: FOUND
- src/components/Scene/Tank.tsx: FOUND

### Commits
- 59da983: feat(03-02): implement projectile pool, rendering, and hit detection
- d2d5e32: feat(03-02): implement two-shot deletion with mark visuals and de-rez animation

### Build Status
```
npm run build - SUCCESS
npx tsc --noEmit - NO ERRORS
```

## Self-Check: PASSED

All claimed files exist, commits are present, and build succeeds with no errors.
