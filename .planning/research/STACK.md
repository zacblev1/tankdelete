# Stack Research

**Domain:** Browser-based 3D game with local filesystem integration
**Researched:** 2026-02-16
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Three.js | ^0.182.0 (r182+) | WebGL 3D rendering engine | Industry standard for browser 3D graphics. Zero-config WebGPU support since r171 with automatic WebGL 2 fallback. Simple API, comprehensive documentation, massive ecosystem. Handles complex scenes with hundreds of objects efficiently. |
| TypeScript | ^5.7.0 | Type-safe JavaScript | Provides static type checking, improved IDE support, and better maintainability for complex 3D game logic. Essential for large codebases. Three.js has excellent TypeScript definitions via @types/three. |
| Vite | ^7.3.0 | Build tool and dev server | Modern build tool with instant HMR, faster than Webpack. Tree-shaking for smaller bundles. Native ESM support. Vite 7 requires Node.js 20.19+/22.12+. Uses Rolldown bundler in v8 (beta). Most appreciated build tool in 2025 for Three.js projects. |
| Tauri v2 | ^2.1.0 | Desktop app framework | **CRITICAL for filesystem access.** Browser File System Access API only has 34% browser support (Chrome/Edge only, no Firefox/Safari). Tauri provides full filesystem access across all platforms. Rust-based, smaller bundle than Electron. Mobile support (iOS/Android) for future expansion. Capability-based security model. |

### Rendering & Effects

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @pmndrs/postprocessing | ^6.38.0 | Post-processing effects library | For Tron neon glow effects, bloom, and visual polish. More performant than Three.js built-in EffectComposer. Provides UnrealBloomPass for glowing edges and SelectiveBloom for specific objects. |
| @gltf-transform/core | ^4.3.0 | glTF asset optimization | Compress 3D models with Draco (90-95% size reduction). Essential for performance when loading folder structures as 3D objects. Use during build/asset pipeline, not runtime. |
| @gltf-transform/extensions | ^4.3.0 | glTF compression extensions | Provides Draco mesh compression and KTX2 texture compression. KTX2 with Basis Universal reduces GPU memory by ~10x. |

### State Management & Physics

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zustand | ^5.0.3 | Lightweight state management | Game state (current directory, selected files, delete queue). Created by React Three Fiber team. Minimal boilerplate, excellent performance for real-time updates. Better than Redux for WebGL apps. |
| @dimforge/rapier3d-compat | ^0.15.0 | Physics engine (WebAssembly) | Tank collisions with file blocks and folder portals. 2-5x faster than cannon-es. Written in Rust, compiled to WASM. Use 'compat' version for broader browser support. |

### Development Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| @types/three | ^0.182.0 | TypeScript definitions for Three.js | Must match Three.js version. |
| vitest | ^4.1.0 | Testing framework | Fast, Vite-native. Browser mode stable in v4. For game logic unit tests, not visual tests. |
| typescript-eslint | ^8.20.0 | ESLint for TypeScript | Use flat config (eslint.config.mjs). Recommended + strict + stylistic configs. |
| stats.js | ^0.17.0 | Performance monitoring | FPS, frame time, memory usage. Created by Three.js author. Essential for hitting 60fps target. |
| @tauri-apps/cli | ^2.1.0 | Tauri CLI tools | For building desktop app with filesystem access. |

## Installation

```bash
# Core dependencies
npm install three@^0.182.0 zustand@^5.0.3 @dimforge/rapier3d-compat@^0.15.0

# Post-processing and optimization
npm install @pmndrs/postprocessing@^6.38.0
npm install @gltf-transform/core@^4.3.0 @gltf-transform/extensions@^4.3.0

# Tauri for filesystem access
npm install @tauri-apps/api@^2.1.0

# Dev dependencies
npm install -D vite@^7.3.0 typescript@^5.7.0 @types/three@^0.182.0
npm install -D vitest@^4.1.0 typescript-eslint@^8.20.0
npm install -D @tauri-apps/cli@^2.1.0
npm install -D stats.js@^0.17.0
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Tauri v2 | Electron | If you need Node.js libraries not available in Rust. Electron bundles Chromium (~150MB), Tauri uses system WebView (~15MB). Tauri is 10x smaller and faster. |
| Tauri v2 | File System Access API (browser) | **Do not use.** Only 34% browser support (Chrome/Edge only). Firefox officially opposes it. Safari has no support. Would require backend server fallback anyway. |
| @pmndrs/postprocessing | Three.js EffectComposer | Built-in EffectComposer if you only need 1-2 simple effects. @pmndrs/postprocessing is more performant and feature-rich. |
| Rapier | cannon-es | cannon-es if you need simpler physics and don't want WASM overhead. Rapier is 2-5x faster but adds ~2MB WASM bundle. |
| Vite | Webpack | Only if you have existing Webpack config you must maintain. Vite is objectively faster and simpler. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Unity WebGL | 10-20MB+ initial bundle, poor load times, requires WebGL 2, shader performance issues, browser memory limits. | Three.js with Vite (2MB bundle after optimization). |
| Babylon.js | Heavier than Three.js (~400KB vs ~700KB), steeper learning curve. Designed for game engines, overkill for this project. | Three.js |
| React Three Fiber (R3F) | Adds React overhead (not needed for this project). Good for declarative UI but tank controls are imperative. Slower than vanilla Three.js. | Vanilla Three.js + zustand |
| File System Access API | Only 34% browser support. Firefox/Safari never will support it. | Tauri v2 |
| Electron | 10x larger bundle size than Tauri. Slower startup. Bundles entire Chromium engine. | Tauri v2 |
| Standard Shader (Three.js) | Uber-shader is overkill for Tron aesthetic. Slower performance. | Custom shaders or MeshBasicMaterial with emissive for neon glow. |
| cannon.js (original) | No longer maintained since 2015. | cannon-es or Rapier |

## Stack Patterns by Variant

**If targeting web-only (no filesystem access):**
- Remove Tauri
- Use File System Access API with polyfill fallback (browser-fs-access library)
- Note: 66% of users won't have filesystem access
- Build with Vite only

**If need mobile support later:**
- Tauri v2 supports iOS/Android
- Keep Rapier (WASM works on mobile)
- Consider touch controls in addition to WASD+mouse

**If need multiplayer:**
- Add Socket.io or WebRTC for real-time sync
- Add server component (Node.js/Rust)
- Keep current stack unchanged

## Performance Targets (Based on 2025 Best Practices)

| Metric | Target | How to Achieve |
|--------|--------|----------------|
| Initial Load | < 3 seconds | Code splitting, Draco compression, lazy load models |
| Target FPS | 60 FPS | < 100 draw calls per frame, instancing for repeated geometries, texture atlases |
| Bundle Size | < 2 MB (gzipped) | Tree-shaking with Vite, remove unused Three.js modules |
| Memory Usage | < 500 MB | Dispose unused geometries/materials, use texture compression (KTX2) |
| Folder with 1000 files | Render < 1 second | Level-of-detail (LOD) for distant objects, frustum culling, instanced rendering |

## Optimization Checklist

- [ ] Use Draco compression for geometries (90-95% size reduction)
- [ ] Use KTX2/Basis Universal for textures (10x GPU memory reduction)
- [ ] Limit draw calls to < 100 per frame
- [ ] Implement instancing for repeated file/folder geometries
- [ ] Use texture atlases to minimize texture switches
- [ ] Dispose geometries/materials when changing directories
- [ ] Implement frustum culling (Three.js built-in)
- [ ] Use LOD for distant objects
- [ ] Avoid lights (use emissive materials for neon glow instead)
- [ ] Monitor with stats.js during development

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| three@0.182.0 | @types/three@0.182.0 | Versions must match exactly |
| vite@7.x | Node.js 20.19+, 22.12+ | Node.js 18 dropped in Vite 7 |
| @dimforge/rapier3d-compat | three@0.182.0 | Use -compat version for older browsers |
| @pmndrs/postprocessing@6.x | three@>=0.169.0 | Check GitHub releases for specific version requirements |
| tauri@2.x | Rust 1.77.2+ | Tauri v2 requires recent Rust toolchain |

## Tron Aesthetic Implementation Notes

**Neon Glow Effect:**
- Use geometric glow method (duplicate geometry scaled 1.1-1.5x)
- Calculate `dot(viewVector, normal)` in vertex shader
- Raise to power for intensity control
- Alternative: UnrealBloomPass from @pmndrs/postprocessing
- **Do not use built-in lights** (performance killer)

**Grid Floor:**
- Custom shader with line patterns
- Emissive material (self-lit, no lights needed)
- Animate glow intensity with uniform

**Color Palette:**
- Cyan (#00FFFF) for friendly objects (folders)
- Orange (#FF9500) for targets (files)
- Magenta (#FF00FF) for marked files
- Dark blue background (#001133)

## Sources

### High Confidence (Official Docs & Current)
- [Three.js GitHub Releases](https://github.com/mrdoob/three.js/releases) - Version r182 verification
- [Vite Documentation](https://vite.dev/blog/announcing-vite7) - Vite 7 features and requirements
- [File System Access API Browser Support](https://caniuse.com/native-filesystem-api) - 34.29% global support, Chrome/Edge only
- [Tauri 2.0 Official Release](https://v2.tauri.app/blog/tauri-20/) - Mobile support, plugin system, IPC improvements
- [Three.js Performance Tips (2025)](https://www.utsubo.com/blog/threejs-best-practices-100-tips) - Draw call optimization, instancing, batching
- [Building Efficient Three.js Scenes](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/) - February 2025 optimization guide

### Medium Confidence (Multiple Sources Agree)
- [Three.js Game Development Best Practices 2025](https://playgama.com/blog/general/master-browser-based-game-development-with-three-js/) - Asset optimization, component architecture
- [Vite + Three.js Setup Guide](https://medium.com/@gianluca.lomarco/three-js-vite-basic-scene-tutorial-3abc2669da6d) - Modern setup patterns
- [TypeScript Three.js Configuration](https://moldstud.com/articles/p-ultimate-guide-to-setting-up-threejs-with-typescript-your-step-by-step-installation) - TypeScript integration
- [Tauri vs Electron Comparison 2025](https://www.raftlabs.com/blog/tauri-vs-electron-pros-cons/) - Bundle size, security, performance comparison
- [ESLint Flat Config with TypeScript](https://advancedfrontends.com/eslint-flat-config-typescript-javascript/) - Modern linting setup
- [Zustand State Management for Games](https://wawasensei.dev/tuto/react-three-fiber-tutorial-hiragana-katakana-game) - Game state patterns with Zustand
- [Three.js Glow Shader Implementation](https://stemkoski.github.io/Three.js/Shader-Glow.html) - Geometric glow technique
- [glTF Draco Compression Guide](https://gltf-transform.dev/modules/extensions/classes/KHRDracoMeshCompression) - 90-95% compression rates
- [Rapier vs Cannon-es Physics Comparison](https://threejs-journey.com/lessons/physics) - 2-5x performance improvement
- [Stats.js Performance Monitoring](https://github.com/mrdoob/stats.js) - FPS and memory tracking
- [Vitest 4 Browser Mode](https://vitest.dev/blog/vitest-3) - Stable in v4
- [@pmndrs/postprocessing Documentation](https://github.com/pmndrs/postprocessing) - Post-processing library features

---
*Stack research for: TankDelete - Browser 3D Tank Game with Filesystem Integration*
*Researched: 2026-02-16*
*Next: Feed into ARCHITECTURE.md and FEATURES.md for comprehensive roadmap*
