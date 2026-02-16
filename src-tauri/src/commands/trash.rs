use crate::models::{TrashAction, UndoStack};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{AppHandle, Manager, State};

/// Get the staging directory path for undo operations
fn get_staging_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let staging_dir = app_data_dir.join(".undo_staging");

    // Create staging directory if it doesn't exist
    if !staging_dir.exists() {
        fs::create_dir_all(&staging_dir)
            .map_err(|e| format!("Failed to create staging directory: {}", e))?;
    }

    Ok(staging_dir)
}

/// Generate a unique staging filename based on original name and timestamp
fn generate_staging_name(original_name: &str, timestamp: u64) -> String {
    format!("{}_{}", timestamp, original_name)
}

/// Move a file to the OS recycle bin with undo support via staging directory
#[tauri::command]
pub async fn move_to_trash(
    path: String,
    app: AppHandle,
    undo_stack: State<'_, UndoStack>,
) -> Result<TrashAction, String> {
    let file_path = Path::new(&path);

    // Verify file exists
    if !file_path.exists() {
        return Err(format!("File does not exist: {}", path));
    }

    // Get file metadata before deletion
    let metadata = fs::metadata(file_path)
        .map_err(|e| format!("Failed to read file metadata: {}", e))?;

    let original_size = metadata.len();
    let file_name = file_path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "Invalid file name".to_string())?
        .to_string();

    // Get current timestamp
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| format!("System time error: {}", e))?
        .as_secs();

    // Get staging directory
    let staging_dir = get_staging_dir(&app)?;
    let staging_name = generate_staging_name(&file_name, timestamp);
    let staging_path = staging_dir.join(&staging_name);

    // Copy file to staging directory for undo support
    fs::copy(file_path, &staging_path)
        .map_err(|e| format!("Failed to copy file to staging: {}", e))?;

    // Move original file to OS trash
    trash::delete(file_path).map_err(|e| format!("Failed to move file to trash: {}", e))?;

    // Create TrashAction record
    let action = TrashAction {
        file_path: path.clone(),
        file_name: file_name.clone(),
        original_size,
        trash_timestamp: timestamp,
    };

    // Add to undo stack and update stats
    undo_stack.push(action.clone());
    undo_stack.increment_stats(original_size);

    Ok(action)
}

/// Undo the last trash operation by restoring file from staging directory
#[tauri::command]
pub async fn undo_last_trash(
    app: AppHandle,
    undo_stack: State<'_, UndoStack>,
) -> Result<Option<TrashAction>, String> {
    // Pop from undo stack
    let action = match undo_stack.pop() {
        Some(a) => a,
        None => return Ok(None), // Nothing to undo
    };

    // Get staging directory
    let staging_dir = get_staging_dir(&app)?;
    let staging_name = generate_staging_name(&action.file_name, action.trash_timestamp);
    let staging_path = staging_dir.join(&staging_name);

    // Verify staging file exists
    if !staging_path.exists() {
        return Err(format!(
            "Staging file not found: {}. Cannot restore.",
            staging_name
        ));
    }

    let original_path = Path::new(&action.file_path);

    // Check if parent directory exists
    if let Some(parent) = original_path.parent() {
        if !parent.exists() {
            return Err(format!(
                "Original directory no longer exists: {}",
                parent.display()
            ));
        }
    }

    // Check if a file already exists at the original path
    if original_path.exists() {
        return Err(format!(
            "File already exists at original path: {}. Cannot restore.",
            action.file_path
        ));
    }

    // Move file from staging back to original location
    fs::rename(&staging_path, original_path).map_err(|e| {
        // If rename fails, try copy + delete (works across filesystems)
        if let Err(copy_err) = fs::copy(&staging_path, original_path) {
            return format!(
                "Failed to restore file (rename failed: {}, copy failed: {})",
                e, copy_err
            );
        }
        if let Err(remove_err) = fs::remove_file(&staging_path) {
            return format!("File restored but failed to clean staging: {}", remove_err);
        }
        return format!("File restored successfully");
    })?;

    // Decrement session stats
    undo_stack.decrement_stats(action.original_size);

    Ok(Some(action))
}

/// Get current session statistics (files deleted count, bytes freed)
#[tauri::command]
pub fn get_session_stats(undo_stack: State<'_, UndoStack>) -> Result<(u64, u64), String> {
    Ok(undo_stack.stats())
}

/// Clean up staging directory (called on app exit or manually)
#[tauri::command]
pub fn cleanup_staging(app: AppHandle) -> Result<(), String> {
    let staging_dir = get_staging_dir(&app)?;

    if staging_dir.exists() {
        fs::remove_dir_all(&staging_dir)
            .map_err(|e| format!("Failed to clean staging directory: {}", e))?;
    }

    Ok(())
}
