#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|_app| {
            println!("Dhadhan Hub Desktop Application Initialized!");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Dhadhan Hub desktop application");
}
