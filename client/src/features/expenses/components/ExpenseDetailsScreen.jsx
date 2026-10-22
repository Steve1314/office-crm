import React, { useState } from 'react';
import { ArrowLeft, Download, Eye, Maximize2, FileText, Check, Trash2 } from 'lucide-react';
import ImageLightboxModal, { downloadFile } from '../../../components/common/ImageLightboxModal';
import { backIconButton, screenBody, screenFrame, screenHeader, screenHeaderGroup, screenTitle } from '../../../utils/tailwindClasses';
import { useLanguage } from '../../../contexts/useLanguage';

export default function ExpenseDetailsScreen({ 
  expense = {
    title: 'Notebook',
    amount: 120,
    date: '10 Oct 2026, 02:15 PM',
    addedBy: 'Amit Patel',
    imageUrl: '',
    proofImage: '',
    proofImages: []
  }, 
  onBack,
  onDeleteExpense
}) {
  const { t } = useLanguage();
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete expense "${expense?.title || 'Expense'}"?`)) {
      if (onDeleteExpense) {
        onDeleteExpense(expense?.id || expense?._id);
      }
      onBack();
    }
  };

  // Normalize proof images list (supports single proofImage and multiple proofImages array)
  const proofImagesList = (Array.isArray(expense?.proofImages) && expense.proofImages.length > 0)
    ? expense.proofImages
    : (expense?.proofImage ? [expense.proofImage] : []);

  const [activeProofIndex, setActiveProofIndex] = useState(0);
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    images: [],
    index: 0,
    title: 'Preview'
  });
  const [isDownloading, setIsDownloading] = useState(false);

  const activeProof = proofImagesList[activeProofIndex] || proofImagesList[0];

  // Open Lightbox for Item Image
  const handleOpenItemImage = () => {
    if (expense.imageUrl) {
      setLightboxState({
        isOpen: true,
        images: [{ url: expense.imageUrl, name: `${expense.title || 'item'}_photo.jpg`, title: `${expense.title} (Item Photo)` }],
        index: 0,
        title: `${expense.title} (Item Photo)`
      });
    }
  };

  // Open Lightbox for Proof Images
  const handleOpenProofLightbox = (idx = activeProofIndex) => {
    if (proofImagesList.length > 0) {
      setLightboxState({
        isOpen: true,
        images: proofImagesList.map((img, i) => ({
          url: img,
          name: `${expense.title || 'expense'}_receipt_${i + 1}.jpg`,
          title: `Receipt Proof #${i + 1}`
        })),
        index: idx,
        title: 'Receipt / Bill Proof'
      });
    }
  };

  // Download Active Proof
  const handleDownloadActiveProof = (e) => {
    e.stopPropagation();
    if (activeProof) {
      downloadFile(activeProof, `${expense.title || 'expense'}_receipt_${activeProofIndex + 1}.jpg`);
      setIsDownloading(true);
      setTimeout(() => setIsDownloading(false), 2000);
    }
  };

  // Download All Proofs
  const handleDownloadAllProofs = (e) => {
    e.stopPropagation();
    proofImagesList.forEach((img, i) => {
      setTimeout(() => {
        downloadFile(img, `${expense.title || 'expense'}_receipt_${i + 1}.jpg`);
      }, i * 300);
    });
    setIsDownloading(true);
    setTimeout(() => setIsDownloading(false), 2500);
  };

  return (
    <div className={screenFrame}>
      {/* 1. Header with Back Button and Delete Action */}
      <header className={screenHeader}>
        <div className={screenHeaderGroup}>
          <button 
            type="button" 
            className={backIconButton}
            onClick={onBack}
            aria-label="Go Back"
          >
            <ArrowLeft size={22} />
          </button>
          <h2 className={screenTitle}>{t('Expense Details')}</h2>
        </div>

        {onDeleteExpense && (
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-400/30 bg-red-500/15 text-red-300"
            onClick={handleDelete}
            title={t('Delete Expense')}
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={18} />
          </button>
        )}
      </header>

      {/* 2. Curved White Body */}
      <div className={screenBody} style={{ paddingBottom: '60px' }}>
        <div className="flex w-full flex-col gap-5">
          {/* Top Summary Card */}
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-center gap-4">
              {/* Item Photo with clickable View/Download */}
              {expense.imageUrl ? (
                <div 
                  className="relative h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl"
                  onClick={handleOpenItemImage}
                  title="Click to view & download item image"
                >
                  <img 
                    src={expense.imageUrl} 
                    alt={expense.title} 
                    className="h-full w-full object-cover"
                  />
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    background: 'rgba(0,0,0,0.65)',
                    borderRadius: '6px',
                    padding: '2px 4px',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Maximize2 size={10} />
                  </div>
                </div>
              ) : (
                <div 
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-600"
                >
                  {expense.title ? expense.title[0].toUpperCase() : 'E'}
                </div>
              )}

              <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2">
                <h3 className="min-w-0 break-words text-base font-bold text-slate-900 sm:text-lg">{expense.title}</h3>
                <span className="shrink-0 text-lg font-extrabold text-blue-700">₹ {Number(expense.amount).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
              <div className="flex flex-wrap gap-x-2">
                <span style={{ fontWeight: 600, color: '#475569' }}>{t('Date:')}</span>
                <span>{expense.date && expense.date.includes(',') ? expense.date : `${expense.date || 'Today'}, 02:15 PM`}</span>
              </div>
              <div className="flex flex-wrap gap-x-2">
                <span style={{ fontWeight: 600, color: '#475569' }}>{t('Added by:')}</span>
                <span>{expense.addedBy || 'Vivek'}</span>
              </div>
              {expense.imageUrl && !proofImagesList.includes(expense.imageUrl) && (
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-2">
                  <button
                    type="button"
                    onClick={handleOpenItemImage}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    <Eye size={14} />
                    <span>{t('View item photo')}</span>
                  </button>
                  <span style={{ color: '#cbd5e1' }}>•</span>
                  <button
                    type="button"
                    onClick={() => downloadFile(expense.imageUrl, `${expense.title}_photo.jpg`)}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    <Download size={14} />
                    <span>{t('Download item photo')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Proof Images Section */}
          <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Photos {proofImagesList.length > 1 ? `(${proofImagesList.length})` : ''}
                </h3>
              </div>

              {proofImagesList.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={proofImagesList.length > 1 ? handleDownloadAllProofs : handleDownloadActiveProof}
                    title="Download"
                  >
                    {isDownloading ? <Check size={13} color="#16a34a" /> : <Download size={13} />}
                    <span>{isDownloading ? t('Downloaded') : t('Download')}</span>
                  </button>
                </div>
              )}
            </div>

            {proofImagesList.length > 0 ? (
              <>
                {/* Large Active Proof Image Card (Click to open full view lightbox) */}
                <div 
                  className="relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-xl bg-slate-100 sm:aspect-[16/9]"
                  onClick={() => handleOpenProofLightbox(activeProofIndex)}
                  title="Click to view full size and zoom"
                >
                  <img 
                    src={activeProof} 
                    alt={`Proof ${activeProofIndex + 1}`} 
                    className="h-full w-full object-contain"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-slate-950/65 px-3 py-2 text-xs font-medium text-white">
                    <Maximize2 size={12} />
                    <span>{t('Tap to expand')} {proofImagesList.length > 1 ? `(${activeProofIndex + 1}/${proofImagesList.length})` : ''}</span>
                  </div>
                </div>

                {/* Thumbnails row if multiple proof images */}
                {proofImagesList.length > 1 && (
                  <div className="flex w-full flex-wrap gap-2">
                    {proofImagesList.map((imgSrc, idx) => (
                      <div
                        key={idx}
                        className={`h-16 w-16 cursor-pointer overflow-hidden rounded-lg border-2 ${idx === activeProofIndex ? 'border-blue-600' : 'border-transparent'}`}
                        onClick={() => setActiveProofIndex(idx)}
                        title={`Receipt photo ${idx + 1}`}
                      >
                        <img 
                          src={imgSrc} 
                          alt={`Photo ${idx + 1}`} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-9 text-center text-slate-500">
                <FileText size={28} style={{ opacity: 0.5, marginBottom: '6px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600 }}>No receipt uploaded for this expense.</div>
              </div>
            )}
          </div>

          {/* Bottom Actions: Back to Expenses and Delete Option */}
          <div className="flex w-full flex-col gap-2 pb-8 pt-1">
            <button
              type="button"
              className="min-h-12 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700"
              onClick={onBack}
            >
              Back to Expenses
            </button>

            {onDeleteExpense && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-rose-600 hover:bg-rose-50"
              >
                <Trash2 size={15} />
                <span>{t('Delete Expense')}</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Universal Fullscreen Lightbox Modal with Download */}
      <ImageLightboxModal
        isOpen={lightboxState.isOpen}
        images={lightboxState.images}
        initialIndex={lightboxState.index}
        title={lightboxState.title}
        onClose={() => setLightboxState({ ...lightboxState, isOpen: false })}
      />
    </div>
  );
}
