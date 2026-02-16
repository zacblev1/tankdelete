# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-16)

**Core value:** Deleting unwanted files feels fun and satisfying, not tedious — turning filesystem cleanup into a game.
**Current focus:** Phase 3: Core Gameplay

## Current Position

Phase: 3 of 4 (Core Gameplay)
Plan: 4 of 4 in current phase (COMPLETE)
Status: Active - Plan 03-04 complete
Last activity: 2026-02-16 — Completed plan 03-04 (Wire Minimap and Remove Dead Code)

Progress: [███████░░░] 70%

## Performance Metrics

**Velocity:**
- Total plans completed: 7
- Average duration: 4 min
- Total execution time: 0.9 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01 | 2 | 14 min | 7 min |
| 02 | 2 | 6 min | 3 min |
| 03 | 3 | 16 min | 5 min |

**Recent Trend:**
- Last 5 plans: 5 min avg
- Trend: Accelerating - gap closure plan executed in <1 min (surgical fixes only)

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

**Plan 03-02 Decisions:**
- Projectile pool max size 20 to prevent excessive spawning
- Glowing cyan (#00ffff) spheres for projectiles with bloom effect
- Position-based hit detection (within 2 units) for simplicity vs instanceId mapping
- Red-orange (#ff4400) pulsing glow for marked files with 1.1x scale overlay
- De-rez duration 0.8 seconds (shrink + sink animation)
- Delete/X keys for batch delete (in addition to keyboard controls)
- Separate deletingFiles set to track de-rez animation state
- onDeletionComplete callback pattern for cleanup after animation

**Plan 03-03 Decisions:**
- Drive-through navigation replaces click-to-enter: More immersive gameplay, no confirmation prompts
- 1-second cooldown on portal triggers: Prevents rapid/accidental directory changes
- Tank spawns at [0, 0, -12] near back portal: Consistent spawn location, oriented toward new directory
- Minimap uses ref-based updates: Avoids re-rendering App on every frame, smooth 60fps
- 30-unit world radius on minimap: Balances spatial awareness with detail visibility
- Minimap forward-up rotation: Classic radar pattern, intuitive orientation

**Plan 03-04 Decisions:**
- None - gap closure plan executed exactly as specified (surgical fixes only)

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-16 (plan execution)
Stopped at: Completed 03-04-PLAN.md (Wire Minimap and Remove Dead Code)
Resume file: None
