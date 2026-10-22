const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Transaction = require('../models/Transaction');
const Settlement = require('../models/Settlement');
const User = require('../models/User');
const fcmService = require('../services/fcmService');
const { publishLiveUpdate, publishUserNotification } = require('../services/liveUpdateService');

// Get all expenses (filterable by user, time)
exports.getExpenses = async (req, res) => {
  try {
    const { userId } = req.query;
    let filter = {};
    if (userId) filter.user = userId;

    const expenses = await Expense.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add New Expense
exports.createExpense = async (req, res) => {
  try {
    const { title, amount, category, imageUrl, proofImage, proofImages, userId, userName, addedBy } = req.body;
    const numericAmount = Number(amount);

    if (!title || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Title and a positive valid amount are required' });
    }

    const finalUserId = userId || (req.user ? req.user.id : null);
    const finalUserName = userName || addedBy || (req.user ? req.user.name : 'Employee');
    const imagesList = Array.isArray(proofImages) ? proofImages : (proofImage ? [proofImage] : []);

    const expense = await Expense.create({
      title,
      amount: numericAmount,
      category: category || 'Office Supplies',
      imageUrl: imageUrl || (imagesList.length > 0 ? imagesList[0] : null),
      proofImage: proofImage || (imagesList.length > 0 ? imagesList[0] : null),
      proofImages: imagesList,
      user: finalUserId,
      userName: finalUserName,
      addedBy: finalUserName
    });
    publishLiveUpdate('expenses');

    try {
      const managers = await User.find({
        role: { $in: ['Admin', 'Manager'] },
        status: 'Active'
      }).select('_id name fcmToken');
      const managerNotification = {
        title: 'New Expense Submitted',
        body: `${finalUserName} submitted "${expense.title}" for ₹${numericAmount.toLocaleString('en-IN')}.`,
        type: 'EXPENSE_ADDED',
        expenseId: String(expense._id)
      };
      const pushResults = await Promise.allSettled(managers.map(async (manager) => {
        const liveSent = publishUserNotification(manager._id, managerNotification);
        const pushSent = manager.fcmToken
          ? await fcmService.sendExpenseAddedAlert(manager.fcmToken, {
            title: expense.title,
            amount: numericAmount,
            employeeName: finalUserName,
            expenseId: expense._id
          })
          : null;
        if (!liveSent && !pushSent) {
          console.warn(`Expense notification could not be delivered to ${manager.name}: no live session or registered push token.`);
        }
      }));
      pushResults.forEach((result) => {
        if (result.status === 'rejected') {
          console.error('Expense manager notification failed:', result.reason?.message || result.reason);
        }
      });
    } catch (notificationError) {
      console.error('Could not notify managers about the saved expense:', notificationError.message);
    }

    res.status(201).json({ success: true, expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin / Manager Issues Money to Employee
exports.issueMoney = async (req, res) => {
  try {
    const { employeeId, employeeName, amount, purpose, issuedById, issuedByName } = req.body;
    const issueAmount = Number(amount);

    if (!employeeId || !Number.isFinite(issueAmount) || issueAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Employee and a positive valid amount are required' });
    }

    let employee = null;
    if (mongoose.Types.ObjectId.isValid(String(employeeId))) {
      employee = await User.findById(employeeId);
    }
    if (!employee) {
      employee = await User.findOne({
        $or: [
          { email: String(employeeId).toLowerCase() },
          ...(employeeName ? [{ name: employeeName }] : [])
        ]
      });
    }
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const resolvedEmployeeName = employee.name || employeeName || 'Employee';
    const employeeFilter = {
      $or: [
        { employee: String(employee._id) },
        {
          $and: [
            { employee: { $in: [null, ''] } },
            { employeeName: resolvedEmployeeName }
          ]
        }
      ]
    };
    const expenseFilter = {
      $or: [
        { user: String(employee._id) },
        {
          $and: [
            { user: { $in: [null, ''] } },
            { $or: [{ userName: resolvedEmployeeName }, { addedBy: resolvedEmployeeName }] }
          ]
        }
      ]
    };

    const latestSettlement = await Settlement.findOne(employeeFilter).sort({ settledAt: -1, createdAt: -1 });
    const settlementDate = latestSettlement
      ? new Date(latestSettlement.settledAt || latestSettlement.createdAt)
      : null;
    const cycleFilter = settlementDate ? { createdAt: { $gt: settlementDate } } : {};
    const [cycleTransactions, cycleExpenses] = await Promise.all([
      Transaction.find({ ...employeeFilter, ...cycleFilter }),
      Expense.find({ ...expenseFilter, ...cycleFilter })
    ]);

    const carryForward = latestSettlement?.carryForward === false
      ? 0
      : Number(latestSettlement?.balance) || 0;
    const previouslyIssued = cycleTransactions.reduce((total, item) => total + (Number(item.amount) || 0), 0);
    const spent = cycleExpenses.reduce((total, item) => total + (Number(item.amount) || 0), 0);
    const balanceBeforeIssue = carryForward + previouslyIssued - spent;
    const deductedAmount = Math.min(issueAmount, Math.max(0, -balanceBeforeIssue));
    const netAmount = issueAmount - deductedAmount;

    const transaction = await Transaction.create({
      employee: String(employee._id),
      employeeName: resolvedEmployeeName,
      amount: issueAmount,
      deductedAmount,
      balanceBeforeIssue,
      netAmount,
      purpose: purpose || 'Office Expenses',
      issuedBy: issuedById || null,
      issuedByName: issuedByName || 'Admin'
    });
    publishLiveUpdate('expenses');

    employee.walletBalance = (employee.walletBalance || 0) + netAmount;
    await employee.save();

    const issuedToSelf = (
      issuedById && String(employee._id) === String(issuedById)
    ) || (
      !issuedById && issuedByName?.trim().toLowerCase() === resolvedEmployeeName.trim().toLowerCase()
    );
    if (!issuedToSelf) {
      if (employee.fcmToken) {
        await fcmService.sendMoneyIssuedAlert(employee.fcmToken, {
          amount: issueAmount,
          deductedAmount,
          netAmount,
          purpose: purpose || 'Office Expenses',
          issuedByName: issuedByName || 'Admin',
          transactionId: transaction._id
        });
      }
      const liveSent = publishUserNotification(employee._id, {
        title: 'Money Issued to You',
        body: `₹${netAmount.toLocaleString('en-IN')} is available from ₹${issueAmount.toLocaleString('en-IN')} issued by ${issuedByName || 'Admin'}.`,
        type: 'MONEY_ISSUED',
        transactionId: String(transaction._id)
      });
      if (!liveSent && !employee.fcmToken) {
        console.warn(`Money issue notification could not be delivered to ${resolvedEmployeeName}: no live session or registered push token.`);
      }
    }

    res.status(201).json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Transactions (Issued Money history)
exports.getTransactions = async (req, res) => {
  try {
    const { employeeId } = req.query;
    let filter = {};
    if (employeeId) filter.employee = employeeId;

    const transactions = await Transaction.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Expense
exports.deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    let expense = null;
    try {
      expense = await Expense.findByIdAndDelete(expenseId);
    } catch (e) {
      expense = await Expense.findOneAndDelete({ $or: [{ _id: expenseId }, { id: expenseId }] });
    }
    res.json({ success: true, message: 'Expense deleted successfully', expense });
    if (expense) publishLiveUpdate('expenses');
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create Settlement (Batch Settle & Carry Forward)
exports.createSettlement = async (req, res) => {
  try {
    const { employeeId, employeeName, totalIssued, totalSpent, balance, carryForward, settledBy, notes, expensesCount } = req.body;

    if (!employeeName) {
      return res.status(400).json({ success: false, message: 'Employee name is required' });
    }

    const settlement = await Settlement.create({
      employee: employeeId,
      employeeName,
      totalIssued: parseFloat(totalIssued) || 0,
      totalSpent: parseFloat(totalSpent) || 0,
      balance: parseFloat(balance) || 0,
      carryForward: carryForward !== false,
      settledBy: settledBy || 'Admin',
      settledAt: new Date(),
      settledDateStr: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      expensesCount: parseInt(expensesCount, 10) || 0,
      notes: notes || ''
    });
    publishLiveUpdate('expenses');

    res.status(201).json({ success: true, settlement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Settlements (Filterable by employee)
exports.getSettlements = async (req, res) => {
  try {
    const { employeeId, employeeName } = req.query;
    let filter = {};
    if (employeeId) filter.employee = employeeId;
    if (employeeName) filter.employeeName = { $regex: new RegExp(employeeName, 'i') };

    const settlements = await Settlement.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, settlements });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
