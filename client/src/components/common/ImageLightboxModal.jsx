import React, { useState, useEffect } from 'react';
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Check } from 'lucide-react';

export async function downloadFile(url, fileName = 'download.jpg') {
  try {
    if (url.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  } catch (err) {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export default function ImageLightboxModal({
  isOpen = false,
  images = [],
  initialIndex = 0,
  title = 'Image Preview',
  onClose
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  // Normalize image list
  const imageList = Array.isArray(images)
    ? images.map((item, idx) => {
        if (typeof item === 'string') {
          return { url: item, name: `${title}_${idx + 1}.jpg` };
        }
        return {
          url: item.url || item.src,
          name: item.name || `${title}_${idx + 1}.jpg`,
          title: item.title
        };
      })
    : images
    ? [{ url: images, name: `${title}.jpg` }]
    : [];

  if (!isOpen || imageList.length === 0) return null;

  const currentImg = imageList[currentIndex] || imageList[0];

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : imageList.length - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < imageList.length - 1 ? prev + 1 : 0));
  };

  const handleTriggerDownload = (e) => {
    e.stopPropagation();
    downloadFile(currentImg.url, currentImg.name || `proof_${Date.now()}.jpg`);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 11, 22, 0.92)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        animation: 'authFadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      {/* Top Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
          color: '#ffffff',
          userSelect: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, marginRight: '14px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div 
              style={{ 
                fontWeight: 700, 
                fontSize: '14.5px', 
                color: '#ffffff',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                wordBreak: 'break-word',
                lineHeight: 1.3
              }}
              title={currentImg.title || title}
            >
              {currentImg.title || title}
            </div>
            {imageList.length > 1 ? (
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                Photo {currentIndex + 1} of {imageList.length}
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                Tap outside to close
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Download Button */}
          <button
            type="button"
            onClick={handleTriggerDownload}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: downloadSuccess ? '#16a34a' : '#1e69ff',
              color: '#ffffff',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(30, 105, 255, 0.3)'
            }}
            title="Download this image"
          >
            {downloadSuccess ? <Check size={16} /> : <Download size={16} />}
            <span>{downloadSuccess ? 'Downloaded!' : 'Download'}</span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Image View Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '16px',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Prev Arrow */}
        {imageList.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10
            }}
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        {/* The Image */}
        <img
          src={currentImg.url}
          alt={currentImg.name || 'Preview'}
          style={{
            maxWidth: '100%',
            maxHeight: '75vh',
            objectFit: 'contain',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
            userSelect: 'none'
          }}
        />

        {/* Next Arrow */}
        {imageList.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10
            }}
            aria-label="Next image"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip (if multiple) */}
      {imageList.length > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '16px 20px 24px 20px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
            overflowX: 'auto',
            userSelect: 'none'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {imageList.map((img, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '10px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: idx === currentIndex ? '2.5px solid #1e69ff' : '2px solid rgba(255, 255, 255, 0.25)',
                opacity: idx === currentIndex ? 1 : 0.6,
                transform: idx === currentIndex ? 'scale(1.08)' : 'scale(1)',
                transition: 'all 0.18s ease',
                flexShrink: 0
              }}
            >
              <img
                src={img.url}
                alt={`Thumb ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
