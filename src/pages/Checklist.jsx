import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListChecks, Plus, LifeBuoy, Send, CheckCircle2, Circle, Loader2, MessageSquareText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';

const PHASE_OPTIONS = [
  { value: '0', labelKey: 'kickoff' },
  { value: '1', labelKey: 'systemConfig' },
  { value: '2', labelKey: 'dataMigration' },
  { value: '3', labelKey: 'staffTraining' },
  { value: '4', labelKey: 'goLive' },
];

const MOCK_RESPONSES_EN = [
  'Our implementation team is reviewing the configuration. A specialist will validate the workflow mapping and confirm next steps within one business day.',
  'This is a known configuration scenario. Ensure your access control groups are mapped to the CAPA owner role before re-publishing the workflow.',
  'We have routed your question to the Data Migration pod. They will confirm whether the relational ID mapping requires a remediating script.',
];
const MOCK_RESPONSES_ES = [
  'Nuestro equipo de implementación está revisando la configuración. Un especialista validará el mapeo del flujo y confirmará los próximos pasos en un día hábil.',
  'Este es un escenario de configuración conocido. Asegúrese de que los grupos de control de acceso estén mapeados al rol de propietario CAPA antes de volver a publicar el flujo.',
  'Hemos derivado su pregunta al equipo de Migración de Datos. Confirmarán si el mapeo de ID relacional requiere un script de remediación.',
];

export default function Checklist() {
  const { t, lang } = useLanguage();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [newPhase, setNewPhase] = useState('0');
  const [adding, setAdding] = useState(false);

  const [tickets, setTickets] = useState([]);
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [taskData, ticketData] = await Promise.all([
          base44.entities.OnboardingTask.list('-created_date', 200),
          base44.entities.SupportTicket.list('-created_date', 50),
        ]);
        setTasks(taskData);
        setTickets(ticketData);
      } catch (e) {
        // empty
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      const created = await base44.entities.OnboardingTask.create({
        title_en: newTitle.trim(),
        title_es: newTitle.trim(),
        phase: newPhase,
        completed: false,
      });
      setTasks((prev) => [created, ...prev]);
      setNewTitle('');
    } catch (e) {
      // ignore
    } finally {
      setAdding(false);
    }
  };

  const toggleTask = async (task) => {
    try {
      const updated = await base44.entities.OnboardingTask.update(task.id, { completed: !task.completed });
      setTasks((prev) => prev.map((x) => (x.id === task.id ? updated : x)));
    } catch (e) {
      // ignore
    }
  };

  const submitQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setSubmitting(true);
    try {
      const responses = lang === 'es' ? MOCK_RESPONSES_ES : MOCK_RESPONSES_EN;
      const response = responses[Math.floor(Math.random() * responses.length)];
      const created = await base44.entities.SupportTicket.create({
        question: question.trim(),
        status: 'investigating',
        response,
      });
      setTickets((prev) => [created, ...prev]);
      setQuestion('');
    } catch (e) {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const resolveTicket = async (ticket) => {
    try {
      const updated = await base44.entities.SupportTicket.update(ticket.id, { status: 'resolved' });
      setTickets((prev) => prev.map((x) => (x.id === ticket.id ? updated : x)));
    } catch (e) {
      // ignore
    }
  };

  const taskTitle = (task) => (lang === 'es' && task.title_es) ? task.title_es : task.title_en;
  const phaseLabel = (phaseValue) => {
    const opt = PHASE_OPTIONS.find((o) => o.value === String(phaseValue));
    return opt ? t(opt.labelKey) : '';
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader icon={ListChecks} title={t('checklistTitle')} desc={t('checklistDesc')} />

      {/* Add task */}
      <form onSubmit={addTask} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={t('taskPlaceholder')}
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
          <select
            value={newPhase}
            onChange={(e) => setNewPhase(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
          >
            {PHASE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{t(o.labelKey)}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={adding}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {t('addTask')}
          </button>
        </div>
      </form>

      {/* Task list */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">{t('checklistTitle')}</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="space-y-2 p-5">{[0, 1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>
          ) : tasks.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-400">{t('noTasks')}</p>
          ) : (
            <AnimatePresence initial={false}>
              {tasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50"
                >
                  <button onClick={() => toggleTask(task)} className="flex-shrink-0">
                    {task.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-slate-300 hover:text-slate-400" />
                    )}
                  </button>
                  <span className={cn('flex-1 text-sm', task.completed ? 'text-slate-400 line-through' : 'text-slate-800')}>
                    {taskTitle(task)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                    {phaseLabel(task.phase)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
          <LifeBuoy className="h-4 w-4 text-blue-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">{t('troubleshooting')}</h2>
            <p className="text-xs text-slate-500">{t('troubleshootingDesc')}</p>
          </div>
        </div>
        <form onSubmit={submitQuestion} className="flex flex-col gap-3 p-5 sm:flex-row">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t('questionPlaceholder')}
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {t('submit')}
          </button>
        </form>
        <div className="divide-y divide-slate-100 border-t border-slate-100">
          {tickets.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">{t('noTickets')}</p>
          ) : (
            <AnimatePresence initial={false}>
              {tickets.map((ticket) => (
                <motion.div key={ticket.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <MessageSquareText className="mt-0.5 h-4 w-4 text-slate-400" />
                      <p className="text-sm font-medium text-slate-800">{ticket.question}</p>
                    </div>
                    <StatusBadge status={ticket.status} t={t} />
                  </div>
                  {ticket.response && (
                    <div className="mt-3 ml-6 rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{t('autoResponse')}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">{ticket.response}</p>
                    </div>
                  )}
                  {ticket.status === 'investigating' && (
                    <button
                      onClick={() => resolveTicket(ticket)}
                      className="ml-6 mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      {t('markResolved')}
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, t }) {
  const resolved = status === 'resolved';
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold', resolved ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700')}>
      <span className={cn('h-1.5 w-1.5 rounded-full', resolved ? 'bg-green-500' : 'bg-amber-500 animate-pulse')} />
      {resolved ? t('statusResolved') : t('statusInvestigating')}
    </span>
  );
}

function PageHeader({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">{title}</h1>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </div>
  );
}