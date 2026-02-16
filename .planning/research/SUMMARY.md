# Project Research Summary

**Project:** TankDelete
**Domain:** Browser-based 3D file management game with filesystem integration
**Researched:** 2026-02-16
**Confidence:** HIGH

## Executive Summary

TankDelete is a browser-based 3D tank game that transforms file management into an engaging gameplay experience. Users navigate filesystem directories as 3D environments, shooting files to mark and delete them through a two-shot safety system. Research confirms this unique combination of gaming and utility is technically feasible using modern web standards (Three.js, WebGPU, Tauri v2), with clear architectural patterns from browser game development and established UX patterns from disk analyzer tools (WinDirStat, DaisyDisk).

The recommended approach uses Tauri v2 for reliable filesystem access (critical - browser File System Access API lacks 66% browser support and has no native trash integration), Three.js with instanced rendering for performance at scale (hundreds of files per directory), and a safety-first architecture with custom trash folder and undo stack. The key technical risk is performance degradation with large directories (500+ files), mitigated through InstancedMesh rendering, spatial partitioning for raycasting, and aggressive GPU resource disposal. The key UX risk is making file deletion feel too game-like, mitigated through two-shot confirmation, recycle bin safety net, and careful UI feedback.

The roadmap should prioritize safety infrastructure (trash system, permissions, undo) in Phase 1 before any gameplay mechanics. Performance optimization must be architectural from the start - instancing, disposal patterns, and raycasting optimization cannot be retrofitted without major refactoring.

## Key Findings

### Recommended Stack

Modern browser 3D games are production-ready in 2026 with Three.js r182+, which provides zero-config WebGPU support with automatic WebGL 2 fallback. Tauri v2 is critical for this project - it provides full cross-platform filesystem access where browser APIs fall short (34% support, no Firefox/Safari, no native trash integration). Vite 7 offers the fastest build experience with instant HMR and tree-shaking for minimal bundles.

**Core technologies:**
- **Three.js r182+**: Industry standard WebGL renderer with WebGPU support, handles complex scenes efficiently
- **Tauri v2**: Desktop framework providing full filesystem access, native trash integration, 10x smaller than Electron
- **TypeScript 5.7+**: Static typing essential for complex game logic and Three.js integration
- **Vite 7**: Modern build tool with fastest HMR, native ESM, requires Node.js 20.19+
- **Zustand 5.0+**: Lightweight state management created by React Three Fiber team, minimal boilerplate
- **Rapier3d-compat 0.15+**: WASM-based physics engine, 2-5x faster than cannon-es for collision detection
- **@pmndrs/postprocessing**: Optimized bloom and glow effects for Tron aesthetic, more performant than Three.js built-in

**Critical version dependencies:**
- three@0.182.0 must match @types/three@0.182.0 exactly
- Vite 7.x requires Node.js 20.19+ or 22.12+ (Node 18 dropped)
- Tauri 2.x requires Rust 1.77.2+ toolchain

### Expected Features

Research shows clear feature expectations from two domains: browser 3D games (WASD controls, 60 FPS, visual feedback) and disk analyzer tools (file size visualization, color coding, hierarchical navigation).

**Must have (table stakes):**
- **File picker on launch** - Standard entry point, users expect directory selection dialog
- **WASD + mouse controls** - Universal gaming standard, anything else feels broken
- **File size visualization** - Core value prop of disk analyzers, geometry scaling by file size
- **File type color coding** - Visual differentiation, universally used in file managers
- **Two-shot delete system** - Prevents accidents, standard for destructive actions
- **Send to recycle bin** - Users expect undo capability, permanent deletion is scary
- **Folder navigation** - Portal gates to traverse directories, breadcrumb trail for context
- **Performance with 100s of files** - Must use InstancedMesh, target <1000 draw calls
- **Hover tooltips** - Show filename/size without cluttering scene

**Should have (competitive advantage):**
- **Tron aesthetic** - Neon grid, cyberpunk UI makes tedious task engaging and memorable
- **Gamification** - Scoring, achievements transform chore into game (87% more engagement)
- **Third-person tank camera** - More engaging than static view, smooth interpolation to prevent motion sickness
- **File type geometry shapes** - Visual differentiation beyond color aids pattern recognition
- **Minimap** - Standard in games, novel in file tools, helps navigation in large directories
- **Batch operations mode** - Power users want multi-select efficiency
- **Undo stack (Ctrl+Z)** - Superior to recycle bin, immediate confidence builder
- **Particle explosions** - Visceral satisfaction, game feel, scales with file size

**Defer (v2+):**
- **Folder boss battles** - High complexity, risks making deletion feel game-y vs. intentional
- **Network drive support** - Security nightmare, requires enterprise features, audit logs
- **Cloud storage integration** - Each API (Dropbox, Drive) is major work, syncing complexity
- **VR mode** - Niche audience, motion sickness risk, doubles development cost
- **Mobile version** - Touch controls don't work for twin-stick gameplay, limited filesystem APIs

### Architecture Approach

Browser 3D games follow an Entity-Component-System (ECS) pattern with clear separation between game logic (update loop), rendering (Three.js scene graph), and data layers (filesystem bridge). The game loop uses fixed update timestep for physics consistency with variable rendering for smoothness, while instanced rendering is essential for handling hundreds of similar objects (file blocks) in a single draw call.

**Major components:**
1. **Game Loop** - requestAnimationFrame with delta time tracking for framerate-independent updates
2. **Entity System** - Manages game objects (tank, files, folders) with component-based architecture
3. **Collision System** - Raycaster for selection, bounding boxes for movement, spatial partitioning for performance
4. **Filesystem Bridge** - Tauri IPC wrapper providing directory reading and native trash integration
5. **Scene Manager** - Three.js scene graph with InstancedMesh for files, custom Tron-themed materials
6. **Resource Manager** - Asset loading with caching, geometry/material pooling prevents memory leaks
7. **State Manager** - Tracks game state (playing, paused, marking mode) with Zustand
8. **Effects Manager** - Particle systems and selective bloom for neon glow without performance hit

**Critical architectural patterns:**
- **Geometry instancing** - Use InstancedMesh for files of same type (reduces 500+ draw calls to ~5)
- **Object pooling** - Reuse geometries/materials, explicit disposal on scene changes prevents GPU memory leaks
- **Event bus** - Decoupled communication between systems (collision emits events, marking listens)
- **Spatial partitioning** - Octree for raycasting optimization (essential with 500+ objects)

### Critical Pitfalls

Research identified 8 critical pitfalls with severe user impact that must be addressed architecturally:

1. **No Safety Net - Permanent File Deletion** - File System Access API remove() permanently deletes with no native trash. Must implement custom trash folder with metadata tracking in IndexedDB, multi-stage confirmation, and undo stack. Address in Phase 1 - cannot be retrofitted.

2. **Permission Fatigue and Double Prompts** - Users bombarded with permission requests. Must request read+write together upfront, store directory handles in IndexedDB for persistent access, provide clear "why we need this" messaging. Address in Phase 1 - permission flow is foundation.

3. **WebGL Memory Leaks from Undisposed Objects** - GPU resources accumulate as users navigate folders, causing crashes. Must explicitly call .dispose() on all geometries/materials/textures when removing objects, use object pooling, monitor renderer.info.memory during development. Address in Phase 2 - must be built into file visualization from start.

4. **Raycasting Performance Collapse** - Mouse-based shooting with 500+ files causes FPS drop to 10-15. Must use spatial partitioning (octree), limit raycast frequency (not every frame), exclude non-interactive objects via layers. Address in Phase 3 - raycasting optimization is architectural.

5. **Bloom Effect Performance Overhead** - Full-screen bloom at native resolution halves FPS. Must use selective bloom (only neon objects), render at 50% resolution, use @pmndrs/postprocessing for optimization. Address in Phase 4 - visual effects should be optimized from implementation.

6. **Pointer Lock Breaking User Expectations** - FPS controls trap users without clear exit. Must handle ESC key, provide visible "Click to Play" prompt, detect support, implement mobile fallback (touch controls). Address in Phase 3 - controls are fundamental.

7. **WASD Controls Breaking on Non-QWERTY** - Using KeyboardEvent.key instead of .code breaks for 40% of users (AZERTY, DVORAK). Must use event.code for physical position, test on multiple layouts. Address in Phase 3 - simple fix but architectural.

8. **State Sync Between Filesystem and Game** - Files deleted externally cause crashes when game references stale handles. Must re-read directory on folder entry, validate file handles before operations, graceful error handling. Address in Phase 2 - file I/O error handling cannot be bolted on.

## Implications for Roadmap

Based on research, a 4-5 phase structure prioritizing safety and performance foundations before gameplay polish:

### Phase 1: Safety Infrastructure and Core Foundation
**Rationale:** Safety systems must be designed in from day one - retrofitting trash/undo is error-prone and risky. Permission handling is foundational to everything else. No user-facing gameplay yet, but establishes non-negotiables.

**Delivers:**
- Tauri app scaffold with filesystem IPC bridge
- Permission request flow with persistent handles in IndexedDB
- Custom trash folder system with metadata tracking
- Undo stack implementation (last 10 actions)
- Basic game loop with delta time tracking
- Input manager capturing keyboard/mouse events
- State manager with Zustand

**Addresses features:**
- Send to recycle bin (table stakes)
- Undo last action (differentiator)
- File picker on launch (table stakes)

**Avoids pitfalls:**
- No Safety Net - implements trash before any deletion
- Permission Fatigue - stores handles, requests minimal permissions upfront
- State Sync Issues - establishes error handling patterns for file operations

**Research flag:** SKIP - Well-documented patterns (Tauri IPC, IndexedDB storage, undo stacks)

### Phase 2: File Visualization and Performance Architecture
**Rationale:** Must establish instancing and disposal patterns before building gameplay on top. Performance optimization is architectural - cannot be added later. Users see something meaningful (their files as 3D objects) validating core concept.

**Delivers:**
- Three.js scene with Tron grid environment
- Directory reader parsing filesystem into entity data
- FileEntity with instanced rendering (InstancedMesh per file type)
- Resource manager with geometry/material pooling
- Explicit disposal on folder navigation
- File size-based scaling, color coding by type
- Camera controller (basic third-person view)
- Memory monitoring (renderer.info tracking)

**Addresses features:**
- File size visualization (table stakes)
- File type color coding (table stakes)
- Performance with 100s of files (table stakes)
- Tron aesthetic - neon grid (differentiator)

**Avoids pitfalls:**
- WebGL Memory Leaks - implements disposal patterns from start
- State Sync Issues - validates file handles, handles missing files gracefully

**Uses stack:**
- Three.js with InstancedMesh for performance
- @gltf-transform for asset optimization
- MaterialLibrary for Tron aesthetic

**Research flag:** SKIP - Browser 3D rendering well-documented, established patterns for instancing

### Phase 3: Interaction System and Tank Mechanics
**Rationale:** Now that we can visualize files safely and performantly, add the core gameplay loop. Raycasting optimization must be built in from start, not added later. This completes the minimum playable experience.

**Delivers:**
- Tank entity with WASD movement (KeyboardEvent.code)
- Pointer Lock API with ESC exit handling
- Collision system with spatial partitioning (octree)
- Raycasting with performance optimization (layer filtering, distance culling)
- Shooting system - projectile spawning and lifecycle
- Two-shot marking system (mark on first hit, delete on second)
- Folder portal navigation (drive through to change directories)
- Basic collision physics with Rapier
- Hover tooltips showing file metadata
- Breadcrumb trail for navigation context

**Addresses features:**
- WASD + mouse controls (table stakes)
- Two-shot delete system (table stakes)
- Folder navigation (table stakes)
- Hover tooltips (table stakes)
- Third-person tank camera (differentiator)

**Avoids pitfalls:**
- Raycasting Performance Collapse - implements octree and optimization from start
- Pointer Lock Breaking Expectations - handles ESC, shows UI indicators
- WASD on Non-QWERTY - uses event.code not event.key
- No Safety Net - integrates with Phase 1 trash system

**Uses stack:**
- Rapier3d for physics collisions
- Three.js Raycaster with optimization
- Pointer Lock API

**Research flag:** NEEDS RESEARCH - Octree integration (three-mesh-bvh), performance tuning for target hardware may need iteration

### Phase 4: Visual Polish and Game Feel
**Rationale:** Core mechanics working, now add the satisfying feedback that makes deletion feel good. Selective bloom must be optimized from implementation. This completes the MVP feature set.

**Delivers:**
- Particle effects on shot impact and deletion (three.quarks)
- Selective bloom on neon objects only (@pmndrs/postprocessing)
- Bloom at 50% resolution with optimization
- Scoring system (points per MB deleted)
- Visual feedback animations (color flash on hit, explosion on delete)
- File type geometry shapes (documents = blocks, images = planes, etc.)
- Enhanced camera smoothing and collision avoidance
- Sound effects (shots, explosions, ambient)
- HUD overlay (current directory, score, controls hint)

**Addresses features:**
- Scoring system (table stakes for MVP)
- Visual feedback on actions (table stakes)
- Particle explosion on delete (differentiator)
- File type geometry shapes (differentiator)
- Tron aesthetic - glow effects (differentiator)

**Avoids pitfalls:**
- Bloom Performance Overhead - selective bloom at reduced resolution from start

**Uses stack:**
- @pmndrs/postprocessing for optimized effects
- Three.quarks for GPU particle systems
- Custom shaders for neon glow

**Research flag:** SKIP - Post-processing optimization well-documented

### Phase 5: Power User Features and Refinement
**Rationale:** MVP is complete and validated. Add features that improve UX for power users without changing core mechanics. These are polish features that can be added incrementally based on user feedback.

**Delivers:**
- Minimap with orthographic projection
- Batch operations mode (multi-select before delete)
- Achievements system (freed 1GB, deleted 100 files, etc.)
- Graphics quality settings (Low/Medium/High)
- Progressive Web App capabilities
- Loading screen with progress indicator
- Enhanced error messaging and recovery
- Accessibility improvements (keyboard-only mode, high contrast)

**Addresses features:**
- Minimap (differentiator)
- Batch operations mode (differentiator)
- Gamification - achievements (differentiator)
- PWA capabilities (differentiator)

**Research flag:** SKIP - Standard patterns for all these features

### Phase Ordering Rationale

**Safety before gameplay:** Trash system and permissions must exist before users can delete anything. These cannot be retrofitted without high risk of data loss.

**Performance is architectural:** Instancing and disposal patterns must be established before building complex interactions on top. Raycasting optimization requires spatial data structures that affect entity storage.

**Visual polish last:** Bloom and particles don't affect core architecture, can be added once mechanics work. However, they must still be optimized from implementation (not "add now, optimize later").

**Dependencies flow downward:**
- Phase 3 requires Phase 2's entity system and Phase 1's trash integration
- Phase 4 requires Phase 3's shooting mechanics to add visual feedback
- Phase 5 enhances Phase 3's navigation and Phase 4's gamification

**Risk mitigation through staging:**
- Phase 1-2 deliver no user-facing gameplay but establish safety and performance foundations
- Phase 3 completes minimum playable experience for validation
- Phase 4-5 are polish that can be scoped down if needed

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 3:** Octree integration specifics (three-mesh-bvh library API, performance tuning for target hardware). While well-documented, optimal implementation may require experimentation with scene size and object counts.

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** Tauri IPC, IndexedDB storage, undo stacks - all well-documented with established patterns
- **Phase 2:** Three.js instanced rendering, memory management - extensively documented with best practices
- **Phase 4:** Post-processing optimization, particle systems - library documentation sufficient
- **Phase 5:** Standard web features - PWA, settings UI, minimap - all well-documented

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Three.js, Tauri, Vite all have official docs, current releases verified, version compatibility confirmed. Only uncertainty is Rapier physics integration complexity (medium confidence). |
| Features | HIGH | Clear expectations from two established domains (browser games + disk analyzers). Feature dependencies well understood. Anti-features clearly identified through research. |
| Architecture | HIGH | ECS patterns, game loops, instanced rendering all well-documented with examples. Three.js performance optimization extensively covered (100+ tips article, official guides). |
| Pitfalls | HIGH | All critical pitfalls verified through multiple sources. File System Access API limitations confirmed in official docs. Three.js memory leak patterns documented with solutions. |

**Overall confidence:** HIGH

### Gaps to Address

**Actual directory scan performance:** Research shows patterns and best practices, but need to test File System Access API with real 1000+ file directories to measure performance. MFT direct read (like WizTree) not available in browser - need to verify async iteration doesn't block UI.

**Cross-browser compatibility specifics:** File System Access API support varies - Chrome/Edge excellent, Safari 26+ good, Firefox still behind flag. Need to verify actual Tauri behavior on each platform since it uses native filesystem (not browser API).

**Octree library performance tuning:** While three-mesh-bvh is well-documented, optimal parameters (max depth, max objects per node) will depend on actual scene characteristics. May need experimentation during Phase 3.

**Selective bloom implementation details:** @pmndrs/postprocessing docs good, but exact integration with InstancedMesh may need testing. Need to verify performance impact on low-end GPUs (integrated graphics).

**Tauri trash integration:** Confirmed Tauri can move files to OS trash, but need to verify exact API and error handling across platforms (macOS, Windows, Linux have different trash specifications).

**WebGPU fallback behavior:** Three.js automatic fallback documented, but need to test actual degradation on WebGL-only devices. Instancing performance may differ significantly between WebGPU and WebGL.

## Sources

### Primary Sources (HIGH confidence)

**Stack & Technology:**
- [Three.js GitHub Releases](https://github.com/mrdoob/three.js/releases) - r182 verification, WebGPU support confirmation
- [Vite Documentation](https://vite.dev/blog/announcing-vite7) - Vite 7 features, Node.js requirements
- [Tauri 2.0 Official Release](https://v2.tauri.app/blog/tauri-20/) - Mobile support, plugin system, IPC improvements
- [File System Access API Browser Support](https://caniuse.com/native-filesystem-api) - 34.29% global support data
- [Chrome File System Access API Docs](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access) - Permission model, limitations

**Performance & Optimization:**
- [100 Three.js Performance Tips (2025)](https://www.utsubo.com/blog/threejs-best-practices-100-tips) - Draw calls, instancing, memory management
- [Building Efficient Three.js Scenes (Feb 2025)](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/) - Recent optimization guide
- [Instanced Rendering in Three.js](https://waelyasmina.net/articles/instanced-rendering-in-three-js/) - InstancedMesh patterns
- [Three.js Instances: Rendering Multiple Objects](https://tympanus.net/codrops/2025/07/10/three-js-instances-rendering-multiple-objects-simultaneously/) - Performance characteristics

**Features & UX:**
- [MDN File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) - Official specification
- [NN/G Tooltip Guidelines](https://www.nngroup.com/articles/tooltip-guidelines/) - UX best practices
- [Cloudscape Delete Patterns](https://cloudscape.design/patterns/resource-management/delete/delete-with-additional-confirmation/) - Safety patterns for destructive actions

**Game Architecture:**
- [3D Games on the Web - MDN](https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_on_the_web) - Browser game fundamentals
- [Game Loop Pattern](https://gameprogrammingpatterns.com/game-loop.html) - Fixed timestep architecture
- [Desktop Mouse and Keyboard Controls - MDN](https://developer.mozilla.org/en-US/docs/Games/Techniques/Control_mechanisms/Desktop_with_mouse_and_keyboard) - Input handling

**Critical Pitfalls:**
- [Persistent Permissions for File System Access API](https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api) - Chrome 119+ permission model
- [Fixing Performance Drops and Memory Leaks in Three.js](https://www.mindfulchase.com/explore/troubleshooting-tips/frameworks-and-libraries/fixing-performance-drops-and-memory-leaks-in-three-js-applications.html) - Disposal patterns
- [WASD Controls on the Web: Use KeyboardEvent.code](https://www.bram.us/2022/03/31/wasd-controls-on-the-web/) - Keyboard layout handling

### Secondary Sources (MEDIUM confidence)

**Stack Comparisons:**
- [Tauri vs Electron 2025 Comparison](https://www.raftlabs.com/blog/tauri-vs-electron-pros-cons/) - Bundle size, security, performance data
- [Three.js Game Development Best Practices 2025](https://playgama.com/blog/general/master-browser-based-game-development-with-three-js/) - Asset optimization, architecture patterns
- [Rapier vs Cannon-es Physics Comparison](https://threejs-journey.com/lessons/physics) - Performance benchmarks

**Features & Competition:**
- [WinDirStat vs TreeSize Comparison](https://appmus.com/vs/windirstat-vs-treesize) - Competitor feature analysis
- [DaisyDisk Official Site](https://daisydiskapp.com/) - UX patterns for disk visualization
- [Gamification: Development & Accomplishment](https://yukaichou.com/gamification-study/8-core-drives-gamification-2-development-accomplishment/) - 87% engagement stat

**Architecture Patterns:**
- [Three.js Project Structure](https://pierfrancesco-soffritti.medium.com/how-to-organize-the-structure-of-a-three-js-project-77649f58fa3f) - Organization patterns
- [ECS in JavaScript](https://jsforgames.com/ecs/) - Entity-Component-System implementation
- [Advanced Collision Detection in Three.js](https://moldstud.com/articles/p-advanced-collision-detection-strategies-in-threejs-a-comprehensive-guide-for-developers) - Raycasting optimization strategies

**Library Documentation:**
- [@pmndrs/postprocessing](https://github.com/pmndrs/postprocessing) - Selective bloom implementation
- [three.quarks](https://github.com/Alchemist0823/three.quarks) - GPU particle system
- [glTF-Transform Documentation](https://gltf-transform.dev/) - Draco compression rates

---
*Research completed: 2026-02-16*
*Ready for roadmap: Yes*
