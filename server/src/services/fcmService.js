const admin = require('../config/firebase');

/**
 * High-Priority FCM Push Notification Service
 * Requests high-priority, lock-screen-visible notifications. Actual display is
 * still subject to Android notification permissions and device-level settings.
 */
class FCMService {
  /**
   * Send urgent task assignment alert to employee
   * Uses high-priority data payload so onMessageReceived triggers in all states
   * (foreground, background, killed, and screen-locked).
   */
  async sendTaskAssignedAlert(fcmToken, { taskTitle, assignedByName, taskId, priority = 'High' }) {
    if (!fcmToken) {
      console.warn('⚠️ No FCM token provided for task assignment alert.');
      return null;
    }

    const title = '🚨 Urgent Task Assigned!';
    const body = `${assignedByName} assigned you: "${taskTitle}" (${priority} Priority)`;

    const message = {
      token: fcmToken,
      data: {
        title: title,
        body: body,
        type: 'TASK_ASSIGNED',
        taskId: taskId ? taskId.toString() : '',
        taskTitle: taskTitle || '',
        assignedBy: assignedByName || '',
        priority: priority
      },
      android: {
        priority: 'high'
      }
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('✅ FCM Task Assigned alert sent successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to send FCM Task Assigned alert:', error.message);
      return null;
    }
  }

  /**
   * Send alert to the assigner when an employee completes the task
   */
  async sendTaskCompletedAlert(fcmToken, { taskTitle, completedByName, taskId }) {
    if (!fcmToken) return null;

    const title = '✅ Task Completed!';
    const body = `${completedByName} has marked "${taskTitle}" as completed.`;

    const message = {
      token: fcmToken,
      data: {
        title,
        body,
        type: 'TASK_COMPLETED',
        taskId: taskId ? taskId.toString() : '',
        taskTitle: taskTitle || '',
        completedBy: completedByName || ''
      },
      android: {
        priority: 'high'
      }
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('✅ FCM Task Completed alert sent:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to send FCM Task Completed alert:', error.message);
      return null;
    }
  }

  async sendTaskClearedAlert(fcmToken, taskId) {
    if (!fcmToken || !taskId) return null;

    try {
      return await admin.messaging().send({
        token: fcmToken,
        data: {
          type: 'TASK_CLEARED',
          taskId: String(taskId)
        },
        android: {
          priority: 'high'
        }
      });
    } catch (error) {
      console.error('Failed to clear completed task notification:', error.message);
      return null;
    }
  }

  /**
   * Send quick task reminder to employee
   * Uses high-priority data payload to wake up screen, ring loud alarm, and show Snooze & Complete buttons.
   */
  async sendTaskReminderAlert(fcmToken, { taskTitle, assignedByName, taskId, priority = 'High' }) {
    if (!fcmToken) return null;

    const title = '🚨 Task Reminder!';
    const body = `"${taskTitle}" is still pending. Complete it and upload proof.`;
    const message = {
      token: fcmToken,
      data: {
        title,
        body,
        type: 'TASK_REMINDER',
        taskId: taskId ? taskId.toString() : '',
        taskTitle: taskTitle || '',
        assignedBy: assignedByName || '',
        priority: priority || 'High'
      },
      android: {
        priority: 'high'
      }
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('✅ FCM Task Reminder alert sent successfully:', response);
      return response;
    } catch (error) {
      console.error('Failed to send task reminder:', error.message);
      return null;
    }
  }

  /**
   * Send alert when money is issued to an employee
   */
  async sendMoneyIssuedAlert(fcmToken, { amount, deductedAmount = 0, netAmount = amount, purpose, issuedByName, transactionId }) {
    if (!fcmToken) return null;

    const title = '💰 Money Issued to Your Account';
    const deductionMessage = deductedAmount > 0
      ? `; ₹${Number(deductedAmount).toLocaleString('en-IN')} adjusted for previous overspending`
      : '';
    const body = `₹${Number(netAmount).toLocaleString('en-IN')} available from ₹${Number(amount).toLocaleString('en-IN')} issued by ${issuedByName}${deductionMessage}`;

    const message = {
      token: fcmToken,
      notification: {
        title: title,
        body: body
      },
      data: {
        type: 'MONEY_ISSUED',
        amount: amount ? amount.toString() : '0',
        deductedAmount: Number(deductedAmount).toString(),
        netAmount: Number(netAmount).toString(),
        purpose: purpose || '',
        transactionId: String(transactionId || '')
      },
      android: {
        priority: 'normal',
        notification: {
          channelId: 'office_crm_default_v2',
          title: title,
          body: body,
          sound: 'default',
          priority: 'default',
          visibility: 'public',
          defaultSound: true,
          defaultVibrateTimings: true
        }
      }
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('✅ FCM Money Issued alert sent:', response);
      return response;
    } catch (error) {
      console.error('❌ Failed to send FCM Money Issued alert:', error.message);
      return null;
    }
  }

  async sendExpenseAddedAlert(fcmToken, { title: expenseTitle, amount, employeeName, expenseId }) {
    if (!fcmToken) return null;

    const title = 'New Expense Submitted';
    const body = `${employeeName} submitted "${expenseTitle}" for ₹${Number(amount).toLocaleString('en-IN')}.`;
    const message = {
      token: fcmToken,
      notification: { title, body },
      data: {
        type: 'EXPENSE_ADDED',
        expenseId: String(expenseId || ''),
        expenseTitle: expenseTitle || '',
        amount: String(amount || 0),
        employeeName: employeeName || ''
      },
      android: {
        priority: 'normal',
        notification: {
          channelId: 'office_crm_default_v2',
          title,
          body,
          sound: 'default',
          priority: 'default',
          visibility: 'public',
          defaultSound: true,
          defaultVibrateTimings: true
        }
      }
    };

    try {
      return await admin.messaging().send(message);
    } catch (error) {
      console.error('Failed to send expense notification:', error.message);
      return null;
    }
  }
}

module.exports = new FCMService();
