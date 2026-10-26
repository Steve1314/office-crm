import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ChevronDown, Check, Paperclip, FileText, X, Eye, FileUp, Download, Calendar, Clock } from 'lucide-react';
import { downloadFile } from '../../../components/common/ImageLightboxModal';
import { compressImageFile } from '../../../utils/imageCompressor';
import { backIconButton, screenBody, screenFrame, screenHeader, screenHeaderGroup, screenTitle } from '../../../utils/tailwindClasses';
import { useLanguage } from '../../../contexts/useLanguage';

export default function CreateTaskScreen({ 
  onBack, 
  onSaveTask, 
  currentUser = { name: 'Admin', role: 'Admin' },
  employees = []
}) {
  const { t } = useLanguage();
  const currentUserIds = new Set(
    [currentUser?.id, currentUser?._id].filter(Boolean).map((id) => String(id).toLowerCase())
  );
  const currentUserEmail = String(currentUser?.email || '').trim().toLowerCase();
  const teamMembers = employees.filter((member) => {
    const memberIds = [member.id, member._id].filter(Boolean).map((id) => String(id).toLowerCase());
    const sharesId = memberIds.some((id) => currentUserIds.has(id));
    const sharesEmail = currentUserEmail
      && String(member.email || '').trim().toLowerCase() === currentUserEmail;
    if (currentUserIds.size || currentUserEmail) return !sharesId && !sharesEmail;
    return String(member.name || '').trim().toLowerCase() !== String(currentUser?.name || '').trim().toLowerCase();
  });

  const [selectedAssignee, setSelectedAssignee] = useState(() => teamMembers[0] || null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('High');
  const [scheduleType, setScheduleType] = useState('immediate');
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  const getDefaultScheduledTime = () => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  };
  
  // Attachments State (Images & PDFs)
  const [attachments, setAttachments] = useState([]);
  const [activePreviewAttachment, setActivePreviewAttachment] = useState(null);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // File Upload Handler
  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(async (file) => {
      const isImg = file.type.startsWith('image/');
      const isPdfDoc = file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');

      const formatSize = (bytes) => {
        if (!bytes) return '0 B';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
      };

      try {
        let finalDataUrl = '';
        if (isImg) {
          finalDataUrl = await compressImageFile(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.8 });
        } else {
          finalDataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          });
        }

        const newAttachment = {
          id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
          name: file.name,
          type: file.type || (isPdfDoc ? 'application/pdf' : 'application/octet-stream'),
          size: formatSize(file.size),
          isImage: isImg,
          isPdf: isPdfDoc,
          url: finalDataUrl
        };
        setAttachments((prev) => [...prev, newAttachment]);
      } catch (err) {
        console.warn('Error attaching file in CreateTaskScreen:', err);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (idToRemove) => {
    setAttachments((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalStartDate = scheduleType === 'scheduled' && scheduledDateTime
      ? new Date(scheduledDateTime).toISOString()
      : null;

    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim() || 'No description provided.',
      priority: priority,
      startDate: finalStartDate,
      assignedTo: selectedAssignee.name,
      assignedToName: selectedAssignee.name,
      assignedToId: selectedAssignee.id || selectedAssignee._id || null,
      assignedBy: currentUser?.name || 'Admin',
      assignedByName: currentUser?.name || 'Admin',
      assignedById: currentUser?.id || currentUser?._id || null,
      completed: false,
      attachments: attachments
    };

    onSaveTask(newTask);
  };

  return (
    <div className={screenFrame}>
      {/* 1. Header with Back Arrow */}
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
          <h2 className={screenTitle}>{t('Create Task')}</h2>
        </div>
      </header>

      {/* 2. White Curved Form Body */}
      <div className={screenBody} style={{ paddingBottom: '220px' }}>
        <form className="flex w-full flex-col gap-5" onSubmit={handleSubmit}>
          
          {/* Assign To */}
          <div ref={dropdownRef} className="relative flex min-w-0 flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">{t('Assign To')}</label>
            <div 
              className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 transition hover:border-blue-300"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {selectedAssignee?.name ? selectedAssignee.name[0] : 'U'}
                </div>
                <span className="truncate font-medium">
                  {selectedAssignee ? selectedAssignee.name : t('Select Team Member...')}
                </span>
              </div>
              <ChevronDown size={18} style={{ color: '#64748b' }} />
            </div>

            {/* Dropdown Options */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                {teamMembers.length === 0 ? (
                  <div style={{ padding: '14px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    {t('No other employees are available for task assignment.')}
                  </div>
                ) : (
                  teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-blue-50"
                      onClick={() => {
                        setSelectedAssignee(member);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                        {member.name ? member.name[0] : 'U'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <span className="truncate text-sm font-medium text-slate-800">{member.name}</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>{member.role || 'Member'}</span>
                      </div>
                      {selectedAssignee?.id === member.id && <Check size={16} color="#1e69ff" />}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">{t('Title')}</label>
            <input 
              type="text"
              placeholder={t('Prepare meeting room')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">{t('Description')}</label>
            <textarea
              placeholder={t('Clean meeting room, arrange chairs and check projector.')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Attachments Section (Images, PDFs) */}
          <div className="flex flex-col gap-2">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Paperclip size={15} color="#1e69ff" />
                <span>{t('Task Attachments (Image / PDF)')}</span>
              </label>
              <span className="text-xs font-medium text-slate-500">
                {attachments.length} {t('attached')}
              </span>
            </div>

            {/* Hidden File Input */}
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              accept="image/*,application/pdf,.pdf,.doc,.docx"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {/* Upload Drop Area */}
            <div 
              className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 px-4 py-6 text-center transition hover:border-blue-400 hover:bg-blue-50"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                <FileUp size={22} />
              </div>
              <div className="text-sm font-semibold text-slate-800">{t('Tap to browse images or PDF documents')}</div>
              <div className="text-xs text-slate-500">{t('Supports JPG, PNG, WEBP, and PDF up to 15MB')}</div>
            </div>

            {/* Attached Items List */}
            {attachments.length > 0 && (
              <div className="mt-3 flex w-full flex-col gap-2">
                {attachments.map((att) => (
                  <div key={att.id} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {att.isImage ? (
                        <img src={att.url} alt={att.name} className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <FileText size={20} />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-800" title={att.name}>
                          {att.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>{att.size}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold">
                            {att.isPdf ? 'PDF' : 'IMAGE'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                        onClick={() => setActivePreviewAttachment(att)}
                        title={t('Preview attachment')}
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
                        onClick={() => downloadFile(att.url, att.name)}
                        title={t('Download attachment')}
                      >
                        <Download size={15} />
                      </button>

                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50"
                        onClick={() => handleRemoveAttachment(att.id)}
                        title={t('Remove attachment')}
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Priority Tri-Buttons */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">{t('Priority')}</label>
            <div className="grid w-full grid-cols-3 gap-2">
              <button
                type="button"
                className={`min-h-11 rounded-xl border px-3 text-sm font-semibold transition ${priority === 'Low' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-emerald-50'}`}
                onClick={() => setPriority('Low')}
              >
                {t('Low')}
              </button>
              <button
                type="button"
                className={`min-h-11 rounded-xl border px-3 text-sm font-semibold transition ${priority === 'Medium' ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-amber-50'}`}
                onClick={() => setPriority('Medium')}
              >
                {t('Medium')}
              </button>
              <button
                type="button"
                className={`min-h-11 rounded-xl border px-3 text-sm font-semibold transition ${priority === 'High' ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-rose-50'}`}
                onClick={() => setPriority('High')}
              >
                {t('High')}
              </button>
            </div>
          </div>

          {/* Start Date & Time (When Task Starts) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <Calendar size={16} className="text-blue-600" />
                {t('When will this task start?')}
              </label>
              <span className="text-[11px] font-medium text-slate-500">
                {scheduleType === 'immediate' ? t('Starts immediately') : t('Scheduled for later')}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`min-h-11 rounded-xl border px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  scheduleType === 'immediate'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => setScheduleType('immediate')}
              >
                <Clock size={15} />
                {t('Start Immediately')}
              </button>
              <button
                type="button"
                className={`min-h-11 rounded-xl border px-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                  scheduleType === 'scheduled'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
                onClick={() => {
                  setScheduleType('scheduled');
                  if (!scheduledDateTime) {
                    setScheduledDateTime(getDefaultScheduledTime());
                  }
                }}
              >
                <Calendar size={15} />
                {t('Schedule for Later')}
              </button>
            </div>

            {scheduleType === 'scheduled' && (
              <div className="mt-1 rounded-xl border border-blue-100 bg-blue-50/50 p-3 flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-700">
                  {t('Select task start date & time:')}
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-medium text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required={scheduleType === 'scheduled'}
                />
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <span>ℹ️</span>
                  {t('Reminders & loud alerts will wait until this scheduled start time.')}
                </p>
              </div>
            )}
          </div>

          {/* Create Task Button */}
          <div className="mb-8 mt-1">
            <button type="submit" className="min-h-12 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              {t('Create Task')}
            </button>
          </div>

        </form>
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
            {/* Header */}
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

            {/* Content */}
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
                  <a
                    href={activePreviewAttachment.url}
                    target="_blank"
                    rel="noreferrer"
                    download={activePreviewAttachment.name}
                    style={{
                      display: 'inline-block',
                      marginTop: '16px',
                      padding: '8px 18px',
                      borderRadius: '10px',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: 600
                    }}
                  >
                    Open / Download PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
