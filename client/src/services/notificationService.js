import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor, registerPlugin } from '@capacitor/core';
import apiService from './api';

const TaskAlertControl = registerPlugin('TaskAlertControl');

const URGENT_TASK_ALERT_TYPES = new Set(['TASK_ASSIGNED', 'TASK_REMINDER', 'TASK_QUICK_ALERT']);
const TASK_NOTIFICATION_TYPES = new Set([...URGENT_TASK_ALERT_TYPES, 'TASK_COMPLETED']);
const NOTICE_TYPES = new Set(['MONEY_ISSUED', 'EXPENSE_ADDED']);

class NotificationService {
  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.token = null;
    this.user = null;
    this.initialization = null;
    this.notificationId = 1;
    this.alertListeners = new Set();
    this.handledNotifications = new Map();
    this.alarmContext = null;
    this.alarmInterval = null;
    this.audioUnlockHandler = null;
  }

  shouldHandleNotification(notification) {
    const reference = notification.taskId || notification.expenseId || notification.transactionId || notification.body;
    const key = `${notification.type || notification.title}:${reference}`;
    const now = Date.now();
    for (const [existingKey, timestamp] of this.handledNotifications) {
      if (now - timestamp > 30000) this.handledNotifications.delete(existingKey);
    }
    if (this.handledNotifications.has(key)) return false;
    this.handledNotifications.set(key, now);
    return true;
  }

  subscribeToAlerts(listener) {
    this.alertListeners.add(listener);
    return () => this.alertListeners.delete(listener);
  }

  async raiseAlert({ title, body, taskId, type }) {
    if (!this.shouldHandleNotification({ title, body, taskId, type })) return;
    const alert = { title, body, taskId, type, id: `${Date.now()}-${Math.random()}` };
    this.notifyAlertListeners(alert);
    await this.startAlarm();
  }

  async raiseNotice({ title, body, taskId, type, expenseId, transactionId }) {
    if (!this.shouldHandleNotification({ title, body, taskId, type, expenseId, transactionId })) return;
    const notice = {
      title,
      body,
      taskId,
      type,
      expenseId,
      transactionId,
      id: `${Date.now()}-${Math.random()}`
    };
    this.notifyAlertListeners(notice);
    if (!this.isNative) {
      await this.sendAlertNotification(notice);
    }
  }

  async sendAlertNotification({ title, body, taskId, type }) {
    const isUrgent = URGENT_TASK_ALERT_TYPES.has(type);
    if (this.isNative) {
      await this.showNativeNotification({ title, body, taskId, type, isUrgent });
      return;
    }
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    const browserNotification = new Notification(title, {
      body,
      icon: '/logo.png',
      requireInteraction: true,
      silent: false
    });
    browserNotification.onclick = () => {
      window.focus();
      this.notifyAlertListeners({
        title,
        body,
        taskId,
        type,
        id: `${Date.now()}-${Math.random()}`
      });
      this.startAlarm();
      browserNotification.close();
    };
  }

  notifyAlertListeners(alert) {
    this.alertListeners.forEach(listener => listener(alert));
  }

  async startAlarm() {
    if (!this.alarmContext && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) this.alarmContext = new AudioContextClass();
    }
    if (!this.alarmContext || this.alarmInterval) return;

    if (this.alarmContext.state === 'suspended') {
      try {
        await this.alarmContext.resume();
      } catch (error) {
        console.warn('Alarm audio is waiting for a user interaction:', error.message);
        return;
      }
    }

    const playPulse = () => {
      const context = this.alarmContext;
      if (!context || context.state !== 'running') return;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      oscillator.frequency.setValueAtTime(660, context.currentTime + 0.18);
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.38);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.4);
    };

    playPulse();
    this.alarmInterval = window.setInterval(playPulse, 1100);
  }

  stopAlarm() {
    if (this.alarmInterval) {
      window.clearInterval(this.alarmInterval);
      this.alarmInterval = null;
    }
    if (this.isNative) {
      TaskAlertControl.stopAlarm().catch((error) => {
        console.error('Could not stop native task alarm:', error.message);
      });
    }
  }

  async clearTaskNotification(taskId) {
    if (!this.isNative || !taskId) return;
    await TaskAlertControl.clearTaskNotification({ taskId: String(taskId) });
  }

  unlockAlarmAudio() {
    if (this.audioUnlockHandler || typeof document === 'undefined') return;
    if (!this.alarmContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) this.alarmContext = new AudioContextClass();
    }
    this.audioUnlockHandler = () => {
      document.removeEventListener('pointerdown', this.audioUnlockHandler);
      document.removeEventListener('keydown', this.audioUnlockHandler);
      if (this.alarmContext?.state === 'suspended') {
        this.alarmContext.resume().catch((error) => {
          console.warn('Could not enable alert audio:', error.message);
        });
      }
    };
    document.addEventListener('pointerdown', this.audioUnlockHandler, { once: true });
    document.addEventListener('keydown', this.audioUnlockHandler, { once: true });
  }

  // Initialize push notification listeners and channels
  async init(user) {
    this.user = user || this.user;
    this.unlockAlarmAudio();
    const userId = this.user?.id || this.user?._id;
    if (this.token && userId) {
      await apiService.syncFCMToken(userId, this.token);
    }
    if (!this.initialization) {
      this.initialization = this.isNative
        ? this.initNativePush()
        : this.initWebNotifications();
    }
    return this.initialization;
  }

  // Native Android/iOS Push Configuration
  async initNativePush() {
    try {
      // 1. Create channels
      await PushNotifications.createChannel({
        id: 'office_crm_alarm_v6',
        name: 'Urgent Tasks Alarm',
        description: 'Loud alarm for urgent task assignments and alerts',
        importance: 5,
        visibility: 1,
        sound: 'task_alarm.wav',
        vibration: true,
        lights: true,
        lightColor: '#1e69ff'
      });
      await PushNotifications.createChannel({
        id: 'office_crm_default_v2',
        name: 'Office CRM Updates',
        description: 'General task and expense updates',
        importance: 4,
        visibility: 1,
        sound: 'default',
        vibration: true
      });
      await LocalNotifications.createChannel({
        id: 'office_crm_alarm_v6',
        name: 'Urgent Tasks Alarm',
        description: 'Loud alarm for urgent task assignments and alerts',
        importance: 5,
        visibility: 1,
        sound: 'task_alarm.wav',
        vibration: true,
        lights: true,
        lightColor: '#1e69ff'
      });
      await LocalNotifications.createChannel({
        id: 'office_crm_default_v2',
        name: 'Office CRM Updates',
        description: 'General task and expense updates',
        importance: 4,
        visibility: 1,
        sound: 'default',
        vibration: true
      });

      // 2. Register Notification Action Buttons (Snooze & Mark as Completed) - Plain text, no emojis
      await LocalNotifications.registerActionTypes({
        types: [
          {
            id: 'TASK_ACTIONS',
            actions: [
              {
                id: 'snooze',
                title: 'Snooze',
                foreground: true
              },
              {
                id: 'complete',
                title: 'Mark as Completed',
                foreground: true
              }
            ]
          }
        ]
      });

      // 3. Listen for Action Button clicks
      LocalNotifications.addListener('localNotificationActionPerformed', async (action) => {
        console.log('Action performed on notification:', action);
        this.stopAlarm();
        const taskId = action.notification?.extra?.taskId;
        const actionId = action.actionId;

        if (actionId === 'snooze' && taskId) {
          try {
            await apiService.snoozeTask(taskId);
          } catch (err) {
            console.error('Failed to snooze task:', err);
          }
        } else if (actionId === 'complete' && taskId) {
          try {
            await apiService.completeTask(taskId, {
              completedAt: new Date().toISOString(),
              quickComplete: true
            });
          } catch (err) {
            console.error('Failed to complete task:', err);
          }
        }

        try {
          await LocalNotifications.cancel({ notifications: [{ id: action.notification.id }] });
        } catch (_) {}
      });

      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      let localPermission = await LocalNotifications.checkPermissions();
      if (localPermission.display === 'prompt') {
        localPermission = await LocalNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted' || localPermission.display !== 'granted') {
        console.warn('Push notification permission denied by user.');
        return;
      }

      PushNotifications.addListener('registration', async (token) => {
        console.log('FCM Device Token Registered:', token.value);
        this.token = token.value;
        localStorage.setItem('fcm_device_token', token.value);

        const userId = this.user?.id || this.user?._id;
        if (userId) {
          await apiService.syncFCMToken(userId, token.value);
        }
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Registration Error:', error);
      });

      PushNotifications.addListener('pushNotificationReceived', async (notification) => {
        console.log('Push notification received:', notification);
        const title = notification.title || notification.data?.title || 'Office CRM';
        const body = notification.body || notification.data?.body || 'You have an update.';
        const type = notification.data?.type || '';

        if (type === 'TASK_COMPLETED') {
          this.stopAlarm();
        }

        if (URGENT_TASK_ALERT_TYPES.has(type)) {
          await this.raiseAlert({
            title,
            body,
            taskId: notification.data?.taskId,
            type
          });
        } else if (TASK_NOTIFICATION_TYPES.has(type) || NOTICE_TYPES.has(type)) {
          await this.raiseNotice({
            title,
            body,
            taskId: notification.data?.taskId,
            expenseId: notification.data?.expenseId,
            transactionId: notification.data?.transactionId,
            type
          });
        }
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('User tapped on notification:', notification);
        const data = notification.notification?.data || {};
        if (URGENT_TASK_ALERT_TYPES.has(data.type)) {
          const alert = {
            title: notification.notification?.title || 'Task reminder',
            body: notification.notification?.body || 'A task needs your attention.',
            taskId: data.taskId,
            type: data.type,
            id: `${Date.now()}-${Math.random()}`
          };
          if (this.shouldHandleNotification(alert)) {
            this.notifyAlertListeners(alert);
            this.startAlarm();
          }
        } else if (TASK_NOTIFICATION_TYPES.has(data.type) || NOTICE_TYPES.has(data.type)) {
          const notice = {
            title: notification.notification?.title || 'Office CRM update',
            body: notification.notification?.body || 'You have an update.',
            taskId: data.taskId,
            expenseId: data.expenseId,
            transactionId: data.transactionId,
            type: data.type,
            id: `${Date.now()}-${Math.random()}`
          };
          if (this.shouldHandleNotification(notice)) this.notifyAlertListeners(notice);
        }
      });

      await PushNotifications.register();
    } catch (e) {
      console.error('Native Push Notification initialization error:', e);
    }
  }

  async showNativeNotification({ title, body, taskId = null, type = '', isUrgent = true }) {
    const channelId = isUrgent ? 'office_crm_alarm_v6' : 'office_crm_default_v2';
    const notifId = taskId ? (Math.abs(taskId.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)) % 100000) : (Math.floor(Math.random() * 100000) + 1);

    await LocalNotifications.schedule({
      notifications: [{
        id: notifId,
        title,
        body,
        channelId,
        actionTypeId: isUrgent ? 'TASK_ACTIONS' : undefined,
        sound: isUrgent ? 'task_alarm.wav' : 'default',
        ongoing: isUrgent, // Persistent: stays on lock-screen/notification-bar until clicked or dismissed via action
        autoCancel: !isUrgent, // Normal notices dismiss when tapped
        schedule: { at: new Date(Date.now() + 200) },
        isExactNotification: true,
        extra: {
          taskId,
          type,
          source: 'office-crm'
        }
      }]
    });
  }

  // Web Browser Notification fallback
  async initWebNotifications() {
    this.unlockAlarmAudio();
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notifications');
      return;
    }

    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (e) {
        console.log('Notification request error', e);
      }
    }
  }

  // Send a test local notification
  async sendTestAlert(title, body) {
    if (this.isNative) {
      try {
        await this.showNativeNotification({ title, body, isUrgent: true });
        await this.startAlarm();
      } catch (error) {
        console.error('Unable to display native notification:', error.message);
      }
    } else if (Notification.permission === 'granted') {
      const browserNotification = new Notification(title, {
        body: body,
        icon: '/logo.png',
        requireInteraction: true,
        silent: false
      });
      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
      };
    } else {
      alert(`🔔 [Notification]: ${title}\n${body}`);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
