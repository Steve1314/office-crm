const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  employeeName: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  deductedAmount: {
    type: Number,
    default: 0
  },
  balanceBeforeIssue: {
    type: Number,
    default: 0
  },
  netAmount: {
    type: Number,
    default: function () {
      return this.amount;
    }
  },
  purpose: {
    type: String,
    default: 'Office Expenses'
  },
  issuedBy: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  issuedByName: {
    type: String,
    default: 'Admin'
  },
  date: {
    type: String,
    default: () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Transaction', transactionSchema);
