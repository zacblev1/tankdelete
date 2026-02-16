export interface FileEntry {
  path: string;
  name: string;
  size: number;
  is_dir: boolean;
  extension: string | null;
}

export interface ScanProgress {
  files_scanned: number;
  total_bytes: number;
}

export interface TrashAction {
  file_path: string;
  file_name: string;
  original_size: number;
  trash_timestamp: number;
}

export interface SessionStats {
  deleted_count: number;
  deleted_bytes: number;
}
