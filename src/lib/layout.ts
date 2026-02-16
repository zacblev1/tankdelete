import { FileEntry } from './types';
import { getFileCategory } from './colors';

export type BlockPosition = {
  x: number;
  y: number;
  z: number;
};

export function layoutFilesInGrid(
  files: FileEntry[],
  spacing: number = 3.0,
  itemsPerRow: number = 12
): Map<string, BlockPosition> {
  const positions = new Map<string, BlockPosition>();

  // Separate files and folders
  const folders = files.filter(f => f.is_dir);
  const regularFiles = files.filter(f => !f.is_dir);

  // Sort folders alphabetically
  folders.sort((a, b) => a.name.localeCompare(b.name));

  // Sort files: grouped by category, then by size descending within category
  // This makes big targets more visible and clusters similar types together
  regularFiles.sort((a, b) => {
    const catA = getFileCategory(a.extension);
    const catB = getFileCategory(b.extension);

    if (catA !== catB) {
      return catA.localeCompare(catB);
    }

    // Within same category, sort by size descending (bigger files first)
    return b.size - a.size;
  });

  // Combine: folders first, then files
  const allItems = [...folders, ...regularFiles];

  // Position items in grid
  let currentRow = 0;
  let currentCol = 0;

  for (const item of allItems) {
    // Calculate centered X position for this column
    const rowOffset = (itemsPerRow - 1) * spacing / 2;
    const x = currentCol * spacing - rowOffset;

    // Y slightly above grid
    const y = 0.5;

    // Z increases per row
    const z = currentRow * spacing;

    positions.set(item.path, { x, y, z });

    // Advance to next position
    currentCol++;
    if (currentCol >= itemsPerRow) {
      currentCol = 0;
      currentRow++;
    }
  }

  return positions;
}
