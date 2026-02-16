import { invoke } from '@tauri-apps/api/core';
import { FileEntry } from './types';

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
};
