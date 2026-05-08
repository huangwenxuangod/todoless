use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;

#[tauri::command]
fn ping() -> &'static str {
    "pong"
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![ping])
        .setup(|app| {
            let show = MenuItem::with_id(app, "show", "Show todoless", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            let _tray = TrayIconBuilder::new()
                .tooltip("todoless")
                .menu(&menu)
                .show_menu_on_left_click(true)
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running todoless");
}
