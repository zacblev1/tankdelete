import { invoke } from '@tauri-apps/api/core';
import { FileEntry, TrashAction } from './types';

export const commands = {
  async pickDirectory(): Promise<string | null> {
    return await invoke<string | null>('pick_directory');
  },

  async scanDirectory(path: string): Promise<FileEntry[]> {
    return await invoke<FileEntry[]>('scan_directory', { path });
  },

  async saveLastDirectory(path: string): Promise<void> {
    return await invoke<void>('save_last_directory', { path });
  },

  async getLastDirectory(): Promise<string | null> {
    return await invoke<string | null>('get_last_directory');
  },

  async moveToTrash(path: string): Promise<TrashAction> {
    return await invoke<TrashAction>('move_to_trash', { path });
  },

  async undoLastTrash(): Promise<TrashAction | null> {
    return await invoke<TrashAction | null>('undo_last_trash');
  },

  async getSessionStats(): Promise<[number, number]> {
    return await invoke<[number, number]>('get_session_stats');
  },
};
