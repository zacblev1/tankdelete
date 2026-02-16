use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

#[tauri::command]
pub async fn save_last_directory(app: AppHandle, path: String) -> Result<(), String> {
    let store = app
        .store("store.json")
        .map_err(|e| format!("Failed to access store: {}", e))?;

    store
        .set("lastDirectory", serde_json::json!(path));

    store
        .save()
        .map_err(|e| format!("Failed to save store: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn get_last_directory(app: AppHandle) -> Result<Option<String>, String> {
    let store = app
        .store("store.json")
        .map_err(|e| format!("Failed to access store: {}", e))?;

    let value = store.get("lastDirectory");

    match value {
        Some(v) => {
            if let Some(s) = v.as_str() {
                Ok(Some(s.to_string()))
            } else {
                Ok(None)
            }
        }
        None => Ok(None),
    }
}
