# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** Deleting unwanted files feels fun and satisfying, not tedious — turning filesystem cleanup into a game.
**Current focus:** Phase 3: Core Gameplay

## Current Position

Phase: 3 of 4 (Core Gameplay)
Plan: 1 of 3 in current phase (COMPLETE)
Status: Active - Plan 03-01 complete
Last activity: 2026-02-16 — Completed plan 03-01 (Drivable Tank with Camera Controls)

Progress: [█████░░░░░] 56%

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 5 min
- Total execution time: 0.6 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 2 | 14 min | 7 min |
| 02 | 2 | 6 min | 3 min |
| 03 | 1 | 3 min | 3 min |

**Recent Trend:**
- Last 5 plans: 5 min avg
- Trend: Steady - maintaining efficient 3-minute execution for recent plans

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Tron visual style: User's stated preference — neon grid, glowing wireframes
- Two-shot delete system: Balances game feel with safety — no confirmation dialogs
- WASD + mouse controls: Classic FPS-style controls, intuitive for gamers
- File picker on launch: User picks which directory to explore, no auto-scanning
- Browser-based: No installation required, accessible

**Plan 01-01 Decisions:**
- Use Bun as package manager: Faster than npm/yarn, modern tooling
- Window starts maximized (not fullscreen): Allows menubar access while maximizing viewport
- Spawn blocking for walkdir traversal: Avoid blocking async runtime with heavy I/O
- Emit scan progress every 100 files: Balance between UI responsiveness and event overhead

**Plan 02-01 Decisions:**
- Four file categories with distinct neon colors: media (cyan), code (green), archive (orange), other (magenta)
- Logarithmic scale mapping from 1KB-1GB to 0.4-2.5 units for file block sizing
- R3F primitive pattern for InfiniteGridHelper integration (TypeScript compatibility)
- Grid layout with folders in front rows, files sorted by category then size descending
- Bloom intensity 2.0 for strong glow halos on neon elements

**Plan 02-02 Decisions:**
- Instanced rendering with merged wireframe geometries for optimal performance (1 draw call per category instead of 500+)
- Folder portals as glowing archway structures with size scaling by folder contents
- Distinct green back portal for parent directory navigation
- Floating Text labels above each block with color-matched glow
- Category-based uniform bob animation (entire category group bobs together) to avoid per-frame geometry rebuilding
- 80 particle count for atmospheric effect (conservative for performance)
- Hover tooltip using drei Html component with Tron-styled dark background and cyan border

**Plan 03-01 Decisions:**
- Instant movement (no acceleration/momentum) for responsive arcade-style feel
- Separate turret rotation on Y axis for classic tank mechanic (aim while moving in different direction)
- Camera aim blend (30% turret direction) for visual aiming feedback without disorientation
- Pre-allocated Vector3 objects in useFrame to avoid GC pressure at 60 FPS
- Ground plane raycasting for mouse aim (converts 2D pointer to 3D world coordinates)
- KeyboardControls wrapper at App level for context availability
- Crosshair as HTML overlay for pixel-perfect centering and no depth sorting issues

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-16 (plan execution)
Stopped at: Completed 03-01-PLAN.md (Drivable Tank with Camera Controls)
Resume file: None
