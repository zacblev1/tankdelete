const MIN_SCALE = 0.4;
const MAX_SCALE = 2.5;
const MIN_SIZE = 1024; // 1 KB
const MAX_SIZE = 1024 ** 3; // 1 GB

export function fileToScale(sizeBytes: number): number {
  // Clamp input to valid range
  const clampedSize = Math.max(MIN_SIZE, Math.min(MAX_SIZE, sizeBytes));

  // Apply log10 normalization
  const logMin = Math.log10(MIN_SIZE);
  const logMax = Math.log10(MAX_SIZE);
  const logSize = Math.log10(clampedSize);

  const normalized = (logSize - logMin) / (logMax - logMin);

  // Map to scale range
  return MIN_SCALE + normalized * (MAX_SCALE - MIN_SCALE);
}

export function folderToScale(childCount: number, totalSize: number): number {
  // Base scale
  let scale = 1.0;

  // Add scale based on child count
  if (childCount > 0) {
    scale += 0.3 * Math.log10(childCount);
  }

  // Add scale based on total size (relative to 1MB)
  const sizeMB = totalSize / (1024 * 1024);
  if (sizeMB > 1) {
    scale += 0.2 * Math.log10(sizeMB);
  }

  // Clamp to reasonable range
  return Math.max(0.8, Math.min(3.0, scale));
}
