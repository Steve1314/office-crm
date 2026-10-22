import React, { useState } from 'react';
import {
  Bell,
  ArrowRight,
  CheckSquare,
  Wallet,
  Sparkles,
  Package,
  CheckCircle2,
  Clock,
  ChevronRight,
  Plus,
  Receipt,
  Menu,
  X,
  Home,
  ClipboardList,
  User
} from 'lucide-react';
import { MetricCardsSkeleton, TaskItemsSkeleton } from '../../../components/common/Skeleton';
import logoImg from '../../../assets/images/logo.png';
import { useLanguage } from '../../../contexts/useLanguage';

export default function DashboardHome({
  user = { name: 'User', role: 'Employee' },
  tasks = [],
  expenses = [],
  isLoading = false,
  onNavigateTab,
  onOpenTaskDetails,
  onOpenAddExpense,
  onOpenCreateTask
}) {
  const { t } = useLanguage();
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Match tasks assigned to current user (ONLY pending tasks; completed tasks removed from recents)
  const userMyTasks = tasks.filter(t => {
    if (t.completed) return false;
    if (!t.assignedTo && !t.assignedToName) return true;
    const target = (t.assignedToName || t.assignedTo || '').toLowerCase();
    const curr = (user?.name || '').toLowerCase();
    const currId = String(user?.id || user?._id || '').toLowerCase();
    const targetId = String(t.assignedToId || t.assignedTo || '').toLowerCase();
    if (currId && targetId && currId === targetId) return true;
    return target === curr || target.includes(curr) || curr.includes(target);
  });

  // Filter tasks based on priority
  const filteredTasks = userMyTasks.filter((t) => {
    if (priorityFilter === 'All') return true;
    return (t.priority || '').toLowerCase() === priorityFilter.toLowerCase();
  });

  // Calculate total expense amount
  const totalExpense = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  // Icon selector based on category or task type
  const getTaskIcon = (task) => {
    if (task.iconType === 'cleaning') {
      return (
        <div className="mr-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
          <Sparkles size={20} />
        </div>
      );
    }
    if (task.iconType === 'stationery') {
      return (
        <div className="mr-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Package size={20} />
        </div>
      );
    }
    if (task.completed) {
      return (
        <div className="mr-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 size={20} />
        </div>
      );
    }
    return (
      <div className="mr-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <Clock size={20} />
      </div>
    );
  };

  return (
    <div className="relative flex min-h-full w-full flex-1 flex-col bg-[#07152b] lg:bg-white">
      {/* 1. Dark Navy Top Header */}
      <header className="flex w-full shrink-0 items-center justify-between bg-[#07152b] px-4 pb-4 pt-[max(16px,env(safe-area-inset-top))] text-white sm:px-6 lg:px-9">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <button
            type="button"
            className="flex shrink-0 items-center justify-center rounded-lg p-1.5 text-white lg:hidden"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open Navigation Menu"
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px',
              borderRadius: '8px',
              flexShrink: 0
            }}
          >
            <Menu size={22} />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/25 bg-slate-800 shadow-md sm:h-12 sm:w-12">
              <span style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>
                {user.name?.trim()?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <h2 className="truncate text-base font-bold tracking-tight sm:text-lg">{t('Hello, ')}{user.name}</h2>
              <span className="w-fit rounded-full border border-emerald-400/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 sm:text-xs">{user.role || 'Employee'}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20 sm:h-11 sm:w-11"
            aria-label="Notifications"
            onClick={() => alert('Notifications: All background push notifications will arrive here & on your phone lock screen!')}
          >
            <Bell size={20} />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-[1.5px] border-[#07152b] bg-red-500"></span>
          </button>
        </div>
      </header>

      {/* 2. White Curved Main Content Area */}
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4 self-stretch rounded-t-[24px] bg-white px-3 pb-24 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] sm:rounded-t-[28px] sm:px-6 sm:pt-5 lg:mx-0 lg:max-w-none lg:rounded-none lg:px-9 lg:pb-9">

        {/* Metric Cards Grid */}
        {isLoading ? (
          <MetricCardsSkeleton />
        ) : (
          <div className="grid w-full grid-cols-2 gap-2.5 sm:gap-3">
            {/* My Tasks Card */}
            <div
              className="flex min-h-28 min-w-0 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-100 p-3 transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-32 sm:p-4"
              onClick={() => onNavigateTab('tasks')}
            >
              <div>
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white sm:h-9 sm:w-9">
                  <CheckSquare size={18} />
                </div>
                <div className="mb-1 truncate text-xs font-semibold text-slate-600">My Tasks</div>
                <div className="mb-1 truncate text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">{userMyTasks.length}</div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-blue-600">
                <span>{t('View')}</span>
                <ArrowRight size={14} />
              </div>
            </div>

            {/* My Expenses Card */}
            <div
              className="flex min-h-28 min-w-0 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 transition hover:-translate-y-0.5 hover:shadow-md sm:min-h-32 sm:p-4"
              onClick={() => onNavigateTab('expenses')}
            >
              <div>
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white sm:h-9 sm:w-9">
                  <Wallet size={18} />
                </div>
                <div className="mb-1 truncate text-xs font-semibold text-slate-600">My Expenses</div>
                <div className="mb-1 truncate text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">₹ {totalExpense.toLocaleString('en-IN')}</div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-blue-600">
                <span>{t('View')}</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        )}

        {/* 3. Recent Tasks Section */}
        <section className="animate-fade-up delay-2">
          <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-extrabold tracking-tight text-slate-900">{t('Recent Tasks')}</h3>
          </div>

          {/* Priority Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['All', 'High', 'Medium', 'Low'].map((p) => (
              <button
                key={p}
                type="button"
                className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition ${priorityFilter === p ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                onClick={() => setPriorityFilter(p)}
              >
                {t(p)}
              </button>
            ))}
          </div>

          {/* Task List or Skeleton */}
          {isLoading ? (
            <TaskItemsSkeleton count={3} />
          ) : (
            <div className="mt-4 flex flex-col gap-3">
              {filteredTasks.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-400">
                  {t('No tasks under ')}{t(priorityFilter)}{t(' priority.')}
                </div>
              ) : (
                filteredTasks.map((task, index) => (
                  <div
                    key={task.id}
                    className="flex min-w-0 cursor-pointer items-center rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-4"
                    onClick={() => onOpenTaskDetails && onOpenTaskDetails(task)}
                  >
                    {getTaskIcon(task)}

                    <div className="min-w-0 flex-1">
                    <div className="mb-1 flex min-w-0 items-center justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900">{task.title}</span>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${task.priority.toLowerCase() === 'high' ? 'bg-red-100 text-red-600' : task.priority.toLowerCase() === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                          {t(task.priority)}
                        </span>
                      </div>
                    <div className="mb-1 truncate text-xs text-slate-500">{task.description}</div>
                    <div className="text-[11px] font-medium text-slate-400">{task.dateTime}</div>
                    </div>

                    <div className="ml-2 flex items-center text-slate-400">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

      </div>

      {/* Floating Speed Dial Action Button */}
      <div className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-4 z-30 flex flex-col items-end gap-3 lg:hidden">
        {isFabOpen && (
          <div className="mb-1 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl">
            <div
              className="flex cursor-pointer items-center gap-2"
              onClick={() => {
                setIsFabOpen(false);
                if (onOpenCreateTask) onOpenCreateTask();
              }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckSquare size={15} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{t('Add Task')}</span>
            </div>

            <div
              className="flex cursor-pointer items-center gap-2"
              onClick={() => {
                setIsFabOpen(false);
                if (onOpenAddExpense) onOpenAddExpense();
              }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={15} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{t('Add Expense')}</span>
            </div>
          </div>
        )}

        <button
          type="button"
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 ${isFabOpen ? 'rotate-45' : ''}`}
          onClick={() => setIsFabOpen(!isFabOpen)}
          aria-label="Quick Actions"
          title="Quick Actions"
        >
          <Plus size={26} strokeWidth={2.6} />
        </button>
      </div>

      {/* Slide-out Mobile Navigation Drawer (For Mobile/Tablet screens) */}
      {isDrawerOpen && typeof window !== 'undefined' && window.innerWidth < 1025 && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            animation: 'authFadeIn 0.2s ease-out'
          }}
          onClick={() => setIsDrawerOpen(false)}
        >
          <div 
            style={{
              width: '280px',
              maxWidth: '85vw',
              height: '100%',
              backgroundColor: '#08152b',
              padding: '24px 18px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '4px 0 32px rgba(0, 0, 0, 0.5)',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header with Company Logo */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '18px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ 
                  width: '42px', 
                  height: '42px', 
                  borderRadius: '12px', 
                  background: 'rgba(255, 255, 255, 0.08)', 
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                  overflow: 'hidden',
                  padding: '3px',
                  flexShrink: 0
                }}>
                  <img 
                    src={logoImg} 
                    alt="Office CRM Logo" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'contain', 
                      borderRadius: '8px' 
                    }} 
                  />
                </div>
                <div>
                  <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '16px', letterSpacing: '-0.2px' }}>Office CRM</div>
                  <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 500 }}>Menu</div>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsDrawerOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '6px', cursor: 'pointer', borderRadius: '8px' }}
                aria-label="Close Menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* User Profile Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 10px', margin: '14px 0', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e293b', color: '#fff', fontWeight: 700 }}>
                {user.name?.trim()?.charAt(0)?.toUpperCase() || 'U'}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 600 }}>{user.role}</span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => { setIsDrawerOpen(false); onNavigateTab('home'); }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', border: 'none', background: '#1e69ff', color: '#ffffff', fontWeight: 700, fontSize: '14px', cursor: 'pointer', textAlign: 'left' }}
              >
                <Home size={18} />
                <span>{t('Dashboard')}</span>
              </button>

              <button
                type="button"
                onClick={() => { setIsDrawerOpen(false); onNavigateTab('tasks'); }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', border: 'none', background: 'transparent', color: '#cbd5e1', fontWeight: 600, fontSize: '14px', cursor: 'pointer', textAlign: 'left' }}
              >
                <ClipboardList size={18} />
                <span>{t('Tasks')} ({userMyTasks.length})</span>
              </button>

              <button
                type="button"
                onClick={() => { setIsDrawerOpen(false); onNavigateTab('expenses'); }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', border: 'none', background: 'transparent', color: '#cbd5e1', fontWeight: 600, fontSize: '14px', cursor: 'pointer', textAlign: 'left' }}
              >
                <Wallet size={18} />
                <span>{t('Expenses')}</span>
              </button>

              <button
                type="button"
                onClick={() => { setIsDrawerOpen(false); onNavigateTab('profile'); }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', border: 'none', background: 'transparent', color: '#cbd5e1', fontWeight: 600, fontSize: '14px', cursor: 'pointer', textAlign: 'left' }}
              >
                <User size={18} />
                <span>{t('Profile')}</span>
              </button>
            </nav>

            {/* Quick Action in Drawer */}
            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  if (onOpenCreateTask) onOpenCreateTask();
                }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.15)', background: 'rgba(255, 255, 255, 0.06)', color: '#ffffff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                <Plus size={16} />
                <span>{t('New Task')}</span>
              </button>
              {onOpenAddExpense && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenAddExpense();
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '10px', border: '1px solid #10b981', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                >
                  <Plus size={16} />
                  <span>{t('Add Expense')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
