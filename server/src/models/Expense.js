const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    default: 'Office Supplies'
  },
  date: {
    type: String,
    default: () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  },
  imageUrl: {
    type: String,
    default: null
  },
  proofImage: {
    type: String,
    default: null
  },
  proofImages: [{
    type: String
  }],
  user: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  userName: {
    type: String,
    default: 'Employee'
  },
  addedBy: {
    type: String,
    default: 'Employee'
  },
  status: {
    type: String,
    enum: ['Approved', 'Pending', 'Rejected'],
    default: 'Approved'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
