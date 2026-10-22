import React, { useState } from 'react';
import { 
  Menu, 
  ChevronDown, 
  Users, 
  GitPullRequest, 
  Receipt, 
  Wallet, 
  CheckCircle2, 
  Clock,
  ChevronRight, 
  Plus, 
  CheckSquare,
  X,
  Home,
  ClipboardList,
  Building,
  User as UserIcon
} from 'lucide-react';
import { Skeleton, TaskItemsSkeleton } from '../../../components/common/Skeleton';
import logoImg from '../../../assets/images/logo.png';
import { useLanguage } from '../../../contexts/useLanguage';

export default function AdminDashboard({ 
  user = { name: 'Admin', role: 'Admin' },
  tasks = [],
  expenses = [],
  allExpenses = [],
  activeExpenses = [],
  isLoading = false,
  onNavigateTab, 
  onViewAllTasks, 
  onOpenTaskDetails,
  onOpenIssueMoney,
  onOpenCreateTask,
  onOpenAddExpense,
  issuedTotal = 0,
  activeIssuedTotal = 0,
  totalEmployees = 0
}) {
  const { t } = useLanguage();
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const allExpensesList = allExpenses && allExpenses.length > 0 ? allExpenses : expenses;
  const totalExpenseAmount = allExpensesList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalIssuedAmount = Number(issuedTotal) || 0;
  const netBalance = totalIssuedAmount - totalExpenseAmount;

  const totalTasks = tasks.length;
  const recentTasks = tasks.filter(t => !t.completed).slice(0, 3);

  const getTaskIconClass = (task) => {
    const p = (task.priority || 'Low').toLowerCase();
    if (p === 'high') return 'red';
    if (p === 'medium') return 'orange';
    return 'green';
  };

  return (
    <div className="relative flex min-h-full w-full flex-1 flex-col bg-[#07152b] lg:bg-white">
      {/* 1. Header with Hamburger Menu and Admin Profile */}
      <header className="flex w-full shrink-0 items-center justify-between bg-[#07152b] px-4 pb-4 pt-[max(16px,env(safe-area-inset-top))] text-white sm:px-6 lg:px-9">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button 
            type="button" 
            className="flex shrink-0 items-center justify-center rounded-lg p-1.5 text-white lg:hidden" 
            aria-label="Navigation Menu" 
            onClick={() => {
              if (window.innerWidth < 1025) {
                setIsDrawerOpen(true);
              }
            }}
          >
            <Menu size={24} />
          </button>
          <h2 className="truncate text-lg font-bold tracking-tight sm:text-xl">{t('Dashboard')}</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" className="flex min-w-0 items-center gap-2 rounded-xl p-1.5 text-left transition hover:bg-white/10" onClick={() => onNavigateTab('profile')} title="View Profile">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold">{user.name?.trim()?.charAt(0)?.toUpperCase() || 'U'}</span>
            <div className="hidden min-w-0 flex-col sm:flex">
              <div className="flex items-center gap-1 text-sm font-bold">
                <span>{user.name}</span>
                <ChevronDown size={14} />
              </div>
              <span className="text-xs text-slate-400">{user.role === 'Admin' ? 'Administrator' : user.role}</span>
            </div>
          </button>
        </div>
      </header>

      {/* Slide-out Mobile Navigation Drawer (Only on Mobile/Tablet screens) */}
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
              borderRight: '1px solid rgba(255, 255, 255, 0.08)'
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
              <div>
                <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '14px' }}>{user.name}</div>
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
                <span>{t('Tasks')}</span>
              </button>

              <button
                type="button"
                onClick={() => { setIsDrawerOpen(false); onNavigateTab('users'); }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', border: 'none', background: 'transparent', color: '#cbd5e1', fontWeight: 600, fontSize: '14px', cursor: 'pointer', textAlign: 'left' }}
              >
                <Users size={18} />
                <span>{t('Team Members')}</span>
              </button>

              <button
                type="button"
                onClick={() => { setIsDrawerOpen(false); onNavigateTab('profile'); }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', border: 'none', background: 'transparent', color: '#cbd5e1', fontWeight: 600, fontSize: '14px', cursor: 'pointer', textAlign: 'left' }}
              >
                <UserIcon size={18} />
                <span>{t('My Profile')}</span>
              </button>
            </nav>

            {/* Quick Actions in Drawer */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => { setIsDrawerOpen(false); onOpenCreateTask(); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '12px', border: 'none', background: 'rgba(30, 105, 255, 0.2)', color: '#60a5fa', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                <Plus size={16} />
                <span>{t('Create Task')}</span>
              </button>

              <button
                type="button"
                onClick={() => { setIsDrawerOpen(false); onOpenIssueMoney(); }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', borderRadius: '12px', border: 'none', background: 'rgba(217, 119, 6, 0.2)', color: '#fbbf24', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                <Plus size={16} />
                <span>{t('Issue Money')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Curved White Body */}
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4 self-stretch rounded-t-[24px] bg-white px-3 pb-24 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] sm:rounded-t-[28px] sm:px-6 sm:pt-5 lg:mx-0 lg:max-w-none lg:rounded-none lg:px-9 lg:pb-9">

        {/* 2x2 Metric Cards Grid */}
        {isLoading ? (
          <div className="grid w-full grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex min-h-[105px] w-full flex-col items-start rounded-2xl border border-slate-100 bg-slate-50 p-3 sm:p-4">
                <Skeleton width="36px" height="36px" borderRadius="10px" />
                <Skeleton width="65%" height="12px" style={{ marginTop: '8px' }} />
                <Skeleton width="45%" height="20px" borderRadius="6px" style={{ marginTop: '4px' }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid w-full grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            {/* Card 1: Total Employees */}
            <div className="flex min-h-28 min-w-0 cursor-pointer flex-col items-start overflow-hidden rounded-2xl border border-cyan-100 bg-cyan-50 p-3 sm:p-4 transition hover:shadow-md" onClick={() => onNavigateTab('users')}>
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500 text-white sm:h-10 sm:w-10">
                <Users size={20} />
              </div>
              <span className="truncate text-xs font-semibold text-slate-600">{t('Total Employees')}</span>
              <span className="truncate text-xl sm:text-2xl font-extrabold text-slate-900">{totalEmployees}</span>
            </div>

            {/* Card 2: Total Tasks */}
            <div className="flex min-h-28 min-w-0 cursor-pointer flex-col items-start overflow-hidden rounded-2xl border border-amber-100 bg-amber-50 p-3 sm:p-4 transition hover:shadow-md" onClick={() => onNavigateTab('tasks')}>
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white sm:h-10 sm:w-10">
                <GitPullRequest size={20} />
              </div>
              <span className="truncate text-xs font-semibold text-slate-600">{t('Total Tasks')}</span>
              <span className="truncate text-xl sm:text-2xl font-extrabold text-slate-900">{totalTasks}</span>
            </div>

            {/* Card 3: Total Expenses */}
            <div className="flex min-h-28 min-w-0 cursor-pointer flex-col items-start overflow-hidden rounded-2xl border border-green-100 bg-green-50 p-3 sm:p-4 transition hover:shadow-md" onClick={() => onNavigateTab('users')} title="View Employee Expenses in Team Members">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white sm:h-10 sm:w-10">
                <Receipt size={20} />
              </div>
              <span className="truncate text-xs font-semibold text-slate-600">{t('Total Expenses')}</span>
              <span className="truncate text-xl sm:text-2xl font-extrabold text-slate-900">₹ {totalExpenseAmount.toLocaleString('en-IN')}</span>
            </div>

            {/* Card 4: Total Issued Money */}
            <div 
              className="flex min-h-28 min-w-0 cursor-pointer flex-col items-start overflow-hidden rounded-2xl border border-purple-100 bg-purple-50 p-3 sm:p-4 transition hover:shadow-md" 
              onClick={() => onOpenIssueMoney ? onOpenIssueMoney() : onNavigateTab('users')} 
              title="Issue Money to Employees"
            >
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white sm:h-10 sm:w-10">
                <Wallet size={20} />
              </div>
              <span className="truncate text-xs font-semibold text-slate-600">{t('Total Issued Money')}</span>
              <span className="truncate text-xl sm:text-2xl font-extrabold text-slate-900">₹ {totalIssuedAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}


        {/* 3. Recent Tasks Section */}
        <section className="mt-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-extrabold tracking-tight text-slate-900">{t('Recent Tasks')}</h3>
            <button 
              type="button" 
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              onClick={onViewAllTasks}
            >
              {t('View All')}
            </button>
          </div>

          {isLoading ? (
            <TaskItemsSkeleton count={2} />
          ) : (
            <div className="flex flex-col gap-2.5">
              {recentTasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: '13px' }}>
                  No tasks created yet. Click + to assign a task.
                </div>
              ) : (
                recentTasks.map((task, index) => (
                  <div 
                    key={task.id} 
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:p-4"
                    onClick={() => onOpenTaskDetails && onOpenTaskDetails(task)}
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getTaskIconClass(task) === 'red' ? 'bg-red-100 text-red-600' : getTaskIconClass(task) === 'orange' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'}`}>
                      {task.completed ? <CheckCircle2 size={18} /> : <Clock size={16} />}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-bold text-slate-900">{task.title}</span>
                      <span className="truncate text-xs text-slate-500">
                        Assigned to: <strong>{task.assignedTo || 'Team'}</strong> • {task.dateTime || task.time || 'Today'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${(task.priority || 'Low').toLowerCase() === 'high' ? 'bg-red-100 text-red-600' : (task.priority || 'Low').toLowerCase() === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {task.priority || 'Low'}
                      </span>
                      <ChevronRight size={16} color="#94a3b8" />
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
                if (onOpenIssueMoney) onOpenIssueMoney();
              }}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#fefce8', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={15} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Issue Money</span>
            </div>

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
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>Add Task</span>
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

    </div>
  );
}
