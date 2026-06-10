import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DAYS } from '../../data/exerciseDatabase';
import { formatDateCompact } from '../../utils/dateUtils';
import {
  consoleHeadCellWideClass,
  consoleRowClass,
  consoleTableBodyClass,
  consoleTableHeaderClass,
} from './dataConsoleStyles';

export function CompletionTable({
  getSessionTitle,
  onSetCompletionCell,
  s1FullLabel,
  s2FullLabel,
  weekCompletion,
}) {
  return (
    <div className="flex-1 overflow-auto scrollbar-none">
      <Table className="min-w-[600px]">
        <TableHeader className={consoleTableHeaderClass}>
          <TableRow className="border-none hover:bg-transparent">
            <TableHead className={`${consoleHeadCellWideClass} w-40`}>Day</TableHead>
            <TableHead className={`${consoleHeadCellWideClass} w-40`}>Date</TableHead>
            <TableHead className={consoleHeadCellWideClass}>{s1FullLabel}</TableHead>
            <TableHead className={consoleHeadCellWideClass}>{s2FullLabel}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={consoleTableBodyClass}>
          {DAYS.map((day) => {
            const dayData = weekCompletion[day];
            const dateDisplay = dayData ? formatDateCompact(dayData.date) : '';
            const dateKey = dayData ? dayData.date : null;

            return (
              <TableRow key={day} className={consoleRowClass}>
                <TableCell className="px-4 py-3 font-semibold italic text-foreground">{day}</TableCell>
                <TableCell className="px-4 py-3 text-[10px] font-semibold uppercase tracking-normal text-muted-foreground">{dateDisplay}</TableCell>
                {['am', 'pm'].map((session) => {
                  const value = dayData?.[session];
                  const status = value === true ? 'done' : value === 'skipped' ? 'skipped' : '';
                  const sessionTitle = getSessionTitle(dateKey, session);
                  const isInactive = !sessionTitle || ['off', 'rest', ''].includes(sessionTitle.trim().toLowerCase());

                  if (isInactive && !status) {
                    return (
                      <TableCell key={session} className="px-4 py-2 opacity-35">
                        <span className="ml-4 text-[10px] font-semibold tracking-normal text-muted-foreground">-</span>
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell key={session} className="px-4 py-2">
                      <select
                        value={status}
                        onChange={(event) => onSetCompletionCell(dateKey, session, event.target.value)}
                        className={cn(
                          "rounded-[var(--app-radius-sm)] border px-3 py-1.5 text-[10px] font-semibold underline-offset-2 transition-colors focus:outline-none",
                          status === 'done'
                            ? "border-[var(--app-border-strong)] bg-[var(--app-accent-soft)] text-foreground"
                            : status === 'skipped'
                              ? "border-[var(--app-border-strong)] bg-[var(--app-surface-muted)] text-[var(--app-text-soft)]"
                              : "border-transparent bg-transparent text-muted-foreground hover:border-[var(--app-border)]"
                        )}
                        disabled={!dateKey}
                      >
                        <option value="">PENDING</option>
                        <option value="done">DONE</option>
                        <option value="skipped">SKIPPED</option>
                      </select>
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
