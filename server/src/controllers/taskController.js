const Task = require('../models/Task');
const User = require('../models/User');
const fcmService = require('../services/fcmService');
const { resolveTaskAssignee } = require('../services/taskReminderService');
const { publishLiveUpdate, publishUserNotification } = require('../services/liveUpdateService');

const clearTaskAlerts = async (task) => {
  try {
    const [assignee, assigner] = await Promise.all([
      resolveTaskAssignee(task),
      task.assignedBy ? User.findById(task.assignedBy) : Promise.resolve(null)
    ]);
    const tokens = new Set([assignee?.fcmToken, assigner?.fcmToken].filter(Boolean));
    await Promise.all([...tokens].map(token => fcmService.sendTaskClearedAlert(token, task._id)));
    return { assigner, assignee };
  } catch (error) {
    console.warn('Could not clear task alerts:', error.message);
    return { assigner: null, assignee: null };
  }
};

// Get all tasks (filterable by assignee, priority, status)
exports.getTasks = async (req, res) => {
  try {
    const { assignedTo, priority, completed } = req.query;
    let filter = {};

    if (assignedTo) filter.assignedTo = assignedTo;
    if (priority && priority !== 'All') filter.priority = priority;
    if (completed !== undefined) filter.completed = completed === 'true';

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const formatTaskDateTime = (date) => {
  if (!date) return 'Today • Just now';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Today • Just now';
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  if (isToday) {
    return `Today at ${timeStr}`;
  }
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow at ${timeStr}`;
  }
  const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${dateStr} at ${timeStr}`;
};

const calculateSnoozeTarget = (req) => {
  let minutes = 10;
  if (req.body?.durationMinutes || req.query?.durationMinutes) {
    minutes = Number(req.body?.durationMinutes || req.query?.durationMinutes);
  } else if (req.body?.minutes || req.query?.minutes) {
    minutes = Number(req.body?.minutes || req.query?.minutes);
  }
  
  if (req.body?.snoozedUntil) {
    const customTime = new Date(req.body.snoozedUntil);
    if (!isNaN(customTime.getTime()) && customTime.getTime() > Date.now()) {
      return customTime;
    }
  }

  const validMinutes = Math.max(1, isNaN(minutes) ? 10 : minutes);
  return new Date(Date.now() + validMinutes * 60 * 1000);
};

const formatSnoozeDuration = (snoozeTime) => {
  const diffMinutes = Math.max(1, Math.round((snoozeTime.getTime() - Date.now()) / (60 * 1000)));
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}`;
  }
  const hours = diffMinutes / 60;
  return `${hours.toFixed(diffMinutes % 60 === 0 ? 0 : 1)} hour${hours === 1 ? '' : 's'}`;
};

// Create Task & Immediately Send High-Priority Killed-App FCM Alert
// Supports assigning to a single person or multiple people simultaneously
exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority = 'High',
      assignedToId,
      assignedToName,
      assignedTo,
      assignedById,
      assignedByName,
      assignedBy,
      startDate,
      attachments = [],
      assignees
    } = req.body;

    if (!title || (!assignedTo && !assignedToName && !assignedToId && (!Array.isArray(assignees) || assignees.length === 0))) {
      return res.status(400).json({ success: false, message: 'Title and Assignee are required' });
    }

    // Normalize assignees list (supports array of objects {id, name}, array of strings/IDs, or single fields)
    let assigneesList = [];
    if (Array.isArray(assignees) && assignees.length > 0) {
      assigneesList = assignees.map((a) => {
        if (typeof a === 'string') return { id: a, name: a };
        return {
          id: a?.id || a?._id || a?.assignedToId || a?.assignedTo || null,
          name: a?.name || a?.assignedToName || a?.assignedTo || 'Team Member'
        };
      });
    } else if (Array.isArray(assignedTo) && assignedTo.length > 0) {
      assigneesList = assignedTo.map((a, idx) => {
        if (typeof a === 'string') {
          const matchingId = Array.isArray(assignedToId) ? assignedToId[idx] : null;
          return { id: matchingId || a, name: a };
        }
        return {
          id: a?.id || a?._id || a?.assignedToId || a?.assignedTo || null,
          name: a?.name || a?.assignedToName || 'Team Member'
        };
      });
    } else {
      const singleName = assignedToName || assignedTo || 'Team Member';
      const singleId = assignedToId || (req.user ? req.user.id : null) || assignedTo;
      assigneesList = [{ id: singleId, name: singleName }];
    }

    // Filter out empty assignees
    assigneesList = assigneesList.filter((a) => a && (a.id || a.name));
    if (assigneesList.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one valid assignee is required' });
    }

    const finalAssignerName = assignedByName || assignedBy || (req.user ? req.user.name : 'Admin');
    const finalAssignerId = assignedById || (req.user ? req.user.id : null);

    const parsedStartDate = startDate ? new Date(startDate) : null;
    const isValidStartDate = parsedStartDate && !isNaN(parsedStartDate.getTime());
    const finalStartDate = isValidStartDate ? parsedStartDate : null;
    const displayDateTime = finalStartDate ? `Starts: ${formatTaskDateTime(finalStartDate)}` : 'Today • Just now';
    const isFutureTask = finalStartDate && finalStartDate.getTime() > Date.now();

    const batchId = assigneesList.length > 1
      ? `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      : null;

    const createdTasks = [];

    for (const assigneeItem of assigneesList) {
      const finalAssigneeId = assigneeItem.id || assigneeItem.name;
      const finalAssigneeName = assigneeItem.name || 'Team Member';

      const task = await Task.create({
        title: title.trim(),
        description: description || '',
        priority,
        assignedTo: finalAssigneeId,
        assignedToName: finalAssigneeName,
        assignedBy: finalAssignerId,
        assignedByName: finalAssignerName,
        attachments,
        startDate: finalStartDate,
        dateTime: displayDateTime,
        assignmentBatchId: batchId
      });

      // Send the alert to each assignee's registered device.
      try {
        const assignee = await resolveTaskAssignee(task);
        const assignedToCreator = assignee && (
          (finalAssignerId && String(assignee._id) === String(finalAssignerId)) ||
          (!finalAssignerId && assignee.name?.trim().toLowerCase() === finalAssignerName.trim().toLowerCase())
        );
        if (assignedToCreator) {
          if (!isFutureTask) {
            task.lastReminderAt = new Date();
            await task.save();
          }
        } else {
          let notificationSent = false;
          if (assignee?.fcmToken) {
            const response = await fcmService.sendTaskAssignedAlert(assignee.fcmToken, {
              taskTitle: task.title,
              assignedByName: task.assignedByName,
              taskId: task._id,
              priority: task.priority
            });
            notificationSent = Boolean(response);
          }
          if (assignee?._id) {
            const bodyText = isFutureTask
              ? `${task.assignedByName} scheduled a task for ${formatTaskDateTime(finalStartDate)}: "${task.title}"`
              : `${task.assignedByName} assigned you: "${task.title}"`;
            notificationSent = publishUserNotification(assignee._id, {
              title: isFutureTask ? 'Upcoming Task Assigned' : 'Task Assigned',
              body: bodyText,
              taskId: String(task._id),
              type: 'TASK_ASSIGNED'
            }) || notificationSent;
          }
          if (notificationSent && !isFutureTask) {
            task.lastReminderAt = new Date();
            await task.save();
          } else if (!notificationSent) {
            console.warn(`Task assignment alert could not be delivered: no registered push token or live session for "${task.assignedToName}"`);
          }
        }
      } catch (fcmErr) {
        console.warn('FCM alert skipped for assignee:', finalAssigneeName, fcmErr.message);
      }

      createdTasks.push(task);
    }

    publishLiveUpdate('tasks');

    res.status(201).json({
      success: true,
      task: createdTasks[0],
      tasks: createdTasks,
      count: createdTasks.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Complete Task with Notes and Proof Images & Alert the Assigner
exports.completeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { completionNotes, proofImages = [], completedByName } = req.body;

    if (!req.body.quickComplete && (!Array.isArray(proofImages) || proofImages.length === 0)) {
      return res.status(400).json({ success: false, message: 'At least one proof image is required to complete a task' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    if (task.completed) {
      return res.status(409).json({ success: false, message: 'Task is already completed' });
    }

    task.completed = true;
    task.completedAt = new Date();
    task.completedByName = completedByName || (req.user ? req.user.name : task.assignedToName) || 'Employee';
    task.completionNotes = completionNotes || (req.body.quickComplete ? 'Completed from mobile notification action' : '');
    task.proofImages = proofImages;
    await task.save();
    publishLiveUpdate('tasks');
    const { assigner, assignee } = await clearTaskAlerts(task);
    const isSelfAssigned = assigner && assignee && String(assigner._id) === String(assignee._id);

    // Trigger instant FCM alert to the person who originally assigned the task!
    if (!isSelfAssigned && assigner && assigner.fcmToken) {
      await fcmService.sendTaskCompletedAlert(assigner.fcmToken, {
        taskTitle: task.title,
        completedByName: task.completedByName,
        taskId: task._id
      });
    }
    if (!isSelfAssigned && assigner?._id) {
      publishUserNotification(assigner._id, {
        title: 'Task Completed',
        body: `${task.completedByName} completed "${task.title}".`,
        taskId: String(task._id),
        type: 'TASK_COMPLETED'
      });
    }

    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Quick Snooze (from mobile notification action)
exports.quickSnoozeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const snoozeTime = calculateSnoozeTarget(req);

    const task = await Task.findOneAndUpdate(
      { _id: taskId, completed: false },
      { $set: { snoozedUntil: snoozeTime }, $inc: { snoozeCount: 1 } },
      { new: true }
    );
    if (!task) {
      const existingTask = await Task.findById(taskId);
      if (!existingTask) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }
      return res.status(409).json({ success: false, message: 'Completed tasks cannot be snoozed' });
    }
    publishLiveUpdate('tasks');

    const durationText = formatSnoozeDuration(snoozeTime);

    res.json({
      success: true,
      message: `Task alert snoozed for ${durationText}`,
      snoozedUntil: snoozeTime,
      snoozeCount: task.snoozeCount,
      task
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Quick Complete (from mobile notification action)
exports.quickCompleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    if (task.completed) {
      await clearTaskAlerts(task);
      return res.status(200).json({ success: true, message: 'Task already completed', task });
    }

    task.completed = true;
    task.completedAt = new Date();
    task.completedByName = req.body.completedByName || task.assignedToName || 'Employee';
    task.completionNotes = req.body.completionNotes || 'Completed directly from mobile notification';
    await task.save();
    publishLiveUpdate('tasks');
    const { assigner, assignee } = await clearTaskAlerts(task);
    const isSelfAssigned = assigner && assignee && String(assigner._id) === String(assignee._id);

    if (!isSelfAssigned && assigner && assigner.fcmToken) {
      await fcmService.sendTaskCompletedAlert(assigner.fcmToken, {
        taskTitle: task.title,
        completedByName: task.completedByName,
        taskId: task._id
      });
    }
    if (!isSelfAssigned && assigner?._id) {
      publishUserNotification(assigner._id, {
        title: 'Task Completed',
        body: `${task.completedByName} completed "${task.title}".`,
        taskId: String(task._id),
        type: 'TASK_COMPLETED'
      });
    }

    res.json({ success: true, message: 'Task completed successfully', task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Snooze Task with Custom Duration
exports.snoozeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const snoozeTime = calculateSnoozeTarget(req);

    const task = await Task.findOneAndUpdate(
      { _id: taskId, completed: false },
      { $set: { snoozedUntil: snoozeTime }, $inc: { snoozeCount: 1 } },
      { new: true }
    );
    if (!task) {
      const existingTask = await Task.findById(taskId);
      if (!existingTask) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }
      return res.status(409).json({ success: false, message: 'Completed tasks cannot be snoozed' });
    }
    publishLiveUpdate('tasks');

    const durationText = formatSnoozeDuration(snoozeTime);

    res.json({
      success: true,
      message: `Task alert snoozed for ${durationText}`,
      snoozedUntil: snoozeTime,
      snoozeCount: task.snoozeCount,
      task
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Task Start Date (both assignee & assigner & admin have permission)
exports.updateTaskStartDate = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { startDate } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    if (task.completed) {
      return res.status(409).json({ success: false, message: 'Completed tasks cannot be updated' });
    }

    const userId = req.user ? String(req.user.id || req.user._id || '') : '';
    const userName = req.user ? String(req.user.name || '').trim().toLowerCase() : '';
    const userRole = req.user ? String(req.user.role || '').toLowerCase() : '';

    const isAdmin = userRole === 'admin';
    const isAssignee = (userId && String(task.assignedTo) === userId) ||
      (userName && String(task.assignedToName).trim().toLowerCase() === userName);
    const isAssigner = (userId && String(task.assignedBy) === userId) ||
      (userName && String(task.assignedByName).trim().toLowerCase() === userName);

    if (!isAdmin && !isAssignee && !isAssigner) {
      return res.status(403).json({ success: false, message: 'You do not have permission to update this task' });
    }

    const parsedStartDate = startDate ? new Date(startDate) : null;
    const isValidStartDate = parsedStartDate && !isNaN(parsedStartDate.getTime());
    task.startDate = isValidStartDate ? parsedStartDate : null;

    if (task.startDate) {
      task.dateTime = `Starts: ${formatTaskDateTime(task.startDate)}`;
      if (task.startDate.getTime() > Date.now()) {
        task.lastReminderAt = null;
      }
    } else {
      task.dateTime = 'Today • Just now';
    }

    await task.save();
    publishLiveUpdate('tasks');

    res.json({
      success: true,
      message: 'Task start date updated successfully',
      task
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendQuickAlert = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    if (task.completed) {
      return res.status(409).json({ success: false, message: 'This task is already completed' });
    }

    const assignee = await resolveTaskAssignee(task);
    const notification = {
      title: 'Quick task reminder',
      body: `${task.assignedByName} requests an update: "${task.title}" is still pending.`,
      taskId: String(task._id),
      type: 'TASK_QUICK_ALERT'
    };
    const liveSent = assignee?._id && publishUserNotification(assignee._id, notification);
    let pushSent = false;
    if (assignee?.fcmToken) {
      pushSent = Boolean(await fcmService.sendTaskReminderAlert(assignee.fcmToken, {
        taskTitle: task.title,
        assignedByName: task.assignedByName,
        taskId: task._id,
        priority: task.priority
      }));
    }
    if (!liveSent && !pushSent) {
      return res.status(409).json({ success: false, message: 'The assignee is not connected and has no registered push-notification device' });
    }
    if (!assignee?._id) {
      return res.status(502).json({ success: false, message: 'The quick alert could not be delivered' });
    }

    publishLiveUpdate('tasks');
    res.json({ success: true, message: `Quick alert sent to ${task.assignedToName}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Task
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    let task = null;
    try {
      task = await Task.findByIdAndDelete(taskId);
    } catch (e) {
      task = await Task.findOneAndDelete({ $or: [{ _id: taskId }, { id: taskId }] });
    }
    if (task) publishLiveUpdate('tasks');
    res.json({ success: true, message: 'Task deleted successfully', task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
