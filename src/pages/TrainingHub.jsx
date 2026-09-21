import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap, Video, FileText, FileDown, CalendarPlus, Clock, CheckCircle2, Loader2, ExternalLink, UserRound } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';

export default function TrainingHub() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ topic: '', scheduled_date: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [res, bk] = await Promise.all([
          base44.entities.TrainingSession.list('-created_date', 50),
          base44.entities.Booking.list('-created_date', 20),
        ]);
        setResources(res);
        setBookings(bk);
      } catch (e) {
        // empty
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const title = (r) => (lang === 'es' && r.title_es) ? r.title_es : r.title_en;
  const desc = (r) => (lang === 'es' && r.description_es) ? r.description_es : r.description_en;

  const submitBooking = async (e) => {
    e.preventDefault();
    if (!form.topic.trim() || !form.scheduled_date) return;
    setSubmitting(true);
    try {
      const created = await base44.entities.Booking.create({
        client_name: user?.full_name || 'Client User',
        company: user?.email || '',
        topic: form.topic.trim(),
        scheduled_date: new Date(form.scheduled_date).toISOString(),
        notes: form.notes.trim(),
        status: 'confirmed',
      });
      setBookings((prev) => [created, ...prev]);
      setForm({ topic: '', scheduled_date: '', notes: '' });
      setConfirmed(true);
      setTimeout(() => setConfirmed(false), 4000);
    } catch (e) {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const videos = resources.filter((r) => r.resource_type === 'video');
  const docs = resources.filter((r) => r.resource_type === 'doc');
  const pdfs = resources.filter((r) => r.resource_type === 'pdf');

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
          <GraduationCap className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">{t('trainingTitle')}</h1>
          <p className="text-xs text-slate-500">{t('trainingDesc')}</p>
        </div>
      </div>

      {/* Resources */}
      <div className="grid gap-6 lg:grid-cols-3">
        <ResourceColumn icon={Video} title={t('videoSessions')} items={videos} titleFn={title} descFn={desc} cta={t('watch')} ctaIcon={ExternalLink} accent="blue" loading={loading} t={t} />
        <ResourceColumn icon={FileText} title={t('documentation')} items={docs} titleFn={title} descFn={desc} cta={t('read')} ctaIcon={ExternalLink} accent="slate" loading={loading} t={t} />
        <ResourceColumn icon={FileDown} title={t('guides')} items={pdfs} titleFn={title} descFn={desc} cta={t('download')} ctaIcon={FileDown} accent="emerald" loading={loading} t={t} />
      </div>

      {/* Booking + bookings */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Booking form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CalendarPlus className="h-5 w-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">{t('bookSession')}</h2>
              <p className="text-xs text-slate-500">{t('bookSessionDesc')}</p>
            </div>
          </div>
          <form onSubmit={submitBooking} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">{t('topic')}</label>
              <input
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder={t('topicPlaceholder')}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">{t('preferredDate')}</label>
              <input
                type="datetime-local"
                value={form.scheduled_date}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">{t('notes')}</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={t('notesPlaceholder')}
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
              {t('confirmBooking')}
            </button>
            <AnimatePresence>
              {confirmed && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {t('bookingConfirmed')}
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* Bookings list */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-900">{t('yourBookings')}</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {bookings.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">{t('noBookings')}</p>
            ) : (
              bookings.map((b) => (
                <div key={b.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">{b.topic}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                      <CheckCircle2 className="h-3 w-3" /> {t('statusResolved').includes('Resuelto') ? 'Confirmada' : 'Confirmed'}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(b.scheduled_date).toLocaleString(lang === 'es' ? 'es-ES' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <UserRound className="h-3.5 w-3.5" />
                      {t('specialist')}
                    </span>
                  </div>
                  {b.notes && <p className="mt-2 text-xs text-slate-500">{b.notes}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const ACCENTS = {
  blue: 'bg-blue-50 text-blue-600',
  slate: 'bg-slate-100 text-slate-600',
  emerald: 'bg-emerald-50 text-emerald-600',
};

function ResourceColumn({ icon: Icon, title, items, titleFn, descFn, cta, ctaIcon: CtaIcon, accent, loading, t }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', ACCENTS[accent])}>
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      </div>
      <div className="divide-y divide-slate-50">
        {loading ? (
          <div className="space-y-2 p-4">{[0, 1].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />)}</div>
        ) : items.length === 0 ? (
          <p className="p-6 text-center text-xs text-slate-400">—</p>
        ) : (
          items.map((r) => (
            <div key={r.id} className="p-4">
              <p className="text-sm font-semibold text-slate-800">{titleFn(r)}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{descFn(r)}</p>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">{r.duration_minutes ? `${r.duration_minutes} ${t('minutes')}` : ''}</span>
                <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700">
                  <CtaIcon className="h-3.5 w-3.5" />
                  {cta}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}