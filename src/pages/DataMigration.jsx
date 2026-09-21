import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, UploadCloud, FileSpreadsheet, PlayCircle, Loader2, CheckCircle2, AlertTriangle, FileWarning } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/lib/LanguageContext';
import { cn } from '@/lib/utils';

export default function DataMigration() {
  const { t } = useLanguage();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [validatingId, setValidatingId] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await base44.entities.MigrationFile.list('-created_date', 50);
        setFiles(data);
      } catch (e) {
        setFiles([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleFiles = async (fileList) => {
    const file = fileList?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    const fileType = ['csv', 'xls', 'xlsx'].includes(ext) ? ext.toUpperCase() : 'CSV';
    try {
      const created = await base44.entities.MigrationFile.create({
        filename: file.name,
        file_type: fileType,
        status: 'pending',
        record_count: 0,
      });
      setFiles((prev) => [created, ...prev]);
    } catch (e) {
      // ignore
    }
  };

  const runValidation = async (file) => {
    setValidatingId(file.id);
    try {
      await base44.entities.MigrationFile.update(file.id, { status: 'validating' });
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: 'validating' } : f)));
      await new Promise((r) => setTimeout(r, 1600));
      // deterministic mock outcome based on filename hash
      const hash = file.filename.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
      const isError = hash % 4 === 0;
      const recordCount = 100 + (hash % 4900);
      const result = isError
        ? { status: 'error', validation_message: t('validationError'), error_line: 42, record_count: recordCount }
        : { status: 'success', validation_message: t('validationSuccess'), record_count: recordCount };
      const updated = await base44.entities.MigrationFile.update(file.id, result);
      setFiles((prev) => prev.map((f) => (f.id === file.id ? updated : f)));
    } catch (e) {
      // ignore
    } finally {
      setValidatingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
          <Database className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">{t('migrationTitle')}</h1>
          <p className="text-xs text-slate-500">{t('migrationDesc')}</p>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'cursor-pointer rounded-2xl border-2 border-dashed bg-white p-10 text-center transition-colors',
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xls,.xlsx"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <motion.div animate={{ scale: dragOver ? 1.05 : 1 }} className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white">
          <UploadCloud className="h-6 w-6" />
        </motion.div>
        <p className="mt-4 text-sm font-semibold text-slate-800">{t('uploadZone')}</p>
        <p className="mt-1 text-xs text-slate-500">{t('uploadOr')}</p>
        <p className="mt-3 text-[11px] text-slate-400">{t('uploadHint')}</p>
      </div>

      {/* Files table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-bold text-slate-900">{t('uploadedFiles')}</h2>
        </div>
        {loading ? (
          <div className="space-y-2 p-5">{[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}</div>
        ) : files.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-400">{t('noFiles')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3">{t('fileName')}</th>
                  <th className="px-5 py-3">{t('fileType')}</th>
                  <th className="px-5 py-3">{t('records')}</th>
                  <th className="px-5 py-3">{t('status')}</th>
                  <th className="px-5 py-3">{t('result')}</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence initial={false}>
                  {files.map((file) => (
                    <motion.tr key={file.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                          <span className="font-medium text-slate-800">{file.filename}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{file.file_type}</td>
                      <td className="px-5 py-3.5 tabular-nums text-slate-600">{file.record_count || '—'}</td>
                      <td className="px-5 py-3.5"><FileStatus status={file.status} t={t} /></td>
                      <td className="px-5 py-3.5 max-w-[280px]">
                        {file.validation_message ? (
                          <ValidationResult file={file} t={t} />
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {file.status !== 'success' && file.status !== 'error' && (
                          <button
                            onClick={() => runValidation(file)}
                            disabled={validatingId === file.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {validatingId === file.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
                            {validatingId === file.id ? t('validating') : t('runValidation')}
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function FileStatus({ status, t }) {
  const map = {
    pending: { label: t('pending'), cls: 'bg-slate-100 text-slate-600' },
    validating: { label: t('validating'), cls: 'bg-blue-50 text-blue-700' },
    success: { label: t('completed'), cls: 'bg-green-50 text-green-700' },
    error: { label: t('validationError').split(':')[0], cls: 'bg-red-50 text-red-700' },
  };
  const s = map[status] || map.pending;
  return <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold', s.cls)}>{s.label}</span>;
}

function ValidationResult({ file, t }) {
  const success = file.status === 'success';
  return (
    <div className={cn('flex items-start gap-2 rounded-lg p-2 text-xs', success ? 'bg-green-50' : 'bg-red-50')}>
      {success ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" /> : <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />}
      <span className={success ? 'text-green-800' : 'text-red-800'}>{file.validation_message}</span>
    </div>
  );
}