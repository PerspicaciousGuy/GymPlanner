import { Calendar, Repeat, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { quickStartTemplates } from './quickStartTemplates';

export function QuickStartTemplatePicker({ onSelect }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {quickStartTemplates.map((template) => {
        const Icon = template.mode === 'fixed' ? Calendar : Repeat;

        return (
          <motion.button
            key={template.id}
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSelect(template)}
            className="group rounded-[var(--app-radius-md)] border border-[var(--app-border)] bg-[var(--app-surface)] p-3 text-left shadow-[var(--app-shadow-sm)] transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-accent-soft)]"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--app-radius-sm)] bg-[var(--app-surface-muted)] text-muted-foreground transition-colors group-hover:bg-foreground group-hover:text-background">
                <Icon size={16} strokeWidth={2.5} />
              </div>
              <span className="inline-flex items-center gap-1 rounded-[var(--app-radius-sm)] border border-[var(--app-border)] bg-[var(--app-surface-muted)] px-2 py-1 text-[8px] font-semibold uppercase tracking-normal text-muted-foreground">
                <Sparkles size={9} />
                Template
              </span>
            </div>
            <h3 className="text-xs font-semibold text-foreground">{template.name}</h3>
            <p className="mt-1 text-[10px] font-medium leading-4 text-muted-foreground">
              {template.description}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}
