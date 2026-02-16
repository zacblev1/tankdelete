interface DirectoryPickerProps {
  onPick: () => void;
  lastDirectory?: string | null;
  onReopenLast?: () => void;
  error?: string | null;
}

export function DirectoryPicker({ onPick, lastDirectory, onReopenLast, error }: DirectoryPickerProps) {
  return (
    <div className="directory-picker">
      <h1>TankDelete</h1>
      <p className="subtitle">Select a directory to explore</p>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {lastDirectory && onReopenLast ? (
        <div className="last-directory">
          <p>Reopen last directory?</p>
          <p className="directory-path">{lastDirectory}</p>
          <div className="button-group">
            <button onClick={onReopenLast} className="btn-primary">
              Yes
            </button>
            <button onClick={onPick} className="btn-secondary">
              Pick New
            </button>
          </div>
        </div>
      ) : (
        <button onClick={onPick} className="btn-primary">
          Select Directory
        </button>
      )}
    </div>
  );
}
