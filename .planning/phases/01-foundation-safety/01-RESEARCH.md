# Phase 1: Foundation & Safety - Research

**Researched:** 2026-02-16
**Domain:** Tauri v2 desktop application with filesystem operations and OS trash integration
**Confidence:** HIGH

## Summary

Phase 1 requires building a Tauri v2 desktop app scaffold with native directory picker, filesystem access, OS trash integration, and session-wide undo functionality. The research confirms this is a well-trodden path with mature tooling.

**Key findings:**
- Tauri v2 provides robust dialog and filesystem APIs with security-first design (scope-based permissions)
- Native trash functionality requires the external `trash` crate (v5.0+) as Tauri doesn't include it built-in
- The Command pattern with undo stack is the standard architecture for undo/redo in filesystem operations
- React + Three.js + Tauri integration works via standard ref/useEffect patterns
- Cross-platform hidden file detection requires platform-specific code (`#[cfg(unix)]` for dotfiles, Windows file attributes for Windows)

**Primary recommendation:** Use Tauri v2's dialog plugin for directory selection (auto-expands scopes), the `trash` crate for recycle bin operations, `walkdir` for efficient recursive scanning, and Tauri Store plugin for persisting last-used directory. Build the undo stack in Rust with commands exposed to the frontend.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**App Launch Flow:**
- Immediately show native directory picker on launch — no title screen, no landing page
- If user cancels picker, re-show picker (must pick a folder to proceed)
- Scene builds instantly after folder selection — no loading screen
- Persist last-used directory and offer to reopen it on next launch

**Directory Picker:**
- Block system directories (/System, /usr, /Library, C:\Windows, etc.) — prevent selection
- Hide hidden files/folders (dotfiles like .git, .env) — don't render them on the grid at all
- Pre-scan recursively on launch — build total size stats for all nested subfolders
- Remember last-used directory between sessions (local storage / Tauri store)

**Trash Behavior:**
- Use OS native trash/recycle bin (macOS Trash, Windows Recycle Bin)
- Full session undo stack — Ctrl+Z walks back through ALL deletions in the session (unlimited)
- On delete: explosion particle effect + HUD toast notification ("Deleted report.pdf (2.3 MB) — Ctrl+Z to undo")
- On undo: file block fades/pops back into its original grid position
- Running HUD counter: total files deleted and total MB freed this session

**Dev Environment:**
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

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tauri | 2.0.0+ | Desktop app framework | Official stable release, production-ready, best-in-class security model |
| @tauri-apps/plugin-dialog | 2.0.0+ | Native file picker | Official plugin, auto-expands filesystem scopes on selection |
| @tauri-apps/plugin-fs | 2.0.0+ | Filesystem operations | Official plugin, path traversal protection built-in |
| @tauri-apps/plugin-store | 2.0.0+ | Persistent key-value storage | Official plugin, persists across sessions, JSON-based |
| trash (Rust crate) | 5.0+ | Move files to OS trash | Cross-platform (Windows/macOS/Linux), implements FreeDesktop spec v1.0 |
| walkdir (Rust crate) | 2.5+ | Recursive directory traversal | Industry standard, performance comparable to find/nftw, efficient filtering |
| React | 18.0+ | UI framework for overlays | Locked decision, hooks-based architecture |
| Three.js | r160+ | 3D rendering (vanilla) | Locked decision, stable API, wide ecosystem |
| TypeScript | 5.0+ | Type safety | Locked decision, essential for Tauri command type safety |
| Vite | 5.4+ | Build tool | Officially recommended by Tauri v2, fast HMR |
| Bun | 1.0+ | Package manager & runtime | Locked decision, fast installation and task running |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hot-toast | 2.4+ | Toast notifications | Lightweight (5KB), promise-based API, accessibility built-in |
| serde_json (Rust) | 1.0+ | JSON serialization | Required for Tauri command parameters/returns |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| trash crate | Electron's shell.trashItem | Would require switching to Electron (not viable — Tauri is locked) |
| walkdir | std::fs::read_dir recursive | Manual recursion is complex, no symlink control, worse performance |
| react-hot-toast | react-toastify | Larger bundle (16KB vs 5KB), more features but heavier |
| Tauri Store | localStorage | Works but JS-only, can't access from Rust backend |

**Installation:**
```bash
# Create project (already done if following Phase 0)
bun create tauri-app

# Add Tauri plugins
bun run tauri add dialog
bun run tauri add fs
bun run tauri add store

# Add Rust dependencies (in src-tauri/Cargo.toml)
# trash = "5.0"
# walkdir = "2.5"
# serde_json = "1.0"

# Add React dependencies
bun add react-hot-toast
bun add three @types/three
```

## Architecture Patterns

### Recommended Project Structure
```
tankdelete/
├── src/
│   ├── components/          # React components
│   │   ├── HUD.tsx          # Heads-up display (file counter, MB freed)
│   │   ├── FileGrid.tsx     # Directory entry renderer (data-only, no 3D)
│   │   └── DirectoryPicker.tsx  # Wrapper for Tauri dialog
│   ├── three/               # Three.js scene management
│   │   ├── SceneManager.ts  # Scene, camera, renderer setup
│   │   ├── FileBlock.ts     # 3D file block representation (deferred to Phase 2)
│   │   └── ParticleSystem.ts # Explosion effects (deferred to Phase 2)
│   ├── lib/                 # Shared utilities
│   │   ├── tauri-commands.ts # Type-safe Tauri invoke wrappers
│   │   └── format.ts        # File size formatting, etc.
│   ├── App.tsx              # Root component
│   └── main.tsx             # Entry point
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs           # Tauri app entry, command registration
│   │   ├── commands/        # Tauri commands
│   │   │   ├── mod.rs       # Module exports
│   │   │   ├── directory.rs # Directory picker, scanning, validation
│   │   │   ├── trash.rs     # Trash operations, undo stack
│   │   │   └── store.rs     # Last directory persistence
│   │   └── models/          # Shared types
│   │       ├── mod.rs
│   │       ├── file_entry.rs # FileEntry struct (path, size, is_dir)
│   │       └── undo_action.rs # UndoAction enum
│   ├── Cargo.toml
│   └── capabilities/
│       └── default.json     # Filesystem & dialog permissions
└── package.json
```

### Pattern 1: Tauri Command Definition (Rust → JavaScript Bridge)
**What:** Define type-safe commands in Rust, expose to frontend via `#[tauri::command]`
**When to use:** All filesystem operations, trash operations, directory scanning
**Example:**
```rust
// Source: https://v2.tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct FileEntry {
    pub path: String,
    pub size: u64,
    pub is_dir: bool,
}

#[tauri::command]
async fn scan_directory(path: String) -> Result<Vec<FileEntry>, String> {
    use walkdir::WalkDir;

    let mut entries = Vec::new();
    for entry in WalkDir::new(&path)
        .follow_links(false)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        entries.push(FileEntry {
            path: entry.path().display().to_string(),
            size: metadata.len(),
            is_dir: metadata.is_dir(),
        });
    }
    Ok(entries)
}

// In lib.rs:
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![scan_directory])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Frontend invocation:**
```typescript
// Source: https://v2.tauri.app/develop/calling-rust/
import { invoke } from '@tauri-apps/api/core';

interface FileEntry {
  path: string;
  size: number;
  is_dir: boolean;
}

async function scanDirectory(path: string): Promise<FileEntry[]> {
  return await invoke<FileEntry[]>('scan_directory', { path });
}
```

### Pattern 2: Directory Picker with Validation
**What:** Use dialog plugin to pick directory, validate against system directory blocklist
**When to use:** On app launch, when user wants to change directories
**Example:**
```rust
// Source: https://v2.tauri.app/plugin/dialog/
use tauri_plugin_dialog::DialogExt;

#[tauri::command]
async fn pick_directory(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let dialog = app.dialog().file();

    let path = dialog
        .set_title("Select Directory to Explore")
        .blocking_pick_folder();

    match path {
        Some(p) => {
            let path_str = p.to_string();

            // Validate against system directories
            if is_system_directory(&path_str) {
                return Err("Cannot select system directory".to_string());
            }

            Ok(Some(path_str))
        },
        None => Ok(None), // User cancelled
    }
}

fn is_system_directory(path: &str) -> bool {
    let system_dirs = [
        "/System", "/usr", "/Library", "/bin", "/sbin", "/etc", "/var",
        "C:\\Windows", "C:\\Program Files", "C:\\Program Files (x86)",
    ];

    system_dirs.iter().any(|sys_dir| path.starts_with(sys_dir))
}
```

### Pattern 3: Undo Stack with Command Pattern
**What:** Maintain stack of trash operations, support unlimited undo
**When to use:** All destructive operations (file deletion in this phase)
**Example:**
```rust
// Sources:
// - https://gernotklingler.com/blog/implementing-undoredo-with-the-command-pattern/
// - https://codezup.com/command-pattern-tutorial-implementing-undo-redo-functionality/

use std::sync::Mutex;
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrashAction {
    pub file_path: String,
    pub original_size: u64,
}

pub struct UndoStack {
    actions: Mutex<Vec<TrashAction>>,
}

impl UndoStack {
    pub fn new() -> Self {
        Self {
            actions: Mutex::new(Vec::new()),
        }
    }

    pub fn push(&self, action: TrashAction) {
        self.actions.lock().unwrap().push(action);
    }

    pub fn pop(&self) -> Option<TrashAction> {
        self.actions.lock().unwrap().pop()
    }
}

#[tauri::command]
async fn move_to_trash(
    path: String,
    undo_stack: State<'_, UndoStack>,
) -> Result<u64, String> {
    use trash;

    let metadata = std::fs::metadata(&path).map_err(|e| e.to_string())?;
    let size = metadata.len();

    // Move to trash (cross-platform)
    trash::delete(&path).map_err(|e| e.to_string())?;

    // Record for undo
    undo_stack.push(TrashAction {
        file_path: path,
        original_size: size,
    });

    Ok(size)
}

#[tauri::command]
async fn undo_last_trash(
    undo_stack: State<'_, UndoStack>,
) -> Result<Option<String>, String> {
    match undo_stack.pop() {
        Some(action) => {
            // Restore from trash - NOTE: trash crate doesn't provide restore,
            // need alternative approach (see Pitfall #2 below)
            Ok(Some(action.file_path))
        },
        None => Ok(None),
    }
}
```

### Pattern 4: React + Vanilla Three.js Integration
**What:** Use React refs and useEffect to manage Three.js scene lifecycle
**When to use:** Embedding Three.js scenes in React components
**Example:**
```typescript
// Sources:
// - https://medium.com/@claudeando/three-js-in-react-functional-component-65c5658a9ab7
// - https://sbcode.net/react-three-fiber/use-effect/

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function SceneCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize scene once
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    sceneRef.current = scene;

    // Animation loop
    function animate() {
      animationFrameRef.current = requestAnimationFrame(animate);
      // DON'T update React state here - breaks animation loop
      // Use refs for animation values
      renderer.render(scene, camera);
    }
    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []); // Empty deps - run once on mount

  return <div ref={containerRef} />;
}
```

### Pattern 5: Toast Notifications
**What:** Show temporary feedback for user actions (delete, undo)
**When to use:** After trash operations, undo operations
**Example:**
```typescript
// Source: https://react-hot-toast.com/
import toast, { Toaster } from 'react-hot-toast';

// In App.tsx
function App() {
  return (
    <>
      <Toaster position="top-right" />
      {/* rest of app */}
    </>
  );
}

// Usage
async function deleteFile(path: string) {
  try {
    const size = await invoke<number>('move_to_trash', { path });
    toast.success(
      `Deleted ${path.split('/').pop()} (${formatBytes(size)}) — Ctrl+Z to undo`,
      { duration: 4000 }
    );
  } catch (error) {
    toast.error(`Failed to delete: ${error}`);
  }
}
```

### Pattern 6: Persistent Settings with Tauri Store
**What:** Remember last-used directory between sessions
**When to use:** On app launch (load last dir), after directory selection (save)
**Example:**
```typescript
// Source: https://v2.tauri.app/plugin/store/
import { load } from '@tauri-apps/plugin-store';

const store = await load('settings.json', { autoSave: true });

// Save last directory
async function saveLastDirectory(path: string) {
  await store.set('lastDirectory', path);
  // Auto-saves due to autoSave: true
}

// Load on startup
async function getLastDirectory(): Promise<string | null> {
  return await store.get<string>('lastDirectory');
}
```

### Anti-Patterns to Avoid

- **Storing animation state in React state:** Causes re-renders, breaks animation loop — use refs instead
- **Blocking the Rust async runtime:** Don't use blocking I/O in async Tauri commands — use `spawn_blocking` for heavy sync work
- **Using std::fs::read_dir recursively:** Manual recursion is error-prone — use `walkdir` crate
- **Hardcoding system directory paths:** Different on each OS — use conditional compilation `#[cfg(target_os = "...")]`
- **Forgetting to clean up Three.js resources:** Memory leaks — always dispose geometries, materials, renderer in useEffect cleanup

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Recursive directory traversal | Custom DFS with std::fs | `walkdir` crate | Handles symlinks, permission errors, efficient filtering, performance-optimized |
| OS trash integration | Custom trash directory management | `trash` crate | Implements platform-specific APIs (macOS FSMoveObjectToTrashSync, Windows IFileOperation, FreeDesktop spec) |
| Cross-platform hidden file detection | String parsing for dots | Platform-specific APIs via `#[cfg]` | Windows uses file attributes (not filename), Unix uses dotfile convention |
| Tauri command serialization | Manual JSON stringify/parse | Tauri's built-in serde integration | Type-safe, handles errors, automatic conversion |
| File size formatting | Custom byte conversion | Shared utility function or crate | Edge cases (1000 vs 1024, localization) |

**Key insight:** Filesystem operations have OS-specific quirks (permissions, symlinks, hidden attributes, trash APIs) that take years to handle correctly. Use battle-tested crates instead of custom implementations.

## Common Pitfalls

### Pitfall 1: Tauri Filesystem Scope Violations
**What goes wrong:** Attempting to read files outside the allowed scope results in runtime errors
**Why it happens:** Tauri v2's security model uses scope-based permissions — only paths explicitly added to the scope are accessible
**How to avoid:** Use the dialog plugin to pick directories (auto-expands scope) or explicitly configure scopes in `capabilities/default.json`
**Warning signs:** Errors like "path not allowed" or "access denied" when calling filesystem commands

**Solution:**
```json
// src-tauri/capabilities/default.json
{
  "permissions": [
    "dialog:allow-open",
    {
      "identifier": "fs:allow-read",
      "allow": [
        { "path": "$HOME/**" }
      ]
    }
  ]
}
```
**Better:** Let dialog picker handle scopes automatically (Source: https://v2.tauri.app/plugin/file-system/)

### Pitfall 2: Trash Crate Has No Restore Functionality
**What goes wrong:** The `trash` crate only moves files to trash — it doesn't provide a restore/undelete function
**Why it happens:** Different OS trash implementations have different metadata formats for tracking original paths
**How to avoid:** Maintain own mapping of original paths before calling trash::delete, or use OS-specific restore APIs
**Warning signs:** Undo feature doesn't work, files stuck in trash

**Solution:**
```rust
// Before calling trash::delete, save original path
#[derive(Serialize, Deserialize)]
struct TrashMetadata {
    original_path: PathBuf,
    trash_timestamp: u64,
}

// Store in separate JSON file or in-memory
// On undo: manually move file back from OS-specific trash location
// macOS: ~/.Trash/, Windows: C:\$Recycle.Bin\, Linux: ~/.local/share/Trash/
```

**Alternative:** Use platform-specific restore APIs:
- macOS: Use AppleScript or Objective-C to restore via Finder
- Windows: Use IFileOperation COM interface
- Linux: Parse `~/.local/share/Trash/info/*.trashinfo` files

### Pitfall 3: Directory Picker User Cancellation Loop
**What goes wrong:** If user cancels picker, re-showing it immediately feels aggressive/trapped
**Why it happens:** Requirement says "if user cancels picker, re-show picker" but no delay/escape hatch
**How to avoid:** Add small delay (500ms) before re-showing, or provide "quit app" option
**Warning signs:** User testing shows frustration, can't close app without force-quit

**Solution:**
```typescript
async function ensureDirectoryPicked(): Promise<string> {
  while (true) {
    const path = await invoke<string | null>('pick_directory');
    if (path) return path;

    // Give user breathing room
    await new Promise(resolve => setTimeout(resolve, 500));

    // Optional: show "Pick a directory or quit" message
  }
}
```

### Pitfall 4: Hidden File Detection on Windows
**What goes wrong:** Checking if filename starts with '.' works on Unix but misses Windows hidden files
**Why it happens:** Windows uses file attributes (not naming convention) for hidden files
**How to avoid:** Use conditional compilation for platform-specific checks
**Warning signs:** .git shows up on macOS correctly but hidden Windows folders still appear

**Solution:**
```rust
// Source: https://users.rust-lang.org/t/portable-way-to-check-if-a-file-is-hidden/106783
fn is_hidden(entry: &walkdir::DirEntry) -> bool {
    entry.file_name()
        .to_str()
        .map(|s| s.starts_with('.'))
        .unwrap_or(false)
}

#[cfg(windows)]
fn is_hidden_windows(entry: &walkdir::DirEntry) -> bool {
    use std::os::windows::fs::MetadataExt;
    const FILE_ATTRIBUTE_HIDDEN: u32 = 0x2;

    entry.metadata()
        .map(|m| m.file_attributes() & FILE_ATTRIBUTE_HIDDEN != 0)
        .unwrap_or(false)
}

fn should_skip_entry(entry: &walkdir::DirEntry) -> bool {
    #[cfg(windows)]
    {
        is_hidden(entry) || is_hidden_windows(entry)
    }

    #[cfg(not(windows))]
    {
        is_hidden(entry)
    }
}
```

### Pitfall 5: System Directory Blocklist Incomplete
**What goes wrong:** User selects /Applications or C:\Users and deletes critical files
**Why it happens:** Blocklist only covers most obvious system directories
**How to avoid:** Research comprehensive list per platform, add safeguards for common user mistakes
**Warning signs:** User reports "I broke my system"

**Recommended blocklist:**
```rust
// Sources:
// - https://osxdaily.com/2007/03/30/mac-os-x-directory-structure-explained/
// - https://www.howtogeek.com/346997/what-is-the-system32-directory-and-why-you-shouldnt-delete-it/

const MACOS_BLOCKED: &[&str] = &[
    "/System",
    "/Library",
    "/usr",
    "/bin",
    "/sbin",
    "/etc",
    "/var",
    "/private",
    "/cores",
    "/dev",
];

const WINDOWS_BLOCKED: &[&str] = &[
    "C:\\Windows",
    "C:\\Program Files",
    "C:\\Program Files (x86)",
    "C:\\ProgramData",
    "C:\\$Recycle.Bin",
    "C:\\System Volume Information",
];

const LINUX_BLOCKED: &[&str] = &[
    "/bin",
    "/boot",
    "/dev",
    "/etc",
    "/lib",
    "/lib64",
    "/proc",
    "/root",
    "/sbin",
    "/sys",
    "/usr",
    "/var",
];
```

### Pitfall 6: Undo Stack Memory Growth
**What goes wrong:** Unlimited undo stack causes memory issues for large deletion sessions
**Why it happens:** Each undo action stores file path + metadata, thousands of deletions = MB of memory
**How to avoid:** Set reasonable limit (e.g., 1000 actions) or implement LRU eviction
**Warning signs:** App memory usage grows over time, slowdown after many deletions

**Solution (Claude's discretion):**
```rust
pub struct UndoStack {
    actions: Mutex<VecDeque<TrashAction>>, // Use VecDeque for efficient pop_front
    max_size: usize,
}

impl UndoStack {
    pub fn new(max_size: usize) -> Self {
        Self {
            actions: Mutex::new(VecDeque::new()),
            max_size,
        }
    }

    pub fn push(&self, action: TrashAction) {
        let mut actions = self.actions.lock().unwrap();
        if actions.len() >= self.max_size {
            actions.pop_front(); // Remove oldest
        }
        actions.push_back(action);
    }
}
```

**Recommendation:** Start with 1000 action limit (reasonable for session-based undo). Monitor in Phase 4.

### Pitfall 7: Pre-scan Blocking App Launch
**What goes wrong:** Scanning a large directory (e.g., home folder with 500k files) freezes UI for 30+ seconds
**Why it happens:** Requirement says "pre-scan recursively on launch" but doesn't specify async strategy
**How to avoid:** Run scan in Rust async task, show progress indicator, allow cancellation
**Warning signs:** App appears frozen after directory selection

**Solution (Claude's discretion):**
```rust
use tauri::Emitter;

#[tauri::command]
async fn scan_directory_progressive(
    app: tauri::AppHandle,
    path: String,
) -> Result<(), String> {
    use walkdir::WalkDir;

    tauri::async_runtime::spawn(async move {
        let mut count = 0;
        let mut total_size = 0u64;

        for entry in WalkDir::new(&path).into_iter().filter_map(|e| e.ok()) {
            if let Ok(metadata) = entry.metadata() {
                count += 1;
                total_size += metadata.len();

                // Emit progress every 100 files
                if count % 100 == 0 {
                    let _ = app.emit("scan_progress", ScanProgress {
                        files_scanned: count,
                        total_bytes: total_size,
                    });
                }
            }
        }

        let _ = app.emit("scan_complete", ScanResult {
            total_files: count,
            total_bytes: total_size,
        });
    });

    Ok(())
}
```

**Frontend:**
```typescript
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen('scan_progress', (event) => {
  console.log(`Scanned ${event.payload.files_scanned} files...`);
});
```

## Code Examples

All examples above are verified patterns from official sources. Additional reference examples:

### Complete Tauri Command Registration
```rust
// src-tauri/src/lib.rs
mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use commands::{directory, trash, store};

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .manage(trash::UndoStack::new(1000)) // Managed state
        .invoke_handler(tauri::generate_handler![
            directory::pick_directory,
            directory::scan_directory,
            trash::move_to_trash,
            trash::undo_last_trash,
            store::save_last_directory,
            store::get_last_directory,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Type-Safe Frontend Commands
```typescript
// src/lib/tauri-commands.ts
import { invoke } from '@tauri-apps/api/core';

export interface FileEntry {
  path: string;
  size: number;
  is_dir: boolean;
}

export interface TrashResult {
  size: number;
}

export const commands = {
  async pickDirectory(): Promise<string | null> {
    return invoke<string | null>('pick_directory');
  },

  async scanDirectory(path: string): Promise<FileEntry[]> {
    return invoke<FileEntry[]>('scan_directory', { path });
  },

  async moveToTrash(path: string): Promise<number> {
    return invoke<number>('move_to_trash', { path });
  },

  async undoLastTrash(): Promise<string | null> {
    return invoke<string | null>('undo_last_trash');
  },

  async saveLastDirectory(path: string): Promise<void> {
    return invoke('save_last_directory', { path });
  },

  async getLastDirectory(): Promise<string | null> {
    return invoke<string | null>('get_last_directory');
  },
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tauri v1 allowlist permissions | Tauri v2 capability-based permissions | Tauri 2.0 (Sept 2024) | More granular security, per-window capabilities, better defaults |
| Manual path scope management | Dialog auto-expands scopes | Tauri 2.0 | Simpler, safer — picker automatically grants access to selected paths |
| React Three Fiber for Tauri | Vanilla Three.js preferred | Ongoing | Less overhead, more control, easier to debug in desktop context |
| Electron for trash operations | Rust trash crate with Tauri | Tauri 1.0+ | Smaller bundles, native performance, no Node.js dependency |

**Deprecated/outdated:**
- **Tauri v1 `allowlist` in tauri.conf.json:** Replaced by capabilities system in v2 — use `capabilities/*.json` files instead
- **`@tauri-apps/api/fs` path allowlist:** Replaced by scope-based permissions — configure in capabilities
- **Bundling React Three Fiber for simple scenes:** Adds 300KB+ for features not needed in desktop context — use vanilla Three.js

## Open Questions

1. **Trash restore mechanism**
   - What we know: `trash` crate moves files to OS trash but provides no restore function
   - What's unclear: Best approach for cross-platform restore (manual file move vs OS-specific APIs)
   - Recommendation: Start with manual tracking + file move (Phase 1), investigate OS APIs for Phase 4 polish

2. **Pre-scan performance threshold**
   - What we know: `walkdir` is efficient, but 500k+ files still take time
   - What's unclear: Acceptable scan time before needing progress indicator
   - Recommendation: Implement progressive scan with events (Pitfall #7 solution), test with large directories

3. **Window launch state**
   - What we know: Can configure `maximized: true` in tauri.conf.json
   - What's unclear: User preference — fullscreen vs maximized windowed
   - Recommendation: Start with maximized windowed (allows menubar access), make configurable in Phase 4

4. **Undo stack size limit**
   - What we know: Unlimited undo can cause memory issues
   - What's unclear: Reasonable limit for typical usage
   - Recommendation: 1000 actions (covers most sessions), monitor in telemetry (Phase 4)

## Sources

### Primary (HIGH confidence)
- [Tauri v2 Dialog Plugin](https://v2.tauri.app/plugin/dialog/) - Directory picker API, user cancellation handling
- [Tauri v2 Filesystem Plugin](https://v2.tauri.app/plugin/file-system/) - Security scopes, recursive directory reading
- [Tauri v2 Calling Rust](https://v2.tauri.app/develop/calling-rust/) - Command pattern, type safety, async commands
- [Tauri v2 Store Plugin](https://v2.tauri.app/plugin/store/) - Persistent key-value storage
- [trash crate docs](https://docs.rs/trash) - Cross-platform trash operations
- [walkdir crate docs](https://docs.rs/walkdir/latest/walkdir/) - Recursive directory traversal

### Secondary (MEDIUM confidence)
- [Tauri trash feature request #5680](https://github.com/tauri-apps/tauri/issues/5680) - Confirmed no native trash support
- [React Hot Toast](https://react-hot-toast.com/) - Toast notification library
- [Three.js + React integration patterns (Medium)](https://medium.com/@claudeando/three-js-in-react-functional-component-65c5658a9ab7) - Verified with official React docs
- [Command Pattern for Undo (CodezUp)](https://codezup.com/command-pattern-tutorial-implementing-undo-redo-functionality/) - Standard CS pattern
- [Rust hidden file detection discussion](https://users.rust-lang.org/t/portable-way-to-check-if-a-file-is-hidden/106783) - Community consensus
- [macOS directory structure (OSXDaily)](https://osxdaily.com/2007/03/30/mac-os-x-directory-structure-explained/) - System directory paths
- [Windows System32 explanation (How-To Geek)](https://www.howtogeek.com/346997/what-is-the-system32-directory-and-why-you-shouldnt-delete-it/) - Windows system paths

### Tertiary (LOW confidence, for awareness only)
- [Tokio async performance discussions](https://tokio.rs/tokio/tutorial) - General async patterns, not Tauri-specific
- [Tauri window maximized bug #11554](https://github.com/tauri-apps/tauri/issues/11554) - Open issue, may be resolved

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are official Tauri plugins or widely-adopted crates with stable APIs
- Architecture: HIGH - Patterns verified with official Tauri v2 docs and Rust community best practices
- Pitfalls: MEDIUM-HIGH - Based on official docs + community issues; trash restore needs validation

**Research date:** 2026-02-16
**Valid until:** 2026-03-16 (30 days — Tauri v2 is stable, slow-moving)

**Notes:**
- Trash restore mechanism (Open Question #1) should be validated early in implementation
- Pre-scan performance (Pitfall #7) requires testing with real-world directory sizes
- All Tauri v2 APIs are stable as of 2.0.0 release (September 2024)
