import React, { useState } from 'react';
import { backIconButton, screenBody, screenFrame, screenHeader, screenHeaderGroup, screenTitle } from '../../../utils/tailwindClasses';
import { ArrowLeft, ChevronDown, User, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useLanguage } from '../../../contexts/useLanguage';

export default function IssueMoneyScreen({
  onBack,
  onIssueSuccess,
  employees = [],
  currentUser,
  expenses = [],
  issuedTransactions = [],
  settlements = []
}) {
  const { t } = useLanguage();
  const currentUserIds = new Set(
    [currentUser?.id, currentUser?._id].filter(Boolean).map((id) => String(id).toLowerCase())
  );
  const currentUserEmail = String(currentUser?.email || '').trim().toLowerCase();
  const employeeList = employees.filter((employee) => {
    const employeeIds = [employee.id, employee._id].filter(Boolean).map((id) => String(id).toLowerCase());
    const sharesId = employeeIds.some((id) => currentUserIds.has(id));
    const sharesEmail = currentUserEmail
      && String(employee.email || '').trim().toLowerCase() === currentUserEmail;
    if (currentUserIds.size || currentUserEmail) return !sharesId && !sharesEmail;
    return String(employee.name || '').trim().toLowerCase() !== String(currentUser?.name || '').trim().toLowerCase();
  });

  const [selectedEmployee, setSelectedEmployee] = useState(() => employeeList[0] || null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issueError, setIssueError] = useState('');
  const [issuedTransaction, setIssuedTransaction] = useState(null);
  const employeeId = String(selectedEmployee?.id || selectedEmployee?._id || '');
  const employeeName = (selectedEmployee?.name || '').trim().toLowerCase();
  const matchesSelectedEmployee = (item, idFields, nameFields) => {
    const itemId = idFields.map(field => item[field]).find(Boolean);
    if (itemId) return String(itemId) === employeeId;
    return nameFields.some(field => item[field]?.trim().toLowerCase() === employeeName);
  };

  // 1. Calculate selected employee's current balance
  const empSettlements = (settlements || []).filter(item =>
    matchesSelectedEmployee(item, ['employeeId', 'employee'], ['employeeName'])
  ).sort((a, b) => new Date(b.settledAt || b.createdAt || 0) - new Date(a.settledAt || a.createdAt || 0));

  const latestSettlement = empSettlements[0] || null;
  const lastSettledTimestamp = latestSettlement ? new Date(latestSettlement.settledAt || latestSettlement.createdAt).getTime() : 0;
  const carriedForwardBalance = latestSettlement ? (Number(latestSettlement.balance) || 0) : 0;

  // Active expenses spent by this employee
  const empSpent = (expenses || []).filter(e => {
    if (!selectedEmployee?.name) return false;
    const matchesEmp = matchesSelectedEmployee(e, ['userId', 'user'], ['userName', 'addedBy']);
    if (!matchesEmp) return false;
    if (!lastSettledTimestamp) return true;
    const t = e.createdAt ? new Date(e.createdAt).getTime() : (e.id && Number(e.id) > 1000000000000 ? Number(e.id) : 0);
    return !t || t >= lastSettledTimestamp;
  }).reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Active money issued to this employee
  const empIssued = (issuedTransactions || []).filter(i => {
    if (!selectedEmployee?.name) return false;
    const matchesEmp = matchesSelectedEmployee(i, ['employeeId', 'employee'], ['employeeName']);
    if (!matchesEmp) return false;
    if (!lastSettledTimestamp) return true;
    const t = i.createdAt ? new Date(i.createdAt).getTime() : (i.id && Number(i.id) > 1000000000000 ? Number(i.id) : 0);
    return !t || t >= lastSettledTimestamp;
  }).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

  // Current balance of the employee before new issue
  const currentBalance = (empIssued + carriedForwardBalance) - empSpent;
  const hasDeficit = currentBalance < 0;
  const deficitAmount = hasDeficit ? Math.abs(currentBalance) : 0;
  const hasSurplus = currentBalance > 0;
  const surplusAmount = hasSurplus ? currentBalance : 0;

  // Live adjustments based on input
  const numericAmount = parseFloat(amount) || 0;
  const deficitCut = hasDeficit ? Math.min(numericAmount, deficitAmount) : 0;
  const netUsableBudget = hasDeficit
    ? Math.max(0, numericAmount - deficitCut)
    : (numericAmount + surplusAmount);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedEmployee) {
      alert('Please select an employee.');
      return;
    }
    if (!numericAmount || numericAmount <= 0) return;

    // If there is an outstanding deficit, show confirmation popup first!
    if (hasDeficit && deficitCut > 0) {
      setIsConfirmModalOpen(true);
      return;
    }

    // Otherwise proceed directly
    executeIssue();
  };

  const executeIssue = async () => {
    setIsSubmitting(true);
    setIssueError('');
    const issueData = {
      employeeId,
      employeeName: selectedEmployee.name,
      amount: numericAmount,
      purpose: purpose.trim() || 'Office supplies',
    };

    try {
      const response = await onIssueSuccess?.(issueData);
      if (!response?.success || !response.transaction) {
        throw new Error(response?.message || 'Money could not be issued. Please try again.');
      }
      setIssuedTransaction(response.transaction);
      setIsConfirmModalOpen(false);
      setIsSuccess(true);
      setTimeout(() => {
        if (onBack) onBack();
      }, 2500);
    } catch (error) {
      setIssueError(error.message || 'Money could not be issued. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const finalDeductedAmount = Number(issuedTransaction?.deductedAmount ?? deficitCut);
  const finalNetAmount = Number(issuedTransaction?.netAmount ?? (numericAmount - deficitCut));

  return (
    <div className={screenFrame}>
      {/* 1. Header with Back Button */}
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
          <h2 className={screenTitle}>{t('Issue Money')}</h2>
        </div>
      </header>

      {/* 2. Curved White Body */}
      <div className={screenBody} style={{ gap: '22px', paddingBottom: '200px' }}>
        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={36} color="#16a34a" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{t('Money Issued Successfully!')}</h3>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              ₹ {numericAmount.toLocaleString('en-IN')} {t('issued to')} {selectedEmployee.name}
            </p>
            {finalDeductedAmount > 0 ? (
              <div style={{
                backgroundColor: '#fff1f2',
                border: '1px solid #fecdd3',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '12.5px',
                color: '#9f1239',
                fontWeight: 600
              }}>
                ₹ {finalDeductedAmount.toLocaleString('en-IN')} adjusted for previous overspending. ₹ {finalNetAmount.toLocaleString('en-IN')} available for new office expenses.
              </div>
            ) : hasSurplus ? (
              <div style={{
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '12.5px',
                color: '#166534',
                fontWeight: 600
              }}>
                ₹ {finalNetAmount.toLocaleString('en-IN')} issued for new office expenses, plus ₹ {surplusAmount.toLocaleString('en-IN')} unspent cash.
              </div>
            ) : (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '8px 14px', fontSize: '12.5px', color: '#166534', fontWeight: 600 }}>
                ₹ {finalNetAmount.toLocaleString('en-IN')} available for new office expenses.
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">

            {/* Field 1: Employee */}
            <div className="flex w-full flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">{t('Employee')}</label>

              <div style={{ position: 'relative' }}>
                <div
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 14px',
                    backgroundColor: '#ffffff',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        backgroundColor: '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#334155'
                      }}
                    >
                      <User size={18} />
                    </div>
                    <span style={{ fontSize: '15px', fontWeight: 500, color: selectedEmployee ? '#1e293b' : '#94a3b8' }}>
                      {selectedEmployee ? selectedEmployee.name : 'Select Employee...'}
                    </span>
                  </div>

                  <ChevronDown
                    size={18}
                    style={{
                      color: '#1e293b',
                      transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s ease'
                    }}
                  />
                </div>

                {/* Dropdown Options */}
                {isDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '6px',
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1.5px solid #e2e8f0',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                      zIndex: 50,
                      maxHeight: '220px',
                      overflowY: 'auto'
                    }}
                  >
                    {employeeList.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                        No other employees are available to issue money to.
                      </div>
                    ) : (
                      employeeList.map((emp) => (
                        <div
                          key={emp.id}
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setIsDropdownOpen(false);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 14px',
                            cursor: 'pointer',
                            backgroundColor: selectedEmployee?.id === emp.id ? '#f1f5f9' : 'transparent',
                            transition: 'background 0.15s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedEmployee?.id === emp.id ? '#f1f5f9' : 'transparent'}
                        >
                          <div
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              backgroundColor: '#e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#475569'
                            }}
                          >
                            <User size={16} />
                          </div>
                          <div>
                            <div style={{ fontSize: '14.5px', fontWeight: 500, color: '#1e293b' }}>{emp.name}</div>
                            {emp.role && (
                              <div style={{ fontSize: '12px', color: '#64748b' }}>{emp.role}</div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Field 2: Amount */}
            <div className="flex w-full flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">Amount</label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#1e293b',
                    pointerEvents: 'none'
                  }}
                >
                  ₹
                </span>
                <input
                  type="number"
                  className="w-full"
                  style={{
                    paddingLeft: '34px',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#1e293b'
                  }}
                  placeholder="10,000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              {/* Live Deficit Auto-Adjustment Card */}
              {selectedEmployee && hasDeficit && (
                <div style={{
                  backgroundColor: '#fff1f2',
                  border: '1.5px solid #fecdd3',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '13px',
                  marginTop: '8px',
                  animation: 'fadeIn 0.2s ease-out'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9f1239', fontWeight: 700, fontSize: '13.5px' }}>
                    <AlertTriangle size={16} color="#e11d48" />
                    <span>{t('Past Pocket Expense Detected')} (-₹{deficitAmount.toLocaleString('en-IN')})</span>
                  </div>
                  <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.4 }}>
                    {selectedEmployee.name} {t('spent')} ₹{deficitAmount.toLocaleString('en-IN')} {t('from personal pocket on previous bills.')}
                  </div>

                  {numericAmount > 0 && (
                    <>
                      <div style={{ height: '1px', backgroundColor: '#fecdd3', margin: '2px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f172a' }}>
                        <span>{t('New Cash Handed Over:')}</span>
                        <span style={{ fontWeight: 700 }}>₹ {numericAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#e11d48' }}>
                        <span>{t('Pocket Pay Back')} ({selectedEmployee.name} {t('takes back')}):</span>
                        <span style={{ fontWeight: 700 }}>- ₹ {deficitCut.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ height: '1px', backgroundColor: '#fecdd3', margin: '2px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', fontWeight: 800, color: '#16a34a' }}>
                        <span>{t('Usable for New Office Purchases:')}</span>
                        <span>₹ {netUsableBudget.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#9f1239', lineHeight: 1.4, marginTop: '2px' }}>
                        💡 {selectedEmployee.name} keeps ₹{deficitCut.toLocaleString('en-IN')} to recover personal pocket money, and uses ₹{netUsableBudget.toLocaleString('en-IN')} as the office budget.
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Live Surplus Existing Cash Card */}
              {selectedEmployee && hasSurplus && (
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '13px',
                  marginTop: '8px',
                  animation: 'fadeIn 0.2s ease-out'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontWeight: 700, fontSize: '13.5px' }}>
                    <Info size={16} color="#16a34a" />
                    <span>{t('Existing Cash in Hand')} (+₹{surplusAmount.toLocaleString('en-IN')})</span>
                  </div>
                  {numericAmount > 0 && (
                    <>
                      <div style={{ height: '1px', backgroundColor: '#bbf7d0', margin: '2px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0f172a' }}>
                        <span>{t('New Cash Handed Over:')}</span>
                        <span style={{ fontWeight: 700 }}>₹ {numericAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                        <span>{t('Existing Cash in Hand:')}</span>
                        <span style={{ fontWeight: 700 }}>+ ₹ {surplusAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ height: '1px', backgroundColor: '#bbf7d0', margin: '2px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', fontWeight: 800, color: '#16a34a' }}>
                        <span>{t('Total Usable Office Budget:')}</span>
                        <span>₹ {netUsableBudget.toLocaleString('en-IN')}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Field 3: Purpose (optional) */}
            <div className="flex w-full flex-col gap-2">
              <label className="text-sm font-semibold text-slate-700">
                {t('Purpose')} <span className="font-normal text-slate-400">({t('Optional')})</span>
              </label>
              <input
                type="text"
                className="w-full"
                placeholder={t('e.g. Office supplies')}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                style={{
                  height: '52px',
                  borderRadius: '12px'
                }}
              />
            </div>

            {/* Submit Button: Issue Money */}
            <div style={{ marginTop: '12px', marginBottom: '40px' }}>
              {issueError && (
                <div role="alert" style={{ color: '#b91c1c', background: '#fef2f2', borderRadius: '10px', padding: '10px 12px', marginBottom: '12px', fontSize: '13px' }}>
                  {issueError}
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)',
                  transition: 'background-color 0.15s ease, transform 0.1s ease'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {isSubmitting ? t('Issuing...') : t('Issue Money')}
              </button>
            </div>

          </form>
        )}
      </div>

      {/* Deficit Adjustment Confirmation Popup Modal */}
      {isConfirmModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '380px',
            maxHeight: '90vh',
            maxHeight: '90dvh',
            overflowY: 'auto',
            padding: '20px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            animation: 'fadeIn 0.2s ease-out',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#e11d48'
                }}>
                  <AlertTriangle size={18} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  {t('Adjust Previous Deficit?')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.45 }}>
              <strong>{selectedEmployee?.name}</strong> {t('has an outstanding deficit of')} <strong>₹ {deficitAmount.toLocaleString('en-IN')}</strong> {t('from spending out-of-pocket on earlier bills.')}
            </div>

            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '14px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              fontSize: '13px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>{t('Cash Being Handed Over:')}</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>₹ {numericAmount.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#e11d48' }}>{t('Clears Pocket Deficit (Cut):')}</span>
                <span style={{ fontWeight: 700, color: '#e11d48' }}>- ₹ {deficitCut.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 800 }}>
                <span style={{ color: '#0f172a' }}>{t('Net Usable Office Budget:')}</span>
                <span style={{ color: '#16a34a' }}>₹ {netUsableBudget.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div style={{
              fontSize: '12px',
              color: '#15803d',
              backgroundColor: '#f0fdf4',
              padding: '10px 12px',
              borderRadius: '10px',
              lineHeight: 1.45
            }}>
              {t('The employee will keep')} ₹{deficitCut.toLocaleString('en-IN')} {t('to recover their personal spending on previous bills, leaving')} ₹{netUsableBudget.toLocaleString('en-IN')} {t('cash for new office expenses.')}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                style={{
                  flex: 1,
                  height: '44px',
                  borderRadius: '12px',
                  border: '1.5px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  color: '#64748b',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                onClick={executeIssue}
                disabled={isSubmitting}
                style={{
                  flex: 1.4,
                  height: '44px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.28)'
                }}
              >
                {isSubmitting ? t('Issuing...') : `${t('Confirm & Issue')} ₹${numericAmount.toLocaleString('en-IN')}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
