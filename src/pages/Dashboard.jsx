import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, CalendarClock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import HealthScore from '@/components/HealthScore';
import PhaseTracker from '@/components/PhaseTracker';

const PHASES = [
  { key: 'kickoff', phaseKey: 'kickoff' },
  { key: 'systemConfig', phaseKey: 'config' },
  { key: 'dataMigration', phaseKey: 'migration' },
  { key: 'staffTraining', phaseKey: 'training' },
  { key: 'goLive', phaseKey: 'golive' },
];

export default function Dashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.OnboardingTask.list('-created_date', 200);
        setTasks(data);
      } catch (e) {
        setTasks([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const phaseProgress = PHASES.map((p, idx) => {
    const phaseTasks = tasks.filter((task) => Number(task.phase) === idx);
    const done = phaseTasks.filter((task) => task.completed).length;
    const progress = phaseTasks.length ? Math.round((done / phaseTasks.length) * 100) : 0;
    return { ...p, progress };
  });

  const totalDone = tasks.filter((task) => task.completed).length;
  const health = tasks.length ? Math.round((totalDone / tasks.length) * 100) : 0;
  const companyName = user?.full_name ? user.full_name.split(' ')[0] : 'Valencia';

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Greeting + Health */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">{t('tagline')}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 lg:text-3xl">
              {t('greeting')}, <span className="text-blue-700">{companyName}</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">{t('greetingSub')}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">{totalDone} {t('of')} {tasks.length} {t('tasks')}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <CalendarClock className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">{t('goLive')}: Q4 2026</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center rounded-xl bg-slate-50 p-5">
            <HealthScore score={health} />
            <p className="mt-3 text-center text-xs font-semibold text-slate-700">{t('healthScore')}</p>
            <p className="mt-1 max-w-[200px] text-center text-[11px] leading-snug text-slate-400">{t('healthScoreDesc')}</p>
          </div>
        </div>
      </motion.div>

      {/* Phases */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6 flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">{t('deploymentPhases')}</h2>
            <p className="text-xs text-slate-500">{t('phasesSub')}</p>
          </div>
        </div>
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : (
          <PhaseTracker phases={phaseProgress} />
        )}
      </div>
    </div>
  );
}