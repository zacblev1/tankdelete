# Phase 3: Core Gameplay - Context

**Gathered:** 2026-02-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Tank movement, shooting mechanics, and the two-shot deletion system. Users go from viewing files as 3D objects to interacting with them — driving a tank, shooting to mark files, and deleting marked files. Includes folder portal navigation, minimap, and third-person camera.

</domain>

<decisions>
## Implementation Decisions

### Tank Feel & Controls
- Arcade / instant movement — responsive, snappy. Press W and you're moving immediately. No momentum or acceleration curves.
- Classic tank controls: A/D rotate the tank body, W/S move forward/back relative to where tank points
- Independent turret rotation — mouse controls turret direction separately from tank body
- Tron light tank visual — sleek, angular, glowing wireframe edges. Low-poly with neon outlines matching the grid aesthetic.

### Shooting & Marking
- Neon energy bolt projectile — glowing orb/bolt that travels fast with a light trail. Not instant-hit.
- First shot mark visual: pulsing glow + color shift to warning color (red/orange) indicating marked for deletion
- Batch delete via keyboard shortcut — mark multiple files with first shots, then press a key (e.g., Delete or X) to delete all marked at once
- De-rez / dissolve destruction animation — block pixelates and dissolves away like Tron de-resolution. Clean and thematic.

### Portal Navigation
- Instant swap on portal entry — drive through the portal threshold and scene immediately reloads with new directory. No transition animation.
- Tank spawns at the back portal after entering a new directory — consistent orientation, always know where you are
- Drive straight through to enter — no confirmation prompt or hover action required
- Back portal has distinct visual style — different color or shape from folder portals so you always know which goes back vs into a subfolder

### Minimap & Camera
- Radar-style circular minimap showing dots for files/folders around player
- Minimap positioned in bottom-left corner (classic radar position)
- Close-follow third-person camera — camera close behind and slightly above the tank for immersive feel
- Camera follows turret aim — shifts slightly in the direction the turret is pointing for aiming feedback

### Claude's Discretion
- Exact tank movement speed and rotation speed tuning
- Projectile speed, size, and trail length
- Specific key binding for batch delete (Delete, X, or similar)
- Minimap radius and dot styling
- Camera smoothing/damping values
- Collision handling with file blocks and portals
- Crosshair/reticle design for aiming

</decisions>

<specifics>
## Specific Ideas

- Tank should match the existing Tron aesthetic: neon wireframe edges, dark body, glowing accents — consistent with the file blocks and grid already built in Phase 2
- De-rez dissolution effect should feel like the classic Tron movie de-resolution — not an explosion, more of a clean digital breakdown
- Back portal was already designed as green in Phase 2 (distinct from cyan folder portals) — maintain that distinction

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-core-gameplay*
*Context gathered: 2026-02-16*
