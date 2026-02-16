import { useEffect, useState, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import toast, { Toaster } from 'react-hot-toast';
import { KeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import './App.css';
import { commands } from './lib/tauri-commands';
import { FileEntry, ScanProgress } from './lib/types';
import { formatBytes } from './lib/format';
import { DirectoryPicker } from './components/DirectoryPicker';
import { HUD } from './components/HUD';
import { Minimap } from './components/HUD/Minimap';
import { Scene } from './components/Scene/Scene';
import { FileBlocks } from './components/Scene/FileBlocks';
import { FolderPortal } from './components/Scene/FolderPortal';
import { BackPortal } from './components/Scene/BackPortal';
import { PortalCollision } from './components/Scene/PortalCollision';
import { Particles } from './components/Scene/Particles';
import { Tank } from './components/Scene/Tank';
import { CameraRig } from './components/Scene/CameraRig';
import { Crosshair } from './components/Scene/Crosshair';
import { useFileBlocks } from './hooks/useFileBlocks';
import { useProjectilePool } from './hooks/useProjectilePool';
import { useMarkedFiles } from './hooks/useMarkedFiles';
import { ProjectileManager } from './components/Scene/ProjectileManager';
import { layoutFilesInGrid } from './lib/layout';
import { folderToScale } from './lib/scale';

type AppState = 'checking' | 'picking' | 'scanning' | 'ready';

// Keyboard controls map
const CONTROLS_MAP = [
  { name: 'forward', keys: ['KeyW', 'ArrowUp'] },
  { name: 'backward', keys: ['KeyS', 'ArrowDown'] },
  { name: 'left', keys: ['KeyA', 'ArrowLeft'] },
  { name: 'right', keys: ['KeyD', 'ArrowRight'] },
  { name: 'batchDelete', keys: ['Delete', 'KeyX'] },
];

function App() {
  const [state, setState] = useState<AppState>('checking');
  const [currentDirectory, setCurrentDirectory] = useState<string | null>(null);
  const [lastDirectory, setLastDirectory] = useState<string | null>(null);
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletedCount, setDeletedCount] = useState<number>(0);
  const [deletedBytes, setDeletedBytes] = useState<number>(0);
  const [tankStartPosition, setTankStartPosition] = useState<[number, number, number]>([0, 0, -12]);

  // Tank ref for camera tracking
  const tankRef = useRef<THREE.Group>(null);

  // Tank state for minimap (updated by Tank component each frame)
  const tankStateRef = useRef({ position: [0, 0, 0] as [number, number, number], rotation: 0 });

  // Projectile pool
  const { spawn, despawn, pool } = useProjectilePool();

  // Marked files hook
  const {
    markedFiles,
    deletingFiles,
    markFile,
    isMarked,
    startDeletion,
    finishDeletion,
    deleteAllMarked,
    markedCount,
  } = useMarkedFiles();

  // File block mesh refs for hit detection (populated by FileBlocks component)
  const fileBlockRefsRef = useRef<React.RefObject<THREE.InstancedMesh | null>[]>([]);

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

  // Keyboard listener for Ctrl+Z (Cmd+Z on macOS) and batch delete
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Check for Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault(); // Prevent browser default undo
        handleUndoLastTrash();
      }

      // Check for Delete or X key for batch delete
      if ((e.key === 'Delete' || e.key === 'x' || e.key === 'X') && markedCount > 0) {
        e.preventDefault();
        handleBatchDelete();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDirectory, markedCount]); // Re-attach when currentDirectory or markedCount changes

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
    setError(null);

    try {
      const result = await commands.scanDirectory(path);
      setEntries(result);
      setState('ready');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('Failed to scan directory:', errorMsg);
      setError(`Scan failed: ${errorMsg}`);
      // Stay on scanning screen briefly so user sees the error
      setTimeout(() => {
        setState('picking');
      }, 3000);
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

  async function navigateToDirectory(dirPath: string) {
    setCurrentDirectory(dirPath);
    await commands.saveLastDirectory(dirPath);
    // Reset tank position to spawn near back portal when entering new directory
    setTankStartPosition([0, 0, -12]);
    await scanDirectory(dirPath);
  }

  async function navigateUp() {
    if (!currentDirectory) return;
    const parent = currentDirectory.replace(/\/[^/]+\/?$/, '') || '/';
    if (parent !== currentDirectory) {
      await navigateToDirectory(parent);
    }
  }

  async function handleUndoLastTrash() {
    try {
      const action = await commands.undoLastTrash();

      if (action) {
        // Show success toast
        toast.success(`Restored ${action.file_name}`, { duration: 3000 });

        // Update session stats
        const [count, bytes] = await commands.getSessionStats();
        setDeletedCount(count);
        setDeletedBytes(bytes);

        // Re-add file to list (scan the directory again to get fresh list)
        if (currentDirectory) {
          const result = await commands.scanDirectory(currentDirectory);
          setEntries(result);
        }
      }
      // If nothing to undo, just ignore (don't show toast)
    } catch (err) {
      toast.error(`Failed to undo: ${err}`);
    }
  }

  // Shoot handler for Tank component
  function handleShoot(position: THREE.Vector3, direction: THREE.Vector3) {
    spawn(position, direction);
  }

  // Projectile hit handler with two-shot deletion logic
  async function handleProjectileHit(filePath: string) {
    if (isMarked(filePath)) {
      // Second hit: delete the file
      try {
        const action = await commands.moveToTrash(filePath);

        // Show success toast
        toast.success(
          `Deleted ${action.file_name} (${formatBytes(action.original_size)})`,
          { duration: 3000 }
        );

        // Update session stats
        const [count, bytes] = await commands.getSessionStats();
        setDeletedCount(count);
        setDeletedBytes(bytes);

        // Start de-rez animation
        startDeletion(filePath);

        // Remove from entries after animation completes (handled by FileBlocks onDeletionComplete)
      } catch (err) {
        toast.error(`Failed to delete file: ${err}`);
      }
    } else {
      // First hit: mark the file
      markFile(filePath);
    }
  }

  // Callback to receive mesh refs from FileBlocks
  function handleMeshRefsReady(refs: React.RefObject<THREE.InstancedMesh | null>[]) {
    fileBlockRefsRef.current = refs;
  }

  // Batch delete all marked files
  async function handleBatchDelete() {
    if (markedCount === 0) return;

    try {
      await deleteAllMarked();

      // Update session stats after batch delete
      const [count, bytes] = await commands.getSessionStats();
      setDeletedCount(count);
      setDeletedBytes(bytes);

      toast.success(`Deleted ${markedCount} marked files`, { duration: 3000 });
    } catch (err) {
      toast.error(`Failed to batch delete: ${err}`);
    }
  }

  // Called when a file's de-rez animation completes
  function handleDeletionComplete(filePath: string) {
    finishDeletion(filePath);
    // Remove file from entries
    setEntries(prev => prev.filter(e => e.path !== filePath));
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
          {error && <div className="error-message">{error}</div>}
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

  // Prepare data for 3D scene
  const { blocksByCategory, folders, allBlocks } = useFileBlocks(entries);

  // Calculate folder positions (folders get front rows in grid layout)
  const folderPositions = new Map<string, [number, number, number]>();
  const folderEntries = entries.filter(e => e.is_dir);
  const allPositions = layoutFilesInGrid(folderEntries);

  for (const folder of folderEntries) {
    const pos = allPositions.get(folder.path);
    if (pos) {
      folderPositions.set(folder.path, [pos.x, pos.y, pos.z]);
    }
  }

  // Compute child counts for folders
  const folderChildCounts = new Map<string, number>();
  for (const folder of folderEntries) {
    // Count immediate children visible in current entries list
    const childCount = entries.filter(e => {
      const parentPath = e.path.substring(0, e.path.lastIndexOf('/'));
      return parentPath === folder.path;
    }).length;
    folderChildCounts.set(folder.path, childCount || 1);
  }

  // Parent path for back portal
  const parentPath = currentDirectory ? currentDirectory.replace(/\/[^/]+\/?$/, '') || '/' : '/';
  const isAtRoot = currentDirectory === '/' || !currentDirectory;

  // Prepare portal data for collision detection
  const folderPortalData = folders.map((folder) => {
    const position = folderPositions.get(folder.path);
    const childCount = folderChildCounts.get(folder.path) || 0;
    return {
      path: folder.path,
      position: position || [0, 0, 0] as [number, number, number],
      scale: folderToScale(childCount, folder.size),
    };
  }).filter(p => p.position[0] !== 0 || p.position[1] !== 0 || p.position[2] !== 0);

  const backPortalPosition: [number, number, number] | null = !isAtRoot ? [0, 0.5, -15] : null;

  // Prepare minimap data
  const minimapFileBlocks = allBlocks.map(block => ({
    position: block.position,
    color: block.color,
    isMarked: markedFiles.has(block.path),
  }));

  const minimapFolderPortals = folderPortalData.map(portal => ({
    position: portal.position,
  }));

  return (
    <div className="scene-container">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#e0e0e0',
            border: '1px solid #00ffff',
            borderRadius: '4px',
          },
          success: {
            iconTheme: {
              primary: '#00ffff',
              secondary: '#1a1a2e',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff3366',
              secondary: '#1a1a2e',
            },
          },
        }}
      />

      <HUD deletedCount={deletedCount} deletedBytes={deletedBytes} />

      <Crosshair />

      <Minimap
        tankPosition={tankStateRef.current.position}
        tankRotation={tankStateRef.current.rotation}
        fileBlocks={minimapFileBlocks}
        folderPortals={minimapFolderPortals}
        backPortalPosition={backPortalPosition}
      />

      <div className="header">
        <div className="header-left">
          <button onClick={navigateUp} className="btn-back" title="Go up one directory">
            ◂
          </button>
          <h2>{currentDirectory}</h2>
        </div>
        <button onClick={changeDirectory} className="btn-secondary">
          Change Directory
        </button>
      </div>

      <KeyboardControls map={CONTROLS_MAP}>
        <Scene>
          <Tank ref={tankRef} initialPosition={tankStartPosition} tankStateRef={tankStateRef} onShoot={handleShoot} />
          <CameraRig tankRef={tankRef} />

          <PortalCollision
            tankRef={tankRef}
            folderPortals={folderPortalData}
            backPortalPosition={backPortalPosition}
            onEnterFolder={navigateToDirectory}
            onEnterBackPortal={navigateUp}
          />

          <ProjectileManager
            pool={pool}
            despawn={despawn}
            onHit={handleProjectileHit}
            fileBlockRefs={fileBlockRefsRef.current}
            allBlocks={allBlocks}
          />

          <FileBlocks
            blocks={blocksByCategory}
            onHover={() => {}}
            onMeshRefsReady={handleMeshRefsReady}
            markedFiles={markedFiles}
            deletingFiles={deletingFiles}
            onDeletionComplete={handleDeletionComplete}
          />

          {folders.map((folder) => {
            const position = folderPositions.get(folder.path);
            const childCount = folderChildCounts.get(folder.path) || 0;
            if (!position) return null;

            return (
              <FolderPortal
                key={folder.path}
                folder={folder}
                position={position}
                scale={folderToScale(childCount, folder.size)}
                childCount={childCount}
                totalSize={folder.size}
                onHover={() => {}}
              />
            );
          })}

          {!isAtRoot && (
            <BackPortal parentPath={parentPath} />
          )}

          <Particles />
        </Scene>
      </KeyboardControls>
    </div>
  );
}

export default App;
