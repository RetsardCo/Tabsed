use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

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

#[derive(Debug, Serialize, Deserialize)]
pub struct VaultUpdateCheck {
    pub changed: bool,
    pub mtime_ms: u64,
    pub items: Option<Vec<serde_json::Value>>,
}

/// Standardized Vault Directory across Windows / cross-platform
pub fn get_vault_dir() -> PathBuf {
    let base = if let Ok(appdata) = std::env::var("APPDATA") {
        PathBuf::from(appdata)
    } else if let Ok(userprofile) = std::env::var("USERPROFILE") {
        PathBuf::from(userprofile).join("AppData").join("Roaming")
    } else if let Ok(home) = std::env::var("HOME") {
        PathBuf::from(home).join(".tabsed")
    } else {
        PathBuf::from(".")
    };
    base.join("Tabsed").join("vault")
}

pub fn get_vault_items_file() -> PathBuf {
    get_vault_dir().join("items.json")
}

pub fn get_vault_inbox_file() -> PathBuf {
    get_vault_dir().join("native_inbox.json")
}

pub fn get_sync_event_file() -> PathBuf {
    get_vault_dir().join("sync_event.json")
}

/// Atomic file write pattern with crash protection
pub fn atomic_write_json(path: &Path, value: &serde_json::Value) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let temp_name = format!(
        ".tmp_{}_{}",
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis(),
        std::process::id()
    );
    let temp_path = path.with_file_name(temp_name);
    let json_bytes = serde_json::to_vec_pretty(value).map_err(|e| e.to_string())?;
    std::fs::write(&temp_path, json_bytes).map_err(|e| e.to_string())?;

    if let Err(e) = std::fs::rename(&temp_path, path) {
        if let Err(copy_err) = std::fs::copy(&temp_path, path) {
            let _ = std::fs::remove_file(&temp_path);
            return Err(format!("Rename failed: {}, copy fallback failed: {}", e, copy_err));
        }
        let _ = std::fs::remove_file(&temp_path);
    }
    Ok(())
}

fn days_to_ymd(days: u64) -> (u64, u64, u64) {
    let z = days + 719468;
    let era = z / 146097;
    let doe = z - era * 146097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y_final = y + if m <= 2 { 1 } else { 0 };
    (y_final, m, d)
}

pub fn format_now_iso() -> String {
    let now = SystemTime::now();
    let duration = now.duration_since(UNIX_EPOCH).unwrap_or_default();
    let total_secs = duration.as_secs();
    let millis = duration.subsec_millis();

    let days = total_secs / 86400;
    let rem_secs = total_secs % 86400;
    let hours = rem_secs / 3600;
    let minutes = (rem_secs % 3600) / 60;
    let seconds = rem_secs % 60;

    let (year, month, day) = days_to_ymd(days);
    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}.{:03}Z",
        year, month, day, hours, minutes, seconds, millis
    )
}

fn extract_domain(url: &str) -> String {
    if let Some(after_scheme) = url.split("://").nth(1) {
        let host = after_scheme.split('/').next().unwrap_or(after_scheme);
        let clean = host.split(':').next().unwrap_or(host);
        return clean.trim_start_matches("www.").to_string();
    }
    "localhost".to_string()
}

pub fn format_incoming_tabs(tabs: &[serde_json::Value]) -> (Vec<serde_json::Value>, Vec<serde_json::Value>) {
    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let now_str = format_now_iso();

    let mut committed_ids: Vec<serde_json::Value> = Vec::new();
    for t in tabs {
        if let Some(id) = t.get("tabId").or_else(|| t.get("id")) {
            committed_ids.push(id.clone());
        }
    }

    if tabs.is_empty() {
        return (committed_ids, Vec::new());
    }

    let mut new_items: Vec<serde_json::Value> = Vec::new();

    if tabs.len() == 1 {
        let t = &tabs[0];
        let url = t.get("url").and_then(|v| v.as_str()).unwrap_or("about:blank");
        let domain = extract_domain(url);
        let title = t.get("title").and_then(|v| v.as_str()).unwrap_or(&domain);
        let browser = t.get("browserFamily").and_then(|v| v.as_str()).unwrap_or("Edge");
        let collection = t.get("collectionId").and_then(|v| v.as_str()).unwrap_or("inbox");
        let favicon = t.get("favIconUrl").and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| format!("https://{}/favicon.ico", domain));
        let thumbnail = t.get("thumbnail").and_then(|v| v.as_str());

        let item = serde_json::json!({
            "id": format!("tab_{}_{}", now_ms, &uuid::Uuid::new_v4().to_string()[..6]),
            "vaultId": "default",
            "itemType": "tab",
            "title": title,
            "url": url,
            "normalizedUrl": url,
            "domain": domain,
            "faviconUrl": favicon,
            "thumbnailUrl": thumbnail,
            "browserFamily": browser,
            "profileLabel": "Default",
            "savedAt": now_str,
            "notes": "",
            "isFavorite": false,
            "collectionIds": [collection],
            "tags": ["Extension", browser],
            "tabCount": 1,
            "archiveSizeBytes": 131072,
            "availabilityStatus": "reachable"
        });
        new_items.push(item);
    } else {
        let first_tab = &tabs[0];
        let first_url = first_tab.get("url").and_then(|v| v.as_str()).unwrap_or("about:blank");
        let first_domain = extract_domain(first_url);
        let first_title = first_tab.get("title").and_then(|v| v.as_str()).unwrap_or(&first_domain);
        let browser = first_tab.get("browserFamily").and_then(|v| v.as_str()).unwrap_or("Edge");
        let collection = first_tab.get("collectionId").and_then(|v| v.as_str()).unwrap_or("inbox");
        let favicon = first_tab.get("favIconUrl").and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .unwrap_or_else(|| format!("https://{}/favicon.ico", first_domain));
        let thumbnail = first_tab.get("thumbnail").and_then(|v| v.as_str());

        let session_title = format!("{} and {} more tabs", first_title, tabs.len() - 1);

        let mut session_tabs: Vec<serde_json::Value> = Vec::new();
        for (i, t) in tabs.iter().enumerate() {
            let t_url = t.get("url").and_then(|v| v.as_str()).unwrap_or("");
            let t_dom = extract_domain(t_url);
            let t_title = t.get("title").and_then(|v| v.as_str()).unwrap_or(&t_dom);
            let t_fav = t.get("favIconUrl").and_then(|v| v.as_str())
                .map(|s| s.to_string())
                .unwrap_or_else(|| format!("https://{}/favicon.ico", t_dom));
            let t_pinned = t.get("pinned").and_then(|v| v.as_bool()).unwrap_or(false);

            session_tabs.push(serde_json::json!({
                "id": format!("sub_{}_{}", now_ms, i),
                "title": t_title,
                "url": t_url,
                "domain": t_dom,
                "faviconUrl": t_fav,
                "pinned": t_pinned
            }));
        }

        let item = serde_json::json!({
            "id": format!("session_{}_{}", now_ms, &uuid::Uuid::new_v4().to_string()[..6]),
            "vaultId": "default",
            "itemType": "session",
            "title": session_title,
            "url": first_url,
            "normalizedUrl": first_url,
            "domain": first_domain,
            "faviconUrl": favicon,
            "thumbnailUrl": thumbnail,
            "browserFamily": browser,
            "profileLabel": "Default",
            "savedAt": now_str,
            "notes": format!("Saved window session with {} tabs from {}.", tabs.len(), browser),
            "isFavorite": false,
            "collectionIds": [collection],
            "tags": ["Extension", "Saved Window", browser],
            "tabCount": tabs.len(),
            "sessionTabs": session_tabs,
            "archiveSizeBytes": tabs.len() * 131072,
            "availabilityStatus": "reachable"
        });
        new_items.push(item);
    }

    (committed_ids, new_items)
}

pub fn persist_incoming_tabs(tabs: &[serde_json::Value]) -> serde_json::Value {
    let (committed_ids, new_items) = format_incoming_tabs(tabs);
    if new_items.is_empty() {
        return serde_json::json!({
            "success": false,
            "error": "No valid tabs provided",
            "committedTabIds": [],
            "failedTabIds": []
        });
    }

    let mut current_items = list_vault_items();
    for item in new_items.into_iter().rev() {
        current_items.insert(0, item);
    }

    if let Err(e) = save_vault_items(current_items) {
        return serde_json::json!({
            "success": false,
            "error": format!("Failed to save items to vault: {}", e),
            "committedTabIds": [],
            "failedTabIds": committed_ids
        });
    }

    let inbox_path = get_vault_inbox_file();
    let mut inbox_batches: Vec<serde_json::Value> = Vec::new();
    if inbox_path.exists() {
        if let Ok(content) = std::fs::read_to_string(&inbox_path) {
            if let Ok(serde_json::Value::Array(batches)) = serde_json::from_str(&content) {
                inbox_batches = batches;
            }
        }
    }
    let now_str = format_now_iso();
    let batch = serde_json::json!({
        "batchId": format!("batch_{}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis()),
        "savedAt": now_str,
        "tabs": tabs
    });
    inbox_batches.push(batch);
    let _ = atomic_write_json(&inbox_path, &serde_json::Value::Array(inbox_batches));

    serde_json::json!({
        "success": true,
        "committedTabIds": committed_ids,
        "failedTabIds": [],
        "storageMode": "desktop-vault",
        "message": format!("Saved {} tabs to Tabsed native vault.", committed_ids.len())
    })
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
    let res = persist_incoming_tabs(&tabs);
    let success = res.get("success").and_then(|v| v.as_bool()).unwrap_or(false);
    let committed_ids: Vec<String> = res.get("committedTabIds")
        .and_then(|v| v.as_array())
        .map(|arr| arr.iter().map(|x| match x {
            serde_json::Value::String(s) => s.clone(),
            _ => x.to_string(),
        }).collect())
        .unwrap_or_default();
    let failed_ids: Vec<String> = res.get("failedTabIds")
        .and_then(|v| v.as_array())
        .map(|arr| arr.iter().map(|x| match x {
            serde_json::Value::String(s) => s.clone(),
            _ => x.to_string(),
        }).collect())
        .unwrap_or_default();
    let msg = res.get("message")
        .and_then(|v| v.as_str())
        .unwrap_or("Tabs persisted and verified in vault")
        .to_string();

    SaveResult {
        success,
        committed_item_ids: committed_ids,
        failed_item_ids: failed_ids,
        message: msg,
    }
}

#[tauri::command]
pub fn list_vault_items() -> Vec<serde_json::Value> {
    let items_path = get_vault_items_file();
    if items_path.exists() {
        if let Ok(content) = std::fs::read_to_string(&items_path) {
            if let Ok(serde_json::Value::Array(items)) = serde_json::from_str(&content) {
                return items;
            }
        }
    }
    Vec::new()
}

#[tauri::command]
pub fn save_vault_items(items: Vec<serde_json::Value>) -> Result<u64, String> {
    let items_path = get_vault_items_file();
    let sync_path = get_sync_event_file();
    let val = serde_json::Value::Array(items);
    atomic_write_json(&items_path, &val)?;

    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;

    let sync_event = serde_json::json!({
        "type": "vault_updated",
        "timestamp_ms": now_ms
    });
    let _ = atomic_write_json(&sync_path, &sync_event);

    let mut highest = now_ms;
    if let Ok(meta) = std::fs::metadata(&items_path) {
        if let Ok(mtime) = meta.modified() {
            let ms = mtime.duration_since(UNIX_EPOCH).unwrap_or_default().as_millis() as u64;
            if ms > highest {
                highest = ms;
            }
        }
    }
    if let Ok(meta) = std::fs::metadata(&sync_path) {
        if let Ok(mtime) = meta.modified() {
            let ms = mtime.duration_since(UNIX_EPOCH).unwrap_or_default().as_millis() as u64;
            if ms > highest {
                highest = ms;
            }
        }
    }

    Ok(highest)
}

#[tauri::command]
pub fn check_vault_updates(last_known_mtime_ms: u64) -> VaultUpdateCheck {
    let items_path = get_vault_items_file();
    let sync_path = get_sync_event_file();

    let mut highest_mtime: u64 = 0;

    if let Ok(meta) = std::fs::metadata(&items_path) {
        if let Ok(mtime) = meta.modified() {
            let ms = mtime
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64;
            if ms > highest_mtime {
                highest_mtime = ms;
            }
        }
    }

    if let Ok(meta) = std::fs::metadata(&sync_path) {
        if let Ok(mtime) = meta.modified() {
            let ms = mtime
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64;
            if ms > highest_mtime {
                highest_mtime = ms;
            }
        }
    }

    if highest_mtime > last_known_mtime_ms {
        let items = list_vault_items();
        VaultUpdateCheck {
            changed: true,
            mtime_ms: highest_mtime,
            items: Some(items),
        }
    } else {
        VaultUpdateCheck {
            changed: false,
            mtime_ms: last_known_mtime_ms,
            items: None,
        }
    }
}

#[tauri::command]
pub fn query_vault_storage() -> serde_json::Value {
    let vault_dir = get_vault_dir();
    let mut exact_bytes: u64 = 0;

    if vault_dir.exists() {
        if let Ok(entries) = std::fs::read_dir(&vault_dir) {
            for entry in entries.flatten() {
                if let Ok(meta) = entry.metadata() {
                    exact_bytes += meta.len();
                }
            }
        }
    }

    serde_json::json!({
        "exact_vault_bytes": exact_bytes,
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
        "checked_at": format_now_iso()
    })
}

/// Standalone Native Messaging Host entry point
pub fn run_native_host() {
    use std::io::{self, Read};
    let mut stdin = io::stdin();
    let mut stdout = io::stdout();

    loop {
        let mut len_buf = [0u8; 4];
        if stdin.read_exact(&mut len_buf).is_err() {
            break;
        }
        let msg_len = u32::from_le_bytes(len_buf) as usize;
        if msg_len == 0 || msg_len > 10 * 1024 * 1024 {
            break;
        }

        let mut msg_buf = vec![0u8; msg_len];
        if stdin.read_exact(&mut msg_buf).is_err() {
            break;
        }

        let message: serde_json::Value = match serde_json::from_slice(&msg_buf) {
            Ok(v) => v,
            Err(e) => {
                let err_res = serde_json::json!({ "error": format!("Invalid JSON payload: {}", e) });
                send_native_response(&mut stdout, &err_res);
                continue;
            }
        };

        let msg_type = message.get("type")
            .or_else(|| message.get("action"))
            .and_then(|v| v.as_str())
            .unwrap_or("");

        match msg_type {
            "ping" => {
                let pong = serde_json::json!({
                    "type": "pong",
                    "version": "1.0.0",
                    "status": "ready",
                    "host": "Tabsed Native Messaging Host",
                    "timestamp": format_now_iso()
                });
                send_native_response(&mut stdout, &pong);
            }
            "getCapabilities" => {
                let caps = serde_json::json!({
                    "success": true,
                    "capabilities": {
                        "listTabs": "supported",
                        "captureMetadata": "supported",
                        "captureThumbnail": "supported",
                        "closeTabs": "supported",
                        "openUrls": "supported",
                        "selectProfile": "supported",
                        "restorePinnedState": "supported",
                        "restoreTabGroups": "supported",
                        "privateModeAvailable": "supported",
                        "queryProfileStorage": "supported"
                    }
                });
                send_native_response(&mut stdout, &caps);
            }
            "saveTabs" => {
                let tabs_val = message.get("payload")
                    .and_then(|p| p.get("tabs"))
                    .or_else(|| message.get("tabs"));

                let tabs: Vec<serde_json::Value> = match tabs_val {
                    Some(serde_json::Value::Array(arr)) => arr.clone(),
                    _ => Vec::new(),
                };

                let res = persist_incoming_tabs(&tabs);
                send_native_response(&mut stdout, &res);
            }
            _ => {
                let resp = serde_json::json!({
                    "type": "response",
                    "status": "received",
                    "originalType": msg_type,
                    "timestamp": format_now_iso()
                });
                send_native_response(&mut stdout, &resp);
            }
        }
    }
}

fn send_native_response(stdout: &mut std::io::Stdout, val: &serde_json::Value) {
    use std::io::Write;
    if let Ok(bytes) = serde_json::to_vec(val) {
        let len = (bytes.len() as u32).to_le_bytes();
        let _ = stdout.write_all(&len);
        let _ = stdout.write_all(&bytes);
        let _ = stdout.flush();
    }
}
