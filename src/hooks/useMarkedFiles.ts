import { useState } from 'react';
import { commands } from '../lib/tauri-commands';

export function useMarkedFiles() {
  const [markedFiles, setMarkedFiles] = useState<Set<string>>(new Set());
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());

  const markFile = (filePath: string) => {
    setMarkedFiles(prev => new Set(prev).add(filePath));
  };

  const unmarkFile = (filePath: string) => {
    setMarkedFiles(prev => {
      const next = new Set(prev);
      next.delete(filePath);
      return next;
    });
  };

  const isMarked = (filePath: string): boolean => {
    return markedFiles.has(filePath);
  };

  const startDeletion = (filePath: string) => {
    // Remove from marked, add to deleting
    setMarkedFiles(prev => {
      const next = new Set(prev);
      next.delete(filePath);
      return next;
    });
    setDeletingFiles(prev => new Set(prev).add(filePath));
  };

  const finishDeletion = (filePath: string) => {
    setDeletingFiles(prev => {
      const next = new Set(prev);
      next.delete(filePath);
      return next;
    });
  };

  const deleteAllMarked = async (): Promise<void> => {
    const filesToDelete = Array.from(markedFiles);

    // Move all marked files to deleting state
    setMarkedFiles(new Set());
    setDeletingFiles(prev => new Set([...prev, ...filesToDelete]));

    // Delete all files in parallel
    const deletePromises = filesToDelete.map(async (filePath) => {
      try {
        await commands.moveToTrash(filePath);
        return { success: true, path: filePath };
      } catch (err) {
        console.error(`Failed to delete ${filePath}:`, err);
        return { success: false, path: filePath };
      }
    });

    await Promise.all(deletePromises);
    // Note: finishDeletion will be called by FileBlocks after de-rez animation completes
  };

  return {
    markedFiles,
    deletingFiles,
    markFile,
    unmarkFile,
    isMarked,
    startDeletion,
    finishDeletion,
    deleteAllMarked,
    markedCount: markedFiles.size,
  };
}
