'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import type { PeriodMode, PeriodState } from '@/lib/utils';

interface PeriodSelectorProps {
  value: PeriodState;
  onChange: (v: PeriodState) => void;
  label: string;
}

const MODES: { key: PeriodMode; label: string }[] = [
  { key: 'today',  label: 'Heute'  },
  { key: 'week',   label: 'Woche'  },
  { key: 'month',  label: 'Monat'  },
  { key: 'all',    label: 'Gesamt' },
];

export default function PeriodSelector({ value, onChange, label }: PeriodSelectorProps) {
  const showArrows = value.mode !== 'all';
  const canForward = value.offset < 0;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Modus-Buttons */}
      <div className="flex rounded-lg border border-brand-200 overflow-hidden text-sm">
        {MODES.map(({ key, label: mLabel }) => (
          <button
            key={key}
            onClick={() => onChange({ mode: key, offset: 0 })}
            className={clsx(
              'px-3 py-1.5 font-medium transition-colors cursor-pointer',
              value.mode === key
                ? 'bg-brand-600 text-white'
                : 'bg-white text-slate-500 hover:bg-brand-50'
            )}
          >
            {mLabel}
          </button>
        ))}
      </div>

      {/* Pfeile + Label */}
      {showArrows && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onChange({ ...value, offset: value.offset - 1 })}
            className="p-1.5 rounded-lg border border-brand-200 hover:bg-brand-50 text-slate-500 hover:text-brand-700 transition-colors cursor-pointer"
            title="Vorherige Periode"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-sm font-medium text-slate-700 px-2 min-w-[200px] text-center">
            {label}
          </span>

          <button
            onClick={() => onChange({ ...value, offset: value.offset + 1 })}
            disabled={!canForward}
            className={clsx(
              'p-1.5 rounded-lg border border-brand-200 transition-colors cursor-pointer',
              canForward
                ? 'hover:bg-brand-50 text-slate-500 hover:text-brand-700'
                : 'text-slate-300 border-slate-100 cursor-not-allowed'
            )}
            title="Nächste Periode"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
