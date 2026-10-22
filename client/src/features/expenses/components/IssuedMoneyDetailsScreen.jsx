import React from 'react';
import {
  ArrowLeft,
  Wallet,
  Receipt,
  User,
  Calendar,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { backIconButton, screenBody, screenFrame, screenHeader, screenHeaderGroup } from '../../../utils/tailwindClasses';
import { useLanguage } from '../../../contexts/useLanguage';

export default function IssuedMoneyDetailsScreen({
  transaction = {},
  expenses = [],
  onBack,
  onSelectExpense
}) {
  const { t } = useLanguage();
  const amount = Number(transaction.amount) || 0;
  const deducted = Number(transaction.deductedAmount) || 0;
  const netAmount = Number(transaction.netAmount ?? (amount - deducted)) || 0;
  const usableBudget = deducted > 0 ? netAmount : amount;

  const issueSpent = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const remainingBalance = usableBudget - issueSpent;
  const isOverspent = issueSpent > usableBudget;
  const overspentAmount = isOverspent ? issueSpent - usableBudget : 0;

  const utilizationPercent = usableBudget > 0
    ? Math.min(100, Math.round((issueSpent / usableBudget) * 100))
    : (issueSpent > 0 ? 100 : 0);

  const issueDate = transaction.createdAt
    ? new Date(transaction.createdAt).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
    : (transaction.date || 'Date unavailable');

  const empName = transaction.employeeName || 'Employee';
  const issuerName = transaction.issuedByName || 'Admin';

  return (
    <div className={screenFrame}>
      {/* 1. Top Header with Back Navigation */}
      <header className={`${screenHeader} sticky top-0 z-10`}>
        <div className={screenHeaderGroup}>
          <button
            type="button"
            className={backIconButton}
            onClick={onBack}
            aria-label={t('Go back to Issued History')}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#ffffff', margin: 0, lineHeight: 1.2 }}>
              {t('Issued Money Details')}
            </h1>
            <span style={{ fontSize: '12px', color: '#93c5fd', opacity: 0.9 }}>
              {t('Cash Handover Voucher & Audit')}
            </span>
          </div>
        </div>
      </header>

      {/* 2. Scrollable Body Content */}
      <div className={`${screenBody} overflow-y-auto`}>
        <div className="issued-money-details-body">
          {/* Hero Voucher Card */}
          <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          border: '1.5px solid #e2e8f0',
          padding: '22px 20px',
          boxShadow: '0 4px 16px rgba(15, 29, 56, 0.04)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #1e69ff, #60a5fa)'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <span style={{
                display: 'inline-block',
                fontSize: '11px',
                fontWeight: 700,
                color: '#1e69ff',
                backgroundColor: '#eff6ff',
                padding: '3px 10px',
                borderRadius: '20px',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {t('Cash Handover')}
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                {transaction.purpose || 'Office Expenses'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#64748b' }}>
                <Calendar size={14} />
                <span>{issueDate}</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500 }}>{t('Total Cash Handed Over')}</div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, marginTop: '2px' }}>
                ₹ {amount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginTop: '18px',
            paddingTop: '16px',
            borderTop: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#dbeafe',
                color: '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <User size={18} />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>{t('Received By')}</span>
                <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{empName}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#f1f5f9',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Wallet size={18} />
              </div>
              <div>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>{t('Handed Over By')}</span>
                <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{issuerName}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Accounting Breakdown Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          border: '1.5px solid #e2e8f0',
          padding: '18px 20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={16} color="#1e69ff" />
            <span>{t('Budget & Accounting Breakdown')}</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155' }}>
              <span>{t('Gross Cash Handed Over:')}</span>
              <strong style={{ color: '#0f172a' }}>₹ {amount.toLocaleString('en-IN')}</strong>
            </div>

            {deducted > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b91c1c' }}>
                <span>{t('Pocket Money Taken Back by')} {empName}:</span>
                <strong style={{ fontWeight: 700 }}>- ₹ {deducted.toLocaleString('en-IN')}</strong>
              </div>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '1px solid #f1f5f9',
              fontWeight: 700,
              color: '#15803d'
            }}>
              <span>{t('Net Available for Office Purchases:')}</span>
              <span>₹ {usableBudget.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>{t('Spent on Purchases:')}</span>
              <strong style={{ color: '#0f172a' }}>- ₹ {issueSpent.toLocaleString('en-IN')}</strong>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '10px',
              borderTop: '1.5px dashed #cbd5e1',
              fontWeight: 800,
              fontSize: '14.5px',
              color: isOverspent ? '#b91c1c' : '#0f172a'
            }}>
              <span>{isOverspent ? t('Current Overspent Amount:') : t('Current Remaining Cash:')}</span>
              <span style={{ color: isOverspent ? '#b91c1c' : '#16a34a' }}>
                {isOverspent ? `₹ ${overspentAmount.toLocaleString('en-IN')}` : `₹ ${remainingBalance.toLocaleString('en-IN')}`}
              </span>
            </div>
          </div>

          {/* Utilization Progress Bar */}
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>Budget Utilization</span>
              <span style={{ fontWeight: 700, color: isOverspent ? '#dc2626' : (utilizationPercent > 80 ? '#d97706' : '#16a34a') }}>
                {utilizationPercent}% {isOverspent ? '(Overspent)' : 'utilized'}
              </span>
            </div>
            <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{
                width: `${utilizationPercent}%`,
                height: '100%',
                backgroundColor: isOverspent ? '#dc2626' : (utilizationPercent > 80 ? '#f59e0b' : '#16a34a'),
                borderRadius: '10px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </div>

        {/* Audit Explanatory Callout Boxes */}
        {deducted > 0 && (
          <div style={{
            padding: '12px 14px',
            backgroundColor: '#f0fdf4',
            border: '1.5px solid #bbf7d0',
            borderRadius: '14px',
            display: 'flex',
            gap: '10px',
            fontSize: '12.5px',
            color: '#166534',
            lineHeight: 1.5
          }}>
            <Info size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#15803d' }} />
            <div>
              <strong>Personal Pocket Pay Back Audit:</strong>
              <div style={{ marginTop: '3px', opacity: 0.95 }}>
                {empName} previously spent ₹{deducted.toLocaleString('en-IN')} from personal pocket on previous authorized company bills. When this cash was issued, {empName} paid back themselves ₹{deducted.toLocaleString('en-IN')}, leaving ₹{usableBudget.toLocaleString('en-IN')} as the active company budget.
              </div>
            </div>
          </div>
        )}

        {isOverspent && (
          <div style={{
            padding: '12px 14px',
            backgroundColor: '#fff1f2',
            border: '1.5px solid #fecdd3',
            borderRadius: '14px',
            display: 'flex',
            gap: '10px',
            fontSize: '12.5px',
            color: '#9f1239',
            lineHeight: 1.5
          }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#e11d48' }} />
            <div>
              <strong>Overspent from Personal Pocket:</strong>
              <div style={{ marginTop: '3px' }}>
                Total recorded expenses (₹{issueSpent.toLocaleString('en-IN')}) exceed the usable company budget by ₹{overspentAmount.toLocaleString('en-IN')}. {empName} funded this excess from personal pocket, which will be reconciled in the next cash issue.
              </div>
            </div>
          </div>
        )}

        {/* 3. Recorded Purchases List */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          border: '1.5px solid #e2e8f0',
          padding: '18px 20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Receipt size={17} color="#1e69ff" />
                <span>{t('Recorded Purchases')}</span>
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {expenses.length} {expenses.length === 1 ? 'purchase item' : 'purchase items'} · Spent ₹ {issueSpent.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {expenses.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '28px 12px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px dashed #cbd5e1',
              color: '#94a3b8',
              fontSize: '13px'
            }}>
              No purchases have been recorded under this cash handover yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {expenses.map((expense, idx) => {
                const expAmount = Number(expense.amount || 0);
                const productImg = expense.proofImage || (expense.proofImages && expense.proofImages[0]) || expense.imageUrl;
                const hasReceipt = Boolean(productImg);

                return (
                  <div
                    key={expense._id || expense.id || idx}
                    onClick={() => onSelectExpense && onSelectExpense(expense)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                      {productImg ? (
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          backgroundColor: '#f1f5f9',
                          flexShrink: 0,
                          border: '1.5px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <img
                            src={productImg}
                            alt={expense.title || 'Product'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.parentElement) {
                                e.currentTarget.parentElement.innerHTML = '🧾';
                              }
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          backgroundColor: '#eff6ff',
                          color: '#1e69ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '17px',
                          fontWeight: 700,
                          flexShrink: 0,
                          border: '1.5px solid #dbeafe'
                        }}>
                          🧾
                        </div>
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{
                          fontSize: '13.5px',
                          fontWeight: 700,
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {expense.title || 'Untitled Expense'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#64748b', marginTop: '2px', flexWrap: 'wrap' }}>
                          <span style={{ backgroundColor: '#e2e8f0', padding: '1px 6px', borderRadius: '4px', fontSize: '10.5px' }}>
                            {expense.category || 'Office Supplies'}
                          </span>
                          <span>{expense.date || (expense.createdAt ? new Date(expense.createdAt).toLocaleDateString() : '')}</span>
                          {hasReceipt && (
                            <span style={{ color: '#16a34a', fontWeight: 600 }}>
                              ✓ Receipt attached
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <strong style={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a' }}>
                        ₹ {expAmount.toLocaleString('en-IN')}
                      </strong>
                      <ChevronRight size={16} color="#94a3b8" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
