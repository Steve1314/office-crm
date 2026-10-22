package com.task.app;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

public class NotificationActionReceiver extends BroadcastReceiver {
    private static final String TAG = "NotificationAction";

    @Override
    public void onReceive(final Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        String taskId = intent.getStringExtra("taskId");
        int notificationId = intent.getIntExtra("notificationId", 1001);

        Log.d(TAG, "Received notification action: " + action + " for taskId: " + taskId);

        // 1. Stop loud ringing and vibration immediately (0 ms delay)
        TaskAlertService.stopAlarm(context);

        // 2. Dismiss persistent notification banner immediately
        try {
            NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.cancel(notificationId);
                if (taskId != null && !taskId.isEmpty()) {
                    manager.cancel(Math.abs(taskId.hashCode()));
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error cancelling notification: " + e.getMessage());
        }

        final boolean isSnooze = "com.task.app.ACTION_SNOOZE".equals(action) || "ACTION_SNOOZE".equals(action);
        final boolean isComplete = "com.task.app.ACTION_COMPLETE".equals(action) || "ACTION_COMPLETE".equals(action);

        if (!isSnooze && !isComplete) {
            // Dismiss or swipe away action - alarm is stopped and notification cancelled
            return;
        }

        // 3. Provide instant visual confirmation to user via Toast
        new Handler(Looper.getMainLooper()).post(new Runnable() {
            @Override
            public void run() {
                try {
                    if (isSnooze) {
                        Toast.makeText(context.getApplicationContext(), "⏰ Task snoozed for 5 minutes", Toast.LENGTH_LONG).show();
                    } else if (isComplete) {
                        Toast.makeText(context.getApplicationContext(), "✅ Task marked as completed", Toast.LENGTH_LONG).show();
                    }
                } catch (Exception tErr) {
                    Log.w(TAG, "Toast error: " + tErr.getMessage());
                }
            }
        });

        // 4. Update task state in production backend (Quick endpoints without JWT requirement)
        if (taskId != null && !taskId.trim().isEmpty()) {
            if (isSnooze) {
                callBackendApi("https://task.cloudastro.space/api/tasks/" + taskId.trim() + "/quick-snooze", "POST", "{}");
            } else if (isComplete) {
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
                sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
                String body = "{\"completedAt\":\"" + sdf.format(new Date()) + "\",\"quickComplete\":true}";
                callBackendApi("https://task.cloudastro.space/api/tasks/" + taskId.trim() + "/quick-complete", "POST", body);
            }
        }
    }

    private void callBackendApi(final String endpoint, final String method, final String jsonBody) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                HttpURLConnection conn = null;
                try {
                    URL url = new URL(endpoint);
                    conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod(method);
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setConnectTimeout(8000);
                    conn.setReadTimeout(8000);

                    if ("POST".equals(method) || "PUT".equals(method)) {
                        conn.setDoOutput(true);
                        OutputStream os = conn.getOutputStream();
                        os.write(jsonBody.getBytes("UTF-8"));
                        os.flush();
                        os.close();
                    }

                    int responseCode = conn.getResponseCode();
                    Log.d(TAG, "API " + method + " " + endpoint + " returned code: " + responseCode);
                } catch (Exception e) {
                    Log.e(TAG, "Failed calling background API endpoint: " + e.getMessage());
                } finally {
                    if (conn != null) {
                        try {
                            conn.disconnect();
                        } catch (Exception ignored) {}
                    }
                }
            }
        }).start();
    }
}
