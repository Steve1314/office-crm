import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Clock, X, BellOff, Calendar, Check, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../../contexts/useLanguage';

const PRESET_DURATIONS = [
  { label: '10 min', minutes: 10, subtitle: 'Quick pause' },
  { label: '15 min', minutes: 15, subtitle: 'Short break' },
  { label: '30 min', minutes: 30, subtitle: 'Standard' },
  { label: '1 hour', minutes: 60, subtitle: 'Deep work' },
  { label: '2 hours', minutes: 120, subtitle: 'Later today' },
  { label: 'Tomorrow', type: 'tomorrow', subtitle: '9:00 AM' }
];

export default function SnoozeTaskModal({
  isOpen,
  taskTitle = '',
  onClose,
  onConfirmSnooze,
  isLoading = false,
  error = ''
}) {
  const { t } = useLanguage();
  const [selectedDuration, setSelectedDuration] = useState(15); // default 15 mins
  const [isCustom, setIsCustom] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(45);

  const calculateWakeUpTime = useMemo(() => {
    const now = new Date();
    if (selectedDuration === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return {
        dateStr: tomorrow.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
        timeStr: '9:00 AM',
        targetDate: tomorrow
      };
    }

    const mins = isCustom ? Math.max(1, Number(customMinutes) || 15) : Number(selectedDuration);
    const target = new Date(now.getTime() + mins * 60 * 1000);
    return {
      dateStr: target.toDateString() === now.toDateString() ? t('Today') : target.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      timeStr: target.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
      targetDate: target
    };
  }, [selectedDuration, isCustom, customMinutes, t]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedDuration === 'tomorrow') {
      onConfirmSnooze({ snoozedUntil: calculateWakeUpTime.targetDate.toISOString() });
    } else {
      const mins = isCustom ? Math.max(1, Number(customMinutes) || 15) : Number(selectedDuration);
      onConfirmSnooze({ durationMinutes: mins, snoozedUntil: calculateWakeUpTime.targetDate.toISOString() });
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <BellOff size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">{t('Snooze Task')}</h3>
              <p className="text-[11px] text-slate-500 line-clamp-1 max-w-[240px]">
                {taskTitle || t('Pause task reminders and alarms')}
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

        {error && (
          <div className="mx-5 mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-100">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Target wake up banner */}
          <div className="flex items-center justify-between rounded-2xl bg-amber-50/80 border border-amber-200/60 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Clock size={18} className="text-amber-600 shrink-0" />
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-700">
                  {t('Reminders Resume At')}
                </span>
                <span className="text-sm font-bold text-amber-950">
                  {calculateWakeUpTime.dateStr} • {calculateWakeUpTime.timeStr}
                </span>
              </div>
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2.5 block">
              {t('Choose how long to snooze:')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_DURATIONS.map((preset) => {
                const isSelected = !isCustom && selectedDuration === (preset.type || preset.minutes);
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setIsCustom(false);
                      setSelectedDuration(preset.type || preset.minutes);
                    }}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-center transition ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-500/20'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50/30'
                    }`}
                  >
                    <span className="text-xs font-bold">{preset.label}</span>
                    <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-amber-100' : 'text-slate-400'}`}>
                      {preset.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Duration Toggle */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3.5 flex flex-col gap-2.5">
            <div 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setIsCustom(!isCustom)}
            >
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar size={14} className="text-slate-500" />
                {t('Custom Minutes')}
              </span>
              <span className="text-[11px] font-medium text-blue-600">
                {isCustom ? t('Active') : t('Enter specific minutes')}
              </span>
            </div>

            {isCustom && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-sm font-bold text-slate-900 shadow-sm focus:border-amber-500 focus:outline-none"
                  placeholder="Minutes"
                />
                <span className="text-xs text-slate-600 font-medium">{t('minutes from now')}</span>
              </div>
            )}
          </div>
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
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-[2] rounded-xl bg-amber-500 hover:bg-amber-600 py-3 text-xs font-bold text-white shadow-md shadow-amber-500/25 transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <span>{t('Snoozing...')}</span>
            ) : (
              <>
                <BellOff size={15} />
                <span>{t('Snooze Reminders')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
