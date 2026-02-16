# Phase 1: Foundation & Safety - Context

**Gathered:** 2026-02-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Tauri desktop app scaffold with directory picker, filesystem read access, trash integration (move files to OS recycle bin), and session-wide undo system. No 3D rendering, no tank, no game mechanics — purely the app shell and safety infrastructure.

</domain>

<decisions>
## Implementation Decisions

### App Launch Flow
- Immediately show native directory picker on launch — no title screen, no landing page
- If user cancels picker, re-show picker (must pick a folder to proceed)
- Scene builds instantly after folder selection — no loading screen
- Persist last-used directory and offer to reopen it on next launch

### Directory Picker
- Block system directories (/System, /usr, /Library, C:\Windows, etc.) — prevent selection
- Hide hidden files/folders (dotfiles like .git, .env) — don't render them on the grid at all
- Pre-scan recursively on launch — build total size stats for all nested subfolders
- Remember last-used directory between sessions (local storage / Tauri store)

### Trash Behavior
- Use OS native trash/recycle bin (macOS Trash, Windows Recycle Bin)
- Full session undo stack — Ctrl+Z walks back through ALL deletions in the session (unlimited)
- On delete: explosion particle effect + HUD toast notification ("Deleted report.pdf (2.3 MB) — Ctrl+Z to undo")
- On undo: file block fades/pops back into its original grid position
- Running HUD counter: total files deleted and total MB freed this session

### Dev Environment
- Tauri v2 desktop app (not pure browser)
- Primary target: macOS (test other platforms later)
- React for UI overlays (HUD, tooltips, menus, file picker integration)
- Three.js (vanilla, not React Three Fiber) for 3D scene
- TypeScript throughout
- Bun as package manager
- Vite as build tool

### Claude's Discretion
- Window size on launch (fullscreen vs maximized windowed)
- Exact system directory blocklist
- Pre-scan performance strategy (background thread, progressive loading)
- Toast notification duration and positioning
- Undo stack memory management

</decisions>

<specifics>
## Specific Ideas

- Launch should feel immediate — picker appears, you pick a folder, you're in the game
- The HUD running total ties into the gamification in Phase 4 (scoring based on MB freed)
- Undo feedback should be clear but not disruptive — block just reappears, no fanfare

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation-safety*
*Context gathered: 2026-02-16*
