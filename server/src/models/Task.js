const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'High'
  },
  assignedTo: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  assignedToName: {
    type: String,
    default: 'Team Member'
  },
  assignedBy: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  assignedByName: {
    type: String,
    default: 'Admin'
  },
  dateTime: {
    type: String,
    default: 'Today'
  },
  startDate: {
    type: Date,
    default: null
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  },
  completedByName: {
    type: String,
    default: null
  },
  completionNotes: {
    type: String,
    default: ''
  },
  proofImages: [{
    type: String
  }],
  snoozedUntil: {
    type: Date,
    default: null
  },
  snoozeCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastReminderAt: {
    type: Date,
    default: null
  },
  attachments: [{
    id: String,
    name: String,
    size: String,
    type: { type: String },
    url: String,
    isImage: Boolean,
    isPdf: Boolean
  }],
  assignmentBatchId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
