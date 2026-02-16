# Phase 4: Game Polish - Context

**Gathered:** 2026-02-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Satisfying visual/audio feedback and gamification that makes file deletion feel fun. Scoring system, particle explosions on deletion, achievement milestones, and HUD feedback. No new gameplay mechanics — this is juice and progression on top of existing mark+delete system.

</domain>

<decisions>
## Implementation Decisions

### Scoring system
- 1 point per MB freed — simple and intuitive (500MB file = 500 points)
- No combo or streak mechanics — keep it straightforward, no time pressure
- Score displayed in HUD counter only — no floating in-world numbers
- Session total accumulates across all directory navigation — never resets until app closes

### Particle explosions
- Voxel shatter style — block breaks into smaller cubes that scatter and fade (digital disintegration)
- Particle color matches file category color (cyan for media, green for code, orange for archives, magenta for other)
- Big difference in scale between small and large files — tiny files get small puff, huge files get massive screen-filling explosion
- Batch delete triggers individual explosions in rapid sequence — chain reaction feel, not one combined blast

### Achievement design
- Size milestones only — focused on the core metric of MB freed
- Powers of 10 thresholds: 100MB, 1GB, 10GB
- Session only — no persistence between app launches
- Tron-themed names: "Derezzer" (100MB), "Grid Cleaner" (1GB), "System Purge" (10GB)

### HUD & feedback
- Score in top-right corner — classic arcade position
- Achievement notifications as toast banners — slide in from top, show name, fade after 3-4 seconds
- Score counting animation — numbers tick up rapidly from old value to new
- Full Tron style HUD — neon glow text, dark translucent backgrounds, cyan/magenta accents

### Claude's Discretion
- Exact particle count and performance budget for explosions
- Toast banner animation timing and easing
- Score counter tick speed and easing curve
- Achievement icon/badge design
- HUD element exact sizing and positioning

</decisions>

<specifics>
## Specific Ideas

- Voxel shatter should feel like digital disintegration — cubes scatter and dissolve, not just fly away
- Chain reaction on batch delete should feel like a satisfying domino effect
- Achievement names should evoke the Tron universe ("Derezzer", "Grid Cleaner", "System Purge")

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-game-polish*
*Context gathered: 2026-02-16*
