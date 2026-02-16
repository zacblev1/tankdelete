---
phase: 03-core-gameplay
plan: 01
subsystem: gameplay
tags: [react-three-fiber, drei, tank-controls, camera, keyboard-controls, player-character, tron-aesthetic]

# Dependency graph
requires:
  - phase: 02-3d-visualization
    plan: 02
    provides: Complete 3D scene with file blocks, portals, particles, and Tron-themed rendering
provides:
  - Drivable Tron-style tank with WASD body controls and independent mouse turret aim
  - Third-person camera rig with smooth following and turret aim blend
  - Crosshair reticle for aiming
  - Tank component exposing forwardRef for external systems
  - KeyboardControls integration in App.tsx
  - Gameplay constants file for tuning movement speeds and camera behavior
affects: [03-02-projectile-system, 03-03-collision-deletion]

# Tech tracking
tech-stack:
  added: [KeyboardControls from drei, forwardRef pattern for tank reference]
  patterns:
    - Classic tank controls: A/D rotate body on Y axis, W/S move forward/back relative to body direction
    - Composite component pattern: Tank as outer group (body) containing inner group (turret) with independent rotation
    - Camera rig pattern: Invisible component using useFrame to manipulate camera position and look-at
    - Pre-allocated Vector3 pattern in useFrame to avoid GC pressure
    - Mouse-to-world raycasting on ground plane for turret aiming
    - Lerp-based camera smoothing for cinematic third-person follow

key-files:
  created:
    - src/lib/constants.ts
    - src/components/Scene/Tank.tsx
    - src/components/Scene/CameraRig.tsx
    - src/components/Scene/Crosshair.tsx
  modified:
    - src/App.tsx

key-decisions:
  - "Instant movement (no acceleration/momentum): User decision from plan — tank moves at TANK_SPEED immediately when W/S pressed for responsive feel"
  - "Separate turret rotation on Y axis: Independent mouse control allows aiming while moving in different direction (classic tank game mechanic)"
  - "Camera aim blend (30% turret direction): Camera shifts slightly toward turret aim to provide visual feedback without disorienting player"
  - "Pre-allocated Vector3 objects in useFrame: Avoid garbage collection pressure during 60 FPS rendering by reusing temporary objects"
  - "Ground plane raycasting for mouse aim: Convert 2D mouse position to 3D world coordinates by intersecting camera ray with Y=0 plane"
  - "KeyboardControls wrapper at App level: Wraps entire Scene so Tank can use useKeyboardControls hook with transient get() reads"
  - "Crosshair as HTML overlay: Renders outside 3D scene for pixel-perfect centering and no depth sorting issues"

patterns-established:
  - "Tank component pattern: Composite group with forwardRef, WASD + mouse controls, Tron wireframe visuals"
  - "CameraRig pattern: Invisible component manipulating camera via useFrame, smooth lerp interpolation, blend-based look-at"
  - "Crosshair pattern: Fixed HTML overlay with pointer-events:none for non-blocking aiming reticle"
  - "Controls enum pattern: Exported from Tank.tsx for type-safe KeyboardControls map keys"

# Metrics
duration: 3min
completed: 2026-02-16
---

# Phase 3 Plan 1: Drivable Tank with Camera Controls Summary

**Fully functional Tron-style player tank with WASD movement, A/D rotation, mouse-controlled turret, smooth third-person camera, and crosshair reticle**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-16T21:02:21Z
- **Completed:** 2026-02-16T21:05:27Z
- **Tasks:** 2 (both auto)
- **Files created:** 4
- **Files modified:** 1

## Accomplishments

- **Drivable tank:** Player can control Tron-style wireframe tank with classic tank controls (A/D rotate body, W/S move forward/back), independent mouse-controlled turret rotation, and instant responsive movement
- **Third-person camera:** Smooth camera follow behind and above tank with lerp interpolation, blending look-at between tank position (70%) and turret aim direction (30%) for aiming feedback
- **Crosshair reticle:** Cyan center-screen crosshair with circle and cross lines for aiming precision
- **Performance optimized:** Pre-allocated Vector3 objects in useFrame loops avoid GC pressure during 60 FPS rendering
- **Ready for projectiles:** Tank component exposes forwardRef and onShoot prop interface for Plan 02 integration

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Tank component with WASD body controls and mouse turret aim** - `fad9b1c` (feat)
   - Created constants.ts with gameplay tuning values (TANK_SPEED, TANK_ROTATION_SPEED, camera offsets, projectile constants for future use)
   - Created Tank.tsx as composite group: outer tank body (WASD controls) + inner turret (mouse aim)
   - Implemented classic tank controls: A/D rotate body on Y axis, W/S move forward/back relative to body facing direction
   - Mouse raycasting: Raycast from camera through pointer to ground plane (Y=0), convert to tank local space, compute turret rotation angle
   - Tron visuals: Cyan wireframe edges (EdgesGeometry) with transparent emissive fill, chassis + treads + octagonal turret + barrel
   - Pre-allocated Vector3, Raycaster, Plane objects to avoid GC
   - Exposed tankRef via forwardRef for CameraRig integration
   - Instant movement (no acceleration) per user decision

2. **Task 2: Create CameraRig, Crosshair, and integrate into App.tsx with KeyboardControls** - `e1d2961` (feat)
   - Created CameraRig.tsx: Computes desired camera position as CAMERA_OFFSET behind/above tank (offset rotated by tank quaternion), smoothly lerps camera.position
   - Look-at blending: Finds turret group, computes turret's world forward direction, blends lookAt target between tank position and point along turret aim (TURRET_AIM_BLEND = 0.3)
   - Pre-allocated Vector3 objects for camera calculations
   - Created Crosshair.tsx: HTML overlay with fixed positioning (50%/50% transform), cyan circle + cross lines, pointer-events:none
   - Updated App.tsx: Added KeyboardControls wrapper around Scene with CONTROLS_MAP (W/S/A/D and arrow keys), created tankRef with useRef, added Tank and CameraRig components to Scene, added Crosshair outside Scene
   - TypeScript compilation passes, build succeeds

## Files Created/Modified

- `src/lib/constants.ts` - Gameplay tuning constants: tank speeds, camera offsets, lerp speeds, projectile constants
- `src/components/Scene/Tank.tsx` - Composite tank component with WASD body controls, mouse turret aim, Tron wireframe visuals, forwardRef
- `src/components/Scene/CameraRig.tsx` - Third-person camera rig with smooth follow, aim blend, pre-allocated vectors
- `src/components/Scene/Crosshair.tsx` - Center-screen cyan reticle HTML overlay
- `src/App.tsx` - Integrated KeyboardControls wrapper, Tank, CameraRig, Crosshair components

## Decisions Made

1. **Instant movement (no acceleration/momentum):** Per user decision in plan, tank moves at TANK_SPEED immediately when W/S pressed. This provides responsive arcade-style feel rather than realistic physics simulation. Movement is simply `delta * TANK_SPEED` applied along tank's forward direction each frame.

2. **Separate turret rotation on Y axis:** Turret rotates independently from tank body based on mouse position. Uses raycasting from camera through pointer to ground plane, converts world intersection to tank local space, computes angle with `Math.atan2`. This enables classic tank mechanic where player can aim in one direction while moving in another.

3. **Camera aim blend (30% turret direction):** Camera look-at blends 70% tank position + 30% along turret aim direction (scaled by 10 units). This subtle shift provides visual feedback about where turret is aiming without disorienting player. Implemented by finding turret group, computing its world forward direction, and blending vectors.

4. **Pre-allocated Vector3 objects in useFrame:** Both Tank and CameraRig create reusable Vector3/Raycaster/Plane objects with useMemo to avoid allocating new objects every frame. At 60 FPS, this prevents garbage collection pressure and frame drops.

5. **Ground plane raycasting for mouse aim:** Mouse position is converted to 3D world coordinates by raycasting from camera through pointer position and intersecting with ground plane (Y=0). This allows turret to aim at the point where player's mouse "touches" the ground, matching player's mental model of aiming.

6. **KeyboardControls wrapper at App level:** drie's KeyboardControls component wraps entire Scene (not just Tank) so the controls context is available to all child components. Tank uses `useKeyboardControls` hook with transient `get()` reads (not reactive subscriptions) to avoid re-renders.

7. **Crosshair as HTML overlay:** Rendered outside 3D scene as fixed HTML div with CSS positioning. This ensures pixel-perfect centering, avoids depth sorting issues, and eliminates the complexity of 3D sprite billboarding. Uses pointer-events:none to not block mouse interaction with 3D scene.

## Deviations from Plan

None - plan executed exactly as written. All specified features implemented: WASD/mouse controls, third-person camera, crosshair, KeyboardControls integration, pre-allocated vectors, Tron visuals, instant movement.

## Issues Encountered

**TypeScript ref nullability:** Initial CameraRig interface used `React.RefObject<THREE.Group>` (non-nullable), but App.tsx's `useRef<THREE.Group>(null)` creates `RefObject<THREE.Group | null>`. Fixed by updating CameraRig interface to accept nullable ref. This is standard React pattern — refs start as null until component mounts.

No other issues. Implementation proceeded smoothly with expected behavior on first attempt.

## User Setup Required

None - no external service configuration required. All functionality is self-contained in React components using drei and react-three-fiber.

## Next Phase Readiness

**Ready for Plan 02 (Projectile Shooting):**
- Tank component exposes `onShoot?: (position: Vector3, direction: Vector3) => void` prop interface
- Turret's world-space forward direction can be computed for projectile spawning
- CameraRig provides stable third-person view for aiming feedback
- Crosshair reticle already in place for aiming
- constants.ts includes PROJECTILE_SPEED and PROJECTILE_MAX_LIFETIME for Plan 02 use

**No blockers.** Plan 02 can implement mouse-click shooting by adding click handler, computing turret barrel world position and forward direction, and spawning projectile components.

---

## Self-Check: PASSED

All files and commits verified:

**Files created:**
- FOUND: src/lib/constants.ts
- FOUND: src/components/Scene/Tank.tsx
- FOUND: src/components/Scene/CameraRig.tsx
- FOUND: src/components/Scene/Crosshair.tsx

**Files modified:**
- FOUND: src/App.tsx

**Commits:**
- FOUND: fad9b1c (Task 1)
- FOUND: e1d2961 (Task 2)

All claims in this summary are accurate and verifiable.

---
*Phase: 03-core-gameplay*
*Completed: 2026-02-16*
