use crate::models::FileEntry;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter};
use walkdir::{DirEntry, WalkDir};

/// Check if a directory is a system directory that should be blocked
fn is_system_directory(path: &Path) -> bool {
    let path_str = path.to_string_lossy();

    #[cfg(target_os = "macos")]
    {
        let blocked_dirs = [
            "/System", "/Library", "/usr", "/bin", "/sbin",
            "/etc", "/var", "/private", "/cores", "/dev",
        ];
        for blocked in &blocked_dirs {
            if path_str.starts_with(blocked) {
                return true;
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        let path_lower = path_str.to_lowercase();
        let blocked_dirs = [
            "c:\\windows",
            "c:\\program files",
            "c:\\program files (x86)",
            "c:\\programdata",
            "c:\\$recycle.bin",
            "c:\\system volume information",
        ];
        for blocked in &blocked_dirs {
            if path_lower.starts_with(blocked) {
                return true;
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        let blocked_dirs = [
            "/bin", "/boot", "/dev", "/etc", "/lib", "/lib64",
            "/proc", "/root", "/sbin", "/sys", "/usr", "/var",
        ];
        for blocked in &blocked_dirs {
            if path_str.starts_with(blocked) {
                return true;
            }
        }
    }

    false
}

/// Check if a file or directory should be hidden
fn is_hidden(entry: &DirEntry) -> bool {
    entry
        .file_name()
        .to_str()
        .map(|s| s.starts_with('.'))
        .unwrap_or(false)
}

#[tauri::command]
pub async fn pick_directory(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
    use tokio::sync::oneshot;

    let (tx, rx) = oneshot::channel();

    app.dialog()
        .file()
        .set_title("Select Directory to Explore")
        .pick_folder(move |result| {
            let _ = tx.send(result);
        });

    let result = rx.await.map_err(|e| format!("Channel error: {}", e))?;

    match result {
        Some(path) => {
            // FilePath can be converted to PathBuf via as_path()
            let path_ref = path.as_path().ok_or("Failed to get path")?;
            let path_buf = path_ref.to_path_buf();

            // Check if it's a system directory
            if is_system_directory(&path_buf) {
                app.dialog()
                    .message("This is a system directory and cannot be selected for safety reasons.")
                    .kind(MessageDialogKind::Error)
                    .title("System Directory")
                    .blocking_show();

                return Err("System directory blocked".to_string());
            }

            Ok(Some(path_buf.to_string_lossy().to_string()))
        }
        None => Ok(None),
    }
}

/// Scan a directory and return its direct children with recursive sizes for subdirectories
#[tauri::command]
pub async fn scan_directory(app: AppHandle, path: String) -> Result<Vec<FileEntry>, String> {
    let path_buf = PathBuf::from(&path);

    if !path_buf.exists() {
        return Err("Directory does not exist".to_string());
    }

    if !path_buf.is_dir() {
        return Err("Path is not a directory".to_string());
    }

    // Spawn blocking to avoid blocking the async runtime
    let app_clone = app.clone();
    tauri::async_runtime::spawn_blocking(move || {
        let mut entries = Vec::new();
        let mut files_scanned = 0u64;
        let mut total_bytes = 0u64;

        // Read direct children of the directory
        let dir_entries = match std::fs::read_dir(&path_buf) {
            Ok(entries) => entries,
            Err(e) => return Err(format!("Failed to read directory: {}", e)),
        };

        for entry in dir_entries {
            let entry = match entry {
                Ok(e) => e,
                Err(_) => continue,
            };

            let entry_path = entry.path();

            // Check if hidden
            if entry_path.file_name()
                .and_then(|n| n.to_str())
                .map(|s| s.starts_with('.'))
                .unwrap_or(false)
            {
                continue;
            }

            let metadata = match entry.metadata() {
                Ok(m) => m,
                Err(_) => continue,
            };

            let is_dir = metadata.is_dir();
            let name = entry_path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();

            let extension = if !is_dir {
                entry_path
                    .extension()
                    .and_then(|e| e.to_str())
                    .map(|s| s.to_string())
            } else {
                None
            };

            // Calculate size
            let size = if is_dir {
                // Calculate recursive size for directories
                let mut dir_size = 0u64;
                let walker = WalkDir::new(&entry_path)
                    .follow_links(false)
                    .into_iter()
                    .filter_entry(|e| !is_hidden(e));

                for walk_entry in walker {
                    if let Ok(walk_entry) = walk_entry {
                        if let Ok(metadata) = walk_entry.metadata() {
                            if metadata.is_file() {
                                dir_size += metadata.len();
                                files_scanned += 1;

                                // Emit progress every 100 files
                                if files_scanned % 100 == 0 {
                                    total_bytes += metadata.len();
                                    let _ = app_clone.emit("scan_progress", serde_json::json!({
                                        "files_scanned": files_scanned,
                                        "total_bytes": total_bytes,
                                    }));
                                }
                            }
                        }
                    }
                }
                dir_size
            } else {
                metadata.len()
            };

            entries.push(FileEntry::new(
                entry_path.to_string_lossy().to_string(),
                name,
                size,
                is_dir,
                extension,
            ));
        }

        // Sort: directories first, then files, alphabetically within each group
        entries.sort_by(|a, b| {
            match (a.is_dir, b.is_dir) {
                (true, false) => std::cmp::Ordering::Less,
                (false, true) => std::cmp::Ordering::Greater,
                _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
            }
        });

        Ok(entries)
    })
    .await
    .map_err(|e| format!("Task join error: {}", e))?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_is_system_directory() {
        #[cfg(target_os = "macos")]
        {
            assert!(is_system_directory(Path::new("/System")));
            assert!(is_system_directory(Path::new("/usr/bin")));
            assert!(!is_system_directory(Path::new("/Users/test")));
        }

        #[cfg(target_os = "windows")]
        {
            assert!(is_system_directory(Path::new("C:\\Windows")));
            assert!(is_system_directory(Path::new("C:\\Program Files")));
            assert!(!is_system_directory(Path::new("C:\\Users")));
        }

        #[cfg(target_os = "linux")]
        {
            assert!(is_system_directory(Path::new("/bin")));
            assert!(is_system_directory(Path::new("/usr/bin")));
            assert!(!is_system_directory(Path::new("/home/test")));
        }
    }
}
