import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Check, 
  ChevronRight, 
  SlidersHorizontal, 
  Plus, 
  UserCheck, 
  Send, 
  Paperclip, 
  X,
  Clock,
  BellRing
} from 'lucide-react';
import { TaskItemsSkeleton } from '../../../components/common/Skeleton';
import { getTaskAssignerName } from '../utils/taskDisplay';
import { useLanguage } from '../../../contexts/useLanguage';

export default function TasksPage({
  tasks = [],
  users = [],
  currentUser = { name: 'Vivek', role: 'Employee' },
  isLoading = false,
  onBackToHome,
  onOpenCreateTask,
  onSnoozeTask,
  onSendTaskAlert,
  onSelectTask
}) {
  const { t } = useLanguage();
  // Dual Scope: Strictly 'my_tasks' (Assigned to Me) vs 'assigned_by_me' (Assigned by Me)
  const [scopeFilter, setScopeFilter] = useState('my_tasks');
  const [statusFilter, setStatusFilter] = useState('Pending'); // 'Pending', 'Completed'
  const [priorityFilter, setPriorityFilter] = useState('All'); // 'All', 'High', 'Medium', 'Low'
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [snoozingTaskId, setSnoozingTaskId] = useState(null);
  const [alertingTaskId, setAlertingTaskId] = useState(null);
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const currentUserName = (currentUser?.name || '').trim().toLowerCase();
  const currentUserEmail = (currentUser?.email || '').trim().toLowerCase();
  const isAdmin = ['admin', 'manager'].includes((currentUser?.role || '').toLowerCase()) ||
                  currentUserName.includes('admin') ||
                  currentUserEmail.includes('admin');

  // Robust User matching helper
  const matchUser = (targetName) => {
    if (!targetName) return false;
    const target = String(targetName).trim().toLowerCase();
    if (currentUserName && (target === currentUserName || target.includes(currentUserName) || currentUserName.includes(target))) {
      return true;
    }
    if (currentUserEmail && (target === currentUserEmail || target.includes(currentUserEmail))) {
      return true;
    }
    const currentId = String(currentUser?.id || currentUser?._id || '').toLowerCase();
    if (currentId && currentId === target) {
      return true;
    }
    if (isAdmin && (target.includes('admin') || target === 'admin' || target === 'vahlay')) {
      return true;
    }
    return false;
  };

  // 1. Partition Tasks strictly into the Two Tabs:
  // - "My Tasks": assigned directly to current user OR unassigned
  // - "Assigned by Me": assigned directly by current user OR if admin created/assigned to employee
  const isMyTask = (t) => {
    if (matchUser(t.assignedTo) || matchUser(t.assignedToName)) return true;
    if (currentUser?.id && (String(t.assignedTo) === String(currentUser.id) || String(t.assignedToId) === String(currentUser.id))) return true;
    if (currentUser?._id && (String(t.assignedTo) === String(currentUser._id) || String(t.assignedToId) === String(currentUser._id))) return true;
    if (!t.assignedTo && !t.assignedToName) return true;
    return false;
  };

  const isAssignedByMe = (t) => {
    if (matchUser(t.assignedBy) || matchUser(t.assignedByName)) return true;
    if (currentUser?.id && (String(t.assignedBy) === String(currentUser.id) || String(t.assignedById) === String(currentUser.id))) return true;
    if (currentUser?._id && (String(t.assignedBy) === String(currentUser._id) || String(t.assignedById) === String(currentUser._id))) return true;
    if (isAdmin && (t.assignedTo || t.assignedToName) && !isMyTask(t)) return true;
    if (isAdmin && !t.assignedBy && !t.assignedByName && (t.assignedTo || t.assignedToName)) return true;
    return false;
  };

  const myTasksList = tasks.filter(isMyTask);
  const assignedByMeList = tasks.filter(isAssignedByMe);

  // Active Scope Set (strictly the two tabs)
  const currentScopeTasks = scopeFilter === 'assigned_by_me' ? assignedByMeList : myTasksList;

  // 2. Status & Search Filtering within the active scope (Only Pending or Completed)
  const filteredTasks = currentScopeTasks.filter((t) => {
    // Status filter: strictly Pending or Completed
    if (statusFilter === 'Completed') {
      if (!t.completed) return false;
    } else {
      if (t.completed) return false;
    }

    // Priority filter
    if (priorityFilter !== 'All' && (t.priority || '').toLowerCase() !== priorityFilter.toLowerCase()) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (t.title || '').toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchAssignee = (t.assignedTo || '').toLowerCase().includes(q);
      const matchAssigner = getTaskAssignerName(t, users).toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAssignee && !matchAssigner) return false;
    }

    return true;
  });

  const activePendingCount = currentScopeTasks.filter(t => !t.completed).length;
  const activeCompletedCount = currentScopeTasks.filter(t => t.completed).length;

  const handleSnooze = async (taskId) => {
    if (!onSnoozeTask) return;
    setSnoozingTaskId(taskId);
    setActionError('');
    setActionMessage('');
    try {
      await onSnoozeTask(taskId);
    } catch (error) {
      setActionError(error.message || 'Could not snooze this task.');
    } finally {
      setSnoozingTaskId(null);
    }
  };

  const handleQuickAlert = async (taskId) => {
    if (!onSendTaskAlert) return;
    setAlertingTaskId(taskId);
    setActionError('');
    setActionMessage('');
    try {
      const response = await onSendTaskAlert(taskId);
      setActionMessage(response.message || 'Quick alert sent.');
    } catch (error) {
      setActionError(error.message || 'Could not send quick alert.');
    } finally {
      setAlertingTaskId(null);
    }
  };

  return (
    <div className="flex min-h-full w-full flex-1 flex-col bg-[#07152b] lg:bg-white">
      {/* 1. Header with Back Arrow and Action Buttons */}
      <header className="flex w-full shrink-0 items-center justify-between bg-[#07152b] px-4 pb-4 pt-[max(16px,env(safe-area-inset-top))] text-white sm:px-6 lg:px-9">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <button
            type="button"
            className="flex shrink-0 items-center justify-center rounded-lg p-1 text-white transition hover:bg-white/10"
            onClick={onBackToHome}
            aria-label="Go Back to Home"
          >
            <ArrowLeft size={22} />
          </button>
          <h2 className="truncate text-lg font-bold tracking-tight sm:text-xl">{t('Tasks')}</h2>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
            aria-label={t('Create Task')}
            onClick={onOpenCreateTask}
            title={t('Create Task')}
          >
            <Plus size={20} />
          </button>
          <button
            type="button"
            className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white transition ${showFilterPanel ? 'bg-blue-600' : 'bg-white/10 hover:bg-white/20'}`}
            aria-label="Filter"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            title={t('Search & Filters')}
            style={{ background: showFilterPanel ? '#1e69ff' : 'rgba(255, 255, 255, 0.08)' }}
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </header>

      {/* 2. White Curved Body */}
      <div className="flex min-h-0 w-full flex-1 flex-col gap-3 self-stretch rounded-t-[24px] bg-white px-3 pb-24 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] sm:gap-4 sm:rounded-t-[28px] sm:px-6 sm:pt-5 lg:mx-0 lg:max-w-none lg:rounded-none lg:px-9 lg:pb-9">

        {/* 1. PRIMARY DUAL SCOPE SWITCHER: Only My Tasks vs Tasks Assigned By Me */}
        <div className="mb-3 w-full">
          <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1">
            {/* My Tasks Tab */}
            <button
              type="button"
              className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition sm:gap-2 sm:px-3 sm:text-sm ${scopeFilter === 'my_tasks' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-900'}`}
              onClick={() => setScopeFilter('my_tasks')}
            >
              <UserCheck size={16} />
              <span>{t('My Tasks')}</span>
              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${scopeFilter === 'my_tasks' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {myTasksList.length}
              </span>
            </button>

            {/* Tasks Assigned by Me Tab */}
            <button
              type="button"
              className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition sm:gap-2 sm:px-3 sm:text-sm ${scopeFilter === 'assigned_by_me' ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-900'}`}
              onClick={() => setScopeFilter('assigned_by_me')}
            >
              <Send size={15} />
              <span>{t('Assigned by Me')}</span>
              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${scopeFilter === 'assigned_by_me' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {assignedByMeList.length}
              </span>
            </button>
          </div>
        </div>

        {/* Optional Search & Priority Filter Drawer */}
        {showFilterPanel && (
          <div className="mb-3 flex animate-fade-in flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder={t('Search tasks, title, employee...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer'
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>{t('Priority:')}</span>
              <div className="flex flex-wrap gap-2">
                {['All', 'High', 'Medium', 'Low'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityFilter === p ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600'}`}
                    onClick={() => setPriorityFilter(p)}
                  >
                    {t(p)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. STATUS TABS: Strictly Pending and Completed */}
        {actionError && (
          <div role="alert" style={{ color: '#b91c1c', background: '#fef2f2', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px', fontSize: '13px' }}>
            {actionError}
          </div>
        )}
        {actionMessage && (
          <div role="status" style={{ color: '#166534', background: '#f0fdf4', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px', fontSize: '13px' }}>
            {actionMessage}
          </div>
        )}
        <div className="mb-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition ${statusFilter === 'Pending' ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
            onClick={() => setStatusFilter('Pending')}
          >
            <span>{t('Pending')}</span>
            {activePendingCount > 0 && (
              <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{activePendingCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition ${statusFilter === 'Completed' ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
            onClick={() => setStatusFilter('Completed')}
          >
            <span>{t('Completed')}</span>
            {activeCompletedCount > 0 && (
              <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
                {activeCompletedCount}
              </span>
            )}
          </button>
        </div>

        {/* Tasks List or Skeleton */}
        {isLoading ? (
          <TaskItemsSkeleton count={4} />
        ) : (
          <div className="flex animate-fade-in flex-col gap-3">
            {filteredTasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8', fontSize: '14px', fontWeight: 500 }}>
                {t('No')} {t(statusFilter)} {t('tasks found')}
              </div>
            ) : (
              filteredTasks.map((task, index) => (
                <div
                  key={task.id}
                  className="flex min-w-0 items-center gap-2 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:gap-3 sm:p-4"
                  style={{ opacity: task.completed ? 0.78 : 1 }}
                >
                  {/* Circular Checkmark Button */}
                  <button
                    type="button"
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${task.completed ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}
                    onClick={() => onSelectTask && onSelectTask(task)}
                    title={task.completed ? t('View completed task') : (scopeFilter === 'my_tasks' ? t('Complete task with proof') : t('View task'))}
                    aria-label={task.completed ? t('View completed task') : (scopeFilter === 'my_tasks' ? t('Complete task with proof') : t('View task'))}
                    style={{ border: 0, padding: 0 }}
                  >
                    {task.completed
                      ? <Check size={18} strokeWidth={2.8} />
                      : <Clock size={17} strokeWidth={2.5} />}
                  </button>

                  {/* Details (Clickable to open Complete / Details screen) */}
                  <div
                    className="min-w-0 flex-1"
                    onClick={() => onSelectTask && onSelectTask(task)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="mb-1 flex min-w-0 items-center justify-between gap-2">
                      <span
                        className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900"
                        style={{ textDecoration: task.completed ? 'line-through' : 'none' }}
                      >
                        {task.title}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {task.attachments && task.attachments.length > 0 && (
                          <span className="task-attachment-badge" title={`${task.attachments.length} attachment(s)`}>
                            <Paperclip size={11} />
                            {task.attachments.length}
                          </span>
                        )}
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${task.priority.toLowerCase() === 'high' ? 'bg-red-100 text-red-600' : task.priority.toLowerCase() === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                          {t(task.priority)}
                        </span>
                      </div>
                    </div>

                    {/* Metadata: Dynamic based on Scope */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#64748b', marginTop: '3px', flexWrap: 'wrap' }}>
                      {scopeFilter === 'my_tasks' ? (
                        <span>{t('By:')} <strong style={{ color: '#0f172a' }}>{getTaskAssignerName(task, users)}</strong></span>
                      ) : scopeFilter === 'assigned_by_me' ? (
                        <>
                          {task.assignedToName || task.assignedTo ? (
                            <span>{t('Assigned to')} <strong style={{ color: '#1e69ff' }}>{task.assignedToName || task.assignedTo}</strong></span>
                          ) : null}
                          <span style={{ color: Number(task.snoozeCount) > 0 ? '#b45309' : '#64748b', fontWeight: 600 }}>
                            {t('Snoozed')} {Number(task.snoozeCount) || 0} {Number(task.snoozeCount) === 1 ? t('time') : t('times')}
                          </span>
                        </>
                      ) : (
                        <>
                          {task.assignedTo && <span>{t('To:')} <strong>{task.assignedTo}</strong></span>}
                          <span>{t('By:')} <strong>{getTaskAssignerName(task, users)}</strong></span>
                        </>
                      )}

                      {task.completed && (
                        <span style={{ color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          ✓ {t('Done')} {task.completedAt ? `${t('at')} ${task.completedAt}` : ''}
                        </span>
                      )}
                    </div>

                    <div className="mt-1 text-[11px] font-medium text-slate-400">{task.dateTime}</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                    {!task.completed && scopeFilter === 'my_tasks' && (
                      <button
                        type="button"
                        onClick={() => handleSnooze(task.id)}
                        disabled={snoozingTaskId === task.id}
                        title={t('Snooze reminders for 5 minutes')}
                        aria-label={t('Snooze reminders for 5 minutes')}
                        style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#64748b', background: 'transparent', border: 0, padding: '4px', fontSize: '10px', cursor: 'pointer', opacity: snoozingTaskId === task.id ? 0.5 : 1 }}
                      >
                        <Clock size={14} />
                        5m
                      </button>
                    )}
                    {!task.completed && scopeFilter === 'assigned_by_me' && (
                      <button
                        type="button"
                        onClick={() => handleQuickAlert(task.id)}
                        disabled={alertingTaskId === task.id}
                        title={t('Send a quick reminder to the assignee')}
                        aria-label={t('Send a quick reminder to the assignee')}
                        style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#1e69ff', background: 'transparent', border: 0, padding: '4px', fontSize: '10px', cursor: 'pointer', opacity: alertingTaskId === task.id ? 0.5 : 1 }}
                      >
                        <BellRing size={14} />
                        Alert
                      </button>
                    )}
                    <button
                      type="button"
                      className="flex items-center justify-center rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      onClick={() => onSelectTask && onSelectTask(task)}
                      aria-label={t('Open task details')}
                      style={{ cursor: 'pointer', border: 0 }}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}
