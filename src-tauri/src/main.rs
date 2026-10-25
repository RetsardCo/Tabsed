// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use tauri::Manager;

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.iter().any(|arg| arg == "--native-host") {
        commands::run_native_host();
        return;
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|app| {
            #[cfg(target_os = "windows")]
            {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_shadow(true);
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_system_info,
            commands::save_tabs_transaction,
            commands::list_vault_items,
            commands::save_vault_items,
            commands::check_vault_updates,
            commands::query_vault_storage,
            commands::restore_tab_session,
            commands::check_url_availability,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
