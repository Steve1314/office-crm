import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ChevronDown, Check, Paperclip, FileText, X, Eye, FileUp, Download, Calendar, Clock, User, Users, CheckSquare, Square, Search } from 'lucide-react';
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
  const availableMembers = teamMembers.length > 0 ? teamMembers : employees;

  const [assignmentMode, setAssignmentMode] = useState('single'); // 'single' | 'multiple'
  const [selectedAssignees, setSelectedAssignees] = useState(() => (availableMembers[0] ? [availableMembers[0]] : []));
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [assigneeError, setAssigneeError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('High');
  const [scheduleType, setScheduleType] = useState('immediate');
  const [scheduledDateTime, setScheduledDateTime] = useState('');

  const isSelected = (member) => {
    const mId = String(member.id || member._id || '').toLowerCase();
    const mName = String(member.name || '').trim().toLowerCase();
    return selectedAssignees.some((item) => {
      const itemId = String(item.id || item._id || '').toLowerCase();
      const itemName = String(item.name || '').trim().toLowerCase();
      return (mId && itemId && mId === itemId) || (mName && itemName && mName === itemName);
    });
  };

  const handleToggleMember = (member) => {
    setAssigneeError('');
    if (assignmentMode === 'single') {
      setSelectedAssignees([member]);
      setIsDropdownOpen(false);
      return;
    }

    if (isSelected(member)) {
      setSelectedAssignees((prev) => prev.filter((m) => {
        const mId = String(member.id || member._id || '').toLowerCase();
        const mName = String(member.name || '').trim().toLowerCase();
        const itemId = String(m.id || m._id || '').toLowerCase();
        const itemName = String(m.name || '').trim().toLowerCase();
        return !((mId && itemId && mId === itemId) || (mName && itemName && mName === itemName));
      }));
    } else {
      setSelectedAssignees((prev) => [...prev, member]);
    }
  };

  const handleSelectAll = () => {
    setAssigneeError('');
    setSelectedAssignees([...availableMembers]);
  };

  const handleClearAll = () => {
    setSelectedAssignees([]);
  };

  const filteredMembers = availableMembers.filter((member) => {
    if (!memberSearchQuery.trim()) return true;
    const q = memberSearchQuery.toLowerCase();
    const nameMatch = (member.name || '').toLowerCase().includes(q);
    const roleMatch = (member.role || '').toLowerCase().includes(q);
    return nameMatch || roleMatch;
  });

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

    if (selectedAssignees.length === 0) {
      setAssigneeError(t('Please select at least one person to assign this task.'));
      return;
    }
    setAssigneeError('');

    const finalStartDate = scheduleType === 'scheduled' && scheduledDateTime
      ? new Date(scheduledDateTime).toISOString()
      : null;

    const isSingle = selectedAssignees.length === 1;
    const primary = selectedAssignees[0];

    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim() || 'No description provided.',
      priority: priority,
      startDate: finalStartDate,
      assignedTo: isSingle ? primary.name : selectedAssignees.map((m) => m.name).join(', '),
      assignedToName: isSingle ? primary.name : selectedAssignees.map((m) => m.name).join(', '),
      assignedToId: isSingle ? (primary.id || primary._id || null) : null,
      assignees: selectedAssignees.map((m) => ({
        id: m.id || m._id || null,
        name: m.name
      })),
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
          
          {/* Assign To Section (Single Person & Multiple People) */}
          <div ref={dropdownRef} className="relative flex min-w-0 flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">{t('Assign To')}</label>
              
              {/* Segmented Mode Selector: Single vs Multiple */}
              <div className="flex items-center rounded-lg bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setAssignmentMode('single');
                    if (selectedAssignees.length > 1) {
                      setSelectedAssignees([selectedAssignees[0]]);
                    }
                  }}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    assignmentMode === 'single'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User size={13} />
                  <span>{t('Single')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAssignmentMode('multiple')}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    assignmentMode === 'multiple'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users size={13} />
                  <span>{t('Multiple')}</span>
                  {selectedAssignees.length > 1 && (
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-700">
                      {selectedAssignees.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Main Dropdown Button */}
            <div 
              className={`flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-900 transition hover:border-blue-300 ${
                assigneeError ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
              }`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="flex min-w-0 items-center gap-2.5">
                {assignmentMode === 'single' ? (
                  <>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">
                      {selectedAssignees[0]?.name ? selectedAssignees[0].name[0] : 'U'}
                    </div>
                    <span className="truncate font-medium">
                      {selectedAssignees[0] ? selectedAssignees[0].name : t('Select Team Member...')}
                    </span>
                    {selectedAssignees[0]?.role && (
                      <span className="hidden sm:inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                        {selectedAssignees[0].role}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-sm">
                      <Users size={15} />
                    </div>
                    <span className="truncate font-medium">
                      {selectedAssignees.length === 0
                        ? t('Select Team Members...')
                        : selectedAssignees.length === 1
                        ? `${selectedAssignees[0].name} (1 selected)`
                        : `${selectedAssignees.length} ${t('Team Members Selected')}`}
                    </span>
                  </>
                )}
              </div>
              <ChevronDown size={18} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Error Message */}
            {assigneeError && (
              <p className="text-xs font-medium text-rose-600">{assigneeError}</p>
            )}

            {/* Chips of Selected Members (Multiple Mode) */}
            {assignmentMode === 'multiple' && selectedAssignees.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                {selectedAssignees.map((member) => (
                  <span
                    key={member.id || member._id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/80 py-1 pl-1.5 pr-2 text-xs font-medium text-blue-900 transition hover:bg-blue-100"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                      {member.name ? member.name[0] : 'U'}
                    </span>
                    <span className="truncate max-w-[120px]">{member.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMember(member);
                      }}
                      className="ml-0.5 rounded-full p-0.5 text-blue-600 hover:bg-blue-200 hover:text-rose-600"
                      title={t('Remove')}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Multiple Mode Multi-Assignment Info Banner */}
            {assignmentMode === 'multiple' && selectedAssignees.length > 1 && (
              <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50/50 p-2.5 text-xs text-blue-800">
                <Users size={16} className="shrink-0 text-blue-600" />
                <span>
                  {t('Assigning to')} <strong>{selectedAssignees.length} {t('people')}</strong>: {t('An individual task copy will be sent to each person.')}
                </span>
              </div>
            )}

            {/* Dropdown Options Popup */}
            {isDropdownOpen && (
              <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl">
                {/* Search & Actions Bar inside Dropdown */}
                <div className="mb-2 flex flex-col gap-2">
                  <div className="relative flex items-center">
                    <Search size={14} className="absolute left-2.5 text-slate-400" />
                    <input
                      type="text"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none"
                      placeholder={t('Search team members...')}
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    {memberSearchQuery && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMemberSearchQuery('');
                        }}
                        className="absolute right-2 text-slate-400 hover:text-slate-600"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Quick Action Buttons for Multi-select */}
                  {assignmentMode === 'multiple' && (
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 pt-0.5 text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAll();
                          }}
                          className="font-semibold text-blue-600 hover:text-blue-700"
                        >
                          {t('Select All')} ({availableMembers.length})
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClearAll();
                          }}
                          className="font-medium text-slate-500 hover:text-slate-700"
                        >
                          {t('Clear')}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsDropdownOpen(false);
                        }}
                        className="rounded-md bg-blue-50 px-2.5 py-1 font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        {t('Done')}
                      </button>
                    </div>
                  )}
                </div>

                {filteredMembers.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    {t('No matching team members found.')}
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {filteredMembers.map((member) => {
                      const checked = isSelected(member);
                      return (
                        <div
                          key={member.id || member._id}
                          className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 py-2 transition ${
                            checked ? 'bg-blue-50/70 font-semibold text-blue-900' : 'hover:bg-slate-50 text-slate-800'
                          }`}
                          onClick={() => handleToggleMember(member)}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            {assignmentMode === 'multiple' && (
                              <div className="shrink-0 text-blue-600">
                                {checked ? (
                                  <CheckSquare size={17} className="text-blue-600" />
                                ) : (
                                  <Square size={17} className="text-slate-300" />
                                )}
                              </div>
                            )}

                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-sm">
                              {member.name ? member.name[0] : 'U'}
                            </div>

                            <div className="flex min-w-0 flex-col">
                              <span className="truncate text-xs font-medium text-slate-800">{member.name}</span>
                              <span className="text-[10px] text-slate-400">{member.role || 'Member'}</span>
                            </div>
                          </div>

                          {assignmentMode === 'single' && checked && (
                            <Check size={16} className="shrink-0 text-blue-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>
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
              {assignmentMode === 'multiple' && selectedAssignees.length > 1
                ? `${t('Assign Task to')} ${selectedAssignees.length} ${t('People')}`
                : t('Create & Assign Task')}
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
