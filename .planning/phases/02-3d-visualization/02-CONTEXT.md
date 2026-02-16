# Phase 2: 3D Visualization - Context

**Gathered:** 2026-02-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Render files and folders as 3D objects in a Tron-themed neon grid environment. Users can see their filesystem as glowing geometric blocks, hover for details, and identify folders as portal structures. No movement or interaction mechanics yet — this phase is purely visual representation with a fixed camera.

</domain>

<decisions>
## Implementation Decisions

### Block geometry & sizing
- Shapes vary by file category (3-4 broad groups: media, code/text, archives, other)
- Each category gets a distinct geometric shape (e.g., flat panels for images, tall columns for code)
- File size affects block dimensions using logarithmic scaling (prevents huge files from dominating)
- Wireframe edges with transparent faces — classic Tron look
- Blocks have gentle hover/bob idle animation — floating slightly above the grid
- Small floating filename label above each block (color-matched glow to block color)
- Hover tooltip shows full filename, exact file size, and last modified date

### Scene layout & arrangement
- Grid-aligned rows — neat, orderly placement on the neon grid
- Sort order: Claude's discretion (gameplay-friendly arrangement)
- Classic Tron grid floor — dark surface with bright neon grid lines extending to horizon
- Atmospheric ambient elements — distant horizon glow, subtle floating particles, light fog

### Folder portals
- Glowing archway/gate design — tall neon arch with clear "walk through me" affordance
- Portal displays folder name, file count, and total size as floating text
- Portal size scales by folder contents — bigger folders get bigger, more imposing portals
- Distinct back portal for parent directory — different color/shape from regular folder portals

### Color scheme & type mapping
- Cyan/blue dominant base palette — classic Tron grid and default glow
- File types use contrasting neon colors (cyan, magenta, green, orange) for easy distinction
- Strong bloom post-processing — heavy glow halos around all neon elements
- Blocks have subtle pulsing glow — gentle breathing effect, feels alive and energized

### Claude's Discretion
- Exact shape-to-category mappings for the 3-4 groups
- Sort order within grid rows
- Specific ambient particle density and fog parameters
- Back portal color/shape specifics
- Exact neon color assignments per file type category
- Bloom intensity tuning for performance

</decisions>

<specifics>
## Specific Ideas

- Classic Tron aesthetic is the north star — cyan/blue world with contrasting neon accents
- Wireframe transparency is key to the look — blocks should feel like data constructs, not solid objects
- The gentle floating/bobbing gives life to the scene without being distracting
- Folder portals as archways should feel inviting — "there's more to explore in here"
- Strong bloom is important for the dreamy Tron atmosphere

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-3d-visualization*
*Context gathered: 2026-02-16*
