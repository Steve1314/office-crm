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

// Create Task & Immediately Send High-Priority Killed-App FCM Alert
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
      attachments = []
    } = req.body;

    const finalAssigneeName = assignedToName || assignedTo || 'Team Member';
    const finalAssigneeId = assignedToId || (req.user ? req.user.id : null) || assignedTo;
    const finalAssignerName = assignedByName || assignedBy || (req.user ? req.user.name : 'Admin');
    const finalAssignerId = assignedById || (req.user ? req.user.id : null);

    if (!title || (!assignedTo && !assignedToName && !assignedToId)) {
      return res.status(400).json({ success: false, message: 'Title and Assignee are required' });
    }

    const task = await Task.create({
      title,
      description: description || '',
      priority,
      assignedTo: finalAssigneeId,
      assignedToName: finalAssigneeName,
      assignedBy: finalAssignerId,
      assignedByName: finalAssignerName,
      attachments,
      dateTime: 'Today • Just now'
    });
    publishLiveUpdate('tasks');

    // Send the first alert to the assignee's registered device.
    try {
      const assignee = await resolveTaskAssignee(task);
      const assignedToCreator = assignee && (
        (finalAssignerId && String(assignee._id) === String(finalAssignerId)) ||
        (!finalAssignerId && assignee.name?.trim().toLowerCase() === finalAssignerName.trim().toLowerCase())
      );
      if (assignedToCreator) {
        task.lastReminderAt = new Date();
        await task.save();
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
          notificationSent = publishUserNotification(assignee._id, {
            title: 'Task Assigned',
            body: `${task.assignedByName} assigned you: "${task.title}"`,
            taskId: String(task._id),
            type: 'TASK_ASSIGNED'
          }) || notificationSent;
        }
        if (notificationSent) {
          task.lastReminderAt = new Date();
          await task.save();
        } else {
          console.warn(`Task assignment alert could not be delivered: no registered push token or live session for "${task.assignedToName}"`);
        }
      }
    } catch (fcmErr) {
      console.warn('FCM alert skipped:', fcmErr.message);
    }

    res.status(201).json({ success: true, task });
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
    const snoozeTime = new Date(Date.now() + 5 * 60 * 1000);

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

    res.json({
      success: true,
      message: 'Task alert snoozed for 5 minutes',
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

// Snooze Task for 5 Minutes
exports.snoozeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const snoozeTime = new Date(Date.now() + 5 * 60 * 1000);

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

    res.json({
      success: true,
      message: 'Task alert snoozed for 5 minutes',
      snoozedUntil: snoozeTime,
      snoozeCount: task.snoozeCount,
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
