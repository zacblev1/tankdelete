export type FileCategory = 'media' | 'code' | 'archive' | 'other';

export const CATEGORY_COLORS: Record<FileCategory, string> = {
  media: '#00ffff',    // cyan
  code: '#00ff66',     // green
  archive: '#ff9900',  // orange
  other: '#ff00ff',    // magenta
};

export const GRID_COLOR = '#00ffff';
export const PORTAL_COLOR = '#ff00ff';
export const BACK_PORTAL_COLOR = '#00ff66';

const MEDIA_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico',
  'mp4', 'mov', 'avi', 'mkv',
  'mp3', 'wav', 'flac', 'ogg', 'aac'
]);

const CODE_EXTENSIONS = new Set([
  'ts', 'tsx', 'js', 'jsx', 'py', 'java', 'cpp', 'c', 'h', 'rs', 'go', 'rb', 'php', 'swift', 'kt', 'cs',
  'txt', 'md', 'json', 'xml', 'yaml', 'yml', 'toml',
  'html', 'css', 'scss', 'sql', 'sh', 'bat'
]);

const ARCHIVE_EXTENSIONS = new Set([
  'zip', 'tar', 'gz', 'rar', '7z', 'bz2', 'xz', 'dmg', 'iso'
]);

export function getFileCategory(extension: string | null): FileCategory {
  if (!extension) return 'other';

  const ext = extension.toLowerCase();

  if (MEDIA_EXTENSIONS.has(ext)) return 'media';
  if (CODE_EXTENSIONS.has(ext)) return 'code';
  if (ARCHIVE_EXTENSIONS.has(ext)) return 'archive';

  return 'other';
}

export function getCategoryColor(extension: string | null): string {
  const category = getFileCategory(extension);
  return CATEGORY_COLORS[category];
}
