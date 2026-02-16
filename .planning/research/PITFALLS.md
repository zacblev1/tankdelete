# Pitfalls Research

**Domain:** Browser-based 3D game with filesystem integration
**Researched:** 2026-02-16
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: No Safety Net - Permanent File Deletion

**What goes wrong:**
Files deleted from the user's actual filesystem are gone permanently. Unlike native OS trash/recycle bins, the File System Access API does not provide a built-in mechanism to move files to the system trash. Calling `remove()` on a file handle **permanently deletes** the file immediately, with no native undo capability.

**Why it happens:**
Developers assume that file deletion in browsers works like desktop applications with automatic trash bin integration. The File System Access API is intentionally low-level and leaves trash handling to the application developer.

**How to avoid:**
1. **Never delete files directly** - Always move to a custom "staging area" first
2. **Implement your own trash system** using a dedicated folder (e.g., `.tankdelete-trash/`)
3. **Add multi-stage confirmation** for any destructive action
4. **Store deletion metadata** (original path, timestamp, file size) in IndexedDB for recovery
5. **Implement an undo stack** with at least 10-20 recent deletions recoverable
6. **Time-based auto-cleanup** of trash folder (e.g., 30 days) with user notification

**Warning signs:**
- User reports lost important files
- No "undo" button visible after file deletion
- Direct calls to `fileHandle.remove()` in shooting logic
- Missing confirmation dialogs before deletion
- No trash/staging folder in codebase

**Phase to address:**
Phase 1 (Core Architecture) - This must be designed into the system from day one. Retrofitting a safety net is extremely difficult and error-prone.

**Sources:**
- [Chrome File System Access API Documentation](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)
- [Lose/Lose: The Game That Deletes Your Files](https://kotaku.com/the-dangerous-video-game-you-werent-supposed-to-play-5400213)
- [Trash (computing) - Wikipedia](https://en.wikipedia.org/wiki/Trash_(computing))

---

### Pitfall 2: Permission Fatigue and Double Prompts

**What goes wrong:**
Users get bombarded with permission prompts - once for directory access, again for write permissions, and potentially every time they navigate to a new folder. This creates terrible UX, leads to users denying permissions out of frustration, and breaks the game flow.

**Why it happens:**
Developers request read and write permissions separately, or don't request the minimum necessary permissions upfront. The API requires explicit user consent for file access, but poor implementation multiplies the number of prompts.

**How to avoid:**
1. **Request read+write together** at initial directory selection (not separately)
2. **Use "Allow on every visit"** persistent permissions (Chrome 119+)
3. **Store directory handles in IndexedDB** to avoid re-prompting on reload
4. **Request at point of intent** with clear messaging: "TankDelete needs access to this folder to show files as game objects"
5. **Handle permission rejections gracefully** - show clear instructions if denied
6. **Implement a permission check before game start** - verify access before loading the 3D scene
7. **Catch and handle permission errors** during gameplay - prompt for re-selection if file is moved/deleted

**Warning signs:**
- Users complaining about "too many popups"
- Permission prompts appearing mid-game
- Separate prompts for read and write operations
- No IndexedDB storage of directory handles
- Game breaking when user switches folders outside the app

**Phase to address:**
Phase 1 (Core Architecture) - Permission flow must be designed before game mechanics. Fixing permission issues later requires significant refactoring.

**Sources:**
- [Persistent Permissions for File System Access API](https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api)
- [Understanding the File System Access API](https://fsjs.dev/understanding-file-system-access-api/)

---

### Pitfall 3: WebGL Memory Leaks from Undisposed Objects

**What goes wrong:**
As users navigate through folders with hundreds of files, textures and geometries accumulate in GPU memory. Each file representation (glowing block) creates geometry, materials, and textures. Without explicit disposal, memory usage climbs until the browser crashes or performance degrades to unplayable framerates.

**Why it happens:**
JavaScript garbage collection doesn't automatically free GPU resources. Developers must manually call `.dispose()` on geometries, materials, and textures. Three.js requires explicit cleanup - removing objects from the scene is not enough.

**How to avoid:**
1. **Always dispose when removing objects:**
   ```javascript
   mesh.geometry.dispose();
   mesh.material.dispose();
   if (mesh.material.map) mesh.material.map.dispose();
   scene.remove(mesh);
   ```
2. **Use object pooling** for frequently created/destroyed objects (file blocks)
3. **Implement InstancedMesh** for identical file representations (same file type)
4. **Share materials** across similar file types (all .txt files use same material)
5. **Monitor memory usage** with `renderer.info.memory` during development
6. **Set up automated disposal** in folder navigation logic
7. **Limit visible objects** - only render files in current folder + neighboring portals

**Warning signs:**
- Memory usage constantly increasing in DevTools
- Performance degradation after navigating multiple folders
- Browser crashes after 5-10 minutes of play
- High texture count in `renderer.info.memory.textures`
- No `.dispose()` calls when switching folders

**Phase to address:**
Phase 2 (File Visualization) - Must be implemented alongside object creation. Memory leaks compound quickly and become impossible to debug after system is complex.

**Sources:**
- [100 Three.js Tips That Actually Improve Performance (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [Exploring Garbage Collection in V8 with WebGL](https://whenderson.dev/blog/webgl-garbage-collection/)

---

### Pitfall 4: Raycasting Performance Collapse with Hundreds of Objects

**What goes wrong:**
Mouse-based shooting requires raycasting to detect which file the player is aiming at. With hundreds of files visible, raycasting every frame against every object tanks performance. Framerate drops to 10-15 FPS, making the game unplayable.

**Why it happens:**
Naive raycasting checks every object in the scene against the ray. With 500 files, that's 500 intersection tests per frame at 60 FPS = 30,000 tests per second. The computational cost is O(n) per frame.

**How to avoid:**
1. **Don't raycast every frame** - only on mouse click or every 2-3 frames
2. **Use the Layer system** to exclude non-interactive objects from raycasting
3. **Implement spatial partitioning** with Octree (three-mesh-bvh library)
4. **Set raycaster near/far bounds** to limit distance
5. **Use two-phase detection:**
   - Phase 1: Broad phase with bounding boxes
   - Phase 2: Precise raycast only on potential hits
6. **Limit raycasting to visible frustum** - don't test off-screen objects
7. **Optimize with distance-based checks** - prioritize closer objects

**How to avoid (continued):**
8. **Use selective object arrays** - only pass potentially visible files to `intersectObjects()`

**Warning signs:**
- FPS drops when mouse moves
- CPU spikes in profiler during raycasting
- Raycaster called in render loop without throttling
- `intersectObjects()` receives entire scene array
- No spatial data structure implementation

**Phase to address:**
Phase 3 (Interaction System) - Implement optimization from the start. Raycasting optimization is architectural and difficult to retrofit.

**Sources:**
- [Three.js Raycasting Performance Optimization](https://protectwise.github.io/troika/troika-3d/performance/)
- [Feature Request: Spatial Search Trees for Raycasting](https://github.com/mrdoob/three.js/issues/12857)
- [Three.js Raycaster Best Practices](https://copyprogramming.com/howto/what-is-three-js-raycaster-exactly-doing)

---

### Pitfall 5: Bloom Effect Performance Overhead

**What goes wrong:**
The Tron neon aesthetic requires bloom/glow effects via post-processing. Unoptimized bloom destroys frame rate - full-screen bloom at native resolution can halve FPS (60 → 30 FPS). Mobile devices become completely unplayable.

**Why it happens:**
Bloom requires multiple render passes with blur operations. Higher resolution = exponentially more pixels to process. Developers enable bloom on everything without selective application or resolution optimization.

**How to avoid:**
1. **Use selective bloom** - only bright objects (neon lines, file blocks) should glow
2. **Lower bloom resolution** - render bloom at 50% resolution, then upscale
3. **Optimize bloom parameters:**
   - Reduce `kernelSize` (number of blur samples)
   - Lower `strength` to minimum acceptable value
   - Increase `threshold` to limit what blooms
4. **Use pmndrs/postprocessing library** - automatically merges effects into fewer passes
5. **Implement LOD for bloom** - disable bloom on distant objects
6. **Mobile optimization** - disable or drastically reduce bloom on mobile devices
7. **Provide graphics settings** - let users toggle bloom quality

**Warning signs:**
- FPS drops significantly when bloom enabled
- Full-screen bloom pass in post-processing
- Bloom resolution matches render resolution
- All objects blooming (no selective bloom)
- No quality/performance settings for users

**Phase to address:**
Phase 4 (Visual Polish) - Implement selective bloom and optimization from the start. Full-screen bloom should never be enabled without optimization.

**Sources:**
- [Three.js Post Processing Performance](https://threejsfundamentals.org/threejs/lessons/threejs-post-processing.html)
- [pmndrs/postprocessing Library](https://github.com/pmndrs/postprocessing)
- [100 Three.js Tips That Actually Improve Performance (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)

---

### Pitfall 6: Pointer Lock Breaking User Expectations

**What goes wrong:**
FPS-style controls with Pointer Lock API can trap users in the game. Users expect ESC to exit, but if not implemented correctly, they can't escape without killing the browser tab. Mobile devices don't support Pointer Lock at all, breaking the entire control scheme.

**Why it happens:**
Pointer Lock requires explicit exit handling. Developers assume it "just works" like native games. The API requires transient activation (user gesture) and fails silently in some contexts.

**How to avoid:**
1. **Always handle ESC key** as exit gesture (browser default, but verify)
2. **Provide visible "Click to Play" prompt** before requesting pointer lock
3. **Detect pointer lock support** before initializing controls
4. **Fallback for mobile/unsupported browsers:**
   - Virtual joystick for movement
   - Tap/touch for shooting
   - Gyroscope for camera (optional)
5. **Handle lock exit gracefully:**
   ```javascript
   document.addEventListener('pointerlockchange', () => {
     if (!document.pointerLockElement) {
       // Show menu/pause game
     }
   });
   ```
6. **Don't auto-request lock** - always require user initiation
7. **Show UI indicators** when pointer lock is active

**Warning signs:**
- No mobile control fallback
- Pointer lock requested on page load
- No visible "playing" indicator
- ESC key not exiting lock
- No feature detection for Pointer Lock API

**Phase to address:**
Phase 3 (Interaction System) - Controls are fundamental to gameplay. Must be designed with cross-platform support from the beginning.

**Sources:**
- [MDN Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API)
- [Pointer Lock API for Browser Games](https://developer.chrome.com/blog/pointer-lock-api-brings-fps-games-to-the-browser)

---

### Pitfall 7: WASD Controls Breaking on Non-QWERTY Keyboards

**What goes wrong:**
WASD controls are hardcoded using `KeyboardEvent.key` which returns the label on the key. On AZERTY keyboards (France, Belgium), the physical WASD positions are ZQSD. On DVORAK, they're ,AOE. Users with non-QWERTY layouts can't play the game.

**Why it happens:**
Developers test on QWERTY keyboards and use `event.key` instead of `event.code`. The `key` property returns the label, not the physical position.

**How to avoid:**
1. **Use `KeyboardEvent.code` not `KeyboardEvent.key`:**
   ```javascript
   // BAD - breaks on non-QWERTY
   if (event.key === 'w') moveForward();

   // GOOD - works on all layouts
   if (event.code === 'KeyW') moveForward();
   ```
2. **Test on multiple keyboard layouts** (AZERTY, DVORAK, QWERTZ)
3. **Provide key rebinding UI** for accessibility
4. **Use standard codes:**
   - Forward: `KeyW`
   - Left: `KeyA`
   - Back: `KeyS`
   - Right: `KeyD`
5. **Document the physical position** in UI ("WASD - physical top-left keys")

**Warning signs:**
- Controls use `event.key` property
- No testing on non-QWERTY layouts
- Users reporting "controls don't work"
- No key rebinding option

**Phase to address:**
Phase 3 (Interaction System) - Input handling foundation. Changing from `.key` to `.code` later requires updating every keyboard event handler.

**Sources:**
- [WASD Controls on the Web: Use KeyboardEvent.code](https://www.bram.us/2022/03/31/wasd-controls-on-the-web/)
- [MDN Desktop Mouse and Keyboard Controls](https://developer.mozilla.org/en-US/docs/Games/Techniques/Control_mechanisms/Desktop_with_mouse_and_keyboard)

---

### Pitfall 8: State Synchronization Between Filesystem and Game World

**What goes wrong:**
User deletes or moves files outside the game (via Finder/Explorer). When the player returns to that folder in-game, the application crashes or shows "ghost" objects representing deleted files. Shooting these ghosts throws errors because the file handles are invalid.

**Why it happens:**
The game caches directory contents but has no way to detect external changes. The File System Access API doesn't provide file watching/notification capabilities (yet). Cached file handles become stale when the underlying filesystem changes.

**How to avoid:**
1. **Re-read directory on every folder entry** - don't cache file lists long-term
2. **Validate file handles before operations:**
   ```javascript
   try {
     await fileHandle.getFile(); // Verify file still exists
   } catch (err) {
     // Handle missing file - remove from scene
   }
   ```
3. **Implement graceful error handling** for all file operations
4. **Show "file not found" feedback** instead of crashing
5. **Provide "refresh folder" action** for users to manually sync
6. **Consider IndexedDB cache invalidation** based on time
7. **Detect permission changes** and re-prompt if needed

**Warning signs:**
- Crashes when files are deleted externally
- No error handling around file operations
- Long-term caching of file handles
- No "refresh" mechanism for folder contents
- Application assumes files never change

**Phase to address:**
Phase 2 (File Visualization) - Must handle file I/O errors from the start. Error handling can't be bolted on later without touching every file operation.

**Sources:**
- [File System Access API Issues: Watching/Notifications](https://github.com/WICG/file-system-access/issues/72)
- [Chrome File System Access API Documentation](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip object pooling, create new geometries per file | Simpler code, faster initial development | Memory leaks, GC pauses, performance degradation | Never - pooling is essential for hundreds of objects |
| Direct file deletion without trash | Fewer file operations, simpler architecture | Lost user data, no recovery, safety concerns | Never - users will lose important files |
| Single-resolution bloom (no optimization) | Easier to implement visual effects | Poor performance, mobile unplayable | Only in prototype phase, must optimize before beta |
| Raycast every frame for all objects | Accurate hit detection, no missed shots | FPS collapse with >100 objects | Only in prototype with <50 objects |
| Cache directory listings indefinitely | Faster folder navigation, less I/O | Stale data, crashes on external changes | Never - always validate or re-read |
| Use `KeyboardEvent.key` for controls | Works on developer's keyboard | Breaks for 40% of users (non-QWERTY) | Never - `event.code` is just as easy |
| Skip permission error handling | Cleaner code without try/catch | App crashes when permissions revoked | Never - permissions can change anytime |
| No mobile fallback for Pointer Lock | Don't have to build touch controls | Game unplayable on mobile/tablets | Only if explicitly desktop-only (must document) |

---

## Integration Gotchas

Common mistakes when connecting to external services or APIs.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| File System Access API | Calling `remove()` directly, assuming trash integration | Implement custom trash folder with metadata tracking |
| File System Access API | Requesting read and write permissions separately | Request `readwrite` mode in single `showDirectoryPicker()` call |
| File System Access API | Not storing directory handles in IndexedDB | Persist handles to avoid re-prompting on reload |
| Three.js InstancedMesh | Forgetting to update `instanceMatrix` after changes | Always call `instanceMesh.instanceMatrix.needsUpdate = true` |
| Three.js Materials | Creating unique materials per file | Share materials between files of same type, use vertex colors for variation |
| Three.js Raycaster | Passing entire scene to `intersectObjects()` | Pass filtered array of potentially visible objects only |
| Pointer Lock API | Requesting lock without user gesture | Only call `requestPointerLock()` in click/key event handler |
| Browser Storage (IndexedDB) | Storing large file contents | Only store file handles and metadata, read content on-demand |
| Post-processing (Bloom) | Applying bloom to entire scene at full resolution | Use selective bloom on marked objects at 50% resolution |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No object disposal | Memory usage climbs steadily, eventual crash | Dispose geometry/material/texture when removing objects | After 3-5 folder transitions (~200-500 objects created) |
| Unoptimized raycasting | FPS drops when moving mouse, input lag | Use spatial partitioning, limit raycast frequency | With >100 objects in scene |
| Full-screen bloom at native resolution | Low FPS, mobile unplayable | Reduce bloom resolution to 50%, selective bloom only | Immediately on most devices |
| Creating new geometries per file | High draw calls, GPU overhead | Use InstancedMesh for identical objects | With >50 similar objects |
| No frustum culling on custom objects | Rendering off-screen objects | Let Three.js auto-cull, or implement manual culling | With >200 total objects |
| Deep directory recursion without limits | Browser hang, stack overflow | Limit recursion depth to 5 levels, implement pagination | With deeply nested folders (>10 levels) |
| No texture atlasing for file icons | High texture count, slow loading | Combine file type icons into single atlas | With >20 different file types |
| Synchronous file reading in main thread | UI freezes during folder load | Use Web Workers for file parsing or chunk with async/await | Folders with >100 files |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Not validating user-selected directories | User selects system folders (C:\Windows, /System) | Implement safelist/blocklist, reject system paths |
| Exposing file contents without sanitization | XSS if displaying file contents, malicious script execution | Sanitize all file content before displaying, use textContent not innerHTML |
| No confirmation for large-scale deletion | Accidental deletion of entire directories | Require explicit confirmation for >10 files, show count prominently |
| Storing absolute file paths in logs | Privacy leak, exposing user's folder structure | Hash paths or use relative paths in error logging |
| Auto-granting persistent permissions | Users forget app has broad file access | Always use per-session permissions initially, only offer persistent after user trust established |
| No protection against symlink attacks | Following symlinks outside intended directory | Check if file is in expected directory tree before operations (the API should handle this, but validate) |
| Displaying full file paths in UI | Information disclosure, path traversal risk | Show only filename and folder name, not full absolute path |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No "are you sure?" for deletion | Accidental file loss, user panic | Two-shot deletion (highlight on first click, delete on second) + confirmation for large files |
| Hidden permission requirements | Users don't understand why game won't start | Onboarding screen: "TankDelete needs folder access. Select any folder to begin." |
| No indication of file changes outside game | Confusion, crashes on return | Show "folder changed externally" notification with refresh option |
| Starting in user's root directory | Overwhelming (thousands of files), risky (system files visible) | Force subfolder selection, suggest Documents or Desktop |
| No visual feedback during file operations | Users don't know if action succeeded | Show animation for deletion, "moved to trash" confirmation |
| Immediate permanent deletion | Fear of using the game, user anxiety | Always visible trash can + undo option |
| No loading indicator for large folders | Game appears frozen | Progress bar or "loading X files..." counter |
| Complex permission dialogs without explanation | Users deny permissions, game broken | Context: "Choose a test folder with files you don't need" |
| No graphics quality settings | Poor performance on lower-end devices, users blame game | Quality presets: Low (no bloom), Medium (optimized bloom), High (full effects) |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **File Deletion:** Often missing **trash/staging folder system** — verify files can be recovered for 30 days
- [ ] **File Deletion:** Often missing **undo functionality** — verify last 10 deletions can be undone
- [ ] **Folder Navigation:** Often missing **external change detection** — verify graceful handling when files change outside game
- [ ] **Shooting Mechanic:** Often missing **object disposal** — verify memory doesn't leak after shooting 100 files
- [ ] **Raycasting:** Often missing **performance optimization** — verify 60 FPS with 500 objects in scene
- [ ] **Bloom Effect:** Often missing **selective application** — verify only file blocks bloom, not entire scene
- [ ] **Permissions:** Often missing **persistent handle storage** — verify no re-prompt on page reload
- [ ] **Permissions:** Often missing **error recovery** — verify graceful handling when permissions revoked
- [ ] **Keyboard Controls:** Often missing **non-QWERTY support** — test on AZERTY, DVORAK layouts
- [ ] **Mobile Support:** Often missing **touch control fallback** — verify playable on tablets without Pointer Lock
- [ ] **Large Folders:** Often missing **loading state** — verify UX for folders with 1000+ files
- [ ] **File Operations:** Often missing **error handling** — try deleting a file that was removed externally

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| User lost files (no trash system) | HIGH - data loss, trust damage | 1. Apologize profusely, 2. Check browser cache/temp files, 3. Suggest file recovery tools (Recuva, PhotoRec), 4. Implement trash system immediately |
| Memory leak from undisposed objects | MEDIUM - requires refactoring | 1. Add `renderer.info` monitoring, 2. Audit all object creation points, 3. Implement disposal on folder transition, 4. Add object pooling |
| Raycasting performance collapse | MEDIUM - requires architecture change | 1. Implement distance-based culling first (quick fix), 2. Add octree library (three-mesh-bvh), 3. Reduce raycast frequency |
| Bloom killing FPS | LOW - parameter tuning | 1. Reduce bloom resolution to 50%, 2. Increase threshold, 3. Make selective, 4. Add graphics settings UI |
| Pointer Lock trapping users | LOW - event handling | 1. Add ESC listener, 2. Add visible "Playing - Press ESC" indicator, 3. Auto-exit on game pause |
| WASD not working (non-QWERTY) | LOW - find/replace | 1. Replace all `event.key` with `event.code`, 2. Update tests, 3. Add keyboard layout detection |
| Permission fatigue | MEDIUM - requires UX redesign | 1. Combine read+write requests, 2. Store handles in IndexedDB, 3. Add permission check before game start |
| Files deleted externally cause crash | MEDIUM - add error handling | 1. Wrap all file ops in try/catch, 2. Re-read directory on folder entry, 3. Remove invalid objects from scene |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| No trash/undo system | Phase 1 - Core Architecture | Verify trash folder created, metadata stored, files recoverable |
| Permission fatigue | Phase 1 - Core Architecture | Test persistent permissions, IndexedDB storage, reload without re-prompt |
| WebGL memory leaks | Phase 2 - File Visualization | Monitor `renderer.info.memory` stays stable across folder transitions |
| Raycasting performance | Phase 3 - Interaction System | Verify 60 FPS with 500 objects, mouse movement smooth |
| Bloom performance | Phase 4 - Visual Polish | Test on low-end device, verify 30+ FPS with bloom enabled |
| Pointer Lock issues | Phase 3 - Interaction System | Test ESC exit, mobile fallback, cross-browser support |
| WASD keyboard layouts | Phase 3 - Interaction System | Test AZERTY, DVORAK, QWERTZ layouts |
| Filesystem sync issues | Phase 2 - File Visualization | Delete file externally, verify no crash, show appropriate feedback |

---

## Sources

### File System Access API
- [Chrome File System Access API Documentation](https://developer.chrome.com/docs/capabilities/web-apis/file-system-access)
- [MDN File System API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API)
- [File System Access API Explainer](https://github.com/WICG/file-system-access/blob/main/EXPLAINER.md)
- [Persistent Permissions for File System Access API](https://developer.chrome.com/blog/persistent-permissions-for-the-file-system-access-api)
- [Understanding the File System Access API](https://fsjs.dev/understanding-file-system-access-api/)

### Security & Safety
- [Lose/Lose: The Game That Deletes Your Files](https://kotaku.com/the-dangerous-video-game-you-werent-supposed-to-play-5400213)
- [Trash Computing Systems](https://en.wikipedia.org/wiki/Trash_(computing))
- [Confirmation Dialogs Best Practices](https://www.nngroup.com/articles/confirmation-dialog/)
- [UX Guide to Destructive Actions](https://medium.com/design-bootcamp/a-ux-guide-to-destructive-actions-their-use-cases-and-best-practices-f1d8a9478d03)
- [How to Manage Dangerous Actions in User Interfaces](https://www.smashingmagazine.com/2024/09/how-manage-dangerous-actions-user-interfaces/)

### Three.js Performance
- [100 Three.js Tips That Actually Improve Performance (2026)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
- [Building Efficient Three.js Scenes](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/)
- [WebGL Best Practices - MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
- [Exploring Garbage Collection in V8 with WebGL](https://whenderson.dev/blog/webgl-garbage-collection/)

### Raycasting Optimization
- [Three.js Raycaster Performance Optimization](https://protectwise.github.io/troika/troika-3d/performance/)
- [Feature Request: Spatial Search Trees for Raycasting](https://github.com/mrdoob/three.js/issues/12857)
- [Three.js Raycaster Best Practices](https://copyprogramming.com/howto/what-is-three-js-raycaster-exactly-doing)

### Post-Processing & Bloom
- [Three.js Post Processing](https://threejsfundamentals.org/threejs/lessons/threejs-post-processing.html)
- [pmndrs/postprocessing Library](https://github.com/pmndrs/postprocessing)
- [Post-Processing with Three.js](https://waelyasmina.net/articles/post-processing-with-three-js-the-what-and-how/)

### Input Handling
- [WASD Controls on the Web: Use KeyboardEvent.code](https://www.bram.us/2022/03/31/wasd-controls-on-the-web/)
- [MDN Desktop Mouse and Keyboard Controls](https://developer.mozilla.org/en-US/docs/Games/Techniques/Control_mechanisms/Desktop_with_mouse_and_keyboard)
- [MDN Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API)
- [Pointer Lock API for Browser Games](https://developer.chrome.com/blog/pointer-lock-api-brings-fps-games-to-the-browser)

### State Management & Undo Systems
- [Rewriting History: Adding Undo/Redo to Complex Web Apps](https://engineering.contentsquare.com/2023/history-undo-redo/)
- [Implementing Undo/Redo in JavaScript](https://medium.com/fbbd/intro-to-writing-undo-redo-systems-in-javascript-af17148a852b)
- [File System Watching Issues](https://github.com/WICG/file-system-access/issues/72)
- [FileSystemObserver API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/FileSystemObserver)

---
*Pitfalls research for: TankDelete - Browser-based 3D Tank Game with Filesystem Integration*
*Researched: 2026-02-16*
