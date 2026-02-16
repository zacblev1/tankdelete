# Requirements: TankDelete

**Defined:** 2026-02-16
**Core Value:** Deleting unwanted files feels fun and satisfying, not tedious — turning filesystem cleanup into a game.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core Engine

- [ ] **ENGN-01**: User can select a starting directory via file picker on launch
- [ ] **ENGN-02**: User can drive tank with WASD keys on the Tron grid
- [ ] **ENGN-03**: User can aim turret with mouse movement
- [ ] **ENGN-04**: User can fire projectile by clicking mouse button
- [ ] **ENGN-05**: Third-person camera follows behind and above the tank smoothly
- [ ] **ENGN-06**: Scene renders at 60 FPS with 500+ file objects via instanced rendering

### File Visualization

- [ ] **VIZL-01**: Files appear as glowing geometric blocks on the neon grid
- [ ] **VIZL-02**: Block size scales proportionally to file size
- [ ] **VIZL-03**: Block color varies by file type/extension
- [ ] **VIZL-04**: Aiming at a block shows hover tooltip with filename, size, and last modified date
- [ ] **VIZL-05**: Tron aesthetic: dark background, neon grid floor, glowing wireframe edges, bloom post-processing
- [ ] **VIZL-06**: Folders appear as distinct portal/gate structures on the grid

### Navigation

- [ ] **NAVG-01**: User can drive through a folder portal to enter that directory (scene reloads with new contents)
- [ ] **NAVG-02**: User can navigate back to parent directory (back portal always present)
- [ ] **NAVG-03**: Minimap displays current directory layout with player position

### Delete System

- [ ] **DELT-01**: First shot marks a file block (visual highlight/glow change indicates marked state)
- [ ] **DELT-02**: Second shot on a marked file sends it to OS recycle bin/trash
- [ ] **DELT-03**: Deleted file block plays destruction animation and is removed from scene
- [ ] **DELT-04**: User can undo last deletion with Ctrl+Z (file restored from trash, block reappears)
- [ ] **DELT-05**: User can mark multiple files then delete all marked files at once (batch mode)

### Gamification

- [ ] **GAME-01**: User earns points based on MB freed when deleting files
- [ ] **GAME-02**: Score display visible in HUD during gameplay
- [ ] **GAME-03**: Particle explosion plays on file deletion, scaled to file size
- [ ] **GAME-04**: Achievement system tracks milestones (e.g., "Freed 1GB", "Deleted 100 files", "Perfect accuracy")
- [ ] **GAME-05**: Achievement notifications display in-game when earned

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Gamification Extended

- **GAMX-01**: Combo multiplier for deleting multiple files in quick succession
- **GAMX-02**: Folder "boss battles" for large nested directories
- **GAMX-03**: Leaderboard tracking across sessions

### Platform

- **PLAT-01**: PWA support (installable, offline after first load)
- **PLAT-02**: File type as distinct geometry shapes (docs = rectangles, images = planes, videos = TV-shaped)

### Advanced Features

- **ADVN-01**: Sound effects for shooting, deleting, navigation
- **ADVN-02**: File suggestions (highlight large/old files as potential targets)
- **ADVN-03**: Session stats summary (total MB freed, files deleted, time spent)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Automatic file deletion | Dangerous — users must confirm every deletion |
| Permanent deletion (bypass recycle bin) | No undo, high regret potential |
| Network/remote drive support | Security and performance complexity |
| Multiplayer / social features | Encourages reckless deletion, scope explosion |
| VR mode | Niche audience, doubles dev cost |
| Mobile version | Mobile filesystem APIs limited, touch controls inadequate |
| File preview/editing | Scope creep — this is a deletion tool |
| Cloud storage integration | Each API complex, defer to v2+ |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| ENGN-01 | — | Pending |
| ENGN-02 | — | Pending |
| ENGN-03 | — | Pending |
| ENGN-04 | — | Pending |
| ENGN-05 | — | Pending |
| ENGN-06 | — | Pending |
| VIZL-01 | — | Pending |
| VIZL-02 | — | Pending |
| VIZL-03 | — | Pending |
| VIZL-04 | — | Pending |
| VIZL-05 | — | Pending |
| VIZL-06 | — | Pending |
| NAVG-01 | — | Pending |
| NAVG-02 | — | Pending |
| NAVG-03 | — | Pending |
| DELT-01 | — | Pending |
| DELT-02 | — | Pending |
| DELT-03 | — | Pending |
| DELT-04 | — | Pending |
| DELT-05 | — | Pending |
| GAME-01 | — | Pending |
| GAME-02 | — | Pending |
| GAME-03 | — | Pending |
| GAME-04 | — | Pending |
| GAME-05 | — | Pending |

**Coverage:**
- v1 requirements: 25 total
- Mapped to phases: 0
- Unmapped: 25 ⚠️

---
*Requirements defined: 2026-02-16*
*Last updated: 2026-02-16 after initial definition*
