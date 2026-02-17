import { FileEntry } from './types';
import { getFileCategory } from './colors';
import { ROAD_GRID_SPACING } from './constants';

export type BlockPosition = {
  x: number;
  y: number;
  z: number;
};

/**
 * Layout files in "city blocks" between Tron road grid lines.
 * Roads run at multiples of ROAD_GRID_SPACING.
 * Files sit inside the blocks between roads, offset from the lines.
 * Folders sit at road intersections as tunnel entrances.
 */
export function layoutFilesInGrid(
  files: FileEntry[],
): Map<string, BlockPosition> {
  const positions = new Map<string, BlockPosition>();
  const S = ROAD_GRID_SPACING;

  // Separate files and folders
  const folders = files.filter(f => f.is_dir);
  const regularFiles = files.filter(f => !f.is_dir);

  // Sort folders alphabetically
  folders.sort((a, b) => a.name.localeCompare(b.name));

  // Sort files by category then size
  regularFiles.sort((a, b) => {
    const catA = getFileCategory(a.extension);
    const catB = getFileCategory(b.extension);
    if (catA !== catB) return catA.localeCompare(catB);
    return b.size - a.size;
  });

  // Place folders at road intersections in front row
  const folderCols = Math.max(folders.length, 1);
  const folderRowOffset = ((folderCols - 1) * S) / 2;

  for (let i = 0; i < folders.length; i++) {
    const x = i * S - folderRowOffset;
    positions.set(folders[i].path, { x, y: 0.5, z: 0 });
  }

  // Place files in city blocks between road grid lines.
  // Each block is the area between 4 road lines.
  // Files go at the center of each block with a small scatter.
  const filesPerBlock = 4; // max files per city block
  const blockInset = S * 0.3; // how far inside the block from the road edge

  // Generate block centers: blocks are at (col+0.5)*S, (row+0.5)*S
  // Start from row 0 (between z=0 road and z=S road)
  const numCols = Math.max(folderCols + 1, 4);
  const colStart = -Math.floor(numCols / 2);

  let fileIndex = 0;
  let row = 0;

  while (fileIndex < regularFiles.length) {
    for (let c = 0; c < numCols && fileIndex < regularFiles.length; c++) {
      const col = colStart + c;
      const blockCenterX = (col + 0.5) * S;
      const blockCenterZ = (row + 0.5) * S + S; // offset past folder row

      // Place up to filesPerBlock in a 2x2 pattern inside the block
      const offsets = [
        [-blockInset, -blockInset],
        [blockInset, -blockInset],
        [-blockInset, blockInset],
        [blockInset, blockInset],
      ];

      for (let f = 0; f < filesPerBlock && fileIndex < regularFiles.length; f++) {
        const [ox, oz] = offsets[f];
        positions.set(regularFiles[fileIndex].path, {
          x: blockCenterX + ox,
          y: 0.5,
          z: blockCenterZ + oz,
        });
        fileIndex++;
      }
    }
    row++;
  }

  return positions;
}
