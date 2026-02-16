import { FileCategory, getFileCategory } from './colors';

export type ShapeConfig = {
  type: 'box' | 'octahedron';
  args: number[];
};

export const CATEGORY_SHAPES: Record<FileCategory, ShapeConfig> = {
  media: { type: 'box', args: [1, 0.3, 1] },        // flat panels for images/video
  code: { type: 'box', args: [0.5, 1.5, 0.5] },     // tall columns for source files
  archive: { type: 'octahedron', args: [0.6, 0] },  // diamond shape for compressed files
  other: { type: 'box', args: [0.8, 0.8, 0.8] },    // cubes for default
};

export function getShapeConfig(extension: string | null): ShapeConfig {
  const category = getFileCategory(extension);
  return CATEGORY_SHAPES[category];
}
