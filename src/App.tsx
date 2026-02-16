import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import './App.css';
import { commands } from './lib/tauri-commands';
import { FileEntry, ScanProgress } from './lib/types';
import { formatBytes } from './lib/format';
import { DirectoryPicker } from './components/DirectoryPicker';

type AppState = 'checking' | 'picking' | 'scanning' | 'ready';

function App() {
  const [state, setState] = useState<AppState>('checking');
  const [currentDirectory, setCurrentDirectory] = useState<string | null>(null);
  const [lastDirectory, setLastDirectory] = useState<string | null>(null);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check for last directory on mount
  useEffect(() => {
    async function checkLastDirectory() {
      try {
        const last = await commands.getLastDirectory();
        setLastDirectory(last);

        if (last) {
          // Show reopen prompt
          setState('picking');
        } else {
          // Go straight to picking
          setState('picking');
          pickDirectory();
        }
      } catch (err) {
        console.error('Failed to get last directory:', err);
        setState('picking');
        pickDirectory();
      }
    }

    checkLastDirectory();

    // Listen for scan progress events
    const unlisten = listen<ScanProgress>('scan_progress', (event) => {
      setScanProgress(event.payload);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  async function pickDirectory() {
    setState('picking');
    setError(null);

    try {
      const result = await commands.pickDirectory();

      if (result === null) {
        // User cancelled - wait 500ms then re-show picker
        setTimeout(() => {
          pickDirectory();
        }, 500);
        return;
      }

      // Valid directory selected
      setCurrentDirectory(result);
      await commands.saveLastDirectory(result);
      setLastDirectory(null);
      setState('scanning');
      await scanDirectory(result);
    } catch (err) {
      // System directory blocked or other error
      setError(err instanceof Error ? err.message : String(err));
      // Wait briefly then re-show picker
      setTimeout(() => {
        setError(null);
        pickDirectory();
      }, 2000);
    }
  }

  async function scanDirectory(path: string) {
    setState('scanning');
    setScanProgress(null);

    try {
      const result = await commands.scanDirectory(path);
      setEntries(result);
      setState('ready');
    } catch (err) {
      console.error('Failed to scan directory:', err);
      setError(err instanceof Error ? err.message : String(err));
      setState('picking');
    }
  }

  async function reopenLastDirectory() {
    if (!lastDirectory) return;

    setCurrentDirectory(lastDirectory);
    setLastDirectory(null);
    setState('scanning');
    await scanDirectory(lastDirectory);
  }

  function changeDirectory() {
    setLastDirectory(null);
    pickDirectory();
  }

  if (state === 'checking') {
    return (
      <div className="container">
        <div className="loading">Checking for last directory...</div>
      </div>
    );
  }

  if (state === 'picking') {
    return (
      <div className="container">
        <DirectoryPicker
          onPick={pickDirectory}
          lastDirectory={lastDirectory}
          onReopenLast={lastDirectory ? reopenLastDirectory : undefined}
          error={error}
        />
      </div>
    );
  }

  if (state === 'scanning') {
    return (
      <div className="container">
        <div className="loading">
          <h2>Scanning directory...</h2>
          {scanProgress && (
            <div className="scan-progress">
              <p>Files scanned: {scanProgress.files_scanned}</p>
              <p>Total size: {formatBytes(scanProgress.total_bytes)}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h2>{currentDirectory}</h2>
        <button onClick={changeDirectory} className="btn-secondary">
          Change Directory
        </button>
      </div>

      <div className="file-list">
        {entries.map((entry) => (
          <div key={entry.path} className={`file-entry ${entry.is_dir ? 'directory' : 'file'}`}>
            <span className="icon">{entry.is_dir ? '📁' : '📄'}</span>
            <span className="name">{entry.name}</span>
            <span className="size">{formatBytes(entry.size)}</span>
            {entry.extension && <span className="extension">.{entry.extension}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
