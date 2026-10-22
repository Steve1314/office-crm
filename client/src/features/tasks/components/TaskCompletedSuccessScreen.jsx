import React, { useState } from 'react';
import { Check, Clock, UserCheck, Download, Maximize2 } from 'lucide-react';
import ImageLightboxModal, { downloadFile } from '../../../components/common/ImageLightboxModal';
import { useLanguage } from '../../../contexts/useLanguage';

export default function TaskCompletedSuccessScreen({ 
  task = {
    title: 'Update website homepage',
    completedBy: 'Vivek',
    completedAt: '10:42 AM',
    proofImage: '',
    proofImages: []
  }, 
  employees = [],
  onBackToTasks 
}) {
  const { t } = useLanguage();
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    images: [],
    index: 0,
    title: 'Task Proof'
  });

  const taskTitle = task?.title || 'Update website homepage';

  // Format completed by name nicely (resolve ObjectId if needed)
  const resolveCompletedByName = () => {
    if (task?.completedByName && task.completedByName.trim()) {
      return task.completedByName;
    }
    const raw = task?.completedBy || task?.assignedToName || task?.assignedTo;
    if (!raw) return 'Employee';
    
    // If raw looks like a MongoDB ObjectId (24 hex characters), find in employees list
    if (typeof raw === 'string' && /^[0-9a-fA-F]{24}$/.test(raw) && Array.isArray(employees)) {
      const matched = employees.find(e => String(e._id || e.id) === raw);
      if (matched && matched.name) return matched.name;
      if (task?.assignedToName) return task.assignedToName;
    }
    return typeof raw === 'string' && /^[0-9a-fA-F]{24}$/.test(raw) 
      ? (task?.assignedToName || 'Employee') 
      : String(raw);
  };

  const completedBy = resolveCompletedByName();

  // Format completed date nicely (convert raw ISO string to friendly format)
  const formatCompletedAt = (dateVal) => {
    if (!dateVal) return 'Recently';
    const d = new Date(dateVal);
    if (!isNaN(d.getTime())) {
      const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${dateStr}, ${timeStr}`;
    }
    return String(dateVal);
  };

  const formattedCompletedAt = formatCompletedAt(task?.completedAt);

  // Normalize multiple proof images
  const proofImagesList = (Array.isArray(task?.proofImages) && task.proofImages.length > 0)
    ? task.proofImages
    : (task?.proofImage ? [task.proofImage] : []);

  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center justify-center overflow-y-auto bg-slate-50 p-3 sm:p-5">
      <div className="my-auto flex w-full max-w-sm flex-col rounded-3xl border border-slate-200 bg-white p-3.5 shadow-sm sm:max-w-md sm:p-5">
        
        {/* 1. Celebratory Confetti & Checkmark Header */}
        <div className="flex flex-col items-center text-center">
          
          {/* Compact Checkmark with Confetti Sprinkles */}
          <div className="relative flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
            {/* Top Yellow Ribbon */}
            <div className="absolute left-3 top-0.5 h-2 w-2 rotate-[25deg] rounded-sm bg-amber-500" />
            {/* Top Center Mint dot */}
            <div className="absolute left-1/2 -top-0.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-green-300" />
            {/* Top Blue Particle */}
            <div className="absolute right-3 top-1 h-1.5 w-2 -rotate-[30deg] rounded-sm bg-blue-500" />
            {/* Left Green Ribbon */}
            <div className="absolute -left-1 top-7 h-1.5 w-2.5 rotate-[35deg] rounded-sm bg-emerald-500" />
            {/* Right Red Ribbon */}
            <div className="absolute -right-1 top-8 h-1.5 w-2.5 -rotate-[40deg] rounded-sm bg-red-500" />
            {/* Bottom Mint dot */}
            <div className="absolute bottom-1 right-4 h-1.5 w-1.5 rounded-full bg-emerald-300" />

            {/* Center Green Badge */}
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 shadow-[0_6px_16px_rgba(34,197,94,0.32)] sm:h-16 sm:w-16">
              <Check size={28} color="#ffffff" strokeWidth={3.5} className="sm:hidden" />
              <Check size={34} color="#ffffff" strokeWidth={3.5} className="hidden sm:block" />
            </div>
          </div>

          {/* Headings */}
          <h2 className="mb-0.5 mt-1 text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
            {t('Task Completed!')}
          </h2>
          <p className="max-w-full truncate px-2 text-xs font-semibold text-slate-600 sm:text-sm">
            {taskTitle}
          </p>
        </div>

        {/* 2. White Details Card */}
        <div className="my-3 w-full rounded-2xl border border-slate-100 bg-slate-50/70 p-3 shadow-none sm:my-3.5 sm:p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-1">
            <div className="text-xs font-bold text-slate-800">
              {t('Proof Uploaded')} {proofImagesList.length > 1 && `(${proofImagesList.length})`}
            </div>
            {proofImagesList.length > 0 && (
              <span className="text-[11px] font-semibold text-green-600">
                {t('Tap photo to view')}
              </span>
            )}
          </div>

          {/* Proof Images Gallery */}
          {proofImagesList.length > 0 ? (
            <div className="mb-2.5 flex w-full items-center gap-2 overflow-x-auto pb-1">
              {proofImagesList.map((imgSrc, idx) => (
                <div 
                  key={idx}
                  onClick={() => setLightboxState({
                    isOpen: true,
                    images: proofImagesList.map((img, i) => ({
                      url: img,
                      name: `${taskTitle}_proof_${i + 1}.jpg`,
                      title: `Proof Photo #${i + 1}`
                    })),
                    index: idx,
                    title: 'Task Completion Proof'
                  })}
                  className={`relative h-[68px] sm:h-[76px] shrink-0 cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-sm ${proofImagesList.length === 1 ? 'w-32 sm:w-36' : 'w-[80px]'}`}
                  title="Tap to preview and download"
                >
                  <img 
                    src={imgSrc} 
                    alt={`Proof ${idx + 1}`} 
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-1 right-1 flex items-center rounded-md bg-black/65 px-1 py-0.5 text-white">
                    <Maximize2 size={9} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mb-2 text-xs italic text-slate-400">
              {t('No photo proof was attached to this task.')}
            </div>
          )}

          {/* Quick Download All Proofs Button if present */}
          {proofImagesList.length > 0 && (
            <div className="mb-2.5">
              <button
                type="button"
                onClick={() => {
                  proofImagesList.forEach((img, i) => {
                    setTimeout(() => {
                      downloadFile(img, `${taskTitle}_proof_${i + 1}.jpg`);
                    }, i * 300);
                  });
                }}
                className="inline-flex min-h-7 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-100"
              >
                <Download size={12} />
                <span>{t('Download')} {proofImagesList.length > 1 ? `${t('All Proofs')} (${proofImagesList.length})` : t('Proof Image')}</span>
              </button>
            </div>
          )}

          {/* Compact 2-column info for Completed By & Completed At */}
          <div className="grid grid-cols-2 gap-2 border-t border-slate-200/60 pt-2.5">
            <div className="flex min-w-0 items-center gap-2 rounded-xl bg-white p-2 border border-slate-100">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <UserCheck size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-medium text-slate-400 leading-tight">{t('Completed by')}</div>
                <div className="truncate text-xs font-bold text-slate-900" title={completedBy}>{completedBy}</div>
              </div>
            </div>

            <div className="flex min-w-0 items-center gap-2 rounded-xl bg-white p-2 border border-slate-100">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <Clock size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-medium text-slate-400 leading-tight">{t('Completed at')}</div>
                <div className="truncate text-xs font-bold text-slate-900" title={formattedCompletedAt}>{formattedCompletedAt}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bottom Button: Back to Tasks */}
        <div className="mt-1 w-full">
          <button
            type="button"
            onClick={onBackToTasks}
            className="min-h-11 w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 active:scale-[0.98]"
          >
            {t('Back to Tasks')}
          </button>
        </div>

        {/* Lightbox Modal */}
        <ImageLightboxModal
          isOpen={lightboxState.isOpen}
          images={lightboxState.images}
          initialIndex={lightboxState.index}
          title={lightboxState.title}
          onClose={() => setLightboxState({ ...lightboxState, isOpen: false })}
        />
      </div>
    </div>
  );
}
