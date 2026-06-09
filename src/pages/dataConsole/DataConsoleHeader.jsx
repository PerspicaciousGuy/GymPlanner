import { Database, Download, Settings2, Upload } from 'lucide-react';
import {
  consoleButtonClass,
  consolePrimaryButtonClass,
} from './dataConsoleStyles';

export function DataConsoleHeader({
  exporting,
  importing,
  importInputRef,
  onExport,
  onImportClick,
  onImportFile,
  onToggleAdvancedCols,
  showAdvancedCols,
}) {
  return (
    <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center md:mb-6">
      <div className="flex-1">
        <h1 className="text-lg font-semibold tracking-normal text-foreground md:text-xl">Data Console</h1>
        <p className="text-[10px] font-medium text-muted-foreground md:text-xs">Configure workouts, sessions, and database.</p>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none sm:pb-0 md:gap-2">
        <input
          ref={importInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={onImportFile}
          className="hidden"
        />
        <button
          onClick={onImportClick}
          disabled={importing}
          className={consoleButtonClass}
          title="Import Data"
        >
          <Upload size={14} />
          <span className="hidden xs:inline">Import</span>
        </button>
        <button
          onClick={() => onExport('current')}
          disabled={exporting}
          className={consoleButtonClass}
          title="Export Current Tab"
        >
          <Download size={14} />
          <span className="hidden xs:inline">Export</span>
        </button>
        <button
          onClick={() => onExport('all')}
          disabled={exporting}
          className={consolePrimaryButtonClass}
          title="Export All Data"
        >
          <Database size={14} />
          <span className="hidden xs:inline">Export All</span>
        </button>

        <div className="mx-0.5 hidden h-6 w-px bg-[var(--app-border)] xs:block md:mx-1" />
        <button
          onClick={() => onToggleAdvancedCols(!showAdvancedCols)}
          className={consoleButtonClass}
          title="Display Options"
        >
          <Settings2 size={14} />
          <span className="hidden xs:inline">Display</span>
        </button>
      </div>
    </div>
  );
}
