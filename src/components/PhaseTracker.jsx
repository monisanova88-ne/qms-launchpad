import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export default function PhaseTracker({ phases }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-5">
      {phases.map((phase, idx) => {
        const done = phase.progress >= 100;
        return (
          <div key={phase.key} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full ring-4 ring-white ${done ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {done ? <CheckCircle2 className="h-5 w-5" /> : <span className="text-sm font-semibold">{idx + 1}</span>}
              </div>
              {idx < phases.length - 1 && <div className="mt-1 h-8 w-px bg-slate-200" />}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{t(phase.key)}</p>
                  <p className="text-xs text-slate-500">{t(`phase_${phase.phaseKey}`)}</p>
                </div>
                <span className="text-sm font-semibold text-slate-700 tabular-nums">{phase.progress}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${phase.progress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}