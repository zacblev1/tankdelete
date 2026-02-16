use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub is_dir: bool,
    pub extension: Option<String>,
}

impl FileEntry {
    pub fn new(
        path: String,
        name: String,
        size: u64,
        is_dir: bool,
        extension: Option<String>,
    ) -> Self {
        Self {
            path,
            name,
            size,
            is_dir,
            extension,
        }
    }
}
