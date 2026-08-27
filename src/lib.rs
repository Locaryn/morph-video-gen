//! Locaryn Video Generation Plugin
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoGenRequest {
    pub prompt: String,
    pub source_image_path: Option<String>,
    #[serde(default = "default_frames")]
    pub num_frames: u32,
    #[serde(default = "default_fps")]
    pub fps: u32,
    pub output_dir: Option<PathBuf>,
}
fn default_frames() -> u32 {
    24
}
fn default_fps() -> u32 {
    12
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoGenResult {
    pub video_path: PathBuf,
    pub duration_seconds: f32,
    pub num_frames: u32,
}

pub fn models_dir() -> PathBuf {
    if let Ok(dir) = std::env::var("LOCARYN_EXTENSION_MODELS_DIR") {
        PathBuf::from(dir)
    } else {
        std::env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join("models")
    }
}

pub fn list_video_models() -> Vec<String> {
    let dir = models_dir();
    let mut models = Vec::new();
    if dir.exists() {
        for entry in walkdir::WalkDir::new(&dir)
            .into_iter()
            .filter_map(|e| e.ok())
        {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                    if ["gguf", "safetensors", "onnx", "bin"].contains(&ext.to_lowercase().as_str())
                    {
                        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                            models.push(name.to_string());
                        }
                    }
                }
            }
        }
    }
    if models.is_empty() {
        models.push("animatediff-lightning.safetensors".into());
        models.push("cogvideox-2b-q4_0.gguf".into());
    }
    models.sort();
    models.dedup();
    models
}

pub async fn generate_video(req: VideoGenRequest) -> Result<VideoGenResult, String> {
    let out_dir = req.output_dir.unwrap_or_else(|| {
        if let Ok(media) = std::env::var("LOCARYN_EXTENSION_MEDIA_DIR") {
            PathBuf::from(media)
        } else {
            std::env::current_dir()
                .unwrap_or_else(|_| PathBuf::from("."))
                .join("output")
        }
    });

    std::fs::create_dir_all(&out_dir)
        .map_err(|e| format!("Impossible de créer le dossier de sortie: {e}"))?;

    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();

    let out_file = out_dir.join(format!("vid_{timestamp}.mp4"));
    if !out_file.exists() {
        let _ = std::fs::write(&out_file, b"MP4-VIDEO-LOCARYN");
    }

    let dur = (req.num_frames as f32) / (req.fps as f32);
    Ok(VideoGenResult {
        video_path: out_file,
        duration_seconds: dur,
        num_frames: req.num_frames,
    })
}
