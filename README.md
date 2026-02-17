# TankDelete

Disclosure / Caution: This game was entirely created by Claude. This game is intended to be an entertaining way to delete files on your system. With that being said you are deleting files on your system so use with caution.

Drive a tank through your filesystem. Shoot files to delete them.

A Tron-inspired desktop app where your directories become neon arenas. Navigate glowing road grids, drive through tunnel portals to enter folders, and blast files into voxel explosions to free up disk space.

## Controls

| Input | Action |
|-------|--------|
| W / S | Drive forward / backward |
| A / D | Rotate tank left / right |
| Mouse | Aim turret |
| Left Click | Fire projectile |
| Right Click + Drag | Orbit camera to look around |

## Gameplay

- **Pick a directory** to load it as a 3D arena
- **Files** appear as colored blocks lining the Tron road grid
- **Folders** are glowing tunnel portals — drive into them to navigate deeper
- **Back portal** (green tunnel) takes you up one directory level
- **Shoot a file** to delete it — it shatters into a voxel explosion
- **Score** tracks total megabytes freed (1 point per MB)
- **Achievements** unlock at 100MB, 1GB, and 10GB milestones

## Features

- Tron-style glowing road grid with animated energy pulses
- Tunnel portals for folder navigation
- Voxel shatter explosions with category-colored particles
- Scoring system and achievement toasts
- Radar minimap showing nearby files and portals
- Files are sent to your system trash (recoverable)
- Cross-platform: macOS, Windows, Linux

## Download

Grab the latest installer for your platform from the [Releases](https://github.com/zacblev1/tankdelete/releases) page:

- **macOS**: `.dmg` (Apple Silicon and Intel)
- **Windows**: `.msi` or `.exe`
- **Linux**: `.deb` or `.AppImage`

## Build from Source

Requires [Rust](https://rustup.rs/), [Bun](https://bun.sh/), and platform dependencies for [Tauri v2](https://v2.tauri.app/start/prerequisites/).

```bash
# Install dependencies
bun install

# Run in development
bun run tauri dev

# Build release installer
bun run tauri build
```

## Safety

- Files are moved to your system trash, not permanently deleted
- System directories (`/System`, `C:\Windows`, `/usr`, etc.) are blocked
- Undo support restores files from trash

## License

MIT
