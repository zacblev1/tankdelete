mod commands;
mod models;

use models::UndoStack;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .manage(UndoStack::new(1000))
        .invoke_handler(tauri::generate_handler![
            commands::directory::pick_directory,
            commands::directory::scan_directory,
            commands::store::save_last_directory,
            commands::store::get_last_directory,
            commands::trash::move_to_trash,
            commands::trash::undo_last_trash,
            commands::trash::get_session_stats,
            commands::trash::cleanup_staging,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
