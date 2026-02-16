# Roadmap: TankDelete

## Overview

TankDelete transforms from concept to playable game across four phases. Phase 1 establishes the foundation (Tauri app with safety infrastructure), Phase 2 renders files as 3D objects with Tron visuals and performance architecture, Phase 3 adds tank mechanics and the core deletion loop, and Phase 4 polishes with scoring and game feel. Each phase delivers a complete capability that can be validated independently.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation & Safety** - Tauri app scaffold with filesystem access and trash system (completed 2026-02-16)
- [ ] **Phase 2: 3D Visualization** - Files and folders rendered as Tron-themed 3D objects
- [ ] **Phase 3: Core Gameplay** - Tank movement, shooting, and two-shot deletion system
- [ ] **Phase 4: Game Polish** - Scoring, achievements, and visual/audio feedback

## Phase Details

### Phase 1: Foundation & Safety
**Goal**: Users can safely select a directory and launch the app with filesystem access established
**Depends on**: Nothing (first phase)
**Requirements**: ENGN-01, DELT-02, DELT-04
**Success Criteria** (what must be TRUE):
  1. User can launch the Tauri app and see a file picker dialog
  2. User can select a starting directory which the app can read
  3. Files moved to recycle bin can be restored (trash integration works)
  4. User can undo the last deletion with Ctrl+Z
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Tauri scaffold + directory picker + filesystem scanning
- [ ] 01-02-PLAN.md — Trash system + undo stack + HUD overlay

### Phase 2: 3D Visualization
**Goal**: Users can see their files and folders as 3D objects in a Tron-themed neon grid environment
**Depends on**: Phase 1
**Requirements**: VIZL-01, VIZL-02, VIZL-03, VIZL-04, VIZL-05, VIZL-06, ENGN-05, ENGN-06
**Success Criteria** (what must be TRUE):
  1. User sees files as glowing geometric blocks on a dark neon grid
  2. Block size scales proportionally to file size (larger files = larger blocks)
  3. Block colors vary by file type/extension
  4. Folders appear as distinct portal/gate structures
  5. Scene maintains 60 FPS with 500+ file objects visible
  6. User can hover over a block and see tooltip with filename, size, and last modified date
  7. Camera follows a fixed position in third-person view (no movement yet)
  8. Tron aesthetic visible: neon grid floor, glowing wireframe edges, bloom post-processing
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Install 3D deps, scene infrastructure (Canvas, Grid, Bloom), utility modules (scale, colors, geometries, layout)
- [ ] 02-02-PLAN.md — Instanced file blocks, folder portals, hover tooltips, App.tsx integration, visual verification

### Phase 3: Core Gameplay
**Goal**: Users can drive the tank, shoot files to mark them, and execute two-shot deletions
**Depends on**: Phase 2
**Requirements**: ENGN-02, ENGN-03, ENGN-04, NAVG-01, NAVG-02, NAVG-03, DELT-01, DELT-03, DELT-05
**Success Criteria** (what must be TRUE):
  1. User can move tank with WASD keys on the grid
  2. User can aim turret with mouse movement
  3. User can fire projectile by clicking mouse button
  4. User can drive through a folder portal to enter that directory (scene reloads)
  5. User can navigate back to parent directory via back portal
  6. Minimap displays current directory layout with player position
  7. First shot on a file marks it (visual highlight indicates marked state)
  8. Second shot on a marked file sends it to OS recycle bin
  9. Deleted file block plays destruction animation and disappears
  10. User can mark multiple files, then delete all marked files at once (batch mode)
  11. Third-person camera follows behind and above the tank smoothly during movement
**Plans**: TBD

Plans:
- [ ] TBD

### Phase 4: Game Polish
**Goal**: Users experience satisfying visual/audio feedback and gamification that makes deletion feel fun
**Depends on**: Phase 3
**Requirements**: GAME-01, GAME-02, GAME-03, GAME-04, GAME-05
**Success Criteria** (what must be TRUE):
  1. User earns points based on MB freed when deleting files (visible in HUD)
  2. Score display is visible and updates in real-time during gameplay
  3. Particle explosion plays on file deletion, scaled proportionally to file size
  4. User can view achievement notifications when milestones are earned (e.g., "Freed 1GB")
  5. Achievement system tracks progress across multiple categories (MB freed, files deleted, accuracy)
**Plans**: TBD

Plans:
- [ ] TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Safety | 0/2 | Complete    | 2026-02-16 |
| 2. 3D Visualization | 0/TBD | Not started | - |
| 3. Core Gameplay | 0/TBD | Not started | - |
| 4. Game Polish | 0/TBD | Not started | - |
