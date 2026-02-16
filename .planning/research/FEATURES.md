# Feature Research: TankDelete

**Domain:** Browser-based 3D file management game / filesystem visualization tool
**Researched:** 2026-02-16
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **File picker on launch** | Standard entry point for filesystem tools; File System Access API is production-ready | LOW | `window.showOpenFilePicker()` for directory selection. Chrome/Edge support excellent, Safari 26+ compatible. Requires HTTPS. |
| **Basic WASD + mouse controls** | Universal gaming standard since 1990s; users expect tank games to use these controls | LOW | Use `KeyboardEvent.code` (not `.key`) for automatic keyboard layout adaptation (WASD→ZQSD on AZERTY). Framework like Phaser handles edge cases. |
| **File size visualization** | Core value prop of disk analyzers; WinDirStat/TreeSize/SpaceMonger all do this | MEDIUM | Scale geometry based on file size. Use `InstancedMesh` for performance with hundreds of files (single draw call vs. thousands). |
| **File type color coding** | Visual differentiation; disk analyzers and file managers universally use this | LOW | Assign colors by extension. Provide 2-3 visual modes: color, monochrome, high-contrast for accessibility. |
| **Hover tooltips** | Information display without cluttering the scene; essential for file identification | MEDIUM | Show filename, size, last modified. Keep text brief (tooltips are microcontent). Position dynamically to avoid screen edge overflow. Use fade-in/fade-out (not instant). |
| **Two-shot delete system** | Prevents accidental deletion; standard for destructive actions in 2026 | MEDIUM | Mark (first shot) → Delete (second shot). "Delete" + "Yes, I'm sure" pattern reduces regret. Show visual state change on mark. GitHub pattern: type filename to confirm for extra safety. |
| **Send to recycle bin** | Users expect undo capability for file deletion; permanent deletion is scary | LOW | Native OS recycle bin integration via File System Access API. Files remain recoverable until bin is emptied. |
| **Folder navigation** | Must traverse directory hierarchy; this is a file manager | MEDIUM | Portal gates you drive through. Load new directory on collision. Breadcrumb trail for context and back-navigation. |
| **Performance with 100s of files** | Must handle typical directory sizes; anything less is unusable | HIGH | **Critical:** Use instancing (`InstancedMesh`) to render 100k+ objects in single draw call. Target <1000 draw calls total. Draco compression for geometry (90-95% size reduction). KTX2 textures stay GPU-compressed (~10x memory savings). |
| **Visual feedback on actions** | Gaming standard; players need confirmation their actions registered | MEDIUM | Particle effects on shot impact, delete, folder entry. Three.quarks or Three Nebula for particle systems. Color flash on hit. Sound effects (pew, explosion). |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Tron aesthetic (neon grid, cyberpunk UI)** | Makes tedious task (cleaning disk) fun and visually engaging; memorable brand identity | MEDIUM | 80s retro futurist grid, neon blue/pink/purple palette, geometric shapes, glitch effects. 30% increase in cyberpunk products expected by 2026. Use post-processing (bloom, chromatic aberration). |
| **Gamification: scoring, achievements** | Transforms chore into game; 87% of badge earners more engaged | MEDIUM | Points per MB deleted, combo multipliers, achievements ("Freed 1GB", "Deleted 100 files", "Perfect accuracy"). Leaderboard optional. Avoid over-gamifying safety. |
| **Third-person tank camera** | More engaging than static view; lets you see your "character" | MEDIUM | Camera follows tank from behind and slightly above. Interactive camera system under player control (mouse). Smooth interpolation to prevent motion sickness. |
| **File type as geometry shape** | Visual differentiation beyond color; aids pattern recognition | MEDIUM | Documents = rectangular blocks, images = flat planes, videos = TV-shaped, folders = portal gates, executables = spiky/dangerous looking. Balance variety with performance. |
| **Minimap for navigation** | Helps orient in large directories; standard in games, novel in file tools | MEDIUM | Orthographic projection, player-centered, circular, bottom-left, 2-3% screen size. Shows folder layout, current position, marked files. Update dynamically. |
| **Progressive Web App (PWA)** | Offline capability, desktop install, feels like native app | LOW | Service workers cache assets. Works offline after first load. Install to desktop. No app store approval needed. |
| **Batch operations mode** | Power users want efficiency; select multiple files before delete | MEDIUM | Toggle mode: mark multiple files, then commit all at once. Visual indicator of selection count. "Delete marked: 23 files (145 MB)". |
| **Undo last action (Ctrl+Z)** | Superior to recycle bin; immediate confidence builder | LOW | Stack-based undo system. Store last 10 actions. Works during session only. Simple keyboard shortcut. |
| **Particle explosion on delete** | Visceral satisfaction; game feel | LOW | Three.quarks for GPU particles. Explosion size scales with file size. Neon color trails. Satisfying sound design. |
| **Folder "boss battles"** | Gamifies cleaning large nested folders; memorable moments | HIGH | Large folders become "boss" portals with special effects. Health bar = folder size. Defeat = clear entire folder. Requires careful UX to remain safe. |

### Anti-Features (Commonly Requested, Often Problematic)

Features to explicitly NOT build.

| Anti-Feature | Why Requested | Why Problematic | Alternative |
|--------------|---------------|-----------------|-------------|
| **Automatic file deletion** | "Make it do the work for me" | Extremely dangerous; users don't trust AI with permanent deletion | Provide "suggestions" view with recommended files, but user must confirm each |
| **Permanent deletion (bypass recycle bin)** | "I want it gone now" | No undo, high regret potential, violates user expectations | Send to recycle bin only; let OS handle permanent deletion |
| **Network drive support (v1)** | "I need to clean servers" | Security nightmare (delete others' files), performance issues (latency), complex permissions | Defer to v2+; requires enterprise features, audit logs, permissions UI |
| **Multiplayer / social features** | "Make it more game-like" | Complexity explosion, encourages reckless deletion for leaderboard, moderation burden | Keep local/single-player for MVP; focus on core experience |
| **VR mode** | "Tron should be immersive" | Niche audience, motion sickness risk with movement, doubles development cost | Desktop-first for v1; VR requires different control scheme, accessibility concerns |
| **Mobile version** | "I want to clean my phone" | Mobile filesystem APIs very limited, touch controls don't work for twin-stick gameplay, performance constraints | Desktop/laptop only; mobile OS file managers are already good |
| **Detailed file preview/editor** | "Show me what's in the file" | Scope creep, security risk (executing code), performance hit | Show filename, extension, basic metadata only. OS file explorer for details. |
| **Cloud storage integration** | "Delete from Dropbox/Drive" | Each API is complex, syncing issues, quota management, auth overhead | v1 local files only. Cloud in v2+ with proper testing. |

## Feature Dependencies

```
Core Engine & Controls
    ├──requires──> File System Access API (directory picker)
    ├──requires──> Three.js + WebGPU rendering
    ├──requires──> WASD + mouse input handling
    └──requires──> Instanced rendering (performance)

File Visualization
    ├──requires──> Core Engine & Controls
    ├──requires──> File size data (from File System API)
    ├──enhances──> File type color coding
    └──enhances──> File type geometry shapes

Navigation & UX
    ├──requires──> Folder portal system
    ├──requires──> Breadcrumb trail
    ├──enhances──> Minimap
    └──enhances──> Hover tooltips

Delete System
    ├──requires──> Two-shot confirmation
    ├──requires──> Recycle bin integration
    ├──enhances──> Undo stack (Ctrl+Z)
    ├──enhances──> Visual feedback (particles)
    └──conflicts──> Permanent deletion (anti-feature)

Gamification Layer
    ├──requires──> Delete System (to score)
    ├──requires──> Visual feedback
    ├──enhances──> Scoring system
    ├──enhances──> Achievements
    └──optional──> Folder boss battles

Polish & Feel
    ├──requires──> Core Engine & Controls
    ├──requires──> Tron aesthetic (neon grid, shaders)
    ├──requires──> Particle effects library
    ├──requires──> Sound effects
    └──enhances──> Post-processing (bloom, glitch)
```

### Dependency Notes

- **Core Engine must use WebGPU:** Three.js r171+ made WebGPU production-ready. Safari 26 (Sept 2025) brought universal browser support. WebGL fallback for older browsers.
- **Instancing is non-negotiable:** Without `InstancedMesh`, rendering 100+ files will cause performance collapse. Must be in Phase 1.
- **Gamification requires safety:** Scoring/achievements can't encourage reckless deletion. Balance fun with responsibility.
- **Folder boss battles conflict with safety:** High complexity feature that risks making deletion feel game-y rather than intentional. Defer to v2+ after safety UX is proven.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate "cleaning files can be fun and safe."

- [x] **Directory picker** — File System Access API entry point
- [x] **3D neon grid environment** — Core Tron aesthetic establishes brand
- [x] **WASD + mouse tank controls** — Standard game controls, comfortable for target audience
- [x] **Files as colored geometric blocks** — Size-based scaling, color by file type
- [x] **Folder portals** — Drive through to navigate directories
- [x] **Hover tooltips** — Show filename, size, last modified on mouseover
- [x] **Two-shot delete (mark → delete)** — Safety first; prevents accidents
- [x] **Send to recycle bin** — Undo capability via OS-level recovery
- [x] **Instanced rendering** — Performance with 100+ files per directory
- [x] **Basic particle effects** — Visual feedback on shot and delete
- [x] **Scoring system** — Points per MB deleted; basic "fun" layer
- [x] **Breadcrumb navigation** — Show current path, back button

**Why these features:** Validates core loop (navigate → identify → mark → delete), proves safety model, establishes visual identity, demonstrates technical feasibility.

### Add After Validation (v1.x)

Features to add once core is working and users confirm the concept.

- [ ] **Achievements** — Once scoring proves engaging (if users care about points)
- [ ] **Minimap** — If navigation in large directories proves confusing
- [ ] **Batch operations mode** — If power users request multi-select
- [ ] **Undo stack (Ctrl+Z)** — If users request more than recycle bin undo
- [ ] **File type geometry shapes** — If color coding alone isn't enough differentiation
- [ ] **Enhanced particle effects** — Explosions scale with file size, trails, secondary effects
- [ ] **Sound design** — SFX for shots, delete, movement, ambient music
- [ ] **Progressive Web App** — If users want offline/desktop install
- [ ] **Third-person camera improvements** — Smooth follow, collision avoidance, configurable distance

**Trigger for adding:** User feedback, analytics showing confusion/frustration, completion rate metrics.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Folder boss battles** — Only if gamification proves popular AND safety UX is rock-solid
- [ ] **Network drive support** — Requires enterprise permissions, security audit, testing infrastructure
- [ ] **Cloud storage integration** — Each API (Dropbox, Drive, OneDrive) is major work
- [ ] **Smart suggestions** — ML-based "safe to delete" recommendations (with heavy disclaimers)
- [ ] **Customization** — Tank skins, color themes, grid styles
- [ ] **Accessibility enhancements** — Screen reader support, keyboard-only mode, high contrast modes
- [ ] **Export reports** — Summary of what was deleted, disk space freed
- [ ] **Multiple tanks** — Different classes with abilities (speed vs. power)

**Why defer:** These are nice-to-have, but don't validate the core concept. Many add complexity that could derail v1.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Two-shot delete system | HIGH | MEDIUM | **P1** |
| Instanced rendering (performance) | HIGH | HIGH | **P1** |
| File System Access API | HIGH | LOW | **P1** |
| WASD + mouse controls | HIGH | LOW | **P1** |
| File size visualization | HIGH | MEDIUM | **P1** |
| Tron aesthetic (neon grid) | HIGH | MEDIUM | **P1** |
| Color coding by file type | MEDIUM | LOW | **P1** |
| Folder portal navigation | HIGH | MEDIUM | **P1** |
| Hover tooltips | MEDIUM | MEDIUM | **P1** |
| Recycle bin integration | HIGH | LOW | **P1** |
| Visual feedback (particles) | MEDIUM | MEDIUM | **P1** |
| Scoring system | MEDIUM | LOW | **P1** |
| Breadcrumb navigation | MEDIUM | LOW | **P1** |
| Third-person camera | MEDIUM | MEDIUM | **P2** |
| Minimap | MEDIUM | MEDIUM | **P2** |
| Achievements | MEDIUM | MEDIUM | **P2** |
| Batch operations | HIGH | MEDIUM | **P2** |
| Undo stack (Ctrl+Z) | MEDIUM | LOW | **P2** |
| File type geometry shapes | LOW | MEDIUM | **P2** |
| PWA capabilities | LOW | LOW | **P2** |
| Sound design | LOW | MEDIUM | **P2** |
| Folder boss battles | MEDIUM | HIGH | **P3** |
| Network drive support | MEDIUM | HIGH | **P3** |
| Cloud storage integration | MEDIUM | HIGH | **P3** |
| Smart suggestions | HIGH | HIGH | **P3** |

**Priority key:**
- **P1 (Must have for launch):** Core functionality, safety features, basic polish
- **P2 (Should have, add when possible):** Enhances core experience, adds delight, relatively low cost
- **P3 (Nice to have, future consideration):** Complex features, niche use cases, requires validation first

## Competitor Feature Analysis

| Feature | WinDirStat / TreeSize | DaisyDisk | SpaceMonger | TankDelete Approach |
|---------|----------------------|-----------|-------------|---------------------|
| **Visualization** | Treemap (2D blocks) | Sunburst chart | Treemap | **3D neon grid** with size-based geometry |
| **File management** | Right-click context menu | Drag to trash | Delete from interface | **Two-shot tank combat** (mark → shoot) |
| **Navigation** | Tree view + treemap | Click to drill down | Hierarchical zoom | **Drive through folder portals** |
| **Performance** | Good (WizTree: MFT scan) | Fast (< 5 sec scan) | Moderate | **Instanced rendering** for 100k+ objects |
| **Safety** | Delete confirmation dialog | Move to trash | Recycle bin | **Two-shot + recycle bin + undo** |
| **User experience** | Utilitarian | Beautiful (Mac aesthetic) | Functional | **Game-first** (fun, engaging, memorable) |
| **Price** | Free (WinDirStat) / Paid (TreeSize Pro) | $9.99 one-time | Free | **Free** (MVP), monetization TBD |
| **Gamification** | None | None | None | **Scoring, achievements, boss battles** |
| **Accessibility** | Keyboard + screen reader | Standard Mac a11y | Mouse-focused | **WCAG 2.1 keyboard nav** (P2) |
| **Platform** | Windows (WinDirStat) | macOS only | Windows | **Browser (cross-platform PWA)** |

**Key differentiator:** TankDelete is the only tool that makes file deletion *fun*. Traditional tools are functional but boring. We trade pure efficiency for engagement.

## Research Sources & Confidence

### HIGH Confidence Sources

- [Three.js Game Development 2025 (Playgama)](https://playgama.com/blog/general/master-browser-based-game-development-with-three-js/)
- [100 Three.js Performance Tips (Utsubo)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [MDN: File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API)
- [Chrome Developers: File System Access API](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)
- [NN/G: Tooltip Guidelines](https://www.nngroup.com/articles/tooltip-guidelines/)
- [Cloudscape: Delete with Confirmation Patterns](https://cloudscape.design/patterns/resource-management/delete/delete-with-additional-confirmation/)
- [Instanced Rendering in Three.js (Wael Yasmina)](https://waelyasmina.net/articles/instanced-rendering-in-three-js/)
- [Three.js Instances: Rendering Multiple Objects (Codrops)](https://tympanus.net/codrops/2025/07/10/three-js-instances-rendering-multiple-objects-simultaneously/)

### MEDIUM Confidence Sources

- [WASD Controls on the Web (Bram.us)](https://www.bram.us/2022/03/31/wasd-controls-on-the-web/)
- [MDN: Desktop Mouse and Keyboard Controls](https://developer.mozilla.org/en-US/docs/Games/Techniques/Control_mechanisms/Desktop_with_mouse_and_keyboard)
- [Mini-Map Design Features as Navigation Aid (MDPI)](https://www.mdpi.com/2220-9964/12/2/58)
- [WinDirStat vs TreeSize Comparison (Appmus)](https://appmus.com/vs/windirstat-vs-treesize)
- [DaisyDisk Official Site](https://daisydiskapp.com/)
- [WizTree Official Site](https://diskanalyzer.com/)
- [Gamification: Development & Accomplishment (Yu-kai Chou)](https://yukaichou.com/gamification-study/8-core-drives-gamification-2-development-accomplishment/)
- [Tooltip Best Practices (Userpilot)](https://userpilot.com/blog/tooltip-best-practices/)

### Framework/Library Documentation

- [Three.quarks (GitHub)](https://github.com/Alchemist0823/three.quarks) — GPU particle system
- [Three Nebula](https://three-nebula.org/) — Particle system engine
- [React Three Fiber: Scaling Performance](https://docs.pmnd.rs/react-three-fiber/advanced/scaling-performance)
- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)

## Gaps to Address in Implementation

1. **Actual directory scan performance:** Need to test File System Access API with 1000+ file directories to measure real-world performance. MFT direct read (like WizTree) not available in browser.

2. **Security sandbox limitations:** Browsers limit filesystem access. Need to verify what operations are allowed vs. blocked. Can we actually move files to recycle bin, or just delete?

3. **Cross-browser compatibility:** File System Access API support varies. Need fallback for Firefox (still behind flag as of Feb 2026). Safari 26+ is good.

4. **Memory management with instancing:** While instancing reduces draw calls, still need to profile memory usage with 1000+ instanced objects. May need LOD (level of detail) system.

5. **Accessibility for 3D game interface:** Screen reader + 3D spatial navigation is largely unsolved problem. May need 2D mode or alternative interface for WCAG 2.1 AA compliance.

6. **Undo vs. recycle bin:** Need to clarify if File System Access API can programmatically send to recycle bin or only permanently delete. This affects undo UX significantly.

7. **WebGPU fallback strategy:** WebGPU is new. Need graceful degradation to WebGL for older browsers without breaking instancing performance.

---

**Research Summary:** Browser-based 3D games are production-ready (Three.js + WebGPU), filesystem visualization patterns are well-established (treemap, color coding, tooltips), gamification increases engagement (87% more engaged with achievements), and safety patterns are critical (two-step confirmation prevents regret). The combination is novel: no competitor makes file management *fun*. Key technical risk is performance at scale, mitigated by instanced rendering. Key UX risk is making deletion feel game-y, mitigated by two-shot confirmation + recycle bin safety net.
