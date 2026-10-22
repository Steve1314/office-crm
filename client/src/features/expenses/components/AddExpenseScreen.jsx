import React, { useState, useRef } from 'react';
import { ArrowLeft, Camera, X } from 'lucide-react';
import ImageLightboxModal from '../../../components/common/ImageLightboxModal';
import { compressImageFile } from '../../../utils/imageCompressor';
import { backIconButton, screenBody, screenFrame, screenHeader, screenHeaderGroup, screenTitle } from '../../../utils/tailwindClasses';
import { useLanguage } from '../../../contexts/useLanguage';

export default function AddExpenseScreen({ 
  onBack, 
  onSaveExpense,
  currentUser = { name: 'Vivek', role: 'Employee' }
}) {
  const { t } = useLanguage();
  const [itemName, setItemName] = useState('');
  const [amount, setAmount] = useState('');
  
  // Single unified photo list (item photos, bill receipts, proofs - all in one)
  const [photos, setPhotos] = useState([]);
  
  // Lightbox preview state
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    images: [],
    index: 0,
    title: 'Preview'
  });

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Upload Handlers (Supports multiple selection with automatic compression)
  const handlePhotoFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const compressedList = await Promise.all(
        Array.from(files).map((file) => compressImageFile(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.8 }))
      );
      setPhotos((prev) => [...prev, ...compressedList.filter(Boolean)]);
    } catch (err) {
      console.warn('Error compressing expense photo:', err);
    }

    e.target.value = '';
  };

  const handleRemovePhoto = (idxToRemove) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handlePreviewPhoto = (idx) => {
    setPreviewModal({
      isOpen: true,
      images: photos,
      index: idx,
      title: `Photo #${idx + 1}`
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!itemName.trim() || !amount) return;

    const newExpense = {
      id: Date.now().toString(),
      title: itemName.trim(),
      amount: parseFloat(amount),
      date: 'Today • Just now',
      addedBy: currentUser?.name || 'Vivek',
      userId: currentUser?.id || currentUser?._id || null,
      userName: currentUser?.name || 'Employee',
      imageUrl: photos.length > 0 ? photos[0] : null,
      proofImage: photos.length > 0 ? photos[0] : null,
      proofImages: photos
    };

    onSaveExpense(newExpense);
  };

  return (
    <div className={screenFrame}>
      {/* 1. Header with Back Button */}
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
          <h2 className={screenTitle}>{t('Add Expense')}</h2>
        </div>
      </header>

      {/* 2. Curved White Body */}
      <div className={screenBody} style={{ gap: '20px', paddingBottom: '200px' }}>
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
          
          {/* Item Name */}
          <div className="flex w-full flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">{t('Item / Description')}</label>
            <input 
              type="text"
              className="w-full"
              placeholder="e.g. Notebook, Lunch with client, Taxi fare"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
            />
          </div>

          {/* Amount (₹) */}
          <div className="flex w-full flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">{t('Amount (₹)')}</label>
            <input 
              type="number"
              className="w-full"
              placeholder="e.g. 250"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
            />
          </div>

          {/* Unified Photos & Receipts (Single Upload Section for all photos) */}
          <div className="flex w-full flex-col gap-2">
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="text-sm font-semibold text-slate-700">
                {t('Photos')} {photos.length > 0 && `(${photos.length})`}{' '}
                <span className="font-normal text-slate-400">({t('Optional')})</span>
              </label>
              {photos.length > 0 && (
                <span className="text-xs font-semibold text-blue-600">
                  Tap image to preview
                </span>
              )}
            </div>
            
            <div className="flex w-full flex-wrap gap-3">
              {photos.map((imgSrc, idx) => (
                <div 
                  key={idx} 
                  className="relative h-24 w-24 cursor-pointer overflow-hidden rounded-xl border border-slate-200"
                  onClick={() => handlePreviewPhoto(idx)}
                  title={`Tap to preview photo #${idx + 1}`}
                >
                  <img src={imgSrc} alt={`Photo ${idx + 1}`} className="h-full w-full object-cover" />
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    left: '3px',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#fff',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    padding: '1px 5px',
                    borderRadius: '4px'
                  }}>
                    #{idx + 1}
                  </div>
                  <button 
                    type="button" 
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/75 text-white"
                    onClick={(e) => { e.stopPropagation(); handleRemovePhoto(idx); }}
                    title="Remove photo"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}

              {/* Add Photo Button */}
              <button
                type="button"
                className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 text-blue-600 transition hover:border-blue-400 hover:bg-blue-100"
                onClick={() => cameraInputRef.current?.click()}
                title={t('Take Photo')}
              >
                <Camera size={26} />
                <span className="text-xs font-semibold">{t('Take Photo')}</span>
              </button>
              <button
                type="button"
                className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 text-blue-600 transition hover:border-blue-400 hover:bg-blue-100"
                onClick={() => fileInputRef.current?.click()}
                title={t('Choose from Gallery')}
              >
                <span className="text-xs font-semibold">{photos.length > 0 ? t('Add More') : t('Choose from Gallery')}</span>
              </button>
            </div>

            {/* Hidden multiple file input */}
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoFileChange}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handlePhotoFileChange}
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
            />
          </div>

          {/* Save Expense Button */}
          <div className="mb-8 mt-1">
            <button type="submit" className="min-h-12 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              {t('Save Expense')}
            </button>
          </div>

        </form>
      </div>

      {/* Lightbox Preview Modal */}
      <ImageLightboxModal
        isOpen={previewModal.isOpen}
        images={previewModal.images}
        initialIndex={previewModal.index}
        title={previewModal.title}
        onClose={() => setPreviewModal({ ...previewModal, isOpen: false })}
      />
    </div>
  );
}
