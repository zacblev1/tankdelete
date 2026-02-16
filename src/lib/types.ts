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
