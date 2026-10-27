import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Clock, X, Check, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../../contexts/useLanguage';

export default function ChangeStartDateModal({
  isOpen,
  task,
  onClose,
  onSaveStartDate,
  isLoading = false
}) {
  const { t } = useLanguage();

  const getInitialDateTime = () => {
    if (task?.startDate) {
      const d = new Date(task.startDate);
      if (!isNaN(d.getTime())) {
        const tzOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
      }
    }
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [mode, setMode] = useState(() => (task?.startDate ? 'scheduled' : 'now'));
  const [scheduledDateTime, setScheduledDateTime] = useState(getInitialDateTime);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleApplyPreset = (hoursOffset, fixedTomorrow9AM = false) => {
    setMode('scheduled');
    const target = new Date();
    if (fixedTomorrow9AM) {
      target.setDate(target.getDate() + 1);
      target.setHours(9, 0, 0, 0);
    } else {
      target.setTime(target.getTime() + hoursOffset * 60 * 60 * 1000);
      target.setMinutes(0, 0, 0);
    }
    const tzOffset = target.getTimezoneOffset() * 60000;
    setScheduledDateTime(new Date(target.getTime() - tzOffset).toISOString().slice(0, 16));
  };

  const handleSave = async () => {
    setError('');
    try {
      const finalStartDate = mode === 'now' 
        ? null 
        : (scheduledDateTime ? new Date(scheduledDateTime).toISOString() : null);
      await onSaveStartDate(finalStartDate);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update start date.');
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-all"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-6 sm:fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">{t('Task Start Time')}</h3>
              <p className="text-[11px] text-slate-500 line-clamp-1 max-w-[240px]">
                {task?.title || t('Set when this task will start')}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {error && (
            <div className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Start Display */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200/70 p-3.5 flex items-center justify-between">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {t('Current Schedule')}
              </span>
              <span className="text-xs font-bold text-slate-800">
                {task?.dateTime || 'Today • Just now'}
              </span>
            </div>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
              {task?.startDate ? t('Scheduled') : t('Immediate')}
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-700">
              {t('When should work on this task start?')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('now')}
                className={`flex items-center justify-center gap-2 rounded-2xl border py-3 px-3 text-xs font-bold transition ${
                  mode === 'now'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Clock size={15} />
                <span>{t('Start Immediately')}</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('scheduled')}
                className={`flex items-center justify-center gap-2 rounded-2xl border py-3 px-3 text-xs font-bold transition ${
                  mode === 'scheduled'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Calendar size={15} />
                <span>{t('Schedule for Later')}</span>
              </button>
            </div>
          </div>

          {/* Scheduled Details */}
          {mode === 'scheduled' && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 flex flex-col gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                  {t('Quick Presets')}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(1)}
                    className="rounded-xl border border-blue-200 bg-white py-2 text-[11px] font-semibold text-blue-800 hover:bg-blue-100/50 transition"
                  >
                    +1 {t('Hour')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(3)}
                    className="rounded-xl border border-blue-200 bg-white py-2 text-[11px] font-semibold text-blue-800 hover:bg-blue-100/50 transition"
                  >
                    +3 {t('Hours')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(0, true)}
                    className="rounded-xl border border-blue-200 bg-white py-2 text-[11px] font-semibold text-blue-800 hover:bg-blue-100/50 transition"
                  >
                    {t('Tomorrow')}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                  {t('Exact date & start time:')}
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-medium text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>

              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <span>ℹ️</span>
                {t('Reminders will stay paused and resume only when this time arrives.')}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            {t('Cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="flex-[2] rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/25 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <span>{t('Saving...')}</span>
            ) : (
              <>
                <Check size={16} />
                <span>{t('Update Start Time')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
