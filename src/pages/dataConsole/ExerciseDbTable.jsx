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
import {
  consoleDeleteButtonClass,
  consoleHeadCellWideClass,
  consoleInputClass,
  consoleRowClass,
  consoleStrongInputClass,
  consoleTableBodyClass,
  consoleTableHeaderClass,
} from './dataConsoleStyles';

export function ExerciseDbTable({
  onRemoveExerciseRow,
  onUpdateExerciseRow,
  paginatedExerciseRows,
}) {
  return (
    <div className="relative flex-1 overflow-auto scrollbar-none">
      <Table className="min-w-[700px]">
        <TableHeader className={consoleTableHeaderClass}>
          <TableRow className="border-none hover:bg-transparent">
            <TableHead className={`${consoleHeadCellWideClass} w-1/4`}>Muscle</TableHead>
            <TableHead className={`${consoleHeadCellWideClass} w-1/4`}>Sub Muscle</TableHead>
            <TableHead className={consoleHeadCellWideClass}>Exercise</TableHead>
            <TableHead className={`${consoleHeadCellWideClass} w-20 text-center`}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={consoleTableBodyClass}>
          {paginatedExerciseRows.map(({ row, idx }) => (
            <TableRow key={`${row.muscle}-${row.subMuscle}-${row.exercise}-${idx}`} className={consoleRowClass}>
              <TableCell className="px-4 py-2">
                <Input
                  value={row.muscle}
                  onChange={(event) => onUpdateExerciseRow(idx, 'muscle', event.target.value)}
                  className={consoleInputClass}
                />
              </TableCell>
              <TableCell className="px-4 py-2">
                <Input
                  value={row.subMuscle}
                  onChange={(event) => onUpdateExerciseRow(idx, 'subMuscle', event.target.value)}
                  className={consoleInputClass}
                />
              </TableCell>
              <TableCell className="px-4 py-2">
                <Input
                  value={row.exercise}
                  onChange={(event) => onUpdateExerciseRow(idx, 'exercise', event.target.value)}
                  className={consoleStrongInputClass}
                />
              </TableCell>
              <TableCell className="px-4 py-2 text-center">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onRemoveExerciseRow(idx)}
                  className={consoleDeleteButtonClass}
                >
                  <Trash2 size={15} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
