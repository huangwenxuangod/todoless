use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager, WindowEvent};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};

static CANCEL_MODEL_DOWNLOAD: AtomicBool = AtomicBool::new(false);

#[tauri::command]
fn ping() -> &'static str {
    "pong"
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TranscribeRequest {
    audio_base64: String,
    mime_type: String,
    model: Option<String>,
}

#[derive(Debug, Serialize)]
struct TranscribeResponse {
    text: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PlanTasksRequest {
    transcript: String,
    today: String,
    timezone: String,
    recent_tasks: Vec<String>,
    model: Option<String>,
    default_due_time: Option<String>,
}

#[derive(Debug, Serialize)]
struct PlanTasksResponse {
    json: String,
}

#[derive(Debug, Deserialize)]
struct GroqTranscription {
    text: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct ModelStatus {
    installed: bool,
    total_bytes: u64,
    path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DownloadModelRequest {
    source: String,
}

#[derive(Debug, Clone)]
struct ModelFile {
    name: &'static str,
    size_hint: u64,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ModelDownloadProgress {
    file: String,
    downloaded_bytes: u64,
    total_bytes: u64,
    percent: f64,
}

fn env_value(key: &str) -> Result<String, String> {
    std::env::var(key).map_err(|_| format!("{key} is not configured"))
}

fn load_env_files() {
    for path in ["../.env.local", ".env.local", "../.env", ".env"] {
        let _ = dotenvy::from_filename(path);
    }
}

fn model_files() -> Vec<ModelFile> {
    vec![
        ModelFile {
            name: "model_quant.onnx",
            size_hint: 228_500_000,
        },
        ModelFile {
            name: "config.yaml",
            size_hint: 16_000,
        },
        ModelFile {
            name: "am.mvn",
            size_hint: 200_000,
        },
        ModelFile {
            name: "tokens.json",
            size_hint: 420_000,
        },
    ]
}

fn project_models_dir() -> Result<std::path::PathBuf, String> {
    std::env::current_dir()
        .map_err(|error| error.to_string())
        .map(|cwd| {
            if cwd.file_name().and_then(|name| name.to_str()) == Some("src-tauri") {
                cwd.join("..").join("models").join("sensevoice-small")
            } else {
                cwd.join("models").join("sensevoice-small")
            }
        })
}

fn model_url(source: &str, file: &str) -> String {
    let base = match source {
        "modelscope" => "https://modelscope.cn/models/iic/SenseVoiceSmall-onnx/resolve/master",
        _ => "https://huggingface.co/DennisHuang648/SenseVoiceSmall-onnx/resolve/main",
    };
    format!("{base}/{file}")
}

#[tauri::command]
fn sensevoice_model_status() -> Result<ModelStatus, String> {
    let dir = project_models_dir()?;
    let files = model_files();
    let installed = files.iter().all(|file| dir.join(file.name).is_file());
    let mut total_bytes = 0;
    if dir.exists() {
        for entry in std::fs::read_dir(&dir).map_err(|error| error.to_string())? {
            let entry = entry.map_err(|error| error.to_string())?;
            total_bytes += entry.metadata().map_err(|error| error.to_string())?.len();
        }
    }
    Ok(ModelStatus {
        installed,
        total_bytes,
        path: dir.to_string_lossy().to_string(),
    })
}

#[tauri::command]
async fn cancel_sensevoice_model_download() -> Result<(), String> {
    CANCEL_MODEL_DOWNLOAD.store(true, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
fn delete_sensevoice_model() -> Result<ModelStatus, String> {
    let dir = project_models_dir()?;
    if dir.exists() {
        std::fs::remove_dir_all(&dir).map_err(|error| error.to_string())?;
    }
    sensevoice_model_status()
}

#[tauri::command]
async fn download_sensevoice_model(app: AppHandle, request: DownloadModelRequest) -> Result<ModelStatus, String> {
    CANCEL_MODEL_DOWNLOAD.store(false, Ordering::SeqCst);
    let dir = project_models_dir()?;
    std::fs::create_dir_all(&dir).map_err(|error| error.to_string())?;

    let client = reqwest::Client::new();
    let files = model_files();
    let total_hint: u64 = files.iter().map(|file| file.size_hint).sum();
    let mut downloaded_total = 0_u64;

    for file in files {
        if CANCEL_MODEL_DOWNLOAD.load(Ordering::SeqCst) {
            return Err("Model download cancelled".to_string());
        }

        let url = model_url(&request.source, file.name);
        let response = client
            .get(&url)
            .send()
            .await
            .map_err(|error| format!("Model download failed: {error}"))?;

        if !response.status().is_success() {
            return Err(format!("Model download returned {} for {}", response.status(), file.name));
        }

        let content_length = response.content_length().unwrap_or(file.size_hint);
        let target = dir.join(file.name);
        let mut output = std::fs::File::create(&target).map_err(|error| error.to_string())?;
        let mut stream = response.bytes_stream();
        let mut file_downloaded = 0_u64;

        while let Some(chunk) = stream.next().await {
            if CANCEL_MODEL_DOWNLOAD.load(Ordering::SeqCst) {
                return Err("Model download cancelled".to_string());
            }
            let chunk = chunk.map_err(|error| error.to_string())?;
            output.write_all(&chunk).map_err(|error| error.to_string())?;
            file_downloaded += chunk.len() as u64;
            let progress_bytes = downloaded_total + file_downloaded;
            let _ = app.emit(
                "sensevoice-download-progress",
                ModelDownloadProgress {
                    file: file.name.to_string(),
                    downloaded_bytes: progress_bytes,
                    total_bytes: total_hint.max(content_length),
                    percent: (progress_bytes as f64 / total_hint.max(content_length) as f64 * 100.0).min(100.0),
                },
            );
        }

        downloaded_total += content_length;
    }

    sensevoice_model_status()
}

fn register_voice_shortcut(app: &AppHandle, shortcut: &str) -> Result<(), String> {
    let shortcut = shortcut
        .parse::<Shortcut>()
        .map_err(|error| format!("Invalid shortcut: {error}"))?;
    let _ = app.global_shortcut().unregister_all();
    app.global_shortcut()
        .on_shortcut(shortcut, move |app, _shortcut, event| {
            let event_name = if event.state() == ShortcutState::Pressed {
                "voice-shortcut"
            } else {
                "voice-shortcut-release"
            };
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.emit(event_name, ());
            }
            if let Some(window) = app.get_webview_window("widget") {
                let _ = window.emit(event_name, ());
            }
        })
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn set_global_shortcut(app: AppHandle, shortcut: String) -> Result<(), String> {
    register_voice_shortcut(&app, &shortcut)
}

#[tauri::command]
async fn transcribe_audio(request: TranscribeRequest) -> Result<TranscribeResponse, String> {
    let api_key = env_value("OPENROUTER_API_KEY")?;
    let model = request
        .model
        .filter(|value| value != "local/sensevoice-small")
        .or_else(|| std::env::var("OPENROUTER_ASR_MODEL").ok())
        .unwrap_or_else(|| "openai/whisper-large-v3-turbo".to_string());
    let format = if request.mime_type.contains("webm") {
        "webm"
    } else if request.mime_type.contains("mp4") {
        "mp4"
    } else if request.mime_type.contains("mpeg") || request.mime_type.contains("mp3") {
        "mp3"
    } else if request.mime_type.contains("m4a") {
        "m4a"
    } else if request.mime_type.contains("wav") {
        "wav"
    } else if request.mime_type.contains("ogg") {
        "ogg"
    } else if request.mime_type.contains("flac") {
        "flac"
    } else {
        "webm"
    };

    let body = serde_json::json!({
        "model": model,
        "input_audio": {
            "data": request.audio_base64,
            "format": format
        }
    });

    let response = reqwest::Client::new()
        .post("https://openrouter.ai/api/v1/audio/transcriptions")
        .bearer_auth(api_key)
        .header("HTTP-Referer", "https://todoless.app")
        .header("X-Title", "todoless")
        .json(&body)
        .send()
        .await
        .map_err(|error| format!("OpenRouter transcription request failed: {error}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("OpenRouter transcription returned {status}: {body}"));
    }

    let parsed = response
        .json::<GroqTranscription>()
        .await
        .map_err(|error| format!("OpenRouter transcription parse failed: {error}"))?;

    Ok(TranscribeResponse { text: parsed.text })
}

#[tauri::command]
async fn plan_tasks(request: PlanTasksRequest) -> Result<PlanTasksResponse, String> {
    let api_key = env_value("OPENROUTER_API_KEY")?;
    let model = request
        .model
        .filter(|value| value != "local/default")
        .or_else(|| std::env::var("OPENROUTER_TEXT_MODEL").ok())
        .unwrap_or_else(|| "deepseek/deepseek-v4-flash".to_string());
    let system = r#"You are todoless, a non-chat voice-to-task agent.
Return only valid JSON. No markdown. No explanation.
Create up to 10 tasks from the transcript.
Use coarse tags only.
Detect simple recurring tasks. Use repeatRule {"type":"daily","interval":1} for daily/every day tasks, {"type":"weekly","interval":1} for weekly/every week tasks, otherwise {"type":"none"}.
When no time is provided, set dueAt to today at the user's default due time and reminderAt to null.
When a date is provided but no time is provided, set dueAt to that date at the user's default due time and reminderAt to that date at 09:00.
Use priority: 3=P1 urgent/high consequence, 2=P2 important or soon, 1=P3 normal, 0=P4 low pressure.
Use content only when the task needs extra execution context; short tasks should have content null.
Output schema:
{"intent":"create_tasks","tasks":[{"title":"string","content":null,"dueAt":"ISO string or null","reminderAt":"ISO string or null","priority":0,"repeatRule":{"type":"none"},"tags":["string"]}],"memoryUpdates":[]}"#;

    let user = format!(
        "Today: {}\nTimezone: {}\nDefault due time: {}\nRecent tasks: {}\nTranscript: {}",
        request.today,
        request.timezone,
        request.default_due_time.unwrap_or_else(|| "22:00".to_string()),
        serde_json::to_string(&request.recent_tasks).unwrap_or_else(|_| "[]".to_string()),
        request.transcript
    );

    let body = serde_json::json!({
        "model": model,
        "response_format": { "type": "json_object" },
        "messages": [
            { "role": "system", "content": system },
            { "role": "user", "content": user }
        ],
        "temperature": 0.1
    });

    let response = reqwest::Client::new()
        .post("https://openrouter.ai/api/v1/chat/completions")
        .bearer_auth(api_key)
        .header("HTTP-Referer", "https://todoless.app")
        .header("X-Title", "todoless")
        .json(&body)
        .send()
        .await
        .map_err(|error| format!("OpenRouter request failed: {error}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("OpenRouter returned {status}: {body}"));
    }

    let parsed = response
        .json::<serde_json::Value>()
        .await
        .map_err(|error| format!("OpenRouter response parse failed: {error}"))?;
    let content = parsed["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| "OpenRouter returned an empty response".to_string())?;

    Ok(PlanTasksResponse {
        json: content.to_string(),
    })
}

#[tauri::command]
fn show_main(app: AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())?;
    window.show().map_err(|error| error.to_string())?;
    window.unminimize().map_err(|error| error.to_string())?;
    window.set_focus().map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

pub fn run() {
    load_env_files();

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            ping,
            transcribe_audio,
            plan_tasks,
            show_main,
            quit_app,
            set_global_shortcut,
            sensevoice_model_status,
            download_sensevoice_model,
            cancel_sensevoice_model_download,
            delete_sensevoice_model
        ])
        .setup(|app| {
            let show = MenuItem::with_id(app, "show", "Show todoless", true, None::<&str>)?;
            let open_widget = MenuItem::with_id(app, "open_widget", "Open Widget", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &open_widget, &quit])?;

            let _tray = TrayIconBuilder::new()
                .tooltip("todoless")
                .menu(&menu)
                .show_menu_on_left_click(true)
                .build(app)?;

            register_voice_shortcut(app.handle(), "Ctrl+Shift+Space")?;

            Ok(())
        })
        .on_menu_event(|app, event| match event.id().as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }
            "open_widget" => {
                if let Some(window) = app.get_webview_window("widget") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" || window.label() == "widget" {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running todoless");
}
