import React, { useState, useMemo } from 'react';
import { ArrowLeft, Plus, SlidersHorizontal, X, Download, FileSpreadsheet, ChevronDown, ChevronRight, Calendar } from 'lucide-react';
import { ExpensesKpiSkeleton, ExpenseItemsSkeleton } from '../../../components/common/Skeleton';
import IssuedMoneyDetailsScreen from './IssuedMoneyDetailsScreen';
import { useLanguage } from '../../../contexts/useLanguage';

const parseRecordDate = (record) => {
  if (record?.createdAt) {
    const d = new Date(record.createdAt);
    if (!isNaN(d.getTime())) return d;
  }
  if (record?.timestamp) {
    const t = Number(record.timestamp);
    if (Number.isFinite(t) && t > 1000000000000) {
      const d = new Date(t);
      if (!isNaN(d.getTime())) return d;
    }
  }
  if (record?.date) {
    const d = new Date(record.date);
    if (!isNaN(d.getTime())) return d;
    const parts = String(record.date).trim().split(/[-/ ]+/);
    if (parts.length === 3 && parts[2].length === 4) {
      const d2 = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      if (!isNaN(d2.getTime())) return d2;
    }
  }
  if (record?.id) {
    const t = Number(record.id);
    if (!isNaN(t) && t > 1000000000000) {
      const d = new Date(t);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
};

const getMonthYearKey = (date) => {
  if (!date || isNaN(date.getTime())) return 'unknown';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getMonthYearLabel = (date) => {
  if (!date || isNaN(date.getTime())) return 'Unknown Date';
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

const MONTHS_LIST = [
  { value: 'All', label: 'All', name: 'All Months' },
  { value: '01', label: 'Jan', name: 'January' },
  { value: '02', label: 'Feb', name: 'February' },
  { value: '03', label: 'Mar', name: 'March' },
  { value: '04', label: 'Apr', name: 'April' },
  { value: '05', label: 'May', name: 'May' },
  { value: '06', label: 'Jun', name: 'June' },
  { value: '07', label: 'Jul', name: 'July' },
  { value: '08', label: 'Aug', name: 'August' },
  { value: '09', label: 'Sep', name: 'September' },
  { value: '10', label: 'Oct', name: 'October' },
  { value: '11', label: 'Nov', name: 'November' },
  { value: '12', label: 'Dec', name: 'December' }
];

const getRecordTimestamp = (record) => {
  if (record?.createdAt) {
    const t = new Date(record.createdAt).getTime();
    if (Number.isFinite(t) && t > 0) return t;
  }
  if (record?.timestamp) {
    const t = Number(record.timestamp);
    if (Number.isFinite(t) && t > 0) return t;
  }
  if (record?.date) {
    const t = new Date(record.date).getTime();
    if (Number.isFinite(t) && t > 0) return t;
    const parts = String(record.date).trim().split(/[-/ ]+/);
    if (parts.length === 3 && parts[2].length === 4) {
      const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
      if (Number.isFinite(d) && d > 0) return d;
    }
  }
  if (record?.id) {
    const t = Number(record.id);
    if (!isNaN(t) && t > 1000000000000) return t;
  }
  return 0;
};

const normalizeIdentity = (value) => {
  const identity = value && typeof value === 'object' ? value._id || value.id : value;
  return identity == null ? '' : String(identity).trim().toLowerCase();
};

const matchesEmployee = (expense, transaction) => {
  const expenseId = normalizeIdentity(expense.user || expense.userId);
  const transactionId = normalizeIdentity(transaction.employee || transaction.employeeId);
  if (expenseId && transactionId && expenseId === transactionId) return true;

  const expenseName = normalizeIdentity(expense.userName || expense.addedBy);
  const transactionName = normalizeIdentity(transaction.employeeName);
  return Boolean(expenseName && transactionName && expenseName === transactionName);
};

const getTransactionKey = (transaction) => String(
  transaction._id || transaction.id ||
  `${normalizeIdentity(transaction.employee || transaction.employeeId || transaction.employeeName)}:${getRecordTimestamp(transaction)}:${transaction.amount}:${transaction.purpose || ''}`
);

export default function ExpensesPage({ 
  expenses = [], 
  allExpenses = [],
  issuedTransactions = [],
  activeIssuedTransactions = [],
  issuedMoney = 0,
  allIssuedMoney = 0,
  currentUser = { role: 'Admin' },
  employees = [],
  isLoading = false,
  onBackToHome, 
  onOpenAddExpense, 
  onSelectExpense 
}) {
  const { t } = useLanguage();
  const isAdmin = ['admin', 'manager'].includes((currentUser?.role || '').toLowerCase());
  const [cycleMode, setCycleMode] = useState('active'); // 'active' (default) | 'all'
  const [historyView, setHistoryView] = useState('expenses'); // 'expenses' (default) | 'issued'
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState('All');
  const now = new Date();
  const currentYearStr = String(now.getFullYear());
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');

  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedDate, setSelectedDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [selectedIssuedTransaction, setSelectedIssuedTransaction] = useState(null);

  const activeFilterText = useMemo(() => {
    if (selectedDate) {
      const d = new Date(selectedDate);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      }
      return selectedDate;
    }
    if (selectedYear === 'All' && selectedMonth === 'All') {
      return 'All History';
    }
    if (selectedYear !== 'All' && selectedMonth === 'All') {
      return `Year ${selectedYear}`;
    }
    const monthObj = MONTHS_LIST.find(m => m.value === selectedMonth);
    const monthName = monthObj ? monthObj.name : selectedMonth;
    if (selectedYear === 'All' && selectedMonth !== 'All') {
      return `Every ${monthName}`;
    }
    return `${monthName} ${selectedYear}`;
  }, [selectedYear, selectedMonth, selectedDate]);

  const availableYears = useMemo(() => {
    const yearsSet = new Set();
    yearsSet.add(currentYearStr);

    [...(allExpenses || []), ...(expenses || []), ...(issuedTransactions || []), ...(activeIssuedTransactions || [])].forEach(item => {
      const d = parseRecordDate(item);
      if (d && !isNaN(d.getTime())) {
        yearsSet.add(String(d.getFullYear()));
      }
    });

    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [allExpenses, expenses, issuedTransactions, activeIssuedTransactions, currentYearStr]);

  const matchesDateFilter = (item) => {
    if (!item) return false;
    const d = parseRecordDate(item);
    if (!d || isNaN(d.getTime())) {
      return selectedYear === 'All' && selectedMonth === 'All' && !selectedDate;
    }

    const y = String(d.getFullYear());
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const ymd = `${y}-${m}-${day}`;

    if (selectedDate) {
      return ymd === selectedDate;
    }

    if (selectedYear !== 'All' && y !== selectedYear) {
      return false;
    }

    if (selectedMonth !== 'All' && m !== selectedMonth) {
      return false;
    }

    return true;
  };

  // Active duration vs All expenses
  const displayExpenses = cycleMode === 'active'
    ? expenses
    : allExpenses;
  const displayIssuedMoney = cycleMode === 'active' ? issuedMoney : allIssuedMoney;
  const displayTransactions = cycleMode === 'active' ? activeIssuedTransactions : issuedTransactions;
  const expensesByIssue = new Map(
    displayTransactions.map(transaction => [getTransactionKey(transaction), []])
  );

  const sortedIssuedTransactionsDesc = [...issuedTransactions].sort((a, b) => getRecordTimestamp(b) - getRecordTimestamp(a));

  displayExpenses.forEach((expense) => {
    const expenseTime = getRecordTimestamp(expense);

    const matchingIssues = sortedIssuedTransactionsDesc
      .filter(transaction => matchesEmployee(expense, transaction))
      .filter(transaction => {
        const issueTime = getRecordTimestamp(transaction);
        return issueTime > 0 && issueTime <= expenseTime;
      });
    const issue = matchingIssues[0] || sortedIssuedTransactionsDesc.find(t => matchesEmployee(expense, t));
    if (issue) {
      const key = getTransactionKey(issue);
      const list = expensesByIssue.get(key);
      if (list) {
        list.push(expense);
      } else {
        expensesByIssue.set(key, [expense]);
      }
    }
  });

  // State for Month Accordions: records open state per month key. Index 0 (latest month) is open by default.
  const [openMonths, setOpenMonths] = useState({});

  const toggleMonth = (key, currentOpen) => {
    setOpenMonths((prev) => ({
      ...prev,
      [key]: !currentOpen
    }));
  };

  // Filter transactions according to employee, date filter and search filter
  const filteredTransactions = useMemo(() => {
    return displayTransactions.filter((tx) => {
      if (selectedEmployeeFilter !== 'All') {
        const empNorm = normalizeIdentity(selectedEmployeeFilter);
        const txEmpNorm = normalizeIdentity(tx.employeeName);
        const txEmpId = normalizeIdentity(tx.employee || tx.employeeId);
        if (txEmpNorm !== empNorm && txEmpId !== empNorm) return false;
      }
      if (cycleMode === 'all' && !matchesDateFilter(tx)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchEmp = (tx.employeeName || '').toLowerCase().includes(q);
        const matchPurpose = (tx.purpose || '').toLowerCase().includes(q);
        const matchIssuer = (tx.issuedByName || '').toLowerCase().includes(q);
        const matchAmount = String(tx.amount || '').includes(q);
        if (!matchEmp && !matchPurpose && !matchIssuer && !matchAmount) return false;
      }
      return true;
    });
  }, [displayTransactions, selectedEmployeeFilter, searchQuery, cycleMode, selectedYear, selectedMonth, selectedDate]);

  // Group transactions by month & year, sorted newest month first
  const monthGroups = useMemo(() => {
    const groupsMap = new Map();

    filteredTransactions.forEach((tx) => {
      const d = parseRecordDate(tx);
      const key = getMonthYearKey(d);
      const label = getMonthYearLabel(d);

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          label,
          year: d ? d.getFullYear() : 0,
          month: d ? d.getMonth() : -1,
          transactions: [],
          totalAmount: 0
        });
      }

      const group = groupsMap.get(key);
      group.transactions.push(tx);
      group.totalAmount += Number(tx.amount) || 0;
    });

    return Array.from(groupsMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [filteredTransactions]);

  const allMonthsExpanded = monthGroups.length > 0 && monthGroups.every((g) => Boolean(openMonths[g.key]));

  const handleToggleAllMonths = () => {
    const targetState = !allMonthsExpanded;
    const nextMap = {};
    monthGroups.forEach((g) => {
      nextMap[g.key] = targetState;
    });
    setOpenMonths(nextMap);
  };

  // Calculate totals for the selected period.
  const totalSpent = displayExpenses.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const remaining = displayIssuedMoney - totalSpent;
  const isOverspent = remaining < 0;

  // Filter based on employee, date filter, and search query
  const filteredExpenses = displayExpenses.filter((item) => {
    // 1. Employee Filter
    if (selectedEmployeeFilter !== 'All') {
      const empNorm = normalizeIdentity(selectedEmployeeFilter);
      const itemEmpNorm = normalizeIdentity(item.userName || item.addedBy);
      const itemUserId = normalizeIdentity(item.user || item.userId);
      if (itemEmpNorm !== empNorm && itemUserId !== empNorm) return false;
    }

    // 2. Date Filter (Applied when in All History)
    if (cycleMode === 'all' && !matchesDateFilter(item)) {
      return false;
    }

    // 3. Search Query
    let matchesSearch = true;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      matchesSearch = (item.title || '').toLowerCase().includes(q) ||
                      (item.category || '').toLowerCase().includes(q) ||
                      (item.userName || '').toLowerCase().includes(q) ||
                      (item.addedBy || '').toLowerCase().includes(q) ||
                      String(item.amount || '').includes(q);
    }

    return matchesSearch;
  });

  // State for All Expenses Month Accordions: closed by default
  const [openExpenseMonths, setOpenExpenseMonths] = useState({});

  const toggleExpenseMonth = (key, currentOpen) => {
    setOpenExpenseMonths((prev) => ({
      ...prev,
      [key]: !currentOpen
    }));
  };

  // Group filteredExpenses by month & year, sorted newest month first
  const expenseMonthGroups = useMemo(() => {
    const groupsMap = new Map();

    filteredExpenses.forEach((item) => {
      const d = parseRecordDate(item);
      const key = getMonthYearKey(d);
      const label = getMonthYearLabel(d);

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          label,
          year: d ? d.getFullYear() : 0,
          month: d ? d.getMonth() : -1,
          expenses: [],
          totalAmount: 0
        });
      }

      const group = groupsMap.get(key);
      group.expenses.push(item);
      group.totalAmount += Number(item.amount) || 0;
    });

    return Array.from(groupsMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, [filteredExpenses]);

  const allExpenseMonthsExpanded = expenseMonthGroups.length > 0 && expenseMonthGroups.every((g) => Boolean(openExpenseMonths[g.key]));

  const handleToggleAllExpenseMonths = () => {
    const targetState = !allExpenseMonthsExpanded;
    const nextMap = {};
    expenseMonthGroups.forEach((g) => {
      nextMap[g.key] = targetState;
    });
    setOpenExpenseMonths(nextMap);
  };

  const handleDownloadExcel = () => {
    try {
      const safeStr = (str) => `"${String(str || '').replace(/"/g, '""')}"`;
      
      const headers = ['#', 'Date', 'Expense Title', 'Category', 'Amount (INR)', 'Added By', 'Receipt Attached'];
      
      const rows = filteredExpenses.map((e, idx) => [
        idx + 1,
        safeStr(e.date || 'N/A'),
        safeStr(e.title || 'Untitled Expense'),
        safeStr(e.category || 'Office Supplies'),
        Number(e.amount || 0).toFixed(2),
        safeStr(e.addedBy || 'Employee'),
        (e.imageUrl || (e.proofImages && e.proofImages.length > 0)) ? 'Yes' : 'No'
      ]);

      let csvContent = '\uFEFF';
      csvContent += `OFFICE CRM - EXPENSE REPORT\n`;
      csvContent += `Period / Filter,${safeStr(activeFilterText)}\n`;
      csvContent += `Generated At,${safeStr(new Date().toLocaleString())}\n`;
      csvContent += `\n`;
      csvContent += `FINANCIAL SUMMARY\n`;
      csvContent += `Total Issued (INR),${Number(displayIssuedMoney || 0).toFixed(2)}\n`;
      csvContent += `Total Spent (INR),${Number(totalSpent || 0).toFixed(2)}\n`;
      csvContent += `${isOverspent ? 'Overspent' : 'Remaining Balance'} (INR),${Math.abs(Number(remaining || 0)).toFixed(2)}\n`;
      csvContent += `\n`;
      csvContent += `ITEMIZED EXPENSES (${filteredExpenses.length} Records)\n`;
      csvContent += headers.join(',') + '\n';
      
      rows.forEach(r => {
        csvContent += r.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Office_Expense_Report_${activeFilterText.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to export excel:', err);
    }
  };

  if (selectedIssuedTransaction) {
    const transactionKey = getTransactionKey(selectedIssuedTransaction);
    let issueExpenses = expensesByIssue.get(transactionKey);
    if (!issueExpenses || issueExpenses.length === 0) {
      const selId = String(selectedIssuedTransaction._id || selectedIssuedTransaction.id || '');
      for (const [k, expList] of expensesByIssue.entries()) {
        if (selId && k.includes(selId)) {
          issueExpenses = expList;
          break;
        }
      }
    }
    if ((!issueExpenses || issueExpenses.length === 0)) {
      issueExpenses = displayExpenses.filter(e => matchesEmployee(e, selectedIssuedTransaction));
    }
    return (
      <IssuedMoneyDetailsScreen
        transaction={selectedIssuedTransaction}
        expenses={issueExpenses || []}
        onBack={() => setSelectedIssuedTransaction(null)}
        onSelectExpense={onSelectExpense}
      />
    );
  }

  return (
    <div className="flex min-h-full w-full flex-1 flex-col bg-[#07152b] lg:bg-white">
      {/* 1. Header with Back Button and Header Action Icons */}
      <header className="flex w-full shrink-0 items-center justify-between bg-[#07152b] px-4 pb-3 pt-[max(16px,env(safe-area-inset-top))] text-white sm:px-6 lg:px-9">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <button 
            type="button" 
            className="flex shrink-0 items-center justify-center rounded-lg p-1 text-white transition hover:bg-white/10" 
            onClick={onBackToHome}
            aria-label="Go Back to Home"
          >
            <ArrowLeft size={22} />
          </button>
          <h2 className="truncate text-lg font-bold tracking-tight sm:text-xl">{t('Expenses')}</h2>
        </div>

        {/* Header Action Icon Buttons (Download, + Add Expense and Filters) */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-emerald-400 transition hover:bg-white/20"
            onClick={handleDownloadExcel}
            title={t('Download Expense Report (Excel)')}
            aria-label={t('Download Expense Report (Excel)')}
          >
            <Download size={19} />
          </button>
          {onOpenAddExpense && (
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
              onClick={onOpenAddExpense}
              title={t('Add Expense')}
              aria-label={t('Add Expense')}
            >
              <Plus size={20} />
            </button>
          )}
          <button
            type="button"
            className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white transition ${showFilterPanel ? 'bg-blue-600' : 'bg-white/10 hover:bg-white/20'}`}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            title={t('Search & Filters')}
            aria-label="Filter"
          >
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </header>

      {/* 2. Curved White Body */}
      <div className="flex min-h-0 w-full flex-1 flex-col self-stretch rounded-t-[24px] bg-white px-3 pb-24 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] sm:rounded-t-[28px] sm:px-6 sm:pt-5 lg:mx-0 lg:max-w-none lg:rounded-none lg:px-9 lg:pb-9">
        
        {/* Active Cycle / All History Toggle Pills */}
        {(
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f1f5f9',
            padding: '3px',
            borderRadius: '12px',
            marginBottom: '12px',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={() => setCycleMode('active')}
              style={{
                flex: 1,
                padding: '7px 10px',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: cycleMode === 'active' ? '#ffffff' : 'transparent',
                color: cycleMode === 'active' ? '#1e293b' : '#64748b',
                fontWeight: cycleMode === 'active' ? 700 : 500,
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow: cycleMode === 'active' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              ⚡ {t('Active Duration')} ({expenses.length})
            </button>
            <button
              type="button"
              onClick={() => setCycleMode('all')}
              style={{
                flex: 1,
                padding: '7px 10px',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: cycleMode === 'all' ? '#ffffff' : 'transparent',
                color: cycleMode === 'all' ? '#1e293b' : '#64748b',
                fontWeight: cycleMode === 'all' ? 700 : 500,
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow: cycleMode === 'all' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              📜 {t('All History')} ({(allExpenses || []).length})
            </button>
          </div>
        )}

        {/* Top KPI Cards (Issued, Spent, Remaining) directly in Expenses */}
        {isLoading ? (
          <ExpensesKpiSkeleton />
        ) : (
          <div className="mb-5 grid w-full grid-cols-3 gap-2 sm:gap-3">
            <div className="flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 p-2.5 sm:p-3">
              <span className="truncate text-xs font-bold text-blue-700">{cycleMode === 'active' ? t('Issued') : t('Net Issued')}</span>
              <span className="truncate text-base sm:text-lg font-extrabold text-blue-700">₹ {displayIssuedMoney.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-2xl border border-purple-100 bg-purple-50 p-2.5 sm:p-3">
              <span className="truncate text-xs font-bold text-purple-700">{t('Spent')}</span>
              <span className="truncate text-base sm:text-lg font-extrabold text-purple-700">₹ {totalSpent.toLocaleString('en-IN')}</span>
            </div>

            <div className={`flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-2xl border p-2.5 sm:p-3 ${isOverspent ? 'border-rose-200 bg-rose-50' : 'border-emerald-100 bg-emerald-50'}`}>
              <span className={`truncate text-xs font-bold ${isOverspent ? 'text-rose-700' : 'text-emerald-700'}`}>{isOverspent ? t('Overspent') : t('Remaining')}</span>
              <span className={`truncate text-base sm:text-lg font-extrabold ${isOverspent ? 'text-rose-700' : 'text-emerald-700'}`}>₹ {Math.abs(remaining).toLocaleString('en-IN')}</span>
            </div>
          </div>
        )}
        {cycleMode === 'active' && (
          <div style={{ marginTop: '-14px', marginBottom: '12px', color: '#64748b', fontSize: '12px' }}>
            {t('Available amount after any previous overspend adjustment.')}
          </div>
        )}
        {isOverspent && (
          <div role="status" style={{ marginTop: '10px', padding: '10px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', color: '#9a3412', fontSize: '12.5px', lineHeight: 1.45 }}>
            Spending is ₹{Math.abs(remaining).toLocaleString('en-IN')} above the amount available for this period. The manager can account for the deficit when issuing money.
          </div>
        )}

        {/* If in All History: sub-toggle between All Expenses list and Issued Money History */}
        {cycleMode === 'all' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            padding: '3px',
            borderRadius: '12px',
            marginTop: '2px',
            marginBottom: '10px',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={() => setHistoryView('expenses')}
              style={{
                flex: 1,
                padding: '7px 10px',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: historyView === 'expenses' ? '#1e69ff' : 'transparent',
                color: historyView === 'expenses' ? '#ffffff' : '#64748b',
                fontWeight: historyView === 'expenses' ? 700 : 500,
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow: historyView === 'expenses' ? '0 1px 4px rgba(30,105,255,0.35)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              🧾 All Expenses ({allExpenses.length})
            </button>
            <button
              type="button"
              onClick={() => setHistoryView('issued')}
              style={{
                flex: 1,
                padding: '7px 10px',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: historyView === 'issued' ? '#1e69ff' : 'transparent',
                color: historyView === 'issued' ? '#ffffff' : '#64748b',
                fontWeight: historyView === 'issued' ? 700 : 500,
                fontSize: '12.5px',
                cursor: 'pointer',
                boxShadow: historyView === 'issued' ? '0 1px 4px rgba(30,105,255,0.35)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              💰 Issued Records ({filteredTransactions.length})
            </button>
          </div>
        )}

        {/* Search & Date Filter Drawer */}
        {showFilterPanel && (
          <div className="task-filter-panel animate-fade-in" style={{ marginBottom: '14px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                className="task-search-input"
                placeholder={t('Search expenses, title, category, added by...')}
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

            {/* Employee Filter Chips */}
            {employees && employees.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Employee:</span>
                <div className="task-priority-chips">
                  {['All', ...Array.from(new Set(employees.map(e => e.name).filter(Boolean)))].map((emp) => (
                    <button
                      key={emp}
                      type="button"
                      className={`task-priority-chip ${selectedEmployeeFilter === emp ? 'active' : ''}`}
                      onClick={() => setSelectedEmployeeFilter(emp)}
                    >
                      {emp}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Single-row Filter: Year dropdown, Month dropdown, Calendar icon */}
            <div 
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                boxSizing: 'border-box',
                marginTop: '6px'
              }}
            >
              {/* Year Dropdown */}
              <select
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setSelectedDate('');
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: selectedYear !== 'All' && !selectedDate ? '1.5px solid #1e69ff' : '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#0f172a',
                  outline: 'none',
                  cursor: 'pointer',
                  flex: '1 1 0',
                  minWidth: '0'
                }}
              >
                <option value="All">All Years</option>
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>

              {/* Month Dropdown */}
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setSelectedDate('');
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: selectedMonth !== 'All' && !selectedDate ? '1.5px solid #1e69ff' : '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#0f172a',
                  outline: 'none',
                  cursor: 'pointer',
                  flex: '1.2 1 0',
                  minWidth: '0'
                }}
              >
                {MONTHS_LIST.map(m => (
                  <option key={m.value} value={m.value}>{m.name}</option>
                ))}
              </select>

              {/* Calendar Icon Button */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: selectedDate ? '#eff6ff' : '#ffffff',
                    border: selectedDate ? '1.5px solid #1e69ff' : '1px solid #cbd5e1',
                    color: selectedDate ? '#1e69ff' : '#64748b',
                    cursor: 'pointer',
                    height: '36px',
                    boxSizing: 'border-box'
                  }}
                  title={selectedDate ? `Selected: ${selectedDate}` : "Pick Date"}
                >
                  <Calendar size={18} color={selectedDate ? '#1e69ff' : '#64748b'} />
                  {selectedDate && (
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e69ff', whiteSpace: 'nowrap' }}>
                      {new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </div>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedDate(val);
                    if (val) {
                      const [y, m] = val.split('-');
                      if (y) setSelectedYear(y);
                      if (m) setSelectedMonth(m);
                    }
                  }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%'
                  }}
                />
                {selectedDate && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDate('');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      color: '#64748b',
                      cursor: 'pointer',
                      marginLeft: '4px',
                      flexShrink: 0,
                      zIndex: 2
                    }}
                    title="Clear date"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Issued Money History Section (shown when in All History and Issued Records view is selected) */}
        {cycleMode === 'all' && historyView === 'issued' && (
          <section style={{ marginTop: '6px', marginBottom: '22px' }} aria-label="Issued money history">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 4px 10px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#1e293b' }}>Issued Money History</span>
                <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '6px' }}>({filteredTransactions.length} {filteredTransactions.length === 1 ? 'record' : 'records'})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '9px',
                    backgroundColor: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)'
                  }}
                >
                  <FileSpreadsheet size={14} />
                  <span>{downloadSuccess ? t('Downloaded!') : t('Export Excel')}</span>
                </button>
              </div>
            </div>

            {/* Direct Flat List of Issued Records (No dropdown/accordion) */}
            {filteredTransactions.length === 0 ? (
              <div className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-7 text-center text-sm text-slate-400">
                No money has been issued yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredTransactions.map((transaction) => {
                  const amount = Number(transaction.amount) || 0;
                  const deducted = Number(transaction.deductedAmount) || 0;
                  const netAmount = Number(transaction.netAmount ?? (amount - deducted)) || 0;
                  const issueExpenses = expensesByIssue.get(getTransactionKey(transaction)) || [];
                  const issueSpent = issueExpenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
                  const transactionKey = getTransactionKey(transaction);
                  const issueDate = transaction.createdAt
                    ? new Date(transaction.createdAt).toLocaleDateString()
                    : (transaction.date || 'Date unavailable');
                  const empName = transaction.employeeName || 'Employee';

                  return (
                    <div
                      key={transactionKey}
                      onClick={() => setSelectedIssuedTransaction(transaction)}
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1.5px solid #f1f5f9',
                        borderRadius: '14px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      title="Tap to view Full Details"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '12px',
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
                          ₹
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#0f172a',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {empName} · {transaction.purpose || 'Office Expenses'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', marginTop: '2px', flexWrap: 'wrap' }}>
                            <span>{issueDate}</span>
                            <span>•</span>
                            <span style={{ color: issueExpenses.length > 0 ? '#1e69ff' : '#64748b', fontWeight: 600 }}>
                              {issueExpenses.length} {issueExpenses.length === 1 ? 'purchase' : 'purchases'} (Spent ₹{issueSpent.toLocaleString('en-IN')})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                            ₹ {amount.toLocaleString('en-IN')}
                          </div>
                          {deducted > 0 ? (
                            <div style={{ color: '#059669', fontSize: '11px', fontWeight: 700, marginTop: '1px' }}>
                              ₹ {netAmount.toLocaleString('en-IN')} for office
                            </div>
                          ) : (
                            <div style={{ color: '#64748b', fontSize: '11px', marginTop: '1px' }}>
                              Office budget
                            </div>
                          )}
                        </div>
                        <ChevronRight size={17} color="#94a3b8" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Expenses List: shown in Active Duration mode OR when in All History with All Expenses view */}
        {(cycleMode === 'active' || (cycleMode === 'all' && historyView === 'expenses')) && (
          <>
            {/* Expenses Count Label, Expand/Collapse & Export Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', padding: '0 4px', flexWrap: 'wrap', gap: '8px' }} className="animate-fade-up delay-3">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b' }}>
                  {filteredExpenses.length} {filteredExpenses.length === 1 ? 'Expense' : 'Expenses'}
                </span>
                {cycleMode === 'all' && isAdmin && (
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    (All team members)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleDownloadExcel}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '9px',
                  backgroundColor: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)'
                }}
              >
                <FileSpreadsheet size={14} />
                <span>{downloadSuccess ? t('Downloaded!') : t('Export Excel')}</span>
              </button>
            </div>

            {/* Direct Flat List of All Expenses (No dropdown/accordion) */}
            {isLoading ? (
              <ExpenseItemsSkeleton count={4} />
            ) : (
              <div className="w-full divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {filteredExpenses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 0', color: '#94a3b8', fontSize: '14px' }}>
                    <div>No expenses recorded for {activeFilterText}.</div>
                  </div>
                ) : (
                  filteredExpenses.map((item) => (
                    <div 
                      key={item._id || item.id} 
                      className="flex w-full min-w-0 cursor-pointer items-center gap-3 px-3 py-3 transition hover:bg-slate-50 sm:px-4"
                      onClick={() => onSelectExpense && onSelectExpense(item)}
                      title="Tap to view Expense Details"
                    >
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-blue-50">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-blue-50 text-sm font-bold text-blue-600">
                            {item.title ? item.title[0].toUpperCase() : '₹'}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-900">{item.title}</div>
                        <div className="truncate text-xs text-slate-500">
                          {[item.userName || item.addedBy || 'Employee', item.date, item.category].filter(Boolean).join(' • ')}
                        </div>
                      </div>

                      <div className="shrink-0 text-sm font-bold text-slate-800">
                        ₹ {Number(item.amount).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
