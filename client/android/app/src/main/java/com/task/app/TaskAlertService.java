package com.task.app;

import android.app.NotificationManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.media.AudioManager;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.util.Log;

public class TaskAlertService {
    private static final String TAG = "TaskAlertService";
    private static final String VOLUME_PREFERENCES = "task_alert_volume";
    private static final String PREVIOUS_ALARM_VOLUME = "previous_alarm_volume";
    private static final String ALARM_VOLUME_RAISED = "alarm_volume_raised";
    private static MediaPlayer mediaPlayer;
    private static Vibrator vibrator;
    private static Handler timeoutHandler;
    private static Runnable timeoutRunnable;

    public static void clearTaskNotification(Context context, String taskId) {
        if (context == null || taskId == null || taskId.isEmpty()) return;
        try {
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                int taskNotificationId = Math.abs(taskId.hashCode());
                manager.cancel(taskNotificationId);
                manager.cancel(taskNotificationId % 100000);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to clear task notification: " + e.getMessage());
        }
    }

    public static synchronized void startAlarm(final Context context) {
        try {
            stopAlarmPlayback(context);
            raiseAlarmVolume(context);

            Uri soundUri = Uri.parse("android.resource://" + context.getPackageName() + "/" + R.raw.task_alarm);
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setDataSource(context, soundUri);

            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build();
            mediaPlayer.setAudioAttributes(audioAttributes);
            mediaPlayer.setLooping(true);
            mediaPlayer.prepare();
            mediaPlayer.start();

            vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = {0, 1000, 600, 1000, 600, 1000};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
                } else {
                    vibrator.vibrate(pattern, 0);
                }
            }

            // Safety timeout: automatically stop ringing after 60 seconds if unattended
            if (timeoutHandler == null) {
                timeoutHandler = new Handler(Looper.getMainLooper());
            }
            timeoutRunnable = new Runnable() {
                @Override
                public void run() {
                    Log.d(TAG, "Task alarm reached 60s timeout - stopping ringing to preserve battery");
                    stopAlarm(context);
                }
            };
            timeoutHandler.postDelayed(timeoutRunnable, 60000);

            Log.d(TAG, "Loud task alarm started successfully");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start alarm: " + e.getMessage());
            stopAlarm(context);
        }
    }

    public static synchronized void stopAlarm(Context context) {
        stopAlarmPlayback(context);
        restoreAlarmVolume(context);
    }

    private static void stopAlarmPlayback(Context context) {
        try {
            if (timeoutHandler != null && timeoutRunnable != null) {
                timeoutHandler.removeCallbacks(timeoutRunnable);
                timeoutRunnable = null;
            }
            if (mediaPlayer != null) {
                try {
                    if (mediaPlayer.isPlaying()) {
                        mediaPlayer.stop();
                    }
                } catch (Exception ignored) {}
                try {
                    mediaPlayer.reset();
                    mediaPlayer.release();
                } catch (Exception ignored) {}
                mediaPlayer = null;
            }
            if (vibrator == null && context != null) {
                vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            }
            if (vibrator != null) {
                try {
                    vibrator.cancel();
                } catch (Exception ignored) {}
                vibrator = null;
            }
            Log.d(TAG, "Task alarm stopped");
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop alarm: " + e.getMessage());
        }
    }

    private static void raiseAlarmVolume(Context context) {
        if (context == null) return;
        AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        if (audioManager == null) return;

        SharedPreferences preferences = context.getSharedPreferences(VOLUME_PREFERENCES, Context.MODE_PRIVATE);
        if (!preferences.getBoolean(ALARM_VOLUME_RAISED, false)) {
            preferences.edit()
                    .putInt(PREVIOUS_ALARM_VOLUME, audioManager.getStreamVolume(AudioManager.STREAM_ALARM))
                    .putBoolean(ALARM_VOLUME_RAISED, true)
                    .apply();
        }

        try {
            audioManager.setStreamVolume(
                    AudioManager.STREAM_ALARM,
                    audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM),
                    0
            );
        } catch (RuntimeException e) {
            Log.e(TAG, "Could not raise alarm volume: " + e.getMessage());
        }
    }

    private static void restoreAlarmVolume(Context context) {
        if (context == null) return;
        SharedPreferences preferences = context.getSharedPreferences(VOLUME_PREFERENCES, Context.MODE_PRIVATE);
        if (!preferences.getBoolean(ALARM_VOLUME_RAISED, false)) return;

        AudioManager audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        if (audioManager == null) return;

        try {
            int previousVolume = preferences.getInt(PREVIOUS_ALARM_VOLUME, audioManager.getStreamMaxVolume(AudioManager.STREAM_ALARM));
            audioManager.setStreamVolume(AudioManager.STREAM_ALARM, previousVolume, 0);
            preferences.edit()
                    .remove(PREVIOUS_ALARM_VOLUME)
                    .remove(ALARM_VOLUME_RAISED)
                    .apply();
        } catch (RuntimeException e) {
            Log.e(TAG, "Could not restore alarm volume: " + e.getMessage());
        }
    }
}
