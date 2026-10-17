import { useCallback, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import OpenMuscleMap from './OpenMuscleMap';
import { APP_MUSCLE_BY_ID, getMuscleStatus, SELECTABLE_MUSCLES } from './muscleMapping';

const VIEW_OPTIONS = [
  { value: 'both', label: 'Both' },
  { value: 'front', label: 'Front' },
  { value: 'rear', label: 'Back' },
];
const LEGACY_VIEWS = { anterior: 'front', posterior: 'rear', both: 'both' };
const MODEL_OPTIONS = [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }];
const BODY_VIEW_COUNT = 2;
const controlClass = 'rounded-[var(--app-radius-sm)] px-3 py-2 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-accent)]';

function MapChoices({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="flex rounded-[var(--app-radius-md)] bg-[var(--app-surface)] p-1">
      {options.map(option => (
        <button key={option.value} type="button" aria-pressed={value === option.value}
          onClick={() => onChange(option.value)} className={cn(controlClass,
            value === option.value ? 'bg-foreground text-background' : 'text-muted-foreground')}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

function MuscleSelectionDetails({ selection, muscleStats, onClear }) {
  return (
    <div className="w-full space-y-3 text-sm" aria-live="polite" aria-atomic="true">
      {selection.length ? (
        <>
          <ul className="space-y-2">
            {selection.map(region => (
              <li key={region.selectionKey}>
                <p className="font-semibold">{region.muscleName} ({region.side})</p>
                <p className="text-muted-foreground">{getMuscleStatus(region.muscleId, muscleStats)}</p>
              </li>
            ))}
          </ul>
          <button type="button" className={cn(controlClass, 'border border-[var(--app-border)]')}
            onClick={onClear}>Clear selection</button>
        </>
      ) : <p className="text-muted-foreground">Tap a muscle, or use Tab and Enter. Escape clears selection.</p>}
    </div>
  );
}

/** Display schematic muscles using existing group-level workout and recovery data. */
export default function InteractiveMuscleMap({
  muscleStats = {}, view = 'both', size = 200, onMuscleClick, onSelect,
  noBackground = false, multiple = false, bilateral = false,
}) {
  const [model, setModel] = useState('male');
  const [currentView, setCurrentView] = useState(LEGACY_VIEWS[view] || view);
  const [selection, setSelection] = useState([]);
  const controller = useRef(null);
  const handleChange = useCallback(value => setSelection(value), []);
  const handleSelect = useCallback(region => {
    const appMuscle = APP_MUSCLE_BY_ID[region.muscleId];
    if (appMuscle) onMuscleClick?.(appMuscle, region);
    onSelect?.(region);
  }, [onMuscleClick, onSelect]);
  const targetedGroups = [...new Set(SELECTABLE_MUSCLES.map(muscle => APP_MUSCLE_BY_ID[muscle.id]))]
    .filter(key => key && muscleStats[key]);
  const maxWidth = size * (currentView === 'both' ? BODY_VIEW_COUNT : 1);

  function changeModel(nextModel) {
    controller.current?.clear();
    setModel(nextModel);
  }

  return (
    <section aria-label="Interactive muscle map" className={cn(
      'flex w-full min-w-0 flex-col items-center gap-4',
      !noBackground && 'rounded-[var(--app-radius-lg)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4',
    )}>
      <div className="flex w-full flex-wrap justify-center gap-3">
        <MapChoices label="Body model" options={MODEL_OPTIONS} value={model} onChange={changeModel} />
        <MapChoices label="Map view" options={VIEW_OPTIONS} value={currentView} onChange={setCurrentView} />
      </div>
      <div className="w-full" style={{ maxWidth }}>
        <OpenMuscleMap model={model} view={currentView} muscleStats={muscleStats}
          multiple={multiple} bilateral={bilateral} controllerRef={controller}
          onSelect={handleSelect} onChange={handleChange} />
      </div>
      <MuscleSelectionDetails selection={selection} muscleStats={muscleStats}
        onClear={() => controller.current?.clear()} />
      {targetedGroups.length > 0 && (
        <ul aria-label="Tracked muscle groups" className="w-full space-y-1 text-xs text-muted-foreground">
          {targetedGroups.map(key => <li key={key}>{key.replaceAll('-', ' ')}: {muscleStats[key].status}</li>)}
        </ul>
      )}
      <p className="w-full text-xs text-muted-foreground">
        Schematic map. Sides refer to the person. Colors reflect broad workout groups, not individual muscle measurements.
      </p>
    </section>
  );
}
