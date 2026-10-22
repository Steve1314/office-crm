import React from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { backIconButton, screenBody, screenFrame, screenHeader, screenHeaderGroup, screenTitle } from '../../../utils/tailwindClasses';
import { useLanguage } from '../../../contexts/useLanguage';

export default function ExpenseSummaryScreen({ 
  expenses = [], 
  issuedMoney = 2000, 
  onBack,
  onOpenAddExpense
}) {
  const { t } = useLanguage();
  const totalSpent = expenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const remaining = issuedMoney - totalSpent;

  return (
    <div className={screenFrame}>
      {/* 1. Header with Back Button and Add Action */}
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
          <h2 className={screenTitle}>{t('Expense Summary')}</h2>
        </div>

        {onOpenAddExpense && (
          <button
            type="button"
            onClick={onOpenAddExpense}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '6px 12px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Plus size={15} />
            <span>{t('Add Expense')}</span>
          </button>
        )}
      </header>

      {/* 2. Curved White Body */}
      <div className={screenBody} style={{ paddingBottom: '90px' }}>
        
        {/* Three Metric Cards Row (Issued, Spent, Remaining) in same row */}
        <div className="mb-5 grid w-full grid-cols-3 gap-2 sm:gap-3">
          <div className="flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 p-2.5 sm:p-4">
            <span className="truncate text-xs font-bold text-blue-700">{t('Issued')}</span>
            <span className="truncate text-base sm:text-lg font-extrabold text-blue-700">₹ {issuedMoney.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-2xl border border-purple-100 bg-purple-50 p-2.5 sm:p-4">
            <span className="truncate text-xs font-bold text-purple-700">{t('Spent')}</span>
            <span className="truncate text-base sm:text-lg font-extrabold text-purple-700">₹ {totalSpent.toLocaleString('en-IN')}</span>
          </div>

          <div className="flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50 p-2.5 sm:p-4">
            <span className="truncate text-xs font-bold text-emerald-700">{t('Remaining')}</span>
            <span className="truncate text-base sm:text-lg font-extrabold text-emerald-700">₹ {remaining.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* My Expense History Section */}
        <div>
          <div className="section-header-wrap" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="section-title">{t('My Expense History')}</h3>
            {onOpenAddExpense && (
              <button
                type="button"
                onClick={onOpenAddExpense}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                + {t('Add Expense')}
              </button>
            )}
          </div>

          {/* Enclosed Card Box */}
          <div className="w-full divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {expenses.map((item) => (
              <div key={item.id} className="flex w-full min-w-0 items-center gap-3 px-3 py-3 sm:px-4">
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-blue-50">
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-sm font-bold text-blue-600">{item.title?.[0] || '₹'}</div>}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-slate-900">{item.title}</div>
                  <div className="truncate text-xs text-slate-500">
                    {[item.date, item.category].filter(Boolean).join(' • ')}
                  </div>
                </div>

                <div className="shrink-0 text-sm font-bold text-slate-800">
                  ₹ {Number(item.amount).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
