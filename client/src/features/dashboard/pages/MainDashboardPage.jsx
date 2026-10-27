import React, { useState, useEffect, useCallback } from 'react';
import DashboardHome from '../components/DashboardHome';
import AdminDashboard from '../../admin/components/AdminDashboard';
import EmployeesPage from '../../admin/components/EmployeesPage';
import TasksPage from '../../tasks/components/TasksPage';
import CreateTaskScreen from '../../tasks/components/CreateTaskScreen';
import CompleteTaskScreen from '../../tasks/components/CompleteTaskScreen';
import TaskCompletedSuccessScreen from '../../tasks/components/TaskCompletedSuccessScreen';
import { getTaskAssignerName } from '../../tasks/utils/taskDisplay';
import ExpensesPage from '../../expenses/components/ExpensesPage';
import ExpenseSummaryScreen from '../../expenses/components/ExpenseSummaryScreen';
import AddExpenseScreen from '../../expenses/components/AddExpenseScreen';
import ExpenseDetailsScreen from '../../expenses/components/ExpenseDetailsScreen';
import ProfilePage from '../../profile/components/ProfilePage';
import IssueMoneyScreen from '../../admin/components/IssueMoneyScreen';
import EmployeeReportScreen from '../../admin/components/EmployeeReportScreen';
import SnoozeTaskModal from '../../tasks/components/SnoozeTaskModal';
import BottomNav from '../../../components/layout/BottomNav';
import DesktopSidebar from '../../../components/layout/DesktopSidebar';
import notificationService from '../../../services/notificationService';
import apiService from '../../../services/api';
import useSwipeBack from '../../../hooks/useSwipeBack';
import { createPortal } from 'react-dom';
import { BellRing, CheckCircle2, ChevronLeft, Receipt, Wallet, BellOff } from 'lucide-react';

export default function MainDashboardPage({ 
  user = { name: 'Admin', role: 'Admin' }, 
  onLogout 
}) {
  const isAdmin = ['admin', 'manager'].includes(user?.role?.toLowerCase());
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'tasks', 'expenses', 'users', 'profile'
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isIssuingMoney, setIsIssuingMoney] = useState(false);
  const [isViewingExpenseSummary, setIsViewingExpenseSummary] = useState(false);
  const [activeExpenseForDetails, setActiveExpenseForDetails] = useState(null);
  const [activeTaskForCompletion, setActiveTaskForCompletion] = useState(null);
  const [completedTaskSuccess, setCompletedTaskSuccess] = useState(null);
  const [selectedEmployeeForReport, setSelectedEmployeeForReport] = useState(null);
  const [activeTaskAlert, setActiveTaskAlert] = useState(null);
  const [taskAlertActionError, setTaskAlertActionError] = useState('');
  const [snoozeModalConfig, setSnoozeModalConfig] = useState({ isOpen: false, taskId: null, title: '' });
  const [isAlertSnoozing, setIsAlertSnoozing] = useState(false);
  const [alertSnoozeError, setAlertSnoozeError] = useState('');

  // Smooth Tab Switch with Skeleton Loading
  const handleTabChange = useCallback((tab) => {
    const effectiveTab = (isAdmin && tab === 'expenses') ? 'users' : tab;
    setSelectedEmployeeForReport(null);
    setActiveTaskForCompletion(null);
    setCompletedTaskSuccess(null);
    setActiveExpenseForDetails(null);
    setIsCreatingTask(false);
    setIsAddingExpense(false);
    setIsIssuingMoney(false);
    setIsViewingExpenseSummary(false);
    if (effectiveTab !== activeTab) {
      setIsTabLoading(true);
      setActiveTab(effectiveTab);
      setTimeout(() => {
        setIsTabLoading(false);
      }, 350);
    } else {
      setActiveTab(effectiveTab);
    }
  }, [isAdmin, activeTab]);

  // Universal WhatsApp / iOS-style Swipe-to-Back Handler
  const handleUniversalBack = useCallback(() => {
    if (selectedEmployeeForReport) {
      setSelectedEmployeeForReport(null);
      return true;
    } else if (completedTaskSuccess) {
      setCompletedTaskSuccess(null);
      handleTabChange('tasks');
      return true;
    } else if (activeTaskForCompletion) {
      notificationService.stopAlarm();
      setActiveTaskForCompletion(null);
      return true;
    } else if (activeExpenseForDetails) {
      setActiveExpenseForDetails(null);
      return true;
    } else if (isCreatingTask) {
      setIsCreatingTask(false);
      return true;
    } else if (isIssuingMoney) {
      setIsIssuingMoney(false);
      return true;
    } else if (isViewingExpenseSummary) {
      setIsViewingExpenseSummary(false);
      return true;
    } else if (isAddingExpense) {
      setIsAddingExpense(false);
      return true;
    } else if (activeTab !== 'home') {
      handleTabChange('home');
      return true;
    }

    return false;
  }, [
    selectedEmployeeForReport,
    completedTaskSuccess,
    activeTaskForCompletion,
    activeExpenseForDetails,
    isCreatingTask,
    isIssuingMoney,
    isViewingExpenseSummary,
    isAddingExpense,
    activeTab,
    handleTabChange
  ]);

  useEffect(() => {
    const handleNativeBack = (event) => {
      if (handleUniversalBack()) {
        event.preventDefault();
      }
    };

    window.addEventListener('nativebackbutton', handleNativeBack);
    return () => window.removeEventListener('nativebackbutton', handleNativeBack);
  }, [handleUniversalBack]);

  const isBackSwipeActive = Boolean(
    selectedEmployeeForReport ||
    completedTaskSuccess ||
    activeTaskForCompletion ||
    activeExpenseForDetails ||
    isCreatingTask ||
    isIssuingMoney ||
    isViewingExpenseSummary ||
    isAddingExpense ||
    activeTab !== 'home'
  );

  const { isDragging, dragProgress } = useSwipeBack(handleUniversalBack, {
    enabled: isBackSwipeActive,
    edgeThreshold: 52,
    minDistance: 75
  });

  // Pure MongoDB Database State (100% Real Database, No LocalStorage Mocking)
  const [issuedTransactions, setIssuedTransactions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // Load Real Data Directly from MongoDB on Mount & on Updates
  const loadRealData = async () => {
    try {
      const [fetchedTasks, fetchedExpenses, fetchedUsers, fetchedTransactions, fetchedSettlements] = await Promise.all([
        apiService.getTasks(),
        apiService.getExpenses(),
        apiService.getUsers(),
        apiService.getTransactions(),
        apiService.getSettlements()
      ]);

      if (Array.isArray(fetchedTasks)) {
        setTasks(fetchedTasks.map(t => ({ ...t, id: t._id || t.id })));
      }
      if (Array.isArray(fetchedExpenses)) {
        setExpenses(fetchedExpenses.map(e => ({ ...e, id: e._id || e.id })));
      }
      if (Array.isArray(fetchedUsers)) {
        setEmployees(fetchedUsers.map(u => ({ ...u, id: u._id || u.id })));
      }
      if (Array.isArray(fetchedTransactions)) {
        const txList = fetchedTransactions.map(tx => ({ ...tx, id: tx._id || tx.id }));
        setIssuedTransactions(txList);
      }
      if (Array.isArray(fetchedSettlements)) {
        setSettlements(fetchedSettlements.map(s => ({ ...s, id: s._id || s.id })));
      }
    } catch (err) {
      console.warn('MongoDB data load error:', err);
    }
  };

  useEffect(() => {
    loadRealData();
    notificationService.init(user).catch((error) => {
      console.error('Notification initialization failed:', error.message);
    });
    const unsubscribeFromAlerts = notificationService.subscribeToAlerts(setActiveTaskAlert);

    const liveUserId = user?.id || user?._id || '';
    const liveUrl = new URL(`${apiService.baseUrl}/events`);
    if (liveUserId) liveUrl.searchParams.set('userId', liveUserId);
    const liveUpdates = new EventSource(liveUrl.toString());
    const refreshData = () => loadRealData();
    liveUpdates.addEventListener('tasks', refreshData);
    liveUpdates.addEventListener('expenses', refreshData);
    liveUpdates.addEventListener('notification', (event) => {
      const notification = JSON.parse(event.data);
      if (['TASK_ASSIGNED', 'TASK_REMINDER', 'TASK_QUICK_ALERT'].includes(notification.type)) {
        notificationService.raiseAlert(notification).catch((error) => {
          console.error('Could not present task alert:', error.message);
        });
      } else {
        notificationService.raiseNotice(notification).catch((error) => {
          console.error('Could not present notification:', error.message);
        });
      }
      refreshData();
    });

    const refreshInterval = window.setInterval(() => {
      if (document.visibilityState === 'visible') refreshData();
    }, 15000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refreshData();
    };
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      liveUpdates.close();
      unsubscribeFromAlerts();
      window.clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [user]);

  const dismissTaskAlert = () => {
    notificationService.stopAlarm();
    setActiveTaskAlert(null);
  };

  const activeAlertTask = activeTaskAlert?.taskId
    ? tasks.find(task => String(task._id || task.id) === String(activeTaskAlert.taskId))
    : null;
  const activeAlertAssignerName = activeAlertTask
    ? getTaskAssignerName(activeAlertTask, employees)
    : '';
  const isUrgentTaskAlert = ['TASK_ASSIGNED', 'TASK_REMINDER', 'TASK_QUICK_ALERT'].includes(activeTaskAlert?.type);

  useEffect(() => {
    if (isUrgentTaskAlert && activeTaskAlert?.taskId && activeAlertTask?.completed) {
      notificationService.stopAlarm();
      setActiveTaskAlert(null);
    }
  }, [activeAlertTask, activeTaskAlert, isUrgentTaskAlert]);

  const snoozeAlertTask = () => {
    if (!activeTaskAlert?.taskId) return;
    setTaskAlertActionError('');
    setAlertSnoozeError('');
    setSnoozeModalConfig({
      isOpen: true,
      taskId: activeTaskAlert.taskId,
      title: activeAlertTask?.title || activeTaskAlert.title || 'Task Reminder'
    });
  };

  const handleConfirmAlertSnooze = async (options) => {
    if (!snoozeModalConfig.taskId) return;
    try {
      setIsAlertSnoozing(true);
      setAlertSnoozeError('');
      await handleSnoozeTask(snoozeModalConfig.taskId, options);
      setSnoozeModalConfig({ isOpen: false, taskId: null, title: '' });
      dismissTaskAlert();
    } catch (error) {
      setAlertSnoozeError(error.message || 'Could not snooze this task.');
    } finally {
      setIsAlertSnoozing(false);
    }
  };

  const openTaskById = async (taskId) => {
    taskId = String(taskId || '');
    if (!taskId) return;
    notificationService.stopAlarm();
    let task = tasks.find(item => String(item._id || item.id) === taskId);
    if (!task && taskId) {
      const fetchedTasks = await apiService.getTasks();
      task = fetchedTasks?.find(item => String(item._id || item.id) === taskId);
      if (task) setTasks(fetchedTasks.map(item => ({ ...item, id: item._id || item.id })));
    }
    try {
      await notificationService.clearTaskNotification(taskId);
    } catch (error) {
      console.error('Could not clear opened task notification:', error.message);
    }
    setActiveTaskAlert(null);
    setActiveTab('tasks');
    if (task && !task.completed) setActiveTaskForCompletion(task);
  };

  const openAlertTask = async () => {
    const taskId = String(activeTaskAlert?.taskId || '');
    await openTaskById(taskId);
  };

  const handleSettleCycle = async (settlementData) => {
    try {
      await apiService.createSettlement(settlementData);
      await loadRealData();
    } catch (e) {
      console.warn('Failed to settle cycle:', e);
    }
  };

  // Actions
  const handleAddEmployee = (newEmp) => {
    setEmployees(prev => [...prev, newEmp]);
    apiService.createEmployee(newEmp);
    notificationService.sendTestAlert(
      'New Employee Added',
      `${newEmp.name} registered as ${newEmp.role}`
    );
  };

  const handleUpdateEmployee = (updatedEmp) => {
    setEmployees(prev => prev.map(e => (e.id === updatedEmp.id || e._id === updatedEmp._id) ? { ...e, ...updatedEmp } : e));
    apiService.updateEmployee(updatedEmp.id || updatedEmp._id, updatedEmp);
    notificationService.sendTestAlert(
      'Employee Updated',
      `${updatedEmp.name}'s details were updated`
    );
  };

  const handleDeleteEmployee = (empId) => {
    setEmployees(prev => prev.filter(e => e.id !== empId && e._id !== empId));
    apiService.deleteEmployee(empId);
  };

  // Helper to extract timestamp from item
  const getItemTimestamp = (item) => {
    if (!item) return 0;
    if (item.createdAt) {
      const t = new Date(item.createdAt).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (item.timestamp) {
      const t = Number(item.timestamp);
      if (!isNaN(t) && t > 0) return t;
    }
    if (item.id) {
      const t = Number(item.id);
      if (!isNaN(t) && t > 1000000000000) return t;
    }
    return 0;
  };

  const normalizeIdentity = (value) => {
    const identity = value && typeof value === 'object' ? value._id || value.id : value;
    return identity == null ? '' : String(identity).trim().toLowerCase();
  };

  const identityMatches = (
    item,
    other,
    itemIdFields,
    itemNameFields,
    otherIdFields = itemIdFields,
    otherNameFields = itemNameFields
  ) => {
    const itemId = itemIdFields.map(field => normalizeIdentity(item[field])).find(Boolean);
    const otherId = otherIdFields.map(field => normalizeIdentity(other[field])).find(Boolean);
    if (itemId && otherId && itemId === otherId) return true;
    const itemName = itemNameFields.map(field => normalizeIdentity(item[field])).find(Boolean);
    const otherName = otherNameFields.map(field => normalizeIdentity(other[field])).find(Boolean);
    return Boolean(itemName && otherName && itemName === otherName);
  };

  const getLatestRecord = (
    item,
    records,
    idFields,
    nameFields,
    timestampField = 'createdAt',
    recordIdFields = idFields,
    recordNameFields = nameFields
  ) =>
    records.filter(record => identityMatches(item, record, idFields, nameFields, recordIdFields, recordNameFields))
      .sort((a, b) => new Date(b[timestampField] || b.createdAt || 0) - new Date(a[timestampField] || a.createdAt || 0))[0] || null;

  const getSettlementTime = (settlement) => settlement
    ? new Date(settlement.settledAt || settlement.createdAt || 0).getTime()
    : 0;

  const getEmployeeCycleStart = (item, idFields, nameFields) => {
    const latestSettlement = getLatestRecord(
      item,
      settlements,
      idFields,
      nameFields,
      'settledAt',
      ['employee', 'employeeId'],
      ['employeeName']
    );
    const latestIssue = getLatestRecord(
      item,
      issuedTransactions,
      idFields,
      nameFields,
      'createdAt',
      ['employee', 'employeeId'],
      ['employeeName']
    );
    return Math.max(getSettlementTime(latestSettlement), getItemTimestamp(latestIssue));
  };

  // Helper to check if an expense belongs to the current user
  const isMyExpense = (item) => {
    const userId = String(user?.id || user?._id || '').trim().toLowerCase();
    const userName = (user?.name || '').trim().toLowerCase();
    if (!userId && !userName) return true; // fallback: show all if no user info
    const itemUserId = String(item.user || item.userId || '').trim().toLowerCase();
    const itemUserName = String(item.userName || item.addedBy || '').trim().toLowerCase();
    if (userId && itemUserId && userId === itemUserId) return true;
    if (userName && itemUserName && userName === itemUserName) return true;
    return false;
  };

  const activeCycleExpenses = expenses.filter((item) => {
    const cycleStart = getEmployeeCycleStart(item, ['user', 'userId'], ['userName', 'addedBy']);
    const timestamp = getItemTimestamp(item);
    return !cycleStart || timestamp > cycleStart;
  });

  // For employees: only show their own expenses. For admin/manager: show all.
  const myActiveCycleExpenses = isAdmin ? activeCycleExpenses : activeCycleExpenses.filter(isMyExpense);
  const myAllExpenses = isAdmin ? expenses : expenses.filter(isMyExpense);

  // For employees: only show their own issued transactions
  const isMyTransaction = (tx) => {
    const userId = String(user?.id || user?._id || '').trim().toLowerCase();
    const userName = (user?.name || '').trim().toLowerCase();
    const txEmpId = String(tx.employee || tx.employeeId || '').trim().toLowerCase();
    const txEmpName = String(tx.employeeName || '').trim().toLowerCase();
    if (userId && txEmpId && userId === txEmpId) return true;
    if (userName && txEmpName && userName === txEmpName) return true;
    return false;
  };

  const latestIssueByEmployee = [];
  [...issuedTransactions]
    .sort((a, b) => getItemTimestamp(b) - getItemTimestamp(a))
    .forEach((transaction) => {
      const alreadyAdded = latestIssueByEmployee.some(existing => identityMatches(
        transaction,
        existing,
        ['employee', 'employeeId'],
        ['employeeName']
      ));
      if (!alreadyAdded) latestIssueByEmployee.push(transaction);
    });
  const activeCycleIssuedList = latestIssueByEmployee.filter((transaction) => {
    const latestSettlement = getLatestRecord(
      transaction,
      settlements,
      ['employee', 'employeeId'],
      ['employeeName'],
      'settledAt'
    );
    return !latestSettlement || getItemTimestamp(transaction) >= getSettlementTime(latestSettlement);
  });

  const latestSettlements = [];
  [...settlements]
    .sort((a, b) => getSettlementTime(b) - getSettlementTime(a))
    .forEach((settlement) => {
      const alreadyAdded = latestSettlements.some(existing => identityMatches(
        settlement,
        existing,
        ['employee', 'employeeId'],
        ['employeeName']
      ));
      if (!alreadyAdded) latestSettlements.push(settlement);
    });
  const activeCarryForward = latestSettlements.reduce((total, settlement) => {
    const latestIssue = latestIssueByEmployee.find(transaction => identityMatches(
      settlement,
      transaction,
      ['employee', 'employeeId'],
      ['employeeName']
    ));
    if (latestIssue && getItemTimestamp(latestIssue) >= getSettlementTime(settlement)) return total;
    return total + (settlement.carryForward === false ? 0 : (Number(settlement.balance) || 0));
  }, 0);
  const activeIssuedMoney = activeCycleIssuedList.reduce(
    (sum, item) => sum + (Number(item.netAmount ?? (Number(item.amount) - (Number(item.deductedAmount) || 0))) || 0),
    0
  ) + activeCarryForward;
  const allIssuedMoney = issuedTransactions.reduce(
    (sum, item) => sum + (Number(item.netAmount ?? (Number(item.amount) - (Number(item.deductedAmount) || 0))) || 0),
    0
  );

  const handleIssueMoneySuccess = async (issueData) => {
    const employeeId = String(issueData.employeeId || '');
    const employeeName = (issueData.employeeName || '').trim().toLowerCase();
    const matchesEmployee = (item, idKeys, nameKeys) => {
      const itemId = idKeys.map(key => item[key]).find(Boolean);
      if (itemId) return String(itemId) === employeeId;
      return nameKeys.some(key =>
        item[key] && String(item[key]).trim().toLowerCase() === employeeName
      );
    };
    const employeeSettlements = settlements.filter(item =>
      matchesEmployee(item, ['employee', 'employeeId'], ['employeeName'])
    ).sort((a, b) => new Date(b.settledAt || b.createdAt || 0) - new Date(a.settledAt || a.createdAt || 0));
    const employeeLatestSettlement = employeeSettlements[0] || null;
    const employeeSettlementTime = employeeLatestSettlement
      ? new Date(employeeLatestSettlement.settledAt || employeeLatestSettlement.createdAt).getTime()
      : 0;

    const prevActiveExpenses = expenses.filter(item =>
      matchesEmployee(item, ['user', 'userId'], ['userName', 'addedBy']) &&
      (!employeeSettlementTime || !getItemTimestamp(item) || getItemTimestamp(item) >= employeeSettlementTime)
    );
    const prevActiveIssued = issuedTransactions.filter(item =>
      matchesEmployee(item, ['employee', 'employeeId'], ['employeeName']) &&
      (!employeeSettlementTime || !getItemTimestamp(item) || getItemTimestamp(item) >= employeeSettlementTime)
    );
    const previousCarryForward = employeeLatestSettlement?.carryForward === false
      ? 0
      : Number(employeeLatestSettlement?.balance) || 0;
    const prevSpent = prevActiveExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const prevNewlyIssued = prevActiveIssued.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const prevTotalIssued = prevNewlyIssued + previousCarryForward;
    const prevBalance = prevTotalIssued - prevSpent;

    if (prevActiveExpenses.length > 0 || prevActiveIssued.length > 0) {
      const autoSettlement = {
        employee: employeeId,
        employeeId,
        employeeName: issueData.employeeName || 'Employee',
        totalIssued: prevTotalIssued,
        newlyIssued: prevNewlyIssued,
        carriedForwardPrevious: previousCarryForward,
        totalSpent: prevSpent,
        balance: prevBalance,
        carryForward: true,
        settledBy: user?.name || 'Admin',
        settledAt: new Date().toISOString(),
        settledDateStr: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        expensesCount: prevActiveExpenses.length,
        notes: `Cycle closed on new issue. Balance ₹${prevBalance.toLocaleString('en-IN')} carried forward.`
      };

      const settlementResponse = await apiService.createSettlement(autoSettlement);
      if (!settlementResponse?.success) {
        throw new Error(settlementResponse?.message || 'Could not save the previous expense balance.');
      }
    }

    const issueResponse = await apiService.issueMoney({
      ...issueData,
      issuedById: user?.id || user?._id,
      issuedByName: user?.name || 'Manager'
    });
    if (!issueResponse?.success) {
      throw new Error(issueResponse?.message || 'Could not issue money.');
    }
    await loadRealData();

    notificationService.sendTestAlert(
      'Money Issued',
      `₹${issueData.amount.toLocaleString('en-IN')} issued to ${issueData.employeeName} for ${issueData.purpose}`
    );
    return issueResponse;
  };

  const handleSaveNewTask = async (newTask) => {
    setIsCreatingTask(false);
    setActiveTab('tasks');
    try {
      await apiService.createTask(newTask);
      await loadRealData();
    } catch (err) {
      console.warn('Backend createTask error:', err);
    }
  };

  const handleSnoozeTask = async (taskId, options = {}) => {
    const response = await apiService.snoozeTask(taskId, options);
    if (!response?.success) {
      throw new Error(response?.message || 'Could not snooze task.');
    }
    await loadRealData();
    return response;
  };

  const handleUpdateTaskStartDate = async (taskId, startDate) => {
    const response = await apiService.updateTaskStartDate(taskId, startDate);
    if (!response?.success) {
      throw new Error(response?.message || 'Could not update task start date.');
    }
    await loadRealData();
    if (activeTaskForCompletion && (activeTaskForCompletion.id === taskId || activeTaskForCompletion._id === taskId)) {
      setActiveTaskForCompletion(prev => ({
        ...prev,
        ...(response.task || {}),
        startDate
      }));
    }
    return response;
  };

  const handleSendTaskAlert = async (taskId) => apiService.sendTaskAlert(taskId);

  const handleConfirmTaskCompletion = async (taskId, completionData) => {
    const response = await apiService.completeTask(taskId, {
      ...completionData,
      completedByName: user?.name || 'Employee'
    });
    if (String(activeTaskAlert?.taskId || '') === String(taskId)) {
      dismissTaskAlert();
    }
    notificationService.stopAlarm();
    await notificationService.clearTaskNotification(taskId);
    await loadRealData();
    setActiveTaskForCompletion(null);
    setCompletedTaskSuccess({
      ...(response.task || activeTaskForCompletion || {}),
      id: response.task?._id || taskId,
      completedBy: response.task?.completedByName || user?.name || 'Employee'
    });
  };

  const snoozeTaskFromDetails = async (taskId, options = {}) => {
    const res = await handleSnoozeTask(taskId, options);
    notificationService.stopAlarm();
    await notificationService.clearTaskNotification(taskId);
    setActiveTaskForCompletion(null);
    return res;
  };

  const handleDeleteTask = async (taskId) => {
    setTasks(prev => prev.filter(t => t.id !== taskId && t._id !== taskId));
    await apiService.deleteTask(taskId);
    await loadRealData();
  };

  const handleSaveNewExpense = async (newExp) => {
    setIsAddingExpense(false);
    setActiveTab('expenses');
    try {
      const expWithImg = {
        ...newExp,
        imageUrl: newExp.proofImage || newExp.imageUrl || 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=150&q=80'
      };
      await apiService.createExpense(expWithImg);
      await loadRealData();
    } catch (err) {
      console.warn('Backend createExpense error:', err);
    }
  };

  const handleDeleteExpense = async (expId) => {
    setExpenses(prev => prev.filter(e => e.id !== expId && e._id !== expId));
    await apiService.deleteExpense(expId);
    await loadRealData();
  };

  const handleFloatingPlusClick = () => {
    if (activeTab === 'expenses') {
      if (isAdmin) {
        setIsIssuingMoney(true);
      } else {
        setIsAddingExpense(true);
      }
    } else {
      setIsCreatingTask(true);
    }
  };

  return (
    <div className="relative grid h-dvh min-h-dvh w-full grid-cols-1 grid-rows-[minmax(0,1fr)] overflow-hidden bg-white lg:grid-cols-[clamp(220px,18vw,280px)_minmax(0,1fr)]">
      {/* WhatsApp / iOS Style Edge Swipe Back Indicator */}
      {isDragging && (
        <div 
          className="pointer-events-none fixed left-0 top-1/2 z-50 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-r-2xl bg-blue-600/90 text-white shadow-lg backdrop-blur-sm lg:hidden"
          style={{
            transform: `translateY(-50%) translateX(${Math.min(dragProgress * 36, 18)}px)`,
            opacity: Math.min(dragProgress * 1.8, 1)
          }}
          aria-hidden="true"
        >
          <ChevronLeft size={24} strokeWidth={2.8} />
        </div>
      )}

      {/* 0. Desktop Sidebar (Visible on Desktop >= 1025px, hidden on mobile/tablet) */}
      <DesktopSidebar 
        activeTab={activeTab}
        onTabChange={handleTabChange}
        user={user}
        isAdmin={isAdmin}
        onLogout={onLogout}
        pendingTasksCount={tasks.filter(t => !t.completed).length}
        onQuickCreateTask={() => {
          setSelectedEmployeeForReport(null);
          setActiveTaskForCompletion(null);
          setCompletedTaskSuccess(null);
          setActiveExpenseForDetails(null);
          setIsAddingExpense(false);
          setIsIssuingMoney(false);
          setIsCreatingTask(true);
        }}
        onQuickAddExpense={isAdmin ? undefined : () => {
          setSelectedEmployeeForReport(null);
          setActiveTaskForCompletion(null);
          setCompletedTaskSuccess(null);
          setActiveExpenseForDetails(null);
          setIsCreatingTask(false);
          setIsIssuingMoney(false);
          setIsAddingExpense(true);
        }}
      />

      {/* Main Content Area */}
      <div className="relative flex h-full min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden bg-white">
        {/* -1. Employee Report View (Admin) */}
      {selectedEmployeeForReport ? (
        <div className="relative flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto bg-white lg:self-stretch">
          <EmployeeReportScreen
            employee={selectedEmployeeForReport}
            tasks={tasks}
            expenses={expenses}
            issuedTransactions={issuedTransactions}
            settlements={settlements}
            onSettleCycle={handleSettleCycle}
            onBack={() => setSelectedEmployeeForReport(null)}
            onSelectTask={(task) => {
              setSelectedEmployeeForReport(null);
              task.completed ? setCompletedTaskSuccess(task) : setActiveTaskForCompletion(task);
            }}
            onSelectExpense={(exp) => {
              setSelectedEmployeeForReport(null);
              setActiveExpenseForDetails(exp);
            }}
          />
        </div>
      ) : completedTaskSuccess ? (
        /* 0. Completed Task Celebratory View */
        <div className="relative flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto bg-slate-50 lg:self-stretch">
          <TaskCompletedSuccessScreen
            task={completedTaskSuccess}
            employees={employees}
            onBackToTasks={() => {
              setCompletedTaskSuccess(null);
              setActiveTab('tasks');
            }}
          />
        </div>
      ) : activeTaskForCompletion ? (
        /* 1. Complete Task View */
        <div className="relative flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto bg-white lg:self-stretch">
          <CompleteTaskScreen
            task={activeTaskForCompletion}
            currentUser={user}
            users={employees}
            onBack={() => {
              notificationService.stopAlarm();
              setActiveTaskForCompletion(null);
            }}
            onConfirmComplete={handleConfirmTaskCompletion}
            onSnoozeTask={snoozeTaskFromDetails}
            onUpdateTaskStartDate={handleUpdateTaskStartDate}
            onDeleteTask={(taskId) => {
              handleDeleteTask(taskId);
              setActiveTaskForCompletion(null);
            }}
          />
        </div>
      ) : activeExpenseForDetails ? (
        /* 1.5. Expense Details View */
        <div className="relative flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto bg-white lg:self-stretch">
          <ExpenseDetailsScreen
            expense={activeExpenseForDetails}
            onBack={() => setActiveExpenseForDetails(null)}
            onDeleteExpense={(expId) => {
              handleDeleteExpense(expId);
              setActiveExpenseForDetails(null);
            }}
          />
        </div>
      ) : isCreatingTask ? (
        /* 2. Create Task View */
        <div className="relative flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto bg-white lg:self-stretch">
          <CreateTaskScreen 
            onBack={() => setIsCreatingTask(false)}
            onSaveTask={handleSaveNewTask}
            currentUser={user}
            employees={employees}
          />
        </div>
      ) : isIssuingMoney ? (
        /* 2.5. Issue Money View */
        <div className="relative flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto bg-white lg:self-stretch">
          <IssueMoneyScreen
            onBack={() => setIsIssuingMoney(false)}
            onIssueSuccess={handleIssueMoneySuccess}
            employees={employees}
            currentUser={user}
            expenses={expenses}
            issuedTransactions={issuedTransactions}
            settlements={settlements}
          />
        </div>
      ) : isViewingExpenseSummary ? (
        /* 3. Expense Summary View */
        <div className="relative flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto bg-white lg:self-stretch">
          <ExpenseSummaryScreen
            expenses={activeCycleExpenses}
            issuedMoney={activeIssuedMoney}
            onBack={() => setIsViewingExpenseSummary(false)}
            onOpenAddExpense={() => {
              setIsViewingExpenseSummary(false);
              setIsAddingExpense(true);
            }}
          />
        </div>
      ) : isAddingExpense ? (
        /* 4. Add Expense View */
        <div className="relative flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto bg-white lg:self-stretch">
          <AddExpenseScreen
            onBack={() => setIsAddingExpense(false)}
            onSaveExpense={handleSaveNewExpense}
            currentUser={user}
          />
        </div>
      ) : (
        /* 5. Main Screens and Tabs */
        <>
          <div className="relative flex h-full min-h-full min-w-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto bg-white">
            {activeTab === 'home' && (
              isAdmin ? (
                /* Admin & Manager Dashboard View */
                <AdminDashboard 
                  user={user}
                  tasks={tasks}
                  expenses={expenses}
                  allExpenses={expenses}
                  activeExpenses={activeCycleExpenses}
                  isLoading={isTabLoading}
                  onNavigateTab={handleTabChange}
                  onViewAllTasks={() => handleTabChange('tasks')}
                  onOpenTaskDetails={(task) => {
                    if (task.completed) {
                      setCompletedTaskSuccess(task);
                    } else {
                      setActiveTaskForCompletion(task);
                    }
                  }}
                  onOpenIssueMoney={() => setIsIssuingMoney(true)}
                  onOpenCreateTask={() => setIsCreatingTask(true)}
                  onOpenAddExpense={() => setIsAddingExpense(true)}
                  issuedTotal={allIssuedMoney}
                  activeIssuedTotal={activeIssuedMoney}
                  totalEmployees={employees.length}
                />
              ) : (
                /* Employee Dashboard View */
                <DashboardHome 
                  user={user || { name: 'Vivek', role: 'Employee' }}
                  tasks={tasks}
                  expenses={myActiveCycleExpenses}
                  isLoading={isTabLoading}
                  onNavigateTab={handleTabChange}
                  onOpenCreateTask={() => setIsCreatingTask(true)}
                  onOpenAddExpense={() => setIsAddingExpense(true)}
                  onOpenTaskDetails={(task) => {
                    if (task.completed) {
                      setCompletedTaskSuccess(task);
                    } else {
                      setActiveTaskForCompletion(task);
                    }
                  }}
                />
              )
            )}

            {activeTab === 'tasks' && (
              <TasksPage 
                tasks={tasks}
                currentUser={user}
                users={employees}
                isLoading={isTabLoading}
                onBackToHome={() => handleTabChange('home')}
                onOpenCreateTask={() => setIsCreatingTask(true)}
                onSnoozeTask={handleSnoozeTask}
                onUpdateTaskStartDate={handleUpdateTaskStartDate}
                onSendTaskAlert={handleSendTaskAlert}
                onDeleteTask={handleDeleteTask}
                onSelectTask={(task) => {
                  if (task.completed) {
                    setCompletedTaskSuccess(task);
                  } else {
                    setActiveTaskForCompletion(task);
                  }
                }}
              />
            )}

            {activeTab === 'expenses' && !isAdmin && (
              <ExpensesPage 
                expenses={myActiveCycleExpenses}
                allExpenses={myAllExpenses}
                issuedTransactions={isAdmin ? issuedTransactions : issuedTransactions.filter(isMyTransaction)}
                activeIssuedTransactions={isAdmin ? activeCycleIssuedList : activeCycleIssuedList.filter(isMyTransaction)}
                issuedMoney={isAdmin ? activeIssuedMoney : activeCycleIssuedList.filter(isMyTransaction).reduce((sum, item) => sum + (Number(item.netAmount ?? (Number(item.amount) - (Number(item.deductedAmount) || 0))) || 0), 0)}
                allIssuedMoney={isAdmin ? allIssuedMoney : issuedTransactions.filter(isMyTransaction).reduce((sum, item) => sum + (Number(item.netAmount ?? (Number(item.amount) - (Number(item.deductedAmount) || 0))) || 0), 0)}
                currentUser={user}
                employees={isAdmin ? employees : []}
                isLoading={isTabLoading}
                onBackToHome={() => handleTabChange('home')}
                onOpenAddExpense={isAdmin ? undefined : (() => setIsAddingExpense(true))}
                onSelectExpense={(item) => setActiveExpenseForDetails(item)}
              />
            )}

            {activeTab === 'users' && (
              <EmployeesPage 
                onBackToHome={() => handleTabChange('home')}
                employees={employees}
                isLoading={isTabLoading}
                onAddEmployee={handleAddEmployee}
                onUpdateEmployee={handleUpdateEmployee}
                onDeleteEmployee={handleDeleteEmployee}
                onSelectEmployee={(emp) => setSelectedEmployeeForReport(emp)}
              />
            )}

            {activeTab === 'profile' && (
              <ProfilePage 
                user={user || { name: 'Vivek Prajapati', role: 'Employee' }}
                onLogout={onLogout}
              />
            )}
          </div>

          {/* Persistent Bottom Navigation with Role Awareness */}
          <BottomNav 
            activeTab={activeTab} 
            onTabChange={handleTabChange} 
            onFloatingAddClick={handleFloatingPlusClick}
            isAdmin={isAdmin}
          />
        </>
      )}

      </div>
      {activeTaskAlert && !snoozeModalConfig.isOpen && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="task-alert-title"
        >
          <section className="relative flex w-full max-w-sm flex-col items-center rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-2xl sm:max-w-md sm:p-6">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              {activeTaskAlert.type === 'TASK_COMPLETED'
                ? <CheckCircle2 size={30} />
                : activeTaskAlert.type === 'MONEY_ISSUED'
                  ? <Wallet size={30} />
                  : activeTaskAlert.type === 'EXPENSE_ADDED'
                    ? <Receipt size={30} />
                    : <BellRing size={30} className="text-amber-500" fill="currentColor" />}
            </div>
            <h2 id="task-alert-title" className="mb-2 text-lg font-extrabold text-slate-900 sm:text-xl">
              {activeTaskAlert.type === 'TASK_ASSIGNED'
                ? 'New Task Assigned'
                : activeTaskAlert.type === 'TASK_COMPLETED'
                  ? 'Task Completed'
                  : activeTaskAlert.type === 'MONEY_ISSUED'
                    ? 'Money Issued'
                    : activeTaskAlert.type === 'EXPENSE_ADDED'
                      ? 'New Expense Submitted'
                      : 'Task Reminder'}
            </h2>
            <div className="w-full">
              {activeAlertTask && (
                <section className="mb-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-left" aria-label="Task details">
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TASK</span>
                      <h3 className="truncate text-sm font-bold text-slate-900">{activeAlertTask.title || 'New task'}</h3>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      (activeAlertTask.priority || 'high').toLowerCase() === 'high'
                        ? 'bg-red-100 text-red-600'
                        : (activeAlertTask.priority || '').toLowerCase() === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
                    }`}>
                      {activeAlertTask.priority || 'High'}
                    </span>
                  </div>
                  {activeAlertTask.description && (
                    <p className="mb-2 line-clamp-2 text-xs text-slate-600">
                      {activeAlertTask.description}
                    </p>
                  )}
                  {activeAlertAssignerName && activeAlertAssignerName !== 'Unknown user' && (
                    <p className="text-xs text-slate-500">
                      <span className="font-medium text-slate-400">Assigned by: </span>
                      <strong className="text-slate-700">{activeAlertAssignerName}</strong>
                    </p>
                  )}
                </section>
              )}
              {!activeAlertTask && (
                <div className="mb-3 rounded-xl bg-slate-50 p-3 text-left text-xs text-slate-600">
                  <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Notification</span>
                  <span>{activeTaskAlert.body}</span>
                </div>
              )}
              {activeAlertTask && activeTaskAlert.body && activeTaskAlert.type !== 'TASK_ASSIGNED' && (
                <p className="mb-3 text-xs text-slate-600">{activeTaskAlert.body}</p>
              )}
            </div>
            {taskAlertActionError && (
              <p className="mb-2 text-xs font-semibold text-red-600" role="alert">{taskAlertActionError}</p>
            )}
            <div className="flex w-full items-center gap-2">
              {isUrgentTaskAlert && (
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                  onClick={snoozeAlertTask}
                  disabled={!activeTaskAlert.taskId}
                >
                  <BellOff size={14} className="text-amber-600" />
                  Snooze...
                </button>
              )}
              {isUrgentTaskAlert && activeTaskAlert.taskId && (
                <button
                  type="button"
                  className="flex-1 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                  onClick={openAlertTask}
                >
                  Open Task
                </button>
              )}
              {!isUrgentTaskAlert && (
                <button
                  type="button"
                  className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
                  onClick={dismissTaskAlert}
                >
                  Got it
                </button>
              )}
            </div>
          </section>
        </div>,
        document.body
      )}

      {/* Snooze Options Modal */}
      <SnoozeTaskModal
        isOpen={snoozeModalConfig.isOpen}
        taskTitle={snoozeModalConfig.title}
        isLoading={isAlertSnoozing}
        error={alertSnoozeError}
        onClose={() => {
          setAlertSnoozeError('');
          setSnoozeModalConfig({ isOpen: false, taskId: null, title: '' });
        }}
        onConfirmSnooze={handleConfirmAlertSnooze}
      />
    </div>
  );
}
