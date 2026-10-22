package com.task.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

public class TaskCallMessagingService extends FirebaseMessagingService {
    private static final String TAG = "TaskCallMessaging";
    public static final String CHANNEL_ID_URGENT = "office_crm_alarm_v7";
    public static final String CHANNEL_ID_DEFAULT = "office_crm_default_v2";

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Log.d(TAG, "FCM message received from: " + remoteMessage.getFrom());

        Map<String, String> data = remoteMessage.getData();
        String title = "Office CRM";
        String body = "";

        if (remoteMessage.getNotification() != null) {
            if (remoteMessage.getNotification().getTitle() != null) {
                title = remoteMessage.getNotification().getTitle();
            }
            if (remoteMessage.getNotification().getBody() != null) {
                body = remoteMessage.getNotification().getBody();
            }
        }

        if (data != null) {
            if (data.containsKey("title")) title = data.get("title");
            if (data.containsKey("body")) body = data.get("body");
        }

        String type = data != null ? data.get("type") : "";
        String taskId = data != null ? data.get("taskId") : null;
        if (taskId == null && data != null) taskId = data.get("id");

        if ("TASK_CLEARED".equalsIgnoreCase(type)) {
            TaskAlertService.stopAlarm(this);
            TaskAlertService.clearTaskNotification(this, taskId);
            return;
        }

        // Forward regular push events to Capacitor for in-app handling.
        try {
            PushNotificationsPlugin.sendRemoteMessage(remoteMessage);
        } catch (Exception e) {
            Log.w(TAG, "PushNotificationsPlugin forwarding: " + e.getMessage());
        }

        // CHECK IF THIS IS AN URGENT TASK ALERT
        // Loud alarm only for task issued/assigned and every 5-min reminders
        boolean isTaskUrgentAlert = "TASK_ASSIGNED".equalsIgnoreCase(type)
                || "TASK_REMINDER".equalsIgnoreCase(type)
                || "TASK_QUICK_ALERT".equalsIgnoreCase(type);

        if (isTaskUrgentAlert) {
            if (data != null && data.containsKey("taskTitle")) {
                title = "🚨 " + data.get("taskTitle");
            } else if (!title.startsWith("🚨")) {
                title = "🚨 " + title;
            }

            // 1. Force the physical screen to wake up immediately using PowerManager WakeLock
            try {
                android.os.PowerManager pm = (android.os.PowerManager) getSystemService(Context.POWER_SERVICE);
                if (pm != null) {
                    @SuppressWarnings("deprecation")
                    android.os.PowerManager.WakeLock wakeLock = pm.newWakeLock(
                            android.os.PowerManager.SCREEN_BRIGHT_WAKE_LOCK |
                            android.os.PowerManager.ACQUIRE_CAUSES_WAKEUP |
                            android.os.PowerManager.ON_AFTER_RELEASE,
                            "OfficeCRM:TaskUrgentAlert"
                    );
                    wakeLock.acquire(10000); // Hold for 10s while screen turns on
                }
            } catch (Exception e) {
                Log.w(TAG, "WakeLock acquire error: " + e.getMessage());
            }

            // 2. Start loud looping alarm ringtone (MediaPlayer)
            TaskAlertService.startAlarm(this);

            // 3. Show full-screen incoming call-style alert over lock screen
            showCallStyleNotification(title, body, taskId);
        } else {
            // FOR EVERYTHING ELSE (Money issued, task completed, expense added, etc.):
            // It MUST be a normal notification! NO loud ringing alarm!

            // If a task was marked completed, stop any ringing alarm for that task and dismiss its alert
            if ("TASK_COMPLETED".equalsIgnoreCase(type)) {
                TaskAlertService.stopAlarm(this);
                TaskAlertService.clearTaskNotification(this, taskId);
            }

            // Show standard normal notification
            showStandardNotification(title, body, taskId);
        }
    }

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        try {
            PushNotificationsPlugin.onNewToken(token);
        } catch (Exception e) {
            Log.w(TAG, "PushNotificationsPlugin token forward: " + e.getMessage());
        }
    }

    private void showCallStyleNotification(String title, String body, String taskId) {
        try {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            createNotificationChannels(manager);

            int notifId = (taskId != null && !taskId.isEmpty()) ? Math.abs(taskId.hashCode()) : 1001;

            // ── Intent to open app (tap on notification body) ─────────────────────
            Intent openIntent = new Intent(this, MainActivity.class);
            openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            openIntent.putExtra("taskId", taskId);
            PendingIntent openPendingIntent = PendingIntent.getActivity(
                    this,
                    notifId,
                    openIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            // ── Full-screen intent → TaskAlertActivity (WhatsApp-call-style overlay) ──
            // This is what turns on the screen and shows the alert over the lock screen.
            Intent alertIntent = new Intent(this, TaskAlertActivity.class);
            alertIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            alertIntent.putExtra(TaskAlertActivity.EXTRA_TASK_ID,    taskId);
            alertIntent.putExtra(TaskAlertActivity.EXTRA_TASK_TITLE, title);
            alertIntent.putExtra(TaskAlertActivity.EXTRA_TASK_BODY,  body);
            alertIntent.putExtra(TaskAlertActivity.EXTRA_NOTIF_ID,   notifId);
            PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
                    this,
                    notifId + 10,
                    alertIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            // ── Intent for SNOOZE button ───────────────────────────────────────────
            Intent snoozeIntent = new Intent(this, NotificationActionReceiver.class);
            snoozeIntent.setAction("com.task.app.ACTION_SNOOZE");
            snoozeIntent.putExtra("taskId", taskId);
            snoozeIntent.putExtra("notificationId", notifId);
            PendingIntent snoozePendingIntent = PendingIntent.getBroadcast(
                    this,
                    notifId + 1,
                    snoozeIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            // ── Intent for COMPLETE button ─────────────────────────────────────────
            Intent completeIntent = new Intent(this, NotificationActionReceiver.class);
            completeIntent.setAction("com.task.app.ACTION_COMPLETE");
            completeIntent.putExtra("taskId", taskId);
            completeIntent.putExtra("notificationId", notifId);
            PendingIntent completePendingIntent = PendingIntent.getBroadcast(
                    this,
                    notifId + 2,
                    completeIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            // ── Intent for DISMISS (swipe away) ───────────────────────────────────
            Intent dismissIntent = new Intent(this, NotificationActionReceiver.class);
            dismissIntent.setAction("com.task.app.ACTION_DISMISS");
            dismissIntent.putExtra("taskId", taskId);
            dismissIntent.putExtra("notificationId", notifId);
            PendingIntent dismissPendingIntent = PendingIntent.getBroadcast(
                    this,
                    notifId + 3,
                    dismissIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID_URGENT)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setLargeIcon(BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher))
                    .setContentTitle(title)
                    .setContentText(body)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                    .setPriority(NotificationCompat.PRIORITY_MAX)
                    .setCategory(NotificationCompat.CATEGORY_CALL)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    .setOngoing(true)
                    .setAutoCancel(false)
                    // NOTE: Do NOT call .setSilent(true) here! Calling setSilent(true) tells Android to suppress
                    // the full-screen intent and demote the notification into the shade!
                    .setContentIntent(openPendingIntent)
                    .setFullScreenIntent(fullScreenPendingIntent, true)
                    .setDeleteIntent(dismissPendingIntent)
                    .addAction(0, "Snooze", snoozePendingIntent)
                    .addAction(0, "Mark as Completed", completePendingIntent);

            if (manager != null) {
                manager.notify(notifId, builder.build());
            }

            // Also attempt direct activity launch in case system allows immediate foreground presentation
            try {
                startActivity(alertIntent);
            } catch (Exception e) {
                Log.d(TAG, "Direct activity launch handed off to fullScreenIntent: " + e.getMessage());
            }
        } catch (Exception e) {
            Log.e(TAG, "Error displaying call style notification: " + e.getMessage());
        }
    }


    private void showStandardNotification(String title, String body, String taskId) {
        try {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            createNotificationChannels(manager);

            int notifId = (int) (System.currentTimeMillis() % 100000);

            Intent openIntent = new Intent(this, MainActivity.class);
            openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            if (taskId != null) openIntent.putExtra("taskId", taskId);
            PendingIntent openPendingIntent = PendingIntent.getActivity(
                    this,
                    notifId,
                    openIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
            );

            NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID_DEFAULT)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setLargeIcon(BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher))
                    .setContentTitle(title)
                    .setContentText(body)
                    .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                    .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                    .setCategory(NotificationCompat.CATEGORY_EVENT)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    .setOngoing(false)
                    .setAutoCancel(true)
                    .setContentIntent(openPendingIntent);

            if (manager != null) {
                manager.notify(notifId, builder.build());
            }
        } catch (Exception e) {
            Log.e(TAG, "Error displaying standard notification: " + e.getMessage());
        }
    }

    private void createNotificationChannels(NotificationManager manager) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && manager != null) {
            // 1. High-priority Urgent Task Alarm channel (sound handled by MediaPlayer)
            NotificationChannel urgentChannel = new NotificationChannel(
                    CHANNEL_ID_URGENT,
                    "Urgent Tasks Alarm",
                    NotificationManager.IMPORTANCE_HIGH
            );
            urgentChannel.setDescription("High-priority task alerts with incoming call banner");
            urgentChannel.enableLights(true);
            urgentChannel.setLightColor(0xFF1E69FF);
            urgentChannel.enableVibration(true);
            urgentChannel.setVibrationPattern(new long[]{0, 500, 200, 500});
            urgentChannel.setSound(null, null); // Sound handled by TaskAlertService to allow looping alarm & instant dismiss
            urgentChannel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
            urgentChannel.setBypassDnd(true);
            manager.createNotificationChannel(urgentChannel);

            // 2. Standard Notification channel for money, completed tasks, expenses
            NotificationChannel defaultChannel = new NotificationChannel(
                    CHANNEL_ID_DEFAULT,
                    "Office CRM Updates",
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            defaultChannel.setDescription("Standard notifications for money, expenses, and task completions");
            defaultChannel.enableLights(true);
            defaultChannel.enableVibration(true);
            defaultChannel.setSound(Settings.System.DEFAULT_NOTIFICATION_URI, null);
            manager.createNotificationChannel(defaultChannel);
        }
    }
}
