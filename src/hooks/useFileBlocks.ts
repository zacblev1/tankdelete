import { useMemo } from 'react';
import { FileEntry } from '../lib/types';
import { layoutFilesInGrid } from '../lib/layout';
import { fileToScale } from '../lib/scale';
import { getFileCategory, getCategoryColor, FileCategory } from '../lib/colors';

export interface BlockData {
  path: string;
  name: string;
  size: number;
  extension: string | null;
  position: [number, number, number];
  scale: number;
  color: string;
  category: FileCategory;
  is_dir: boolean;
}

export interface FileBlocksData {
  blocksByCategory: Map<FileCategory, BlockData[]>;
  folders: FileEntry[];
  allBlocks: BlockData[];
}

export function useFileBlocks(entries: FileEntry[]): FileBlocksData {
  return useMemo(() => {
    // Separate folders and files
    const folders = entries.filter(e => e.is_dir);
    const files = entries.filter(e => !e.is_dir);

    // Get layout positions for files only
    const positions = layoutFilesInGrid(files);

    // Transform files into block data
    const allBlocks: BlockData[] = files.map(file => {
      const position = positions.get(file.path);
      const scale = fileToScale(file.size);
      const category = getFileCategory(file.extension);
      const color = getCategoryColor(file.extension);

      return {
        path: file.path,
        name: file.name,
        size: file.size,
        extension: file.extension,
        position: position ? [position.x, position.y, position.z] : [0, 0, 0],
        scale,
        color,
        category,
        is_dir: file.is_dir,
      };
    });

    // Group blocks by category for instanced rendering
    const blocksByCategory = new Map<FileCategory, BlockData[]>();
    for (const block of allBlocks) {
      if (!blocksByCategory.has(block.category)) {
        blocksByCategory.set(block.category, []);
      }
      blocksByCategory.get(block.category)!.push(block);
    }

    return {
      blocksByCategory,
      folders,
      allBlocks,
    };
  }, [entries]);
}
