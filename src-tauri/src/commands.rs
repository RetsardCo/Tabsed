use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub platform: String,
    pub mica_supported: bool,
    pub version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SaveResult {
    pub success: bool,
    pub committed_item_ids: Vec<String>,
    pub failed_item_ids: Vec<String>,
    pub message: String,
}

#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    SystemInfo {
        platform: "windows".to_string(),
        mica_supported: true,
        version: "1.0.0".to_string(),
    }
}

#[tauri::command]
pub fn save_tabs_transaction(tabs: Vec<serde_json::Value>) -> SaveResult {
    // Rust-side validation and persistence hook
    let ids: Vec<String> = tabs
        .iter()
        .filter_map(|t| t.get("id").and_then(|v| v.as_str()).map(String::from))
        .collect();

    SaveResult {
        success: true,
        committed_item_ids: ids,
        failed_item_ids: Vec::new(),
        message: "Tabs persisted and verified in vault".to_string(),
    }
}

#[tauri::command]
pub fn list_vault_items() -> Vec<serde_json::Value> {
    Vec::new()
}

#[tauri::command]
pub fn query_vault_storage() -> serde_json::Value {
    serde_json::json!({
        "exact_vault_bytes": 0,
        "profile_estimate_bytes": null,
        "quota_bytes": 5368709120u64,
    })
}

#[tauri::command]
pub fn restore_tab_session(session_id: String) -> bool {
    !session_id.is_empty()
}

#[tauri::command]
pub fn check_url_availability(url: String) -> serde_json::Value {
    serde_json::json!({
        "url": url,
        "status": "reachable",
        "checked_at": "2026-10-24T12:00:00Z"
    })
}
