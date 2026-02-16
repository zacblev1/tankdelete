# TankDelete

## What This Is

A Tron-themed browser-based tank game where you drive through your actual file directory on a neon grid. Files appear as glowing geometric blocks — shoot them to send them to the recycling bin. Folders are portals you drive through to navigate deeper into your filesystem.

## Core Value

Deleting unwanted files feels fun and satisfying, not tedious — turning filesystem cleanup into a game.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Tron-style 3D neon grid environment in the browser
- [ ] Tank with WASD movement and mouse-aimed turret
- [ ] Files rendered as glowing blocks (size based on file size, color based on file type)
- [ ] Folders rendered as portal/gate structures you drive through to enter
- [ ] Two-shot delete system (first shot marks, second shot sends to recycle bin)
- [ ] Hover tooltip showing filename, size, and last modified date
- [ ] File picker on launch to choose starting directory
- [ ] Navigate back to parent directory (drive back out of portal)
- [ ] Actual filesystem integration — deletions move real files to OS recycle bin

### Out of Scope

- Mobile support — desktop browser with keyboard/mouse only
- File creation or renaming — this is a deletion tool only
- Network/remote filesystems — local directories only
- Multiplayer — single player experience

## Context

- Browser-based means WebGL/Three.js or similar for the Tron 3D aesthetic
- Filesystem access in a browser requires either a backend server or the File System Access API
- The recycle bin/trash behavior varies by OS (macOS Trash, Windows Recycle Bin, Linux trash)
- Tron aesthetic: dark background, neon cyan/magenta/orange glowing edges, grid floor, wireframe geometry
- Two-shot system provides safety without breaking game flow — first shot highlights/marks the target, second shot confirms deletion

## Constraints

- **Platform**: Web browser (Chrome/Firefox/Edge) — must work without installation
- **Filesystem Access**: Need a mechanism to read directories and move files to trash from the browser
- **Performance**: Must handle directories with hundreds of files without lag
- **Safety**: Two-shot system is non-negotiable — no accidental single-click deletions

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Tron visual style | User's stated preference — neon grid, glowing wireframes | — Pending |
| Two-shot delete system | Balances game feel with safety — no confirmation dialogs | — Pending |
| WASD + mouse controls | Classic FPS-style controls, intuitive for gamers | — Pending |
| File picker on launch | User picks which directory to explore, no auto-scanning | — Pending |
| Browser-based | No installation required, accessible | — Pending |

---
*Last updated: 2026-02-16 after initialization*
