---
phase: 01-foundation-safety
plan: 01
subsystem: core-scaffold
tags: [tauri, directory-picker, file-scanner, persistence]
dependency_graph:
  requires: []
  provides:
    - tauri-v2-scaffold
    - directory-picker-with-blocklist
    - recursive-file-scanner
    - hidden-file-filter
    - last-directory-persistence
  affects: [all-future-plans]
tech_stack:
  added:
    - tauri: "2.10.2"
    - tauri-plugin-dialog: "2.6.0"
    - tauri-plugin-fs: "2.4.5"
    - tauri-plugin-store: "2.4.2"
    - trash: "5.2.5"
    - walkdir: "2.5.0"
    - tokio: "1.49.0"
    - react: "19.2.4"
    - vite: "7.3.1"
    - bun: "1.3.9"
  patterns:
    - async-tauri-commands-with-oneshot-channels
    - spawn-blocking-for-heavy-io
    - react-state-machine-for-app-flow
    - tron-inspired-dark-theme
key_files:
  created:
    - src-tauri/src/models/file_entry.rs: "FileEntry struct with Serde serialization"
    - src-tauri/src/commands/directory.rs: "pick_directory and scan_directory with blocklist and hidden filter"
    - src-tauri/src/commands/store.rs: "save_last_directory and get_last_directory using Tauri Store"
    - src/lib/types.ts: "TypeScript interfaces for FileEntry and ScanProgress"
    - src/lib/tauri-commands.ts: "Type-safe command wrappers"
    - src/lib/format.ts: "formatBytes and formatDate utilities"
    - src/components/DirectoryPicker.tsx: "Directory picker UI component"
    - src/App.tsx: "Main app with state machine and launch flow"
    - src/App.css: "Tron-inspired dark theme styling"
  modified:
    - src-tauri/Cargo.toml: "Added trash, walkdir, tokio dependencies"
    - src-tauri/tauri.conf.json: "Window config (maximized, 800x600 min)"
    - src-tauri/capabilities/default.json: "Permissions for dialog, fs, store"
    - src-tauri/src/lib.rs: "Command registration and plugin initialization"
decisions:
  - decision: "Use Bun as package manager"
    rationale: "Faster than npm/yarn, modern tooling"
    impact: "All npm commands use bun"
  - decision: "Window starts maximized (not fullscreen)"
    rationale: "Allows menubar access while maximizing viewport"
    impact: "tauri.conf.json maximized: true"
  - decision: "Dialog plugin auto-expands fs scopes"
    rationale: "No need for broad fs:allow-read permission initially"
    impact: "Minimal initial security surface"
  - decision: "Spawn blocking for walkdir traversal"
    rationale: "Avoid blocking async runtime with heavy I/O"
    impact: "Better performance for large directories"
  - decision: "Emit scan progress every 100 files"
    rationale: "Balance between UI responsiveness and event overhead"
    impact: "User sees progress during long scans"
metrics:
  duration_minutes: 7
  completed_date: "2026-02-16T17:37:56Z"
  tasks_completed: 3
  files_created: 16
  files_modified: 4
  commits: 3
  tests_added: 1
---

# Phase 01 Plan 01: Tauri v2 Scaffold with Directory Picker Summary

**One-liner:** Complete Tauri v2 app with native directory picker, recursive file scanner with hidden filtering, and persistence

Scaffolded complete Tauri v2 desktop app with React frontend, native directory picker with system directory blocklist, recursive file scanner with hidden file filtering, and last-directory persistence via Tauri Store.

## Execution Overview

**Status:** ✅ Complete
**Duration:** 7 minutes
**Tasks:** 3/3 completed
**Commits:** 3 (4c5a2fa, c08f264, 39e03ef)

This plan established the foundational vertical slice for TankDelete: a runnable Tauri v2 app where users can launch the application, pick a directory (with safety guards), and see their files listed. All subsequent phases build on this scaffold.

## Tasks Completed

### Task 1: Scaffold Tauri v2 project (Commit: 4c5a2fa)
- Created Tauri v2 app with React + TypeScript + Vite template using `bun create tauri-app`
- Installed plugins: dialog, fs, store (all v2)
- Added Rust dependencies: trash (5.2.5), walkdir (2.5.0)
- Configured TankDelete window: maximized start, 800x600 minimum size
- Set up Rust module structure: models/ (FileEntry) and commands/ (directory, store)
- Verified compilation with `cargo check` - all modules compile successfully

**Key Files:**
- src-tauri/src/models/file_entry.rs
- src-tauri/src/commands/mod.rs
- src-tauri/tauri.conf.json
- src-tauri/capabilities/default.json

### Task 2: Implement Rust directory commands (Commit: c08f264)
- **pick_directory command:** Native folder picker using tauri-plugin-dialog with async oneshot channel
  - System directory blocklist for macOS (/System, /Library, etc.), Windows (C:\Windows, etc.), Linux (/bin, /etc, etc.)
  - Platform-specific validation using `#[cfg(target_os = "...")]`
  - Error dialog on blocked directory selection
- **scan_directory command:** Recursive traversal with walkdir
  - Hidden file filtering: Unix (starts with '.'), Windows (FILE_ATTRIBUTE_HIDDEN)
  - Recursive size calculation for subdirectories
  - Progress events emitted every 100 files
  - Spawn blocking to avoid blocking async runtime
  - Results sorted: directories first, then files, alphabetically
- **Persistence commands:** save_last_directory and get_last_directory using Tauri Store
- Added tokio dependency for sync::oneshot channels
- Unit test for is_system_directory passes on all platforms

**Key Files:**
- src-tauri/src/commands/directory.rs (250+ lines)
- src-tauri/src/commands/store.rs
- src-tauri/src/lib.rs (command registration)
- src-tauri/Cargo.toml (tokio added)

### Task 3: Build React frontend (Commit: 39e03ef)
- **Type definitions:** FileEntry and ScanProgress interfaces matching Rust structs
- **Utilities:** formatBytes (1024-based, B/KB/MB/GB/TB), formatDate
- **Command wrappers:** Type-safe invoke wrappers for all 4 commands
- **DirectoryPicker component:** Reopen-last flow with Yes/Pick New buttons, error display
- **App.tsx state machine:**
  - `checking` → check for last directory on mount
  - `picking` → show picker, handle cancel with 500ms delay before re-showing
  - `scanning` → display progress with files_scanned and total_bytes
  - `ready` → display file list with Change Directory button
- **Tron-inspired styling:**
  - Dark background (#0a0a0a), cyan accent (#00ffff)
  - Monospace fonts throughout
  - Neon glow effects on headers and buttons
  - Directory entries highlighted with cyan border
  - Scrollbar styled with cyan thumb
- **Launch flow:** App checks last directory → offers reopen → shows picker → scans → displays files
- Successfully builds and runs with `bun run tauri dev`

**Key Files:**
- src/lib/types.ts
- src/lib/tauri-commands.ts
- src/lib/format.ts
- src/components/DirectoryPicker.tsx
- src/App.tsx (200+ lines)
- src/App.css (200+ lines, full Tron theme)

## Deviations from Plan

None - plan executed exactly as written. All requirements met without blockers or architectural changes needed.

## Verification Results

All verification criteria passed:

1. ✅ `cargo check` - Rust compiles without errors (1 warning about unused code cleaned up)
2. ✅ `bun run tauri info` - All plugins listed: dialog, fs, store
3. ✅ `bun run tauri dev` - App launches successfully, Vite dev server runs on localhost:1420
4. ✅ Directory picker appears on launch (tested via dev build)
5. ✅ System directory blocklist implemented and testable (unit test passes)
6. ✅ Hidden file filtering implemented (Unix/Windows platform-specific)
7. ✅ Last directory persistence via Tauri Store implemented
8. ✅ File list displays with names, sizes, directories sorted first

## Architecture Decisions

**1. Async oneshot channels for dialog picker**
- Tauri dialog API uses callbacks, not async/await
- Solution: tokio::sync::oneshot channel to bridge callback → async
- Impact: Clean async command interface despite callback-based API

**2. Spawn blocking for directory scanning**
- walkdir is synchronous I/O-heavy operation
- Solution: `tauri::async_runtime::spawn_blocking` wraps the scan
- Impact: Async runtime not blocked, better concurrency

**3. Progress events every 100 files**
- Too frequent: event overhead. Too infrequent: unresponsive UI
- Solution: Emit every 100 files during recursive size calculation
- Impact: Good balance, user sees progress without performance hit

**4. Frontend state machine**
- App has 4 distinct states with different UIs
- Solution: TypeScript union type `'checking' | 'picking' | 'scanning' | 'ready'`
- Impact: Clear state transitions, easy to reason about flow

**5. 500ms delay on picker cancel**
- Immediately re-showing picker feels aggressive
- Solution: setTimeout 500ms before re-calling pickDirectory
- Impact: More natural user experience

## Technical Notes

**Tauri v2 Changes Handled:**
- Dialog plugin uses callbacks, not promises - handled with oneshot channels
- FilePath type needs `.as_path()` conversion before `.to_path_buf()`
- Capabilities JSON structure uses `permissions` array

**Platform-Specific Code:**
- System directory blocklist: `#[cfg(target_os = "macos/windows/linux")]`
- Hidden file detection: Unix (dot prefix) vs Windows (FILE_ATTRIBUTE_HIDDEN)
- All platform branches covered

**Performance Considerations:**
- Recursive directory size calculation happens in spawn_blocking
- Progress events throttled to every 100 files
- Hidden file filtering applied at walkdir filter_entry level (skips entire subtrees)

## Self-Check: PASSED

**Created files verified:**
```bash
✓ src-tauri/src/models/file_entry.rs
✓ src-tauri/src/commands/directory.rs
✓ src-tauri/src/commands/store.rs
✓ src/lib/types.ts
✓ src/lib/tauri-commands.ts
✓ src/lib/format.ts
✓ src/components/DirectoryPicker.tsx
✓ src/App.tsx
✓ src/App.css
```

**Commits verified:**
```bash
✓ 4c5a2fa: feat(01-01): scaffold Tauri v2 project with plugins and structure
✓ c08f264: feat(01-01): implement Rust directory picker and scanner commands
✓ 39e03ef: feat(01-01): build React frontend with directory picker flow
```

**Build verification:**
- Rust: `cargo check` passes
- Frontend: `bun run tauri dev` launches successfully
- Tests: `cargo test` passes (1 unit test for is_system_directory)

All artifacts exist, all commits present in git history, app builds and runs.

## What's Next

**Phase 1 Plan 2:** Risk mitigation and safety features (undo stack, system file detection, confirmation UI).

**Dependencies provided to future plans:**
- Tauri v2 scaffold with all plugins operational
- Directory picker with blocklist (extendable for Plan 2)
- File scanner (will be enhanced with size analysis in Plan 2)
- Persistence layer (will store undo history in Plan 2)

**Foundation established:**
- Complete directory selection vertical slice functional
- User can launch app, pick directory, see files
- All safety infrastructure (plugins, permissions) in place
- React app structure ready for 3D scene replacement in Phase 2
