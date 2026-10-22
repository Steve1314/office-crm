import React from 'react';
import { 
  Home, 
  ClipboardList, 
  Wallet, 
  Users, 
  User, 
  Plus, 
  LogOut, 
  CheckCircle2, 
  Sparkles,
  Building
} from 'lucide-react';
import logoImg from '../../assets/images/logo.png';
import { useLanguage } from '../../contexts/useLanguage';

export default function DesktopSidebar({
  activeTab,
  onTabChange,
  user = { name: 'Admin', role: 'Admin' },
  isAdmin = false,
  onLogout,
  pendingTasksCount = 0,
  onQuickCreateTask,
  onQuickAddExpense
}) {
  const { t } = useLanguage();
  return (
    <aside className="hidden h-dvh w-[clamp(220px,18vw,280px)] shrink-0 flex-col gap-4 border-r border-white/10 bg-[#08152b] p-4 text-white lg:flex lg:p-6" aria-label="Desktop Navigation Sidebar">
      {/* 1. App Brand & Workspace Header with User Logo */}
      <div className="flex items-center gap-3 border-b border-white/10 px-2 pb-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/10 p-1">
          <img src={logoImg} alt="Office CRM Logo" className="h-full w-full rounded-lg object-contain" />
        </div>
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-lg font-extrabold leading-tight">Office CRM</h1>
          <span className="text-xs text-slate-400">{t('HQ Workspace')}</span>
        </div>
      </div>

      {/* 2. User Profile Summary Pill */}
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="relative h-10 w-10 shrink-0">
          <span className="flex h-full w-full items-center justify-center rounded-full bg-slate-800 font-bold">{user?.name ? user.name[0] : 'U'}</span>
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#08152b] bg-emerald-500"></span>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="truncate text-sm font-bold">{user?.name || 'Vivek Prajapati'}</div>
          <span className={`w-fit rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${isAdmin ? 'border-blue-400/30 bg-blue-500/20 text-blue-300' : 'border-emerald-400/30 bg-emerald-500/20 text-emerald-300'}`}>
            {user?.role || 'Employee'}
          </span>
        </div>
      </div>

      {/* 3. Quick Action Creation Buttons */}
      <div className="flex flex-col gap-2">
        {onQuickCreateTask && (
          <button 
            type="button" 
            className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-700"
            onClick={onQuickCreateTask}
            title="Create a new task"
          >
            <Plus size={16} />
            <span>{t('New Task')}</span>
          </button>
        )}
        {!isAdmin && onQuickAddExpense && (
          <button 
            type="button" 
            className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-3 py-2 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/25"
            onClick={onQuickAddExpense}
            title="Record a new expense"
          >
            <Plus size={16} />
            <span>{t('Add Expense')}</span>
          </button>
        )}
      </div>

      {/* 4. Main Navigation Menu */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        <div className="px-2 py-2 text-[11px] font-bold tracking-widest text-slate-500">{t('NAVIGATION')}</div>

        {/* Home */}
        <button
          type="button"
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${activeTab === 'home' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          onClick={() => onTabChange('home')}
        >
          <Home size={19} />
          <span className="flex-1">{t('Dashboard')}</span>
        </button>

        {/* Tasks */}
        <button
          type="button"
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${activeTab === 'tasks' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          onClick={() => onTabChange('tasks')}
        >
          <ClipboardList size={19} />
          <span className="flex-1">{t('Tasks')}</span>
          {pendingTasksCount > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-extrabold text-white">{pendingTasksCount}</span>
          )}
        </button>

        {/* Expenses (Regular employees only; Admin manages via Team Members -> Employee Report) */}
        {!isAdmin && (
          <button
            type="button"
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${activeTab === 'expenses' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            onClick={() => onTabChange('expenses')}
          >
            <Wallet size={19} />
            <span className="flex-1">{t('Expenses')}</span>
          </button>
        )}

        {/* Users (Admin / Manager) */}
        {isAdmin && (
          <button
            type="button"
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            onClick={() => onTabChange('users')}
          >
            <Users size={19} />
            <span className="flex-1">{t('Team Members')}</span>
          </button>
        )}

        {/* Profile (Employee or Admin) */}
        <button
          type="button"
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          onClick={() => onTabChange('profile')}
        >
          <User size={19} />
          <span className="flex-1">{t('My Profile')}</span>
        </button>
      </nav>

      {/* 5. Footer with Logout */}
      <div className="border-t border-white/10 pt-3">
        {onLogout && (
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-500/20"
            onClick={onLogout}
            title="Log out of account"
          >
            <LogOut size={18} />
            <span>{t('Logout')}</span>
          </button>
        )}
      </div>
    </aside>
  );
}
