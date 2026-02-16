# Architecture Research

**Domain:** Browser-based 3D game with filesystem integration
**Researched:** 2026-02-16
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   UI     │  │  Camera  │  │  Input   │  │  Audio   │    │
│  │  Overlay │  │ Controls │  │ Manager  │  │ Manager  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
├───────┴─────────────┴─────────────┴─────────────┴───────────┤
│                     Game Logic Layer                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │   Game   │  │  Entity  │  │ Collision│  │  State   │    │
│  │   Loop   │  │  System  │  │  System  │  │ Manager  │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
├───────┴─────────────┴─────────────┴─────────────┴───────────┤
│                     Rendering Layer                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │         Scene Graph (Three.js Scene)                 │    │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐    │    │
│  │  │ Tank   │  │ File   │  │ Folder │  │Effects │    │    │
│  │  │ Mesh   │  │ Meshes │  │Portals │  │Particles│   │    │
│  │  └────────┘  └────────┘  └────────┘  └────────┘    │    │
│  │                WebGL Renderer                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                      Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Filesystem  │  │   Resource   │  │    Game      │      │
│  │   Bridge     │  │   Manager    │  │    State     │      │
│  │   (Tauri)    │  │  (Assets)    │  │   Storage    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Game Loop** | Coordinates update/render cycle at 60 FPS | requestAnimationFrame() with delta time tracking |
| **Input Manager** | Captures keyboard/mouse events | addEventListener for keydown/keyup, pointer lock for mouse |
| **Camera Controls** | Manages player viewpoint and tank movement | Three.js PerspectiveCamera with manual transform updates |
| **Entity System** | Manages game objects (tank, files, folders) | Entity-Component pattern or simple object pool |
| **Collision System** | Detects tank-file, tank-folder, projectile-file interactions | Three.js Raycaster for selection, bounding box for movement |
| **State Manager** | Tracks game state (playing, paused, marking mode) | Finite state machine or simple enum-based state |
| **Scene Graph** | Hierarchical 3D object container | Three.js Scene with Group nodes for organization |
| **WebGL Renderer** | Converts scene graph to pixels | Three.js WebGLRenderer with performance optimizations |
| **Filesystem Bridge** | Reads directories, moves files to trash | Tauri IPC commands to native filesystem APIs |
| **Resource Manager** | Loads and caches textures, geometries, audio | Three.js LoadingManager with asset pooling |

## Recommended Project Structure

```
src/
├── core/                   # Core game engine systems
│   ├── GameLoop.ts         # Main update/render loop with delta time
│   ├── InputManager.ts     # Keyboard/mouse event handling
│   ├── StateManager.ts     # Game state (playing, paused, marking)
│   └── EventBus.ts         # Decoupled component communication
├── entities/               # Game objects
│   ├── Tank.ts             # Player-controlled tank entity
│   ├── FileEntity.ts       # File representations (geometric blocks)
│   ├── FolderPortal.ts     # Folder portal gates
│   └── Projectile.ts       # Tank projectiles
├── systems/                # Entity Component System logic
│   ├── MovementSystem.ts   # Tank movement with WASD
│   ├── CollisionSystem.ts  # Raycasting and bounding box checks
│   ├── ShootingSystem.ts   # Projectile spawning and lifecycle
│   └── MarkingSystem.ts    # Two-shot marking/deletion logic
├── rendering/              # Graphics layer
│   ├── SceneManager.ts     # Three.js scene setup and management
│   ├── CameraController.ts # Camera positioning and mouse look
│   ├── MaterialLibrary.ts  # Reusable Tron-styled materials
│   └── EffectsManager.ts   # Particle systems, glow effects
├── filesystem/             # Native filesystem integration
│   ├── FilesystemBridge.ts # Tauri IPC wrapper
│   ├── DirectoryReader.ts  # Parse directory into entities
│   └── TrashManager.ts     # Move files to OS trash/recycle bin
├── resources/              # Asset loading and caching
│   ├── ResourceManager.ts  # LoadingManager wrapper
│   ├── GeometryPool.ts     # Shared geometries to reduce memory
│   └── TextureCache.ts     # Texture loading and reuse
├── ui/                     # UI overlay
│   ├── HUD.ts              # Current directory, controls hint
│   └── LoadingScreen.ts    # Asset loading progress
└── main.ts                 # Entry point, initialization
```

### Structure Rationale

- **core/:** Shared systems that don't depend on game-specific logic. These could be reused in other projects.
- **entities/:** Each game object type has its own file. Follows single responsibility principle.
- **systems/:** ECS-style systems that operate on entities. Decouples logic from data.
- **rendering/:** Isolates Three.js dependencies. Makes it easier to swap rendering tech if needed.
- **filesystem/:** Platform-specific code isolated behind interfaces. Only this layer knows about Tauri.
- **resources/:** Centralized asset management prevents duplicate loading and memory leaks.

## Architectural Patterns

### Pattern 1: Entity-Component-System (ECS) Lite

**What:** Entities are simple IDs or objects with data. Systems contain the logic that operates on entities with specific components.

**When to use:** When you have many similar objects (hundreds of files) and need to keep logic organized and performant.

**Trade-offs:**
- **Pros:** Clean separation of data and logic, easy to optimize, scales well
- **Cons:** More boilerplate than OOP for small games, requires discipline to maintain

**Example:**
```typescript
// Component: pure data
interface Transform {
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
}

interface Renderable {
  mesh: THREE.Mesh;
}

interface FileData {
  path: string;
  name: string;
  size: number;
  marked: boolean;
}

// Entity: just components
class FileEntity {
  transform: Transform;
  renderable: Renderable;
  fileData: FileData;
}

// System: pure logic
class RenderSystem {
  update(entities: FileEntity[]) {
    entities.forEach(entity => {
      entity.renderable.mesh.position.copy(entity.transform.position);
      entity.renderable.mesh.rotation.setFromQuaternion(entity.transform.rotation);
    });
  }
}
```

### Pattern 2: Game Loop with Fixed Update and Variable Render

**What:** Updates game logic at a fixed timestep (e.g., 60 Hz) while rendering as fast as possible with interpolation.

**When to use:** For physics and collision detection that needs consistent behavior regardless of framerate.

**Trade-offs:**
- **Pros:** Deterministic physics, smooth rendering even with FPS drops
- **Cons:** More complex than naive loop, requires interpolation for smooth visuals

**Example:**
```typescript
class GameLoop {
  private lastTime = 0;
  private accumulator = 0;
  private readonly fixedDeltaTime = 1000 / 60; // 60 Hz

  start() {
    const loop = (currentTime: number) => {
      const deltaTime = currentTime - this.lastTime;
      this.lastTime = currentTime;

      this.accumulator += deltaTime;

      // Fixed update for game logic
      while (this.accumulator >= this.fixedDeltaTime) {
        this.update(this.fixedDeltaTime);
        this.accumulator -= this.fixedDeltaTime;
      }

      // Variable render with interpolation
      const alpha = this.accumulator / this.fixedDeltaTime;
      this.render(alpha);

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  update(dt: number) {
    // Physics, collision, game logic
  }

  render(alpha: number) {
    // Interpolate and render
  }
}
```

### Pattern 3: Geometry Instancing for Hundreds of Similar Objects

**What:** Use THREE.InstancedMesh to render many identical objects (e.g., file blocks) in a single draw call.

**When to use:** When rendering hundreds of objects with the same geometry and material.

**Trade-offs:**
- **Pros:** Massive performance improvement (up to 80% faster), lower memory usage
- **Cons:** All instances share same geometry/material, requires matrix math for positioning

**Example:**
```typescript
class FileInstanceManager {
  private instancedMesh: THREE.InstancedMesh;
  private matrix = new THREE.Matrix4();

  constructor(count: number) {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    this.instancedMesh = new THREE.InstancedMesh(geometry, material, count);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }

  setInstanceTransform(index: number, position: Vector3, rotation: Quaternion) {
    this.matrix.compose(position, rotation, new Vector3(1, 1, 1));
    this.instancedMesh.setMatrixAt(index, this.matrix);
    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }
}
```

### Pattern 4: Event Bus for Decoupled Communication

**What:** Components publish and subscribe to events without knowing about each other.

**When to use:** When many systems need to react to the same events (e.g., file deleted, folder entered).

**Trade-offs:**
- **Pros:** Loose coupling, easy to add new listeners, testable
- **Cons:** Harder to trace data flow, potential for memory leaks if listeners not removed

**Example:**
```typescript
type EventMap = {
  'file:marked': { fileId: string };
  'file:deleted': { fileId: string; path: string };
  'folder:entered': { folderPath: string };
};

class EventBus {
  private listeners = new Map<keyof EventMap, Set<Function>>();

  on<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }
}
```

## Data Flow

### Request Flow: User Shoots File

```
[User clicks mouse]
    ↓
[InputManager] detects mouse button down
    ↓
[ShootingSystem] spawns Projectile entity
    ↓
[Game Loop] updates Projectile position
    ↓
[CollisionSystem] raycasts projectile path
    ↓ (hit detected)
[MarkingSystem] marks FileEntity or deletes if already marked
    ↓
[EventBus] emits 'file:marked' or 'file:deleted'
    ↓
[FilesystemBridge] moves file to trash (if deleted)
    ↓
[RenderSystem] updates FileEntity appearance (glow/disappear)
```

### Request Flow: User Navigates Through Folder Portal

```
[Tank moves to FolderPortal]
    ↓
[CollisionSystem] detects tank-portal overlap
    ↓
[EventBus] emits 'folder:entered' event
    ↓
[DirectoryReader] reads new directory via FilesystemBridge
    ↓
[EntitySystem] despawns old file entities
    ↓
[ResourceManager] disposes old geometries/textures
    ↓
[EntitySystem] spawns new FileEntity and FolderPortal entities
    ↓
[RenderSystem] adds new meshes to scene graph
    ↓
[HUD] updates current directory display
```

### State Management Flow

```
[Game State Store]
    ↓ (subscribe)
[UI Components] ←→ [Game Systems] → [State Actions] → [Game State Store]
    ↓                                                        ↓
[Display updates]                                    [Persistence layer]
```

### Rendering Pipeline

```
[Entity System: positions updated]
    ↓
[Frustum Culling: only visible objects]
    ↓
[Material Batching: group by material]
    ↓
[Scene Graph: hierarchical transforms]
    ↓
[WebGL State Machine: minimize state changes]
    ↓
[GPU: vertex + fragment shaders]
    ↓
[Canvas: final pixels]
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 files | Simple array iteration, no instancing needed, basic raycasting |
| 100-500 files | Use InstancedMesh for files, implement frustum culling, simple object pooling |
| 500-1000 files | Add spatial partitioning (octree), level-of-detail (LOD) system, aggressive culling |
| 1000+ files | Consider virtual scrolling (only render nearby files), worker thread for directory parsing, WebGPU for multi-threaded rendering |

### Scaling Priorities

1. **First bottleneck: Draw calls with 100+ unique meshes**
   - **Problem:** Each file as a separate mesh causes hundreds of draw calls, dropping framerate below 30 FPS
   - **Solution:** Implement InstancedMesh for files with same shape. Reduces draw calls from 500+ to ~5
   - **Implementation:** Group files by type, use one InstancedMesh per file type

2. **Second bottleneck: Collision detection with 500+ entities**
   - **Problem:** Naive raycast against all entities causes input lag when selecting files
   - **Solution:** Implement spatial partitioning (octree or uniform grid) to cull distant objects
   - **Implementation:** Only raycast against objects in camera view frustum + nearby cells

3. **Third bottleneck: Memory leaks from directory navigation**
   - **Problem:** Loading new directory without disposing old meshes/textures causes memory to grow unbounded
   - **Solution:** Explicit dispose() calls on geometries, materials, textures when switching directories
   - **Implementation:** Track all created resources in ResourceManager, dispose batch on scene change

## Anti-Patterns

### Anti-Pattern 1: Creating New Geometry/Material Per File

**What people do:**
```typescript
files.forEach(file => {
  const geometry = new THREE.BoxGeometry(1, 1, 1); // BAD: new geometry every time
  const material = new THREE.MeshBasicMaterial({ color: 0x00ffff }); // BAD: new material
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
});
```

**Why it's wrong:** Each geometry and material consumes GPU memory. With 500 files, this creates 500 geometries and 500 materials, causing memory bloat and hundreds of draw calls.

**Do this instead:**
```typescript
// Create once, reuse many times
const sharedGeometry = new THREE.BoxGeometry(1, 1, 1);
const sharedMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });

// Option 1: Reuse for individual meshes
files.forEach(file => {
  const mesh = new THREE.Mesh(sharedGeometry, sharedMaterial);
  scene.add(mesh);
});

// Option 2: Use instancing (even better)
const instancedMesh = new THREE.InstancedMesh(sharedGeometry, sharedMaterial, files.length);
```

### Anti-Pattern 2: Removing Objects Without Disposal

**What people do:**
```typescript
// BAD: Only removes from scene, doesn't free GPU memory
scene.remove(mesh);
```

**Why it's wrong:** The geometry, material, and textures remain in GPU memory. After navigating through 10 directories, memory usage has grown 10x even though only one directory is visible.

**Do this instead:**
```typescript
function disposeEntity(mesh: THREE.Mesh) {
  mesh.geometry.dispose();
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach(m => m.dispose());
  } else {
    mesh.material.dispose();
  }
  // Dispose textures if material has them
  if (mesh.material.map) mesh.material.map.dispose();
  if (mesh.material.normalMap) mesh.material.normalMap.dispose();
  scene.remove(mesh);
}
```

### Anti-Pattern 3: Using Browser File System Access API Instead of Tauri

**What people do:** Attempt to use the browser's File System Access API for reading directories and moving files to trash.

**Why it's wrong:**
- File System Access API requires user to manually select directories via picker (terrible UX for a file manager)
- No native "move to trash" support—only permanent deletion via remove()
- Sandboxed with no access to system trash/recycle bin
- Permission prompts on every session

**Do this instead:** Use Tauri (or Electron) to bridge to native filesystem APIs:
```typescript
// Tauri command in Rust backend
#[tauri::command]
async fn read_directory(path: String) -> Result<Vec<FileInfo>, String> {
  // Native filesystem access, no permission prompts
}

#[tauri::command]
async fn move_to_trash(path: String) -> Result<(), String> {
  // Uses platform-specific trash API (FSMoveObjectToTrashSync on macOS, etc.)
}
```

### Anti-Pattern 4: Game Loop Without Delta Time

**What people do:**
```typescript
function gameLoop() {
  tank.position.x += 1; // BAD: speed depends on framerate
  requestAnimationFrame(gameLoop);
}
```

**Why it's wrong:** Tank moves at different speeds on 30 FPS vs 144 FPS displays. Game is unplayable on slower machines.

**Do this instead:**
```typescript
let lastTime = performance.now();

function gameLoop(currentTime: number) {
  const deltaTime = (currentTime - lastTime) / 1000; // in seconds
  lastTime = currentTime;

  const speed = 5; // units per second
  tank.position.x += speed * deltaTime; // framerate-independent

  requestAnimationFrame(gameLoop);
}
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Tauri Backend** | IPC via invoke() | Commands for reading directories, moving to trash, watching filesystem |
| **Three.js** | Scene graph composition | WebGLRenderer, PerspectiveCamera, Mesh, etc. |
| **OS Trash API** | Via Tauri Rust backend | macOS: FSMoveObjectToTrashSync, Windows: SHFileOperation, Linux: Freedesktop spec |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Game Logic ↔ Rendering** | Entity transform updates → Scene graph | Game logic updates entity.transform, RenderSystem syncs to mesh.position |
| **UI ↔ Game Logic** | Event bus + state subscriptions | UI listens to events, dispatches actions to state manager |
| **Systems ↔ Systems** | Event bus (decoupled) | CollisionSystem emits events, MarkingSystem listens |
| **Filesystem Bridge ↔ Game Logic** | Async IPC with promises | DirectoryReader awaits FilesystemBridge.readDirectory() |

## Build Order (Dependencies Between Components)

### Phase 1: Core Infrastructure (No visual output yet)
1. **EventBus** — Foundation for decoupled communication
2. **StateManager** — Track game state
3. **GameLoop** — Update/render cycle with delta time
4. **InputManager** — Capture keyboard/mouse

**Why first:** These are foundation systems that everything else depends on. No point building entities without a game loop to update them.

### Phase 2: Minimal Rendering (See something on screen)
1. **SceneManager** — Three.js scene setup, WebGLRenderer
2. **CameraController** — Position camera, mouse look
3. **MaterialLibrary** — Create Tron-themed materials
4. **Tank entity** — Player-controlled object with basic mesh

**Why second:** Need visual feedback to iterate quickly. Can test input and movement.

### Phase 3: Filesystem Integration (Read real data)
1. **FilesystemBridge** — Tauri IPC wrapper
2. **DirectoryReader** — Parse directory into data structures
3. **FileEntity** — Represent files as entities
4. **ResourceManager** — Load/cache assets, geometry pooling

**Why third:** Now we can render real filesystem data. This is the core value proposition.

### Phase 4: Game Mechanics (Make it playable)
1. **CollisionSystem** — Raycasting and bounding boxes
2. **ShootingSystem** — Projectile spawning
3. **MarkingSystem** — Two-shot delete logic
4. **TrashManager** — Move files to OS trash
5. **FolderPortal** — Navigate directories

**Why fourth:** Builds on all previous layers. Needs rendering, entities, and filesystem bridge.

### Phase 5: Polish (Make it smooth)
1. **EffectsManager** — Particles, glow effects
2. **HUD** — UI overlay with directory info
3. **LoadingScreen** — Asset loading feedback
4. **GeometryPool** — Optimize memory for 500+ files

**Why last:** These improve UX but aren't required for core functionality. Can optimize based on real performance data.

## Performance Optimization Checklist

For handling hundreds of files without lag:

- [ ] Use InstancedMesh for files with same geometry
- [ ] Batch objects by material to reduce draw calls
- [ ] Implement frustum culling (only render visible objects)
- [ ] Use geometry/material pooling (dispose and reuse)
- [ ] Add spatial partitioning for collision detection (octree or grid)
- [ ] Dispose resources when switching directories
- [ ] Use texture atlases for multiple file type icons
- [ ] Consider LOD system for distant files (lower poly count)
- [ ] Profile with Chrome DevTools to identify bottlenecks
- [ ] Test on low-end hardware (integrated GPU, 30 FPS target)

## Sources

**WebGL & Three.js Architecture:**
- [3D games on the Web - MDN](https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_on_the_web)
- [How to organize your Three.js code in a cleaner way](https://pierfrancesco-soffritti.medium.com/how-to-organize-the-structure-of-a-three-js-project-77649f58fa3f)
- [Three.js Scene Graph](https://threejsfundamentals.org/threejs/lessons/threejs-scenegraph.html)
- [Building Efficient Three.js Scenes](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/)

**Game Loop & ECS Patterns:**
- [Game Loop Pattern](https://gameprogrammingpatterns.com/game-loop.html)
- [Update Method Pattern](https://gameprogrammingpatterns.com/update-method.html)
- [Entity-Component-System in A-Frame](https://aframe.io/docs/1.7.0/introduction/entity-component-system.html)
- [ECS in JavaScript](https://jsforgames.com/ecs/)

**Performance Optimization:**
- [Best practices of optimizing game performance with WebGL](https://gamedevjs.com/articles/best-practices-of-optimizing-game-performance-with-webgl/)
- [How to Optimize WebGL for High-Performance 3D Graphics](https://blog.pixelfreestudio.com/how-to-optimize-webgl-for-high-performance-3d-graphics/)
- [Performance Optimization - Troika JS](https://protectwise.github.io/troika/troika-3d/performance/)

**Input & Collision:**
- [Desktop mouse and keyboard controls - MDN](https://developer.mozilla.org/en-US/docs/Games/Techniques/Control_mechanisms/Desktop_with_mouse_and_keyboard)
- [Three.js Raycaster: 2026 Best Practices](https://copyprogramming.com/howto/what-is-three-js-raycaster-exactly-doing)
- [Advanced Collision Detection Strategies in Three.js](https://moldstud.com/articles/p-advanced-collision-detection-strategies-in-threejs-a-comprehensive-guide-for-developers)

**Memory Management:**
- [Fixing Performance Drops and Memory Leaks in Three.js](https://www.mindfulchase.com/explore/troubleshooting-tips/frameworks-and-libraries/fixing-performance-drops-and-memory-leaks-in-three-js-applications.html)
- [Memory management strategies - WebGL and Three.js](https://app.studyraid.com/en/read/11964/381742/memory-management-strategies)

**Filesystem Integration:**
- [File System Access API - Chrome Developers](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)
- [Tauri File System Plugin](https://v2.tauri.app/plugin/file-system/)
- [Send2Trash - Cross-platform trash library](https://pypi.org/project/Send2Trash/)

**State Management:**
- [WebGL State Diagram](https://webglfundamentals.org/webgl/lessons/webgl-state-diagram.html)
- [State Pattern - Game Programming Patterns](https://gameprogrammingpatterns.com/state.html)

---
*Architecture research for: TankDelete - Browser-based 3D tank game with filesystem integration*
*Researched: 2026-02-16*
