import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Camera,
  X, 
  Sparkles, 
  Paperclip, 
  FileText, 
  Eye, 
  Download, 
  Clock, 
  User,
  Trash2,
  Calendar,
  BellOff
} from 'lucide-react';
import ImageLightboxModal, { downloadFile } from '../../../components/common/ImageLightboxModal';
import { compressImageFile } from '../../../utils/imageCompressor';
import { getTaskAssignerName } from '../utils/taskDisplay';
import { backIconButton, screenBody, screenFrame, screenHeader, screenHeaderGroup, screenTitle } from '../../../utils/tailwindClasses';
import { useLanguage } from '../../../contexts/useLanguage';
import SnoozeTaskModal from './SnoozeTaskModal';
import ChangeStartDateModal from './ChangeStartDateModal';

export default function CompleteTaskScreen({ 
  task = {
    id: '1',
    title: 'Office Cleaning',
    description: 'Clean meeting room and reception area.',
    priority: 'High',
    assignedTo: 'Riya Shah',
    assignedBy: 'Admin'
  },
  users = [],
  currentUser = { name: 'Vivek', role: 'Employee' },
  onBack, 
  onConfirmComplete,
  onSnoozeTask,
  onUpdateTaskStartDate,
  onDeleteTask
}) {
  const { t } = useLanguage();
  const [completionNotes, setCompletionNotes] = useState('');
  const [activePreviewAttachment, setActivePreviewAttachment] = useState(null);
  const [isSnoozeModalOpen, setIsSnoozeModalOpen] = useState(false);
  const [isChangeStartDateModalOpen, setIsChangeStartDateModalOpen] = useState(false);
  const [isUpdatingStartDate, setIsUpdatingStartDate] = useState(false);
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    images: [],
    index: 0,
    title: 'Task Proof'
  });
  
  // Real proof images (empty initially, uploaded by user)
  const [proofImages, setProofImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSnoozing, setIsSnoozing] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Check if current user is the assigner vs the assignee
  const curName = (currentUser?.name || '').trim().toLowerCase();
  const assignedToName = (task?.assignedToName || task?.assignedTo || '').toString().trim().toLowerCase();

  const userId = String(currentUser?.id || currentUser?._id || '');
  const assignedToId = String(task?.assignedToId || task?.assignedTo || '');
  const isAssignee = (userId && userId === assignedToId) || (curName && assignedToName === curName);
  // If not the assignee, they are the assigner/supervisor checking up on the task
  const isAssigner = !isAssignee;

  const handleAddImageClick = () => {
    if (proofImages.length >= 5) {
      alert(t('Maximum 5 proof images allowed.'));
      return;
    }
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5 - proofImages.length);
    if (files.length > 0) {
      try {
        const compressedImages = await Promise.all(files.map((file) => compressImageFile(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.8 })));
        setProofImages((prev) => [...prev, ...compressedImages.filter(Boolean)].slice(0, 5));
      } catch (err) {
        console.warn('Error compressing task proof image:', err);
      }
    }
    e.target.value = '';
  };

  const handleRemoveImage = (indexToRemove) => {
    setProofImages(proofImages.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (proofImages.length === 0) {
      setSubmitError(t('Add at least one proof image before completing this task.'));
      return;
    }
    if (onConfirmComplete) {
      setIsSubmitting(true);
      setSubmitError('');
      try {
        await onConfirmComplete(task.id || task._id, {
        completionNotes: completionNotes.trim(),
        proofImages: proofImages,
        completedByName: currentUser?.name || 'Employee'
        });
      } catch (error) {
        setSubmitError(error.message || t('Task completion failed. Please try again.'));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      if (onDeleteTask) {
        onDeleteTask(task.id);
      }
      if (onBack) {
        onBack();
      }
    }
  };

  const handleSnooze = () => {
    setIsSnoozeModalOpen(true);
  };

  const handleConfirmSnooze = async (options) => {
    if (!onSnoozeTask) return;
    setIsSnoozing(true);
    setSubmitError('');
    try {
      await onSnoozeTask(task.id || task._id, options);
      setIsSnoozeModalOpen(false);
    } catch (error) {
      setSubmitError(error.message || 'Could not snooze this task.');
    } finally {
      setIsSnoozing(false);
    }
  };

  const handleSaveStartDate = async (newStartDate) => {
    if (!onUpdateTaskStartDate) return;
    setIsUpdatingStartDate(true);
    try {
      await onUpdateTaskStartDate(task.id || task._id, newStartDate);
    } finally {
      setIsUpdatingStartDate(false);
    }
  };

  return (
    <div className={screenFrame}>
      {/* 1. Header with Back Button & Delete Action */}
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
          <h2 className={screenTitle}>
            {isAssigner ? t('Task Details') : t('Complete Task')}
          </h2>
        </div>

        {/* Delete button in header for Assigner */}
        {isAssigner && (
          <button
            type="button"
            onClick={handleDelete}
            title="Delete Task"
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
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
      <div className={screenBody} style={{ gap: '18px', paddingBottom: '60px' }}>
        
        {/* Task Summary Card */}
        <div className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Sparkles size={22} />
              </div>
              <div className="min-w-0">
                <h3 className="break-words text-base font-bold text-slate-900 sm:text-lg">{task.title || 'Office Task'}</h3>
                <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:gap-2">
                  <span className="shrink-0 text-xs font-semibold text-slate-500">{t('Description')}</span>
                  <span className="break-words text-sm text-slate-700">
                    {task.description || 'No description provided.'}
                  </span>
                </div>
              </div>
            </div>

            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${task.priority === 'Low' ? 'bg-emerald-50 text-emerald-700' : task.priority === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
              {t(task.priority || 'High')} {t('Priority')}
            </span>
          </div>

          <div className="my-4 border-t border-slate-100"></div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(task.assignedToName || task.assignedTo) && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500">{t('Assigned to')}</span>
                <span className="flex min-w-0 items-center gap-1.5 break-words text-sm font-medium text-slate-800">
                  <User size={12} />
                  {task.assignedToName || task.assignedTo}
                </span>
              </div>
            )}
            {getTaskAssignerName(task, users) !== 'Unknown user' && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-500">{t('Assigned by')}</span>
                <span className="break-words text-sm font-medium text-slate-800">{getTaskAssignerName(task, users)}</span>
              </div>
            )}
          </div>

          {/* Start Time Row - accessible to both assignee and assigner */}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <Calendar size={16} />
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {t('Task Start Time')}
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {task.dateTime || 'Today • Just now'}
                </span>
              </div>
            </div>
            {!task.completed && onUpdateTaskStartDate && (
              <button
                type="button"
                onClick={() => setIsChangeStartDateModalOpen(true)}
                className="rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition shadow-sm"
              >
                {t('Change')}
              </button>
            )}
          </div>

          {/* Task Attachments Section if present */}
          {task.attachments && task.attachments.length > 0 && (
            <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Paperclip size={14} color="#1e69ff" />
                <span>{t('Task Attachments')} ({task.attachments.length}):</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {task.attachments.map((att) => (
                  <div key={att.id} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
                    <div className="flex min-w-0 items-center gap-2">
                      {att.isImage ? (
                        <img src={att.url} alt={att.name} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                          <FileText size={18} />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium text-slate-800">
                          {att.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>{att.size}</span>
                          <span className="rounded-full bg-white px-2 py-0.5 font-semibold">
                            {att.isPdf ? 'PDF' : 'IMAGE'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white"
                        onClick={() => setActivePreviewAttachment(att)}
                        title={t('Preview attachment')}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white"
                        onClick={() => downloadFile(att.url, att.name)}
                        title={t('Download attachment')}
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ASSIGNER VIEW: Show Status Overview */}
        {isAssigner ? (
          <div className="assigner-actions-row" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Status Card */}
            <div className="w-full rounded-2xl border border-amber-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Clock size={20} />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{t('Pending Completion')}</div>
                  <div style={{ fontSize: '12px', color: '#b45309', fontWeight: 600 }}>
                    {t('Assigned to')} {task.assignedToName || task.assignedTo || t('team member')}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '12px', padding: '10px 12px', backgroundColor: '#fff7ed', borderRadius: '10px', color: '#9a3412', fontSize: '13px', fontWeight: 600 }}>
                {t('Snoozed')} {Number(task.snoozeCount) || 0} {Number(task.snoozeCount) === 1 ? t('time') : t('times')}
              </div>
            </div>

          </div>
        ) : (
          /* ASSIGNEE VIEW (or Assigner override): Show Completion form with notes and proofs */
          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
            
            {/* Notes Textarea */}
            <div className="flex w-full flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">{t('Add completion notes')}</label>
              <textarea
                placeholder={t('Provide notes on task completion...')}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Proof Images Gallery */}
            <div className="flex w-full flex-col gap-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className="text-sm font-semibold text-slate-700">{t('Add proof images (max 5)')}</label>
                {proofImages.length > 0 && (
                  <span className="text-xs font-semibold text-blue-600">
                    Tap image to preview & download
                  </span>
                )}
              </div>
              
              <div className="flex w-full flex-wrap gap-3">
                {proofImages.map((imgSrc, index) => (
                  <div 
                    key={index} 
                    className="relative h-24 w-24 cursor-pointer overflow-hidden rounded-xl border border-slate-200"
                    onClick={() => setLightboxState({
                      isOpen: true,
                      images: proofImages,
                      index: index,
                      title: 'Task Completion Proof'
                    })}
                    style={{ cursor: 'pointer' }}
                    title="Click to view & download"
                  >
                    <img src={imgSrc} alt={`Proof ${index + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/75 text-white"
                      onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }}
                      title="Remove image"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {/* Sleek, Beautiful UI Plus Button */}
                {proofImages.length < 5 && (
                  <>
                  <button
                    type="button"
                    className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 text-blue-600 transition hover:border-blue-400 hover:bg-blue-100"
                    onClick={() => cameraInputRef.current?.click()}
                    aria-label={t('Take Photo')}
                    title={t('Take Photo')}
                  >
                    <Camera size={24} strokeWidth={2.4} />
                    <span className="text-xs font-semibold">{t('Take Photo')}</span>
                  </button>
                  <button
                    type="button"
                    className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 text-blue-600 transition hover:border-blue-400 hover:bg-blue-100"
                    onClick={handleAddImageClick}
                    aria-label={t('Choose from Gallery')}
                    title={t('Choose from Gallery')}
                  >
                    <Plus size={24} strokeWidth={2.4} />
                    <span className="text-xs font-semibold">{t('Choose from Gallery')}</span>
                  </button>
                  </>
                )}
              </div>

              {/* Hidden file input for native camera or file upload */}
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*"
                multiple
                style={{ display: 'none' }} 
                onChange={handleFileChange}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            {/* Mark Complete Action Button */}
            <div className="mb-8 mt-1">
              {submitError && (
                <div role="alert" className="mb-3 rounded-xl bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                  {submitError}
                </div>
              )}
              <button type="submit" className="min-h-12 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting}>
                {isSubmitting ? t('Submitting...') : t('Mark Complete with Proof')}
              </button>
              {onSnoozeTask && (
                <button
                  type="button"
                  onClick={handleSnooze}
                  disabled={isSubmitting || isSnoozing}
                  className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <BellOff size={16} className="text-amber-600" />
                  <span>{isSnoozing ? t('Snoozing...') : t('Snooze Task...')}</span>
                </button>
              )}
            </div>

          </form>
        )}

      </div>

      {/* Attachment Preview Modal */}
      {activePreviewAttachment && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setActivePreviewAttachment(null)}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '92%',
              width: '400px',
              maxHeight: '90vh',
              maxHeight: '90dvh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 'calc(100% - 30px)' }}>
                {activePreviewAttachment.name}
              </div>
              <button
                type="button"
                onClick={() => setActivePreviewAttachment(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '16px', textAlign: 'center' }}>
              {activePreviewAttachment.isImage ? (
                <div>
                  <img 
                    src={activePreviewAttachment.url} 
                    alt={activePreviewAttachment.name} 
                    style={{ width: '100%', maxHeight: '340px', objectFit: 'contain', borderRadius: '12px' }} 
                  />
                  <div style={{ marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => downloadFile(activePreviewAttachment.url, activePreviewAttachment.name)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: '10px',
                        backgroundColor: '#1e69ff',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      <Download size={15} />
                      <span>Download Image</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '24px 12px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '16px', backgroundColor: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                    <FileText size={34} />
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                    {activePreviewAttachment.name}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px' }}>
                    PDF Document • {activePreviewAttachment.size}
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadFile(activePreviewAttachment.url, activePreviewAttachment.name)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginTop: '16px',
                      padding: '8px 18px',
                      borderRadius: '10px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Download size={15} />
                    <span>Download PDF</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Universal Lightbox Modal */}
      <ImageLightboxModal
        isOpen={lightboxState.isOpen}
        images={lightboxState.images}
        initialIndex={lightboxState.index}
        title={lightboxState.title}
        onClose={() => setLightboxState({ ...lightboxState, isOpen: false })}
      />

      {/* Snooze Options Modal */}
      <SnoozeTaskModal
        isOpen={isSnoozeModalOpen}
        taskTitle={task.title}
        isLoading={isSnoozing}
        onClose={() => setIsSnoozeModalOpen(false)}
        onConfirmSnooze={handleConfirmSnooze}
      />

      {/* Change Start Date Modal */}
      <ChangeStartDateModal
        isOpen={isChangeStartDateModalOpen}
        task={task}
        isLoading={isUpdatingStartDate}
        onClose={() => setIsChangeStartDateModalOpen(false)}
        onSaveStartDate={handleSaveStartDate}
      />

    </div>
  );
}
