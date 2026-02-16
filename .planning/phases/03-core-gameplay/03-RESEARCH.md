# Phase 3: Core Gameplay - Research

**Researched:** 2026-02-16
**Domain:** React Three Fiber game mechanics (tank controls, projectile shooting, camera systems, deletion workflows)
**Confidence:** HIGH

## Summary

Phase 3 implements the core interactive gameplay loop: driving a tank with classic tank controls (WASD + mouse turret), shooting projectiles at file blocks to mark them, and executing two-shot deletions. The technical domain centers on React Three Fiber's useFrame hook for smooth movement, KeyboardControls from Drei for input handling, raycasting for projectile collision detection, third-person camera follow, and batch state management for multi-file selection.

The existing codebase already has the Three.js scene foundation (Phase 2) with file blocks, portals, and Tron aesthetic established. The stack (React 19.1.0, @react-three/fiber 9.5.0, @react-three/drei 10.7.7, three.js 0.182.0) is current and stable. The Tauri backend already provides `moveToTrash()` command for file deletion with undo support.

**Primary recommendation:** Use Drei's KeyboardControls for input, implement tank as a composite group with independent body/turret rotation, manage projectiles with object pooling for performance, use raycasting for hit detection, implement third-person camera with useFrame-based smoothing, and manage marked files with Set-based state pattern for O(1) batch operations.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Tank Feel & Controls
- Arcade / instant movement — responsive, snappy. Press W and you're moving immediately. No momentum or acceleration curves.
- Classic tank controls: A/D rotate the tank body, W/S move forward/back relative to where tank points
- Independent turret rotation — mouse controls turret direction separately from tank body
- Tron light tank visual — sleek, angular, glowing wireframe edges. Low-poly with neon outlines matching the grid aesthetic.

#### Shooting & Marking
- Neon energy bolt projectile — glowing orb/bolt that travels fast with a light trail. Not instant-hit.
- First shot mark visual: pulsing glow + color shift to warning color (red/orange) indicating marked for deletion
- Batch delete via keyboard shortcut — mark multiple files with first shots, then press a key (e.g., Delete or X) to delete all marked at once
- De-rez / dissolve destruction animation — block pixelates and dissolves away like Tron de-resolution. Clean and thematic.

#### Portal Navigation
- Instant swap on portal entry — drive through the portal threshold and scene immediately reloads with new directory. No transition animation.
- Tank spawns at the back portal after entering a new directory — consistent orientation, always know where you are
- Drive straight through to enter — no confirmation prompt or hover action required
- Back portal has distinct visual style — different color or shape from folder portals so you always know which goes back vs into a subfolder

#### Minimap & Camera
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

### Specific Context
- Tank should match the existing Tron aesthetic: neon wireframe edges, dark body, glowing accents — consistent with the file blocks and grid already built in Phase 2
- De-rez dissolution effect should feel like the classic Tron movie de-resolution — not an explosion, more of a clean digital breakdown
- Back portal was already designed as green in Phase 2 (distinct from cyan folder portals) — maintain that distinction

</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @react-three/fiber | ^9.5.0 | React renderer for Three.js | Industry standard for React + Three.js integration, handles automatic disposal and React lifecycle |
| @react-three/drei | ^10.7.7 | Helper abstractions for R3F | Official companion library providing KeyboardControls, Html, Text, and other essential utilities |
| three.js | ^0.182.0 | 3D graphics library | Core WebGL abstraction, latest stable version with ongoing 2026 updates |
| React | ^19.1.0 | UI framework | Latest stable React with automatic batching and concurrent features |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-three/postprocessing | ^3.0.4 | Visual effects pipeline | Already in use for Tron glow effects, extend for projectile trails and destruction effects |
| troika-three-text | ^0.52.4 | GPU-accelerated text rendering | Already in use for labels, can be used for HUD text if needed |

### Not Needed (Already Have)
| Need | Have | Notes |
|------|------|-------|
| Physics engine | None needed | User specified instant arcade movement, no physics simulation |
| Animation library | useFrame + manual tweening | Simple animations via clock.elapsedTime and delta time |
| State management | React useState/useReducer | Complex state (marked files) handled with Set + useState pattern |

**Installation:**
```bash
# All dependencies already installed in package.json
# No additional packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── Scene/
│   │   ├── Tank.tsx              # Main tank component (body + turret)
│   │   ├── TankBody.tsx          # Tank chassis with WASD movement
│   │   ├── TankTurret.tsx        # Independent turret with mouse aim
│   │   ├── Projectile.tsx        # Single projectile instance
│   │   ├── ProjectilePool.tsx    # Manages active projectiles
│   │   ├── Camera.tsx            # Third-person follow camera
│   │   ├── Minimap.tsx           # Radar-style 2D overlay
│   │   └── Crosshair.tsx         # Center-screen aiming reticle
│   └── HUD/
│       └── MarkedFilesIndicator.tsx  # Show count of marked files
├── hooks/
│   ├── useTankControls.ts        # Encapsulate WASD + rotation logic
│   ├── useProjectilePool.ts      # Object pool for projectile reuse
│   ├── useMarkedFiles.ts         # Manage Set of marked file paths
│   └── useCameraFollow.ts        # Smooth camera tracking logic
└── lib/
    ├── collision.ts              # Raycasting utilities for hit detection
    └── constants.ts              # Movement speed, projectile speed, etc.
```

### Pattern 1: KeyboardControls for Input Handling
**What:** Drei's KeyboardControls wrapper provides Zustand-based keyboard state distribution to components
**When to use:** Tank movement, shooting input, batch delete trigger
**Example:**
```typescript
// App.tsx - Wrap scene with KeyboardControls
import { KeyboardControls } from '@react-three/drei';

enum Controls {
  forward = 'forward',
  backward = 'backward',
  left = 'left',
  right = 'right',
  shoot = 'shoot',
  batchDelete = 'batchDelete',
}

const controlsMap = [
  { name: Controls.forward, keys: ['KeyW', 'ArrowUp'] },
  { name: Controls.backward, keys: ['KeyS', 'ArrowDown'] },
  { name: Controls.left, keys: ['KeyA', 'ArrowLeft'] },
  { name: Controls.right, keys: ['KeyD', 'ArrowRight'] },
  { name: Controls.shoot, keys: ['Space'] },  // Mouse handled separately
  { name: Controls.batchDelete, keys: ['Delete', 'KeyX'] },
];

<KeyboardControls map={controlsMap}>
  <Scene>
    <Tank />
  </Scene>
</KeyboardControls>

// useTankControls.ts - Access keyboard state
import { useKeyboardControls } from '@react-three/drei';

export function useTankControls() {
  const [, get] = useKeyboardControls<Controls>();

  useFrame((state, delta) => {
    const { forward, backward, left, right } = get();
    // Apply movement based on pressed keys
  });
}
```
**Source:** [Drei KeyboardControls Documentation](https://drei.docs.pmnd.rs/controls/keyboard-controls)

### Pattern 2: Frame-Rate Independent Movement with Delta Time
**What:** Use useFrame's delta parameter to ensure consistent movement speed across all hardware
**When to use:** All tank movement, turret rotation, projectile travel, camera following
**Example:**
```typescript
// Source: https://kylemadkins.com/blog/movement-react-three-fiber/
import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';

function TankBody({ speed = 5 }) {
  const tankRef = useRef<THREE.Group>(null);
  const [, get] = useKeyboardControls<Controls>();

  useFrame((state, delta) => {
    if (!tankRef.current) return;

    const { forward, backward, left, right } = get();

    // Rotation (instant as per user requirement)
    if (left) tankRef.current.rotation.y += 2.0 * delta;
    if (right) tankRef.current.rotation.y -= 2.0 * delta;

    // Movement (instant, no acceleration)
    const direction = new Vector3();
    if (forward) direction.z -= 1;
    if (backward) direction.z += 1;

    if (direction.length() > 0) {
      direction.normalize();
      direction.applyEuler(tankRef.current.rotation); // Local to world space
      direction.multiplyScalar(speed * delta);
      tankRef.current.position.add(direction);
    }
  });

  return <group ref={tankRef}>...</group>;
}
```
**Why this works:** Multiplying movement by delta (time since last frame) ensures 60fps and 30fps machines move at same real-world speed.

### Pattern 3: Independent Turret Rotation with Mouse
**What:** Turret rotates on Y-axis independently from tank body, controlled by mouse movement or pointer position
**When to use:** Tank turret aiming system
**Example:**
```typescript
function TankTurret() {
  const turretRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame((state) => {
    if (!turretRef.current) return;

    // Get mouse position in normalized device coordinates (-1 to +1)
    const mouse = state.pointer;

    // Raycast from camera through mouse position to ground plane
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);

    // Point turret at intersection
    if (intersection) {
      turretRef.current.lookAt(intersection.x, turretRef.current.position.y, intersection.z);
    }
  });

  return <group ref={turretRef}>...</group>;
}
```
**Alternative approach:** Listen to mousemove events and calculate angle from tank to cursor, then interpolate turret rotation.

### Pattern 4: Raycasting for Projectile Hit Detection
**What:** Cast rays from projectile position to check for file block intersections
**When to use:** Every frame for each active projectile to detect hits
**Example:**
```typescript
// Source: https://sbcode.net/threejs/raycaster2/
function Projectile({ position, direction, onHit }) {
  const projectileRef = useRef<THREE.Mesh>(null);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  useFrame((state, delta) => {
    if (!projectileRef.current) return;

    // Move projectile
    const movement = direction.clone().multiplyScalar(20 * delta);
    projectileRef.current.position.add(movement);

    // Check for collisions
    raycaster.set(projectileRef.current.position, direction);
    const intersects = raycaster.intersectObjects(fileBlocksArray, false);

    if (intersects.length > 0) {
      const hitObject = intersects[0].object;
      onHit(hitObject.userData.filePath);
      // Remove projectile from pool
    }
  });

  return <mesh ref={projectileRef} position={position}>
    <sphereGeometry args={[0.1, 8, 8]} />
    <meshBasicMaterial color="#00ffff" />
  </mesh>;
}
```
**Performance note:** Use BVH (three-mesh-bvh) if hitting performance issues with many file blocks, but likely unnecessary for this use case.

### Pattern 5: Object Pooling for Projectiles
**What:** Reuse projectile instances instead of creating/destroying on each shot
**When to use:** Projectile system where shots are fired frequently
**Example:**
```typescript
// Source: https://kingdavvid.hashnode.dev/introduction-to-object-pooling-in-threejs
interface PooledProjectile {
  active: boolean;
  position: Vector3;
  direction: Vector3;
  lifeTime: number;
}

function useProjectilePool(maxSize = 20) {
  const [pool, setPool] = useState<PooledProjectile[]>([]);

  const spawn = (position: Vector3, direction: Vector3) => {
    setPool(prev => {
      const inactive = prev.find(p => !p.active);
      if (inactive) {
        inactive.active = true;
        inactive.position.copy(position);
        inactive.direction.copy(direction);
        inactive.lifeTime = 0;
        return [...prev];
      }

      if (prev.length < maxSize) {
        return [...prev, { active: true, position: position.clone(), direction: direction.clone(), lifeTime: 0 }];
      }

      return prev; // Pool full
    });
  };

  const despawn = (index: number) => {
    setPool(prev => {
      prev[index].active = false;
      return [...prev];
    });
  };

  return { pool, spawn, despawn };
}
```
**Why:** Avoids garbage collection spikes from creating/destroying meshes rapidly. Important for smooth 60fps gameplay.

### Pattern 6: Third-Person Camera Follow
**What:** Camera tracks tank from behind and above, smoothly interpolating to target position
**When to use:** Main gameplay camera
**Example:**
```typescript
// Source: https://sbcode.net/react-three-fiber/follow-cam/
function CameraRig({ target }: { target: React.RefObject<THREE.Group> }) {
  const { camera } = useThree();
  const cameraOffset = useMemo(() => new Vector3(0, 4, 8), []); // Behind and above
  const currentPosition = useMemo(() => new Vector3(), []);
  const currentLookAt = useMemo(() => new Vector3(), []);

  useFrame((state, delta) => {
    if (!target.current) return;

    // Calculate desired camera position relative to tank
    const desiredPosition = target.current.position.clone();
    desiredPosition.add(cameraOffset.clone().applyQuaternion(target.current.quaternion));

    // Smooth interpolation (lerp) for camera lag
    currentPosition.lerp(desiredPosition, 5 * delta);
    camera.position.copy(currentPosition);

    // Look at tank position with slight offset toward turret aim direction
    const lookAtTarget = target.current.position.clone();
    currentLookAt.lerp(lookAtTarget, 10 * delta);
    camera.lookAt(currentLookAt);
  });

  return null;
}
```
**User requirement:** "Camera follows turret aim" - extend this pattern to blend lookAt target toward turret's forward direction.

### Pattern 7: Batch Selection with Set-Based State
**What:** Use Set for O(1) add/remove/check operations on marked files
**When to use:** Managing which files are marked for deletion
**Example:**
```typescript
// Source: https://medium.com/@rakibshakib/efficiently-managing-selection-states-in-react-a-comprehensive-guide-8ed00f173adb
function useMarkedFiles() {
  const [markedFiles, setMarkedFiles] = useState<Set<string>>(new Set());

  const toggleMark = (filePath: string) => {
    setMarkedFiles(prev => {
      const next = new Set(prev);
      if (next.has(filePath)) {
        next.delete(filePath); // Second shot - ready to delete
        return next;
      } else {
        next.add(filePath); // First shot - mark
        return next;
      }
    });
  };

  const isMarked = (filePath: string) => markedFiles.has(filePath);

  const deleteAllMarked = async () => {
    const paths = Array.from(markedFiles);
    await Promise.all(paths.map(path => commands.moveToTrash(path)));
    setMarkedFiles(new Set()); // Clear after deletion
  };

  return { markedFiles, toggleMark, isMarked, deleteAllMarked };
}
```
**Why Set over Array:** O(1) lookup vs O(n), no duplicates, efficient iteration.

### Pattern 8: Portal Collision Detection with Bounding Boxes
**What:** Check if tank's bounding box overlaps with portal's bounding box to trigger navigation
**When to use:** Detecting when tank drives through folder or back portal
**Example:**
```typescript
// Source: https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_collision_detection/Bounding_volume_collision_detection_with_THREE.js
function checkPortalCollision(tank: THREE.Object3D, portals: THREE.Object3D[]) {
  const tankBox = new THREE.Box3().setFromObject(tank);

  for (const portal of portals) {
    const portalBox = new THREE.Box3().setFromObject(portal);

    if (tankBox.intersectsBox(portalBox)) {
      // Trigger navigation
      const folderPath = portal.userData.folderPath;
      navigateToDirectory(folderPath);
      return;
    }
  }
}

useFrame(() => {
  checkPortalCollision(tankRef.current, portalRefs);
});
```
**User requirement:** "Instant swap on portal entry" - no animation, just immediate scene reload.

### Pattern 9: Minimap with Orthographic Camera
**What:** Render second view from above using orthographic camera, display in corner via Html component
**When to use:** Minimap HUD element
**Example:**
```typescript
// Source: https://wawasensei.dev/tuto/how-to-build-a-minimap-with-threejs
import { Hud, OrthographicCamera } from '@react-three/drei';

function Minimap({ tankPosition }: { tankPosition: Vector3 }) {
  return (
    <Hud renderPriority={2}>
      <OrthographicCamera makeDefault={false} position={[tankPosition.x, 50, tankPosition.z]} zoom={5}>
        {/* Render simplified versions of file blocks and portals */}
        <mesh position={[0, 0, 0]}>
          <circleGeometry args={[0.2]} />
          <meshBasicMaterial color="#00ffff" />
        </mesh>
      </OrthographicCamera>
    </Hud>
  );
}
```
**Alternative:** Use HTML canvas element with absolute positioning and manually draw dots for files/folders based on world positions.

### Pattern 10: Crosshair HTML Overlay
**What:** Centered HTML element overlayed on canvas for aiming reticle
**When to use:** Aiming feedback for shooting
**Example:**
```css
/* Crosshair.css */
.crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border: 2px solid #00ffff;
  border-radius: 50%;
  pointer-events: none;
  z-index: 100;
}

.crosshair::before,
.crosshair::after {
  content: '';
  position: absolute;
  background: #00ffff;
}

.crosshair::before {
  width: 2px;
  height: 10px;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
}

.crosshair::after {
  width: 10px;
  height: 2px;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
}
```
```tsx
// Crosshair.tsx
export function Crosshair() {
  return <div className="crosshair" />;
}
```
**User discretion:** Exact crosshair design is up to implementation - can be simple dot, circle, or cross pattern.

### Anti-Patterns to Avoid

- **Using React state for every frame updates:** Don't use setState for position/rotation that changes every frame - directly mutate Three.js objects via refs
- **Creating new Vector3/Quaternion in useFrame:** Pre-allocate reusable objects outside the loop to avoid garbage collection pressure
- **Missing delta time multiplication:** Always multiply movement by delta for frame-rate independence
- **Dispose in useFrame:** Never call dispose() inside animation loop - handle cleanup in useEffect cleanup or component unmount
- **Reading from KeyboardControls state reactively in useFrame:** Use `get()` method for transient reads to avoid re-renders

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Keyboard input state | Custom keydown/keyup listeners | `@react-three/drei` KeyboardControls | Handles cleanup, supports multiple keys per action, Zustand-based distribution |
| Text rendering in 3D | Canvas texture + plane mesh | `@react-three/drei` Text with troika-three-text | GPU-accelerated SDF rendering, better performance and quality |
| Mouse position to 3D space | Manual viewport calculations | `useThree().pointer` + Raycaster | Handles coordinate transforms, camera projection automatically |
| Object disposal | Manual geometry.dispose(), material.dispose() calls | R3F automatic disposal | R3F disposes on unmount by default, prevents memory leaks |
| Delta time calculation | Manual clock.getDelta() in components | `useFrame((state, delta) => ...)` | Delta shared across all components, won't cause timing issues |
| Third-person camera smoothing | Manual quaternion slerp | Vector3.lerp() for position + lookAt interpolation | Simpler math, sufficient for arcade controls |

**Key insight:** React Three Fiber and Drei provide battle-tested solutions for common 3D game patterns. Building custom versions introduces bugs, memory leaks, and performance issues. The ecosystem is mature enough to rely on for all core mechanics.

## Common Pitfalls

### Pitfall 1: Garbage Collection Spikes from Object Creation
**What goes wrong:** Creating new Vector3, Quaternion, or geometry instances every frame causes GC pauses and stuttering
**Why it happens:** JavaScript garbage collection runs when heap fills, causing visible frame drops in 60fps applications
**How to avoid:** Pre-allocate reusable objects outside useFrame:
```typescript
// BAD - creates garbage every frame
useFrame((state, delta) => {
  const movement = new Vector3(0, 0, -1); // New allocation
  movement.multiplyScalar(speed * delta);
  tankRef.current.position.add(movement);
});

// GOOD - reuse single object
const movement = useMemo(() => new Vector3(), []);
useFrame((state, delta) => {
  movement.set(0, 0, -1); // Reuse existing object
  movement.multiplyScalar(speed * delta);
  tankRef.current.position.add(movement);
});
```
**Warning signs:** Frame rate drops during intense gameplay, performance degrades over time, stuttering during shooting

### Pitfall 2: Missing dispose={null} on Shared Geometries
**What goes wrong:** R3F disposes geometries/materials on component unmount, breaking reused instances
**Why it happens:** Default R3F behavior assumes one-to-one component-to-resource mapping
**How to avoid:** Set `dispose={null}` when sharing geometry across multiple meshes:
```typescript
// Shared geometry for all projectiles
const projectileGeometry = useMemo(() => new THREE.SphereGeometry(0.1, 8, 8), []);

// Each projectile instance
{pool.map(projectile => (
  <mesh key={projectile.id} geometry={projectileGeometry} dispose={null}>
    <meshBasicMaterial color="#00ffff" />
  </mesh>
))}
```
**Warning signs:** Console errors about disposed geometry, missing projectiles after first deletion, visual glitches

### Pitfall 3: Diagonal Movement Speed Boost
**What goes wrong:** Moving diagonally (W+A or W+D) results in faster movement than single direction
**Why it happens:** Combining two unit vectors creates vector with magnitude 1.414 (sqrt(2))
**How to avoid:** Normalize direction vector before applying speed:
```typescript
const direction = new Vector3();
if (forward) direction.z -= 1;
if (backward) direction.z += 1;
if (left) direction.x -= 1;
if (right) direction.x += 1;

if (direction.length() > 0) {
  direction.normalize(); // Scale to length 1
  direction.multiplyScalar(speed * delta);
}
```
**Warning signs:** Players notice moving diagonally feels faster, inconsistent collision timing

### Pitfall 4: Camera Jitter from Immediate Position Updates
**What goes wrong:** Setting camera position directly from tank position causes jerky motion
**Why it happens:** Tank position changes in discrete steps each frame, camera needs smooth interpolation
**How to avoid:** Use lerp to smooth camera movement:
```typescript
// BAD - direct copy
camera.position.copy(targetPosition);

// GOOD - interpolate
currentPosition.lerp(targetPosition, 5 * delta);
camera.position.copy(currentPosition);
```
**Warning signs:** Camera feels jerky during tank rotation, visual stuttering when stopping movement

### Pitfall 5: Raycaster Reuse Without Proper set() Call
**What goes wrong:** Raycaster checks old ray direction, detects incorrect intersections
**Why it happens:** Raycaster.set() must be called before each intersect check to update internal ray
**How to avoid:** Always call set() before intersectObjects():
```typescript
const raycaster = useMemo(() => new THREE.Raycaster(), []);

useFrame(() => {
  // Update raycaster for this frame
  raycaster.set(projectile.position, projectile.direction);
  const hits = raycaster.intersectObjects(targets);
});
```
**Warning signs:** Projectiles hit wrong targets, collision detection seems delayed or inaccurate

### Pitfall 6: Portal Navigation Triggering Multiple Times
**What goes wrong:** Driving through portal triggers navigation 10+ times while tank passes through bounding box
**Why it happens:** useFrame checks collision every frame, tank takes multiple frames to cross portal threshold
**How to avoid:** Add cooldown or one-shot flag:
```typescript
const lastNavigationTime = useRef(0);

useFrame(({ clock }) => {
  if (clock.elapsedTime - lastNavigationTime.current < 1.0) return; // 1 second cooldown

  if (checkPortalCollision()) {
    lastNavigationTime.current = clock.elapsedTime;
    navigateToDirectory(portalPath);
  }
});
```
**Warning signs:** Console shows multiple navigation calls, UI flashes, directories load repeatedly

### Pitfall 7: Set State Not Triggering Re-render
**What goes wrong:** Mutating Set directly doesn't trigger React re-render
**Why it happens:** React compares object references - mutating in-place doesn't change reference
**How to avoid:** Create new Set instance when updating:
```typescript
// BAD - mutates existing Set, no re-render
setMarkedFiles(prev => {
  prev.add(filePath); // Mutation
  return prev; // Same reference
});

// GOOD - new Set instance
setMarkedFiles(prev => new Set(prev).add(filePath));
// or
setMarkedFiles(prev => {
  const next = new Set(prev);
  next.add(filePath);
  return next;
});
```
**Warning signs:** UI doesn't update when marking files, batch delete count doesn't change

## Code Examples

Verified patterns from official sources:

### Tank Component Structure
```typescript
// Tank.tsx - Composite tank with body and turret
export function Tank({ onShoot }: { onShoot: (position: Vector3, direction: Vector3) => void }) {
  const tankRef = useRef<THREE.Group>(null);
  const turretRef = useRef<THREE.Group>(null);

  return (
    <group ref={tankRef} position={[0, 0, 0]}>
      <TankBody parentRef={tankRef} />
      <TankTurret parentRef={turretRef} onShoot={onShoot} />
    </group>
  );
}
```

### WASD Movement with Instant Response
```typescript
// TankBody.tsx
import { useKeyboardControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

function TankBody({ parentRef }) {
  const [, get] = useKeyboardControls<Controls>();
  const direction = useMemo(() => new Vector3(), []);

  useFrame((state, delta) => {
    if (!parentRef.current) return;

    const { forward, backward, left, right } = get();

    // Instant rotation (arcade feel)
    const rotationSpeed = 2.5;
    if (left) parentRef.current.rotation.y += rotationSpeed * delta;
    if (right) parentRef.current.rotation.y -= rotationSpeed * delta;

    // Instant movement (no acceleration)
    direction.set(0, 0, 0);
    if (forward) direction.z = -1;
    if (backward) direction.z = 1;

    if (direction.length() > 0) {
      direction.normalize();
      direction.applyEuler(parentRef.current.rotation);
      direction.multiplyScalar(8 * delta); // 8 units/second
      parentRef.current.position.add(direction);
    }
  });

  return (
    <group>
      {/* Tron-style wireframe tank body */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(1, 0.5, 1.5)]} />
        <lineBasicMaterial color="#00ffff" toneMapped={false} />
      </lineSegments>
    </group>
  );
}
```

### Mouse-Controlled Turret
```typescript
// TankTurret.tsx
function TankTurret({ parentRef, onShoot }) {
  const turretRef = useRef<THREE.Group>(null);
  const { camera, pointer } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const groundPlane = useMemo(() => new THREE.Plane(new Vector3(0, 1, 0), 0), []);
  const intersection = useMemo(() => new Vector3(), []);

  useFrame(() => {
    if (!turretRef.current) return;

    // Raycast mouse to ground plane
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(groundPlane, intersection);

    // Point turret at mouse position (Y-axis only)
    turretRef.current.lookAt(intersection.x, turretRef.current.position.y, intersection.z);
  });

  return (
    <group ref={turretRef} position={[0, 0.5, 0]}>
      {/* Wireframe turret */}
      <lineSegments>
        <edgesGeometry args={[new THREE.CylinderGeometry(0.3, 0.3, 0.4, 8)]} />
        <lineBasicMaterial color="#00ffff" toneMapped={false} />
      </lineSegments>
      {/* Barrel */}
      <lineSegments position={[0, 0, -0.5]}>
        <edgesGeometry args={[new THREE.BoxGeometry(0.1, 0.1, 0.8)]} />
        <lineBasicMaterial color="#00ffff" toneMapped={false} />
      </lineSegments>
    </group>
  );
}
```

### Projectile with Trail Effect
```typescript
// Projectile.tsx
function Projectile({ position, direction, onHit, onExpire }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lifetime = useRef(0);
  const maxLifetime = 3.0; // 3 seconds

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Move projectile
    const movement = direction.clone().multiplyScalar(20 * delta);
    meshRef.current.position.add(movement);

    // Check lifetime
    lifetime.current += delta;
    if (lifetime.current > maxLifetime) {
      onExpire();
      return;
    }

    // Raycasting for hit detection (simplified)
    // Full implementation would check against file block array
  });

  return (
    <mesh ref={meshRef} position={position}>
      {/* Glowing energy bolt */}
      <sphereGeometry args={[0.15, 8, 8]} />
      <meshBasicMaterial color="#00ffff" toneMapped={false} />
      {/* Trail effect - use postprocessing or MeshLine */}
    </mesh>
  );
}
```

### Marked File State Management
```typescript
// useMarkedFiles.ts
export function useMarkedFiles() {
  const [markedFiles, setMarkedFiles] = useState<Set<string>>(new Set());

  const markFile = useCallback((filePath: string) => {
    setMarkedFiles(prev => {
      const next = new Set(prev);
      next.add(filePath);
      return next;
    });
  }, []);

  const unmarkFile = useCallback((filePath: string) => {
    setMarkedFiles(prev => {
      const next = new Set(prev);
      next.delete(filePath);
      return next;
    });
  }, []);

  const isMarked = useCallback((filePath: string) => {
    return markedFiles.has(filePath);
  }, [markedFiles]);

  const deleteAllMarked = useCallback(async () => {
    const paths = Array.from(markedFiles);

    // Delete in parallel
    await Promise.all(paths.map(async (path) => {
      try {
        await commands.moveToTrash(path);
      } catch (err) {
        console.error(`Failed to delete ${path}:`, err);
      }
    }));

    // Clear marked set
    setMarkedFiles(new Set());

    // Update session stats
    const [count, bytes] = await commands.getSessionStats();
    return { count, bytes };
  }, [markedFiles]);

  return {
    markedFiles,
    markedCount: markedFiles.size,
    markFile,
    unmarkFile,
    isMarked,
    deleteAllMarked,
    clearMarked: () => setMarkedFiles(new Set()),
  };
}
```

### Two-Shot Deletion Logic
```typescript
// App.tsx integration with existing file blocks
const { markedFiles, isMarked, markFile, unmarkFile, deleteAllMarked } = useMarkedFiles();

function handleProjectileHit(filePath: string) {
  if (isMarked(filePath)) {
    // Second hit - delete immediately
    commands.moveToTrash(filePath).then(() => {
      unmarkFile(filePath);
      // Trigger de-rez animation
      // Remove from scene
    });
  } else {
    // First hit - mark for deletion
    markFile(filePath);
    // Trigger pulsing glow + color shift
  }
}

// Batch delete on keyboard shortcut
const [, get] = useKeyboardControls<Controls>();
useFrame(() => {
  if (get().batchDelete && markedFiles.size > 0) {
    deleteAllMarked();
  }
});
```

### De-Rez Dissolution Effect (Conceptual)
```typescript
// FileBlock with dissolution animation
function FileBlock({ filePath, marked, deleting }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    if (marked) {
      // Pulsing glow for marked state
      const pulse = Math.sin(clock.elapsedTime * 4) * 0.5 + 0.5;
      meshRef.current.material.emissiveIntensity = 1 + pulse;
    }

    if (deleting) {
      // De-rez effect - scale down and fade out
      const progress = Math.min(deletionProgress / deletionDuration, 1);
      meshRef.current.scale.setScalar(1 - progress);
      meshRef.current.material.opacity = 1 - progress;

      // Pixelation via custom shader (advanced)
      // Or use particle burst effect on deletion
    }
  });

  return <mesh ref={meshRef}>...</mesh>;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual keydown/keyup listeners | Drei KeyboardControls | Drei v2+ (2020) | Cleaner code, automatic cleanup, multi-key support |
| Physics engines for arcade movement | Direct position manipulation | N/A | Simpler, lower overhead for instant movement |
| Separate HTML canvas for minimap | Drei Hud component with second scene | Drei v9+ (2022) | Better integration, consistent rendering pipeline |
| Manual dispose() calls everywhere | R3F automatic disposal | R3F v5+ (2019) | Prevents memory leaks, less boilerplate |
| clock.getDelta() per component | useFrame delta parameter | R3F v6+ (2020) | Consistent delta across components, no clock flushing issues |
| OrbitControls for camera | Custom useFrame-based camera rig | N/A | Full control for gameplay camera vs orbital inspection |

**Deprecated/outdated:**
- **PointerLockControls for FPS:** Not suitable for third-person tank controls with independent turret
- **@react-three/cannon physics:** Overkill for instant arcade movement, adds complexity
- **THREE.MeshLine for projectile trails:** Package maintenance issues, better to use postprocessing bloom

## Open Questions

1. **Projectile Trail Visual Implementation**
   - What we know: User wants "light trail" on projectiles, Tron aesthetic
   - What's unclear: Best approach - MeshLine, postprocessing bloom, or particle system?
   - Recommendation: Start with postprocessing bloom (already in use), add MeshLine if bloom insufficient. Bloom is lower complexity and consistent with existing effects.

2. **Minimap Dot Styling Details**
   - What we know: Radar-style circular minimap, dots for files/folders, bottom-left position
   - What's unclear: Should minimap be 3D scene with orthographic camera or 2D HTML canvas overlay?
   - Recommendation: HTML canvas overlay is simpler to implement and style, better performance for 2D elements. Reserve 3D approach if need actual mesh rendering in minimap.

3. **Collision Detection Frequency**
   - What we know: Need to detect tank entering portals
   - What's unclear: Check every frame or less frequently? Performance impact with many portals?
   - Recommendation: Check every frame initially (simple bounding box checks are cheap). Optimize to spatial partitioning only if profiling shows issues (unlikely with <50 portals).

4. **Camera "Follows Turret Aim" Implementation**
   - What we know: Camera should shift toward turret aim direction
   - What's unclear: How much shift? Full lookAt turret direction or subtle offset?
   - Recommendation: Blend camera lookAt between tank center (70%) and turret aim point (30%). User has discretion to tune exact blend factor during implementation.

5. **Marked File Persistence Across Navigation**
   - What we know: User can mark files then navigate to different directory
   - What's unclear: Should marks persist when returning to directory, or clear on navigation?
   - Recommendation: Clear marks on directory change (simpler mental model, avoids stale state). User can decide to implement persistence if needed.

## Sources

### Primary (HIGH confidence)
- [Drei KeyboardControls Documentation](https://drei.docs.pmnd.rs/controls/keyboard-controls) - API reference and usage patterns
- [React Three Fiber Basic Animations](https://r3f.docs.pmnd.rs/tutorials/basic-animations) - useFrame hook and delta time
- [Kyle Madkins: Framerate-Independent Movement](https://kylemadkins.com/blog/movement-react-three-fiber/) - Delta time best practices
- [Drei Html Component](https://drei.docs.pmnd.rs/misc/html) - HTML overlay integration
- [Drei Hud Component](https://drei.docs.pmnd.rs/portals/hud) - HUD rendering layer
- [R3F Performance Pitfalls](https://docs.pmnd.rs/react-three-fiber/advanced/pitfalls) - Official performance guide
- [R3F Automatic Disposal](https://gracious-keller-98ef35.netlify.app/docs/api/automatic-disposal/) - Memory management

### Secondary (MEDIUM confidence)
- [React Three Fiber Tutorials: Follow Cam](https://sbcode.net/react-three-fiber/follow-cam/) - Third-person camera pattern
- [Wawa Sensei: Third Person Controller Tutorial](https://wawasensei.dev/tuto/third-person-controller-react-three-fiber-tutorial) - Complete controller implementation
- [Wawa Sensei: Minimap Tutorial](https://wawasensei.dev/tuto/how-to-build-a-minimap-with-threejs) - Minimap with Drei View
- [Three.js Tutorials: Raycaster](https://sbcode.net/threejs/raycaster/) - Raycasting fundamentals
- [Three.js Tutorials: Raycaster Collision Detection](https://sbcode.net/threejs/raycaster2/) - Hit detection patterns
- [MDN: Bounding Volume Collision Detection](https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_collision_detection/Bounding_volume_collision_detection_with_THREE.js) - Box3 intersection
- [Codrops: Dissolve Effect with Shaders and Particles](https://tympanus.net/codrops/2025/02/17/implementing-a-dissolve-effect-with-shaders-and-particles-in-three-js/) - De-rez animation technique
- [Introduction to Object Pooling in Three.js](https://kingdavvid.hashnode.dev/introduction-to-object-pooling-in-threejs) - Performance pattern
- [100 Three.js Tips (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips) - Current best practices
- [Medium: Managing Selection States in React](https://medium.com/@rakibshakib/efficiently-managing-selection-states-in-react-a-comprehensive-guide-8ed00f173adb) - Set-based selection pattern

### Tertiary (LOW confidence - WebSearch only)
- Various R3F GitHub discussions on keyboard controls, disposal, and camera systems
- Community examples and CodeSandbox demos referenced in searches
- Tauri v2 file system documentation and trash implementation discussions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All packages verified in package.json, versions current, official documentation available
- Architecture patterns: HIGH - Patterns drawn from official Drei/R3F docs and verified tutorials with working code examples
- Pitfalls: MEDIUM-HIGH - Common issues documented in official performance guide and community discussions, some based on general Three.js/React patterns
- Code examples: MEDIUM - Adapted from official examples and tutorials, not tested in this specific codebase

**Research date:** 2026-02-16
**Valid until:** ~2026-03-16 (30 days - stable ecosystem, slow-moving updates)

**Notes:**
- React Three Fiber and Three.js ecosystem is mature and stable
- No breaking changes expected in this timeframe
- User requirements are specific and locked, reducing architectural exploration needed
- Existing Phase 2 foundation provides clear integration points
- Tauri backend already handles file deletion, no additional dependencies needed
