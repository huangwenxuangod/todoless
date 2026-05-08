use base64::Engine;
use reqwest::multipart;
use serde::{Deserialize, Serialize};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Emitter, Manager, WindowEvent};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[tauri::command]
fn ping() -> &'static str {
    "pong"
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TranscribeRequest {
    audio_base64: String,
    mime_type: String,
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
}

#[derive(Debug, Serialize)]
struct PlanTasksResponse {
    json: String,
}

#[derive(Debug, Deserialize)]
struct GroqTranscription {
    text: String,
}

fn env_value(key: &str) -> Result<String, String> {
    std::env::var(key).map_err(|_| format!("{key} is not configured"))
}

#[tauri::command]
async fn transcribe_audio(request: TranscribeRequest) -> Result<TranscribeResponse, String> {
    let api_key = env_value("GROQ_API_KEY")?;
    let audio = base64::engine::general_purpose::STANDARD
        .decode(request.audio_base64)
        .map_err(|error| format!("Invalid audio payload: {error}"))?;

    let extension = if request.mime_type.contains("webm") {
        "webm"
    } else if request.mime_type.contains("mp4") {
        "mp4"
    } else if request.mime_type.contains("wav") {
        "wav"
    } else {
        "audio"
    };

    let part = multipart::Part::bytes(audio)
        .file_name(format!("voice.{extension}"))
        .mime_str(&request.mime_type)
        .map_err(|error| format!("Invalid audio mime type: {error}"))?;

    let form = multipart::Form::new()
        .text("model", "whisper-large-v3-turbo")
        .text("language", "zh")
        .part("file", part);

    let response = reqwest::Client::new()
        .post("https://api.groq.com/openai/v1/audio/transcriptions")
        .bearer_auth(api_key)
        .multipart(form)
        .send()
        .await
        .map_err(|error| format!("Groq request failed: {error}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("Groq returned {status}: {body}"));
    }

    let parsed = response
        .json::<GroqTranscription>()
        .await
        .map_err(|error| format!("Groq response parse failed: {error}"))?;

    Ok(TranscribeResponse { text: parsed.text })
}

#[tauri::command]
async fn plan_tasks(request: PlanTasksRequest) -> Result<PlanTasksResponse, String> {
    let api_key = env_value("DEEPSEEK_API_KEY")?;
    let system = r#"You are todoless, a non-chat voice-to-task agent.
Return only valid JSON. No markdown. No explanation.
Create up to 10 tasks from the transcript.
Use coarse tags only.
When no time is provided, set dueAt to today at 22:00 in the user's timezone and reminderAt to null.
When a date is provided but no time is provided, set dueAt to that date at 22:00 and reminderAt to that date at 09:00.
Use priority: 3=P1 urgent/high consequence, 2=P2 important or soon, 1=P3 normal, 0=P4 low pressure.
Use content only when the task needs extra execution context; short tasks should have content null.
Output schema:
{"intent":"create_tasks","tasks":[{"title":"string","content":null,"dueAt":"ISO string or null","reminderAt":"ISO string or null","priority":0,"tags":["string"]}],"memoryUpdates":[]}"#;

    let user = format!(
        "Today: {}\nTimezone: {}\nRecent tasks: {}\nTranscript: {}",
        request.today,
        request.timezone,
        serde_json::to_string(&request.recent_tasks).unwrap_or_else(|_| "[]".to_string()),
        request.transcript
    );

    let body = serde_json::json!({
        "model": "deepseek-v4-flash",
        "response_format": { "type": "json_object" },
        "messages": [
            { "role": "system", "content": system },
            { "role": "user", "content": user }
        ],
        "temperature": 0.1
    });

    let response = reqwest::Client::new()
        .post("https://api.deepseek.com/chat/completions")
        .bearer_auth(api_key)
        .json(&body)
        .send()
        .await
        .map_err(|error| format!("DeepSeek request failed: {error}"))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("DeepSeek returned {status}: {body}"));
    }

    let parsed = response
        .json::<serde_json::Value>()
        .await
        .map_err(|error| format!("DeepSeek response parse failed: {error}"))?;
    let content = parsed["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| "DeepSeek returned an empty response".to_string())?;

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

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            ping,
            transcribe_audio,
            plan_tasks,
            show_main
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

            let shortcut = Shortcut::new(Some(Modifiers::CONTROL | Modifiers::SHIFT), Code::Space);
            let handle = app.handle().clone();
            app.global_shortcut().on_shortcut(shortcut, move |_app, _shortcut, event| {
                if event.state() == ShortcutState::Pressed {
                    if let Some(window) = handle.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.unminimize();
                        let _ = window.set_focus();
                        let _ = window.emit("voice-shortcut", ());
                    }
                }
            })?;

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
                if window.label() == "main" {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running todoless");
}
