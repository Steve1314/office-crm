const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const fcmService = require('./fcmService');
const { publishUserNotification } = require('./liveUpdateService');

const REMINDER_INTERVAL_MS = 5 * 60 * 1000;
const CHECK_INTERVAL_MS = 15 * 1000;
let reminderRunActive = false;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const resolveTaskAssignee = async (task) => {
  const assigneeId = String(task.assignedTo || '');
  if (mongoose.Types.ObjectId.isValid(assigneeId)) {
    const userById = await User.findById(assigneeId);
    if (userById) return userById;
  }

  const assigneeName = task.assignedToName || (
    !mongoose.Types.ObjectId.isValid(assigneeId) ? assigneeId : ''
  );
  if (!assigneeName) return null;
  return User.findOne({ name: new RegExp(`^${escapeRegex(assigneeName)}$`, 'i') });
};

const sendDueReminders = async () => {
  if (mongoose.connection.readyState !== 1 || reminderRunActive) return;

  reminderRunActive = true;
  try {
    const now = new Date();
    const pendingTasks = await Task.find({ completed: false, assignedTo: { $ne: null } });

    for (const task of pendingTasks) {
      const currentTask = await Task.findOne({ _id: task._id, completed: false });
      if (!currentTask || (currentTask.snoozedUntil && currentTask.snoozedUntil > now)) continue;
      // Do not remind if scheduled start date is in the future
      if (currentTask.startDate && new Date(currentTask.startDate) > now) continue;

      const reminderBase = currentTask.lastReminderAt || currentTask.startDate || currentTask.createdAt;
      if (!reminderBase || now.getTime() - new Date(reminderBase).getTime() < REMINDER_INTERVAL_MS) continue;

      const assignee = await resolveTaskAssignee(currentTask);
      if (!assignee) continue;
      const assignedToCreator = (
        currentTask.assignedBy && String(currentTask.assignedBy) === String(assignee._id)
      ) || (
        !currentTask.assignedBy &&
        currentTask.assignedByName?.trim().toLowerCase() === assignee.name?.trim().toLowerCase()
      );
      if (assignedToCreator) {
        currentTask.lastReminderAt = now;
        await currentTask.save();
        continue;
      }

      let notificationSent = false;
      if (assignee.fcmToken) {
        const response = await fcmService.sendTaskReminderAlert(assignee.fcmToken, {
          taskTitle: currentTask.title,
          assignedByName: currentTask.assignedByName,
          taskId: currentTask._id,
          priority: currentTask.priority
        });
        notificationSent = Boolean(response);
      }
      notificationSent = publishUserNotification(assignee._id, {
        title: 'Task Reminder',
        body: `"${currentTask.title}" is still pending. Complete it and upload proof.`,
        taskId: String(currentTask._id),
        type: 'TASK_REMINDER'
      }) || notificationSent;

      if (notificationSent) {
        currentTask.lastReminderAt = now;
        await currentTask.save();
      }
    }
  } finally {
    reminderRunActive = false;
  }
};

const startTaskReminderService = () => {
  console.log(`Task reminder worker started (checking every ${CHECK_INTERVAL_MS / 1000} seconds).`);
  const timer = setInterval(() => {
    sendDueReminders().catch((error) => {
      console.error('Task reminder service failed:', error.message);
    });
  }, CHECK_INTERVAL_MS);
  timer.unref();
  return timer;
};

module.exports = { startTaskReminderService, sendDueReminders, resolveTaskAssignee };
