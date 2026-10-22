import React from 'react';
import { Home, ClipboardList, Wallet, User, Users, MoreHorizontal } from 'lucide-react';
import { useLanguage } from '../../contexts/useLanguage';

export default function BottomNav({ 
  activeTab, 
  onTabChange, 
  isAdmin = false 
}) {
  const { t } = useLanguage();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(64px+env(safe-area-inset-bottom))] items-center justify-around border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] lg:hidden" aria-label="Bottom Navigation">
      {/* 1. Home */}
      <button
        type="button"
        className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-400'}`}
        onClick={() => onTabChange('home')}
      >
        <Home size={22} />
        <span>{t('Home')}</span>
      </button>

      {/* 2. Tasks */}
      <button
        type="button"
        className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition ${activeTab === 'tasks' ? 'text-blue-600' : 'text-slate-400'}`}
        onClick={() => onTabChange('tasks')}
      >
        <ClipboardList size={22} />
        <span>{t('Tasks')}</span>
      </button>

      {/* 3. Expenses (Regular employees only; Admin manages via Users -> Employee Report) */}
      {!isAdmin && (
        <button
          type="button"
          className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition ${activeTab === 'expenses' ? 'text-blue-600' : 'text-slate-400'}`}
          onClick={() => onTabChange('expenses')}
        >
          <Wallet size={22} />
          <span>{t('Expenses')}</span>
        </button>
      )}

      {/* 4. Users (Admin) OR Profile (Employee) */}
      {isAdmin ? (
        <button
          type="button"
          className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition ${activeTab === 'users' ? 'text-blue-600' : 'text-slate-400'}`}
          onClick={() => onTabChange('users')}
        >
          <Users size={22} />
          <span>{t('Users')}</span>
        </button>
      ) : (
        <button
          type="button"
          className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400'}`}
          onClick={() => onTabChange('profile')}
        >
          <User size={22} />
          <span>{t('Profile')}</span>
        </button>
      )}

      {/* 5. More (Admin) */}
      {isAdmin && (
        <button
          type="button"
          className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition ${activeTab === 'profile' ? 'text-blue-600' : 'text-slate-400'}`}
          onClick={() => onTabChange('profile')}
        >
          <MoreHorizontal size={22} />
          <span>{t('More')}</span>
        </button>
      )}
    </nav>
  );
}
