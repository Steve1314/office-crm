const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  employeeName: {
    type: String,
    required: true
  },
  totalIssued: {
    type: Number,
    required: true
  },
  totalSpent: {
    type: Number,
    required: true
  },
  balance: {
    type: Number,
    required: true
  },
  carryForward: {
    type: Boolean,
    default: true
  },
  settledBy: {
    type: String,
    default: 'Admin'
  },
  settledAt: {
    type: Date,
    default: Date.now
  },
  settledDateStr: {
    type: String,
    default: () => new Date().toLocaleString()
  },
  expensesCount: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settlement', settlementSchema);
