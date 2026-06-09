import { Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getDayOfWeek } from '../../utils/dateUtils';
import {
  consoleCompactInputClass,
  consoleDeleteButtonClass,
  consoleHeadCellClass,
  consoleInputClass,
  consoleRowClass,
  consoleStrongInputClass,
  consoleTableBodyClass,
  consoleTableHeaderClass,
} from './dataConsoleStyles';

export function WorkoutRowsTable({
  onRemoveWorkoutGridRow,
  onUpdateWorkoutRow,
  s1Label,
  s2Label,
  showAdvancedCols,
  visibleWorkoutRows,
}) {
  return (
    <div className="flex-1 overflow-auto">
      <Table className="min-w-[1000px]">
        <TableHeader className={consoleTableHeaderClass}>
          <TableRow className="border-none hover:bg-transparent">
            <TableHead className={`${consoleHeadCellClass} w-10`}>No.</TableHead>
            <TableHead className={`${consoleHeadCellClass} w-24`}>Day</TableHead>
            <TableHead className={`${consoleHeadCellClass} w-32`}>Date</TableHead>
            <TableHead className={`${consoleHeadCellClass} w-20`}>Session</TableHead>
            {showAdvancedCols && <TableHead className={`${consoleHeadCellClass} w-16`}>Group</TableHead>}
            {showAdvancedCols && <TableHead className={`${consoleHeadCellClass} w-16`}>Row</TableHead>}
            <TableHead className={consoleHeadCellClass}>Muscle</TableHead>
            <TableHead className={consoleHeadCellClass}>Sub Muscle</TableHead>
            <TableHead className={`${consoleHeadCellClass} w-80`}>Exercise</TableHead>
            <TableHead className={`${consoleHeadCellClass} w-16 text-center`}>Sets</TableHead>
            <TableHead className={`${consoleHeadCellClass} w-16 text-center`}>Reps</TableHead>
            <TableHead className={`${consoleHeadCellClass} w-20 text-center`}>Weight</TableHead>
            <TableHead className={`${consoleHeadCellClass} w-12 text-center`}>Del</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={consoleTableBodyClass}>
          {visibleWorkoutRows.map(({ row, idx }, visibleIdx) => (
            <TableRow key={`workout-row-${idx}`} className={consoleRowClass}>
              <TableCell className="px-3 py-2 text-[10px] font-semibold text-muted-foreground/45">{visibleIdx + 1}</TableCell>
              <TableCell className="px-3 py-2">
                <span className="text-[11px] font-semibold italic text-foreground">{row.day}</span>
              </TableCell>
              <TableCell className="px-3 py-2">
                <Input
                  type="date"
                  value={row.dateOrDay || ''}
                  onChange={(event) => {
                    const newDate = event.target.value;
                    onUpdateWorkoutRow(idx, 'dateOrDay', newDate);
                    if (newDate) {
                      onUpdateWorkoutRow(idx, 'day', getDayOfWeek(newDate));
                    }
                  }}
                  className={consoleInputClass}
                />
              </TableCell>
              <TableCell className="px-3 py-2">
                <select
                  value={row.session}
                  onChange={(event) => onUpdateWorkoutRow(idx, 'session', event.target.value)}
                  className="w-full rounded-[var(--app-radius-sm)] border border-transparent bg-transparent px-1 py-1 text-[10px] font-semibold uppercase tracking-normal text-foreground outline-none transition-colors focus:border-[var(--app-border)] focus:bg-[var(--app-surface)]"
                >
                  <option value="am">{s1Label}</option>
                  <option value="pm">{s2Label}</option>
                </select>
              </TableCell>
              {showAdvancedCols && (
                <TableCell className="px-3 py-2">
                  <Input value={String(row.groupIndex)} onChange={(event) => onUpdateWorkoutRow(idx, 'groupIndex', event.target.value)} className={consoleCompactInputClass} />
                </TableCell>
              )}
              {showAdvancedCols && (
                <TableCell className="px-3 py-2">
                  <Input value={String(row.rowIndex)} onChange={(event) => onUpdateWorkoutRow(idx, 'rowIndex', event.target.value)} className={consoleCompactInputClass} />
                </TableCell>
              )}
              <TableCell className="px-3 py-2">
                <Input value={row.muscle} onChange={(event) => onUpdateWorkoutRow(idx, 'muscle', event.target.value)} className={consoleInputClass} />
              </TableCell>
              <TableCell className="px-3 py-2">
                <Input value={row.subMuscle} onChange={(event) => onUpdateWorkoutRow(idx, 'subMuscle', event.target.value)} className={consoleInputClass} />
              </TableCell>
              <TableCell className="px-3 py-2">
                <Input value={row.exercise} onChange={(event) => onUpdateWorkoutRow(idx, 'exercise', event.target.value)} className={consoleStrongInputClass} />
              </TableCell>
              <TableCell className="px-3 py-2">
                <Input value={row.sets} onChange={(event) => onUpdateWorkoutRow(idx, 'sets', event.target.value)} className={`${consoleStrongInputClass} text-center`} />
              </TableCell>
              <TableCell className="px-3 py-2">
                <Input value={row.reps} onChange={(event) => onUpdateWorkoutRow(idx, 'reps', event.target.value)} className={`${consoleStrongInputClass} text-center`} />
              </TableCell>
              <TableCell className="px-3 py-2">
                <Input value={row.weight} onChange={(event) => onUpdateWorkoutRow(idx, 'weight', event.target.value)} className={`${consoleStrongInputClass} text-center`} />
              </TableCell>
              <TableCell className="px-3 py-2 text-center">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onRemoveWorkoutGridRow(idx)}
                  className={consoleDeleteButtonClass}
                >
                  <Trash2 size={14} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
