import React, { useState, useMemo } from 'react';
import { ArrowLeft, CheckCircle2, Receipt, ChevronRight, Calendar, SlidersHorizontal, X, Download, FileSpreadsheet, Check } from 'lucide-react';
import IssuedMoneyDetailsScreen from '../../expenses/components/IssuedMoneyDetailsScreen';
import { backIconButton, screenBody, screenFrame, screenHeader, screenHeaderGroup, screenTitle } from '../../../utils/tailwindClasses';
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

const getTransactionKey = (transaction) => String(
  transaction._id || transaction.id ||
  `${normalizeIdentity(transaction.employee || transaction.employeeId || transaction.employeeName)}:${getRecordTimestamp(transaction)}:${transaction.amount}:${transaction.purpose || ''}`
);

export default function EmployeeReportScreen({
  employee = {
    id: '3',
    name: 'Amit Patel',
    role: 'Employee',
    status: 'Active',
    email: 'amit.patel@company.com'
  },
  tasks = [],
  expenses = [],
  issuedTransactions = [],
  settlements = [],
  onSettleCycle,
  onBack,
  onSelectTask,
  onSelectExpense
}) {
  const { t } = useLanguage();
  const [reportView, setReportView] = useState('overview'); // 'overview', 'tasks', 'expenses'
  const [cycleMode, setCycleMode] = useState('active'); // 'active', 'all'
  const [historyView, setHistoryView] = useState('expenses'); // 'expenses', 'issued'
  const [selectedIssuedTransaction, setSelectedIssuedTransaction] = useState(null);
  const [openExpenseMonths, setOpenExpenseMonths] = useState({});
  const now = new Date();
  const currentYearStr = String(now.getFullYear());
  const currentMonthStr = String(now.getMonth() + 1).padStart(2, '0');

  const [selectedYear, setSelectedYear] = useState(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedDate, setSelectedDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleNotes, setSettleNotes] = useState('');
  const [isSettling, setIsSettling] = useState(false);

  const toggleExpenseMonth = (key, currentOpen) => {
    setOpenExpenseMonths((prev) => ({
      ...prev,
      [key]: !currentOpen
    }));
  };

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

  // Helper to extract timestamp from item
  const getItemTimestamp = (item) => {
    if (item.createdAt) {
      const t = new Date(item.createdAt).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (item.id) {
      const t = Number(item.id);
      if (!isNaN(t) && t > 1000000000000) return t;
    }
    return 0;
  };

  // 0. Employee Settlement Cycles History
  const empSettlements = (settlements || []).filter(item =>
    item.employeeId === employee.id ||
    item.employee === employee.id ||
    item.employeeName?.toLowerCase().includes(employee.name.toLowerCase())
  ).sort((a, b) => new Date(b.settledAt || b.createdAt || 0) - new Date(a.settledAt || a.createdAt || 0));

  const latestSettlement = empSettlements[0] || null;
  const lastSettledTimestamp = latestSettlement ? new Date(latestSettlement.settledAt || latestSettlement.createdAt).getTime() : 0;
  const carriedForwardBalance = latestSettlement ? (Number(latestSettlement.balance) || 0) : 0;

  // 1. Employee Tasks
  const allEmpTasks = tasks.filter(t =>
    t.assignedTo?.toLowerCase().includes(employee.name.toLowerCase())
  );
  const empTasks = allEmpTasks
    .filter(matchesDateFilter)
    .filter(t => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (t.title || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.priority || '').toLowerCase().includes(q);
    });

  // 2. Employee Active Expenses (Created after last settlement)
  const allEmpExpenses = expenses.filter(e => {
    const creator = (e.userName || e.addedBy || '').toLowerCase();
    const empName = (employee.name || '').toLowerCase();
    const empId = String(employee.id || employee._id || '').toLowerCase();
    const expUserId = String(e.user || e.userId || '').toLowerCase();
    if (empId && expUserId && empId === expUserId) return true;
    return creator && (creator.includes(empName) || empName.includes(creator));
  });
  const activeCycleExpenses = allEmpExpenses.filter(e => {
    if (!lastSettledTimestamp) return true;
    const t = getItemTimestamp(e);
    return !t || t >= lastSettledTimestamp;
  });

  const allTimeEmpExpenses = allEmpExpenses
    .filter(matchesDateFilter);

  const activeEmpExpenses = activeCycleExpenses;

  const empExpenses = cycleMode === 'active' ? activeEmpExpenses : allTimeEmpExpenses;

  // 3. Employee Active Issued Transactions (Issued after last settlement)
  const allEmpIssued = issuedTransactions.filter(item => {
    const empName = (employee.name || '').toLowerCase();
    const empId = String(employee.id || employee._id || '').toLowerCase();
    const txEmpName = (item.employeeName || '').toLowerCase();
    const txEmpId = String(item.employee || item.employeeId || '').toLowerCase();
    if (empId && txEmpId && empId === txEmpId) return true;
    return txEmpName && (txEmpName.includes(empName) || empName.includes(txEmpName));
  });
  const activeCycleIssued = allEmpIssued.filter(item => {
    if (!lastSettledTimestamp) return true;
    const t = getItemTimestamp(item);
    return !t || t >= lastSettledTimestamp;
  });

  const allTimeEmpIssued = allEmpIssued
    .filter(matchesDateFilter);

  const activeEmpIssued = activeCycleIssued;

  const empIssuedList = cycleMode === 'active' ? activeEmpIssued : allTimeEmpIssued;

  const availableYears = useMemo(() => {
    const yearsSet = new Set();
    yearsSet.add(currentYearStr);

    [...issuedTransactions, ...expenses, ...tasks].forEach(item => {
      const d = parseRecordDate(item);
      if (d && !isNaN(d.getTime())) {
        yearsSet.add(String(d.getFullYear()));
      }
    });

    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [issuedTransactions, expenses, tasks, currentYearStr]);

  // Group employee expenses under their respective issued money transaction
  const expensesByIssue = new Map(
    allEmpIssued.map(transaction => [getTransactionKey(transaction), []])
  );

  const sortedIssuesDesc = [...allEmpIssued].sort((a, b) => getRecordTimestamp(b) - getRecordTimestamp(a));

  allEmpExpenses.forEach((expense) => {
    const expenseTime = getRecordTimestamp(expense);

    const matchingIssues = sortedIssuesDesc.filter(transaction => {
      const issueTime = getRecordTimestamp(transaction);
      return issueTime > 0 && issueTime <= expenseTime;
    });
    // Pick the most recent issue prior to the expense; fallback to nearest/earliest issue so no purchases are lost
    const issue = matchingIssues[0] || sortedIssuesDesc[sortedIssuesDesc.length - 1] || sortedIssuesDesc[0];
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

  // Dynamic Financial Calculations (Active Cycle with Carried Forward balance vs All History)

  // Group allTimeEmpExpenses by month & year, sorted newest first
  const expenseMonthGroups = useMemo(() => {
    const groupsMap = new Map();

    allTimeEmpExpenses.forEach((item) => {
      const d = parseRecordDate(item);
      const key = getMonthYearKey(d);
      const label = getMonthYearLabel(d);

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          label,
          year: d.getFullYear(),
          month: d.getMonth(),
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
  }, [allTimeEmpExpenses]);

  const allExpenseMonthsExpanded = expenseMonthGroups.length > 0 && expenseMonthGroups.every((g) => Boolean(openExpenseMonths[g.key]));

  const handleToggleAllExpenseMonths = () => {
    const targetState = !allExpenseMonthsExpanded;
    const nextMap = {};
    expenseMonthGroups.forEach((g) => {
      nextMap[g.key] = targetState;
    });
    setOpenExpenseMonths(nextMap);
  };

  // Dynamic Financial Calculations (Active Cycle with Carried Forward balance vs All History)
  const newlyIssuedInCycle = activeEmpIssued.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const activeTotalIssued = newlyIssuedInCycle + carriedForwardBalance;
  const activeTotalSpent = activeEmpExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const activeRemaining = activeTotalIssued - activeTotalSpent;

  const allTotalIssued = allTimeEmpIssued.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const allTotalSpent = allTimeEmpExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const allRemaining = allTotalIssued - allTotalSpent;

  const totalIssued = cycleMode === 'active' ? activeTotalIssued : allTotalIssued;
  const totalSpent = cycleMode === 'active' ? activeTotalSpent : allTotalSpent;
  const remaining = cycleMode === 'active' ? activeRemaining : allRemaining;

  const pendingTasks = empTasks.filter(t => !t.completed).length;
  const completedTasks = empTasks.filter(t => t.completed).length;

  const handleConfirmSettle = async () => {
    setIsSettling(true);
    const settlementData = {
      id: Date.now().toString(),
      employeeId: employee.id,
      employeeName: employee.name,
      totalIssued: totalIssued,
      newlyIssued: newlyIssuedInCycle,
      carriedForwardPrevious: carriedForwardBalance,
      totalSpent: totalSpent,
      balance: remaining, // This carries forward into the next cycle
      carryForward: true,
      settledBy: 'Admin',
      settledAt: new Date().toISOString(),
      settledDateStr: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      expensesCount: empExpenses.length,
      notes: settleNotes.trim() || 'Settled and carried forward balance'
    };

    if (onSettleCycle) {
      await onSettleCycle(settlementData);
    }

    setIsSettling(false);
    setIsSettleModalOpen(false);
    setSettleNotes('');
  };

  const handleDownloadExcel = () => {
    try {
      const safeStr = (str) => `"${String(str || '').replace(/"/g, '""')}"`;

      const headers = ['#', 'Date', 'Expense Title', 'Category', 'Amount (INR)', 'Added By', 'Receipt Attached'];

      const rows = empExpenses.map((e, idx) => [
        idx + 1,
        safeStr(e.date || 'N/A'),
        safeStr(e.title || 'Untitled Expense'),
        safeStr(e.category || 'Office Supplies'),
        Number(e.amount || 0).toFixed(2),
        safeStr(e.addedBy || employee.name || 'Employee'),
        (e.imageUrl || (e.proofImages && e.proofImages.length > 0)) ? 'Yes' : 'No'
      ]);

      let csvContent = '\uFEFF'; // UTF-8 BOM ensures proper Unicode handling in Excel
      csvContent += `OFFICE CRM - EMPLOYEE EXPENSE REPORT\n`;
      csvContent += `Employee Name,${safeStr(employee.name || 'Employee')}\n`;
      csvContent += `Role,${safeStr(employee.role || 'Staff')}\n`;
      csvContent += `Email,${safeStr(employee.email || '')}\n`;
      csvContent += `Period / Filter,${safeStr(activeFilterText)}\n`;
      csvContent += `Report Exported At,${safeStr(new Date().toLocaleString())}\n`;
      csvContent += `\n`;
      csvContent += `FINANCIAL SUMMARY\n`;
      csvContent += `Total Issued (INR),${Number(totalIssued || 0).toFixed(2)}\n`;
      csvContent += `Total Spent (INR),${Number(totalSpent || 0).toFixed(2)}\n`;
      csvContent += `Remaining Balance (INR),${Number(remaining || 0).toFixed(2)}\n`;
      csvContent += `\n`;
      csvContent += `ITEMIZED EXPENSES (${empExpenses.length} Records)\n`;
      csvContent += headers.join(',') + '\n';

      rows.forEach(r => {
        csvContent += r.join(',') + '\n';
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const cleanName = (employee.name || 'Employee').replace(/[^a-zA-Z0-9]/g, '_');
      link.setAttribute('href', url);
      link.setAttribute('download', `${cleanName}_Expense_Report_${activeFilterText.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to export excel:', err);
      alert('Could not download expense report. Please try again.');
    }
  };

  if (selectedIssuedTransaction) {
    let issueExpenses = expensesByIssue.get(getTransactionKey(selectedIssuedTransaction));
    if (!issueExpenses || issueExpenses.length === 0) {
      const selId = String(selectedIssuedTransaction._id || selectedIssuedTransaction.id || '');
      for (const [k, expList] of expensesByIssue.entries()) {
        if (selId && k.includes(selId)) {
          issueExpenses = expList;
          break;
        }
      }
    }
    if ((!issueExpenses || issueExpenses.length === 0) && allEmpIssued.length <= 1) {
      issueExpenses = allEmpExpenses;
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
    <div className={screenFrame}>
      {/* 1. Top Header */}
      <header className={screenHeader}>
        <div className={screenHeaderGroup}>
          <button
            type="button"
            className={backIconButton}
            onClick={reportView === 'overview' ? onBack : () => setReportView('overview')}
            aria-label="Go Back"
          >
            <ArrowLeft size={22} />
          </button>
          <div>
            <h2 className={screenTitle}>
              {reportView === 'overview' && t('Employee Report')}
              {reportView === 'tasks' && t('Employee Tasks')}
              {reportView === 'expenses' && t('Employee Expenses')}
            </h2>
            <span style={{ fontSize: '11.5px', color: '#93c5fd', opacity: 0.9 }}>
              {employee.name} · {reportView === 'overview' ? t('Overview & Options') : (reportView === 'tasks' ? `${empTasks.length} ${t('Assigned Tasks')}` : `${cycleMode === 'active' ? activeEmpExpenses.length : allEmpExpenses.length} ${t('Records')}`)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {reportView === 'overview' && (
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
              aria-label={t('Download Expense Report')}
              onClick={handleDownloadExcel}
              title={t('Download Expense Report (Excel)')}
              style={{ color: '#4ade80' }}
            >
              <Download size={19} />
            </button>
          )}

          {reportView === 'expenses' && (
            <>
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
                aria-label={t('Download Expense Report')}
                onClick={handleDownloadExcel}
                title={t('Download Expense Report (Excel)')}
                style={{ color: '#4ade80' }}
              >
                <Download size={19} />
              </button>
              {cycleMode === 'all' && (
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white transition hover:bg-white/20"
                  aria-label="Filter"
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                  title={t('Date Filter')}
                  style={{ background: showFilterPanel ? '#1e69ff' : 'rgba(255, 255, 255, 0.08)' }}
                >
                  <SlidersHorizontal size={18} />
                </button>
              )}
            </>
          )}

          {reportView === 'tasks' && (
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white transition hover:bg-white/20"
              aria-label="Filter"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              title={t('Search & Filters')}
              style={{ background: showFilterPanel ? '#1e69ff' : 'rgba(255, 255, 255, 0.08)' }}
            >
              <SlidersHorizontal size={18} />
            </button>
          )}
        </div>
      </header>

      {/* 2. Curved White Body */}
      <div className={screenBody} style={{ paddingBottom: '60px', gap: '16px' }}>

        {/* Employee Card */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            border: '1.5px solid #f1f5f9'
          }}
        >
          <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eff6ff', color: '#1e69ff', fontSize: '20px', fontWeight: 700 }}>
              {employee.name?.trim()?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <span
              style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                border: '2px solid #ffffff'
              }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '16.5px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {employee.name}
              </h3>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '20px',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb'
                }}
              >
                {employee.role}
              </span>
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
              {employee.email || `${employee.name.toLowerCase().replace(/\s+/g, '.')}@company.com`}
            </div>
          </div>
        </div>

        {/* OVERVIEW VIEW: Quick Actions, Financial Summary, and 2 Big Options */}
        {reportView === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Section Heading for the Two Options */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginTop: '2px', marginBottom: '-6px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                Employee Sections
              </span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Tap to open & manage
              </span>
            </div>

            {/* THE TWO OPTIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Option 1: Tasks Option Tile */}
              <div
                onClick={() => setReportView('tasks')}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '18px',
                  border: '1.5px solid #e2e8f0',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(15, 29, 56, 0.03)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    backgroundColor: '#eff6ff',
                    color: '#1e69ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        Tasks
                      </h4>
                      <span style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: '#eff6ff',
                        color: '#1e69ff'
                      }}>
                        {empTasks.length} Total
                      </span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#ea580c', fontWeight: 600 }}>
                        {empTasks.filter(t => !t.completed).length} Pending
                      </span>
                      <span>•</span>
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>
                        {empTasks.filter(t => t.completed).length} Completed
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#1e69ff', fontWeight: 700, fontSize: '13px' }}>
                  <ChevronRight size={18} />
                </div>
              </div>

              {/* Option 2: Expenses Option Tile */}
              <div
                onClick={() => setReportView('expenses')}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '18px',
                  border: '1.5px solid #e2e8f0',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  boxShadow: '0 3px 12px rgba(15, 29, 56, 0.03)',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    backgroundColor: '#f0fdf4',
                    color: '#16a34a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Receipt size={24} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                        Expenses
                      </h4>
                      <span style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        backgroundColor: '#f0fdf4',
                        color: '#16a34a'
                      }}>
                        {activeEmpExpenses.length} Active Bills
                      </span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>
                        Spent ₹ {totalSpent.toLocaleString('en-IN')}
                      </span>
                      <span>•</span>
                      <span style={{ color: remaining >= 0 ? '#16a34a' : '#e11d48', fontWeight: 600 }}>
                        {remaining >= 0 ? `₹ ${remaining.toLocaleString('en-IN')} Left` : `-₹ ${Math.abs(remaining).toLocaleString('en-IN')} Over`}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontWeight: 700, fontSize: '13px' }}>
                  <ChevronRight size={18} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* EXPENSES VIEW: Active Duration vs All History Toggle, Budget Stats & Filters */}
        {reportView === 'expenses' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Active Duration vs All History Pill Toggle */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#f1f5f9',
                padding: '4px',
                borderRadius: '12px',
                gap: '4px'
              }}
            >
              <button
                type="button"
                onClick={() => setCycleMode('active')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
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
                Active Duration ({activeCycleExpenses.length})
              </button>
              <button
                type="button"
                onClick={() => setCycleMode('all')}
                style={{
                  flex: 1,
                  padding: '8px 10px',
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
                All History ({allTimeEmpIssued.length})
              </button>
            </div>

            {/* Single-row Filter: Year dropdown, Month dropdown, Calendar icon */}
            {cycleMode === 'all' && showFilterPanel && (
              <div
                className="animate-fade-in"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  marginBottom: '6px',
                  width: '100%',
                  boxSizing: 'border-box'
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
                    backgroundColor: '#f8fafc',
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
                    backgroundColor: '#f8fafc',
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
                      backgroundColor: selectedDate ? '#eff6ff' : '#f8fafc',
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
            )}

            {/* Financial Overview Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: '-6px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
                {cycleMode === 'active' ? 'Active Cycle Overview' : 'All Time Financial Overview'}
              </span>
            </div>

            {/* Financial Tri-Cards (Issued, Spent, Remaining) in same row */}
            <div className="grid w-full grid-cols-3 gap-2 sm:gap-3">
              <div className="flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-2xl border border-blue-100 bg-blue-50 p-2.5 sm:p-4">
                <span className="truncate text-xs font-bold text-blue-700">{cycleMode === 'active' ? 'Issued' : 'All Issued'}</span>
                <span className="truncate text-base sm:text-lg font-extrabold text-blue-700">₹ {totalIssued.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-2xl border border-purple-100 bg-purple-50 p-2.5 sm:p-4">
                <span className="truncate text-xs font-bold text-purple-700">{cycleMode === 'active' ? 'Spent' : 'All Spent'}</span>
                <span className="truncate text-base sm:text-lg font-extrabold text-purple-700">₹ {totalSpent.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50 p-2.5 sm:p-4">
                <span className="truncate text-xs font-bold text-emerald-700">{cycleMode === 'active' ? 'Remaining' : 'Net Balance'}</span>
                <span className="truncate text-base sm:text-lg font-extrabold text-emerald-700">₹ {remaining.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Carried Forward Banner (Visible in Active Mode when previous settlement exists) */}
            {latestSettlement && cycleMode === 'active' && (
              <div style={{
                backgroundColor: carriedForwardBalance >= 0 ? '#f0fdf4' : '#fff1f2',
                border: `1.5px solid ${carriedForwardBalance >= 0 ? '#bbf7d0' : '#fecdd3'}`,
                borderRadius: '14px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                marginTop: '-6px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{carriedForwardBalance >= 0 ? '🔄' : '⚠️'}</span>
                  <div>
                    <div style={{
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: carriedForwardBalance >= 0 ? '#166534' : '#9f1239'
                    }}>
                      {carriedForwardBalance >= 0
                        ? 'Carried Forward from Last Settlement'
                        : 'Personal Pocket Pay Back'
                      }
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: carriedForwardBalance >= 0 ? '#15803d' : '#be123c'
                    }}>
                      {carriedForwardBalance >= 0
                        ? `Settled on ${latestSettlement.settledDateStr || 'previous cycle'}`
                        : `${employee.name} spent ₹${Math.abs(carriedForwardBalance).toLocaleString('en-IN')} from personal pocket in previous cycle (paid back on next cash issuance)`
                      }
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  color: carriedForwardBalance >= 0 ? '#16a34a' : '#e11d48'
                }}>
                  {carriedForwardBalance >= 0 ? '+' : '-'} ₹ {Math.abs(carriedForwardBalance).toLocaleString('en-IN')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Task Search Bar (when viewing tasks) */}
        {showFilterPanel && reportView === 'tasks' && (
          <div className="mb-1 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="relative w-full">
              <input
                type="text"
                className="w-full pr-10"
                placeholder={t('Search assigned tasks...')}
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
          </div>
        )}

        {/* VIEW 2: Employee Tasks */}
        {reportView === 'tasks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Tasks Section Header Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: '2px' }}>
              <div>
                <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>
                  All Assigned Tasks
                </span>
                <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '8px' }}>
                  ({empTasks.length} total)
                </span>
              </div>
            </div>

            {empTasks.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px 20px',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '1.5px dashed #cbd5e1',
                color: '#64748b',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e69ff' }}>
                  <CheckCircle2 size={24} />
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                  No tasks assigned to {employee.name} yet.
                </div>
                <div style={{ fontSize: '12.5px', color: '#94a3b8', maxWidth: '280px' }}>
                  Assigned office tasks and their completion status will appear here.
                </div>
              </div>
            ) : (
              empTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTask && onSelectTask(t)}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    border: '1.5px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, marginRight: '10px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: t.completed ? '#dcfce7' : '#fed7aa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: t.completed ? '#16a34a' : '#ea580c',
                        flexShrink: 0
                      }}
                    >
                      <CheckCircle2 size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: t.completed ? '#64748b' : '#0f172a',
                        textDecoration: t.completed ? 'line-through' : 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{t.dateTime || t.date || 'Today'}</span>
                        <span>•</span>
                        <span style={{ fontWeight: 600, color: t.completed ? '#16a34a' : '#ea580c' }}>
                          {t.completed ? 'Completed' : 'Pending'}
                        </span>
                        {t.priority && (
                          <>
                            <span>•</span>
                            <span style={{
                              fontSize: '11px',
                              padding: '1px 6px',
                              borderRadius: '6px',
                              backgroundColor: (t.priority.toLowerCase() === 'high' ? '#fee2e2' : (t.priority.toLowerCase() === 'medium' ? '#ffedd5' : '#f1f5f9')),
                              color: (t.priority.toLowerCase() === 'high' ? '#dc2626' : (t.priority.toLowerCase() === 'medium' ? '#c2410c' : '#475569')),
                              fontWeight: 700
                            }}>
                              {t.priority}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <ChevronRight size={18} color="#94a3b8" />
                </div>
              ))
            )}

            {/* Back to Options button */}
            <button
              type="button"
              onClick={() => setReportView('overview')}
              style={{
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '14px',
                border: '1.5px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#1e69ff',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} />
              <span>{t('Back to Employee Overview')}</span>
            </button>
          </div>
        )}

        {/* VIEW 3: Employee Expenses (Active Duration: active bills; All History: grouped issued cycles) */}
        {reportView === 'expenses' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cycleMode === 'active' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: '2px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                    {activeEmpExpenses.length} Expense{activeEmpExpenses.length === 1 ? '' : 's'} recorded
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleDownloadExcel}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 13px',
                        borderRadius: '10px',
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(22, 163, 74, 0.28)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {downloadSuccess ? (
                        <>
                          <Check size={15} />
                          <span>{t('Downloaded!')}</span>
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet size={15} />
                          <span>{t('Export Excel')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {downloadSuccess && (
                  <div style={{
                    backgroundColor: '#dcfce7',
                    border: '1px solid #86efac',
                    color: '#15803d',
                    padding: '9px 12px',
                    borderRadius: '12px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <CheckCircle2 size={16} color="#16a34a" />
                    <span>Excel Expense Report downloaded (.csv)!</span>
                  </div>
                )}

                {activeEmpExpenses.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 0', color: '#94a3b8', fontSize: '13.5px' }}>
                    No active expenses recorded for {employee.name} in current cycle.
                  </div>
                ) : (
                  activeEmpExpenses.map((e) => (
                    <div
                      key={e.id}
                      onClick={() => onSelectExpense && onSelectExpense(e)}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '14px',
                        padding: '14px',
                        border: '1.5px solid #f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0, marginRight: '12px' }}>
                        <img src={e.imageUrl} alt={e.title} style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#0f172a',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            wordBreak: 'break-word',
                            lineHeight: 1.35
                          }}>
                            {e.title}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {[e.date, e.category].filter(Boolean).join(' • ')}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>₹ {e.amount}</div>
                        <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>Approved</span>
                      </div>
                    </div>
                  ))
                )}
              </>
            ) : (
              /* All History */
              <>
                {/* All History - Issued Records View */}

                {/* All History - Issued Records */}

                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', padding: '0 4px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b' }}>
                        {allTimeEmpIssued.length} {allTimeEmpIssued.length === 1 ? 'Record' : 'Records'}
                      </span>
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {allTimeEmpIssued.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '36px 0', color: '#94a3b8', fontSize: '14px', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <div>No money issued to {employee.name} in {activeFilterText}.</div>
                      </div>
                    ) : (
                      allTimeEmpIssued.map((transaction) => {
                        const amount = Number(transaction.amount) || 0;
                        const deducted = Number(transaction.deductedAmount) || 0;
                        const netAmount = Number(transaction.netAmount ?? (amount - deducted)) || 0;
                        const issueExpenses = expensesByIssue.get(getTransactionKey(transaction)) || [];
                        const issueSpent = issueExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
                        const transactionKey = getTransactionKey(transaction);
                        const issueDate = transaction.createdAt
                          ? new Date(transaction.createdAt).toLocaleDateString()
                          : (transaction.date || 'Date unavailable');
                        const empName = employee.name || transaction.employeeName || 'Employee';

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
                      })
                    )}
                  </div>
                </>


              </>
            )}

            {/* Back to Options button */}
            <button
              type="button"
              onClick={() => setReportView('overview')}
              style={{
                marginTop: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '14px',
                border: '1.5px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#16a34a',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} />
              <span>{t('Back to Employee Overview')}</span>
            </button>
          </div>
        )}

      </div>

      {/* Settle Cycle Modal */}
      {isSettleModalOpen && (
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
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Settle Current Cycle
              </h3>
              <button
                type="button"
                onClick={() => setIsSettleModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
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
                <span style={{ color: '#64748b' }}>Newly Issued in Cycle:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>₹ {newlyIssuedInCycle.toLocaleString('en-IN')}</span>
              </div>
              {carriedForwardBalance !== 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Prev Carried Forward:</span>
                  <span style={{ fontWeight: 700, color: carriedForwardBalance >= 0 ? '#16a34a' : '#e11d48' }}>
                    {carriedForwardBalance >= 0 ? '+' : '-'} ₹ {Math.abs(carriedForwardBalance).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Total Spent ({empExpenses.length} bills):</span>
                <span style={{ fontWeight: 600, color: '#9333ea' }}>- ₹ {totalSpent.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700 }}>
                <span>Balance to Carry Forward:</span>
                <span style={{ color: remaining >= 0 ? '#16a34a' : '#e11d48' }}>
                  {remaining >= 0 ? '+' : '-'} ₹ {Math.abs(remaining).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div style={{
              fontSize: '12px',
              color: remaining >= 0 ? '#15803d' : '#be123c',
              backgroundColor: remaining >= 0 ? '#f0fdf4' : '#fff1f2',
              padding: '10px 12px',
              borderRadius: '10px',
              lineHeight: 1.45
            }}>
              {remaining >= 0
                ? `Remaining balance of ₹${remaining.toLocaleString('en-IN')} will carry forward into the new cycle as opening balance.`
                : `Deficit of -₹${Math.abs(remaining).toLocaleString('en-IN')} will carry forward into the new cycle (company owes employee).`
              }
            </div>

            <input
              type="text"
              placeholder="Optional settlement note (e.g. October sprint 1)"
              value={settleNotes}
              onChange={(e) => setSettleNotes(e.target.value)}
              style={{
                width: '100%',
                height: '42px',
                borderRadius: '10px',
                border: '1.5px solid #e2e8f0',
                padding: '0 12px',
                fontSize: '13px',
                outline: 'none'
              }}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setIsSettleModalOpen(false)}
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
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSettle}
                disabled={isSettling}
                style={{
                  flex: 1.3,
                  height: '44px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {isSettling ? 'Settling...' : 'Confirm Settlement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
