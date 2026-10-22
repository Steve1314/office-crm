package com.task.app;

import android.app.KeyguardManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.WindowManager;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Button;
import android.util.Log;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

/**
 * Full-screen WhatsApp-style task alert activity.
 *
 * This activity is launched as the fullScreenIntent target when an urgent task
 * notification arrives. It appears over the lock screen immediately — just like
 * a WhatsApp call — without the user having to unlock the phone or scroll to the
 * notification shade.
 *
 * Actions available:
 *   • Dismiss  — stops the alarm and cancels the notification (stays on lock screen)
 *   • Snooze   — snoozes the task for 5 min via the backend quick-snooze endpoint
 *   • Open     — stops alarm, launches MainActivity, and shows the task detail screen
 */
public class TaskAlertActivity extends AppCompatActivity {

    private static final String TAG = "TaskAlertActivity";

    /** Extra keys — must match what TaskCallMessagingService puts in the intent */
    public static final String EXTRA_TASK_ID    = "taskId";
    public static final String EXTRA_TASK_TITLE = "taskTitle";
    public static final String EXTRA_TASK_BODY  = "taskBody";
    public static final String EXTRA_NOTIF_ID   = "notificationId";

    private String taskId;
    private int    notificationId;

    // Auto-dismiss after 60 s to avoid the screen being locked forever
    private final Handler  autoDismissHandler  = new Handler(Looper.getMainLooper());
    private final Runnable autoDismissRunnable = this::dismissAndFinish;

    // ─────────────────────────────────────────────────────────────────────────

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ── 1. Turn screen on and show over the lock screen ───────────────
        enableOverLockScreen();

        // ── 2. Full-screen immersive UI ───────────────────────────────────
        setContentView(R.layout.activity_task_alert);
        hideSystemUI();

        // ── 3. Read intent extras ─────────────────────────────────────────
        Intent intent = getIntent();
        taskId         = intent.getStringExtra(EXTRA_TASK_ID);
        notificationId = intent.getIntExtra(EXTRA_NOTIF_ID, -1);
        String title   = intent.getStringExtra(EXTRA_TASK_TITLE);
        String body    = intent.getStringExtra(EXTRA_TASK_BODY);

        if (title == null || title.isEmpty()) title = "🚨 New Task Alert";
        if (body  == null || body.isEmpty())  body  = "Tap to open the task.";

        // ── 4. Populate views ─────────────────────────────────────────────
        TextView tvTitle = findViewById(R.id.tv_alert_title);
        TextView tvBody  = findViewById(R.id.tv_alert_body);
        Button   btnDismiss  = findViewById(R.id.btn_alert_dismiss);
        Button   btnSnooze   = findViewById(R.id.btn_alert_snooze);
        Button   btnOpen     = findViewById(R.id.btn_alert_open);

        if (tvTitle != null) tvTitle.setText(title);
        if (tvBody  != null) tvBody.setText(body);

        if (btnDismiss != null) btnDismiss.setOnClickListener(v -> dismissAndFinish());
        if (btnSnooze  != null) btnSnooze.setOnClickListener(v  -> snoozeAndFinish());
        if (btnOpen    != null) btnOpen.setOnClickListener(v    -> openTaskAndFinish());

        // ── 5. Auto-dismiss safety timer (60 s) ──────────────────────────
        autoDismissHandler.postDelayed(autoDismissRunnable, 60_000);

        Log.d(TAG, "TaskAlertActivity shown for taskId=" + taskId);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        // Re-apply lock-screen flags in case activity was re-used
        enableOverLockScreen();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        autoDismissHandler.removeCallbacks(autoDismissRunnable);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Button actions
    // ─────────────────────────────────────────────────────────────────────────

    private void dismissAndFinish() {
        TaskAlertService.stopAlarm(this);
        cancelNotification();
        finish();
    }

    private void snoozeAndFinish() {
        TaskAlertService.stopAlarm(this);
        cancelNotification();

        // Fire-and-forget network call (same pattern as NotificationActionReceiver)
        if (taskId != null && !taskId.trim().isEmpty()) {
            new Thread(() -> {
                java.net.HttpURLConnection conn = null;
                try {
                    java.net.URL url = new java.net.URL(
                            "https://task.cloudastro.space/api/tasks/" + taskId.trim() + "/quick-snooze");
                    conn = (java.net.HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setConnectTimeout(8000);
                    conn.setReadTimeout(8000);
                    conn.setDoOutput(true);
                    byte[] body = "{}".getBytes("UTF-8");
                    conn.getOutputStream().write(body);
                    conn.getOutputStream().flush();
                    int code = conn.getResponseCode();
                    Log.d(TAG, "Snooze API responded: " + code);
                } catch (Exception e) {
                    Log.e(TAG, "Snooze API error: " + e.getMessage());
                } finally {
                    if (conn != null) try { conn.disconnect(); } catch (Exception ignored) {}
                }
            }).start();
        }

        finish();
    }

    private void openTaskAndFinish() {
        TaskAlertService.stopAlarm(this);
        cancelNotification();

        // Launch the main app, passing the taskId so it can open the correct task
        final Intent mainIntent = new Intent(this, MainActivity.class);
        mainIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        if (taskId != null) mainIntent.putExtra("taskId", taskId);

        KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
        if (km != null && km.isKeyguardLocked()) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                km.requestDismissKeyguard(this, new KeyguardManager.KeyguardDismissCallback() {
                    @Override
                    public void onDismissSucceeded() {
                        startActivity(mainIntent);
                        finish();
                    }
                    @Override
                    public void onDismissCancelled() {
                        finish();
                    }
                    @Override
                    public void onDismissError() {
                        startActivity(mainIntent);
                        finish();
                    }
                });
                return;
            }
        }

        startActivity(mainIntent);
        finish();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private void cancelNotification() {
        try {
            NotificationManager nm =
                    (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                if (notificationId != -1) nm.cancel(notificationId);
                if (taskId != null && !taskId.isEmpty())
                    nm.cancel(Math.abs(taskId.hashCode()));
            }
        } catch (Exception e) {
            Log.e(TAG, "Error cancelling notification: " + e.getMessage());
        }
    }

    /** Show the activity over the lock screen and turn the display on. */
    @SuppressWarnings("deprecation")
    private void enableOverLockScreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        }

        // Always add window flags for full backwards and OEM compatibility (Samsung OneUI, Xiaomi MIUI, Oppo, Vivo)
        getWindow().addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
            WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON   |
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON   |
            WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
        );
    }

    /** Hide the status and navigation bars for a true full-screen experience. */
    private void hideSystemUI() {
        try {
            WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
            View decorView = getWindow().getDecorView();
            WindowInsetsControllerCompat controller =
                    new WindowInsetsControllerCompat(getWindow(), decorView);
            controller.hide(WindowInsetsCompat.Type.systemBars());
            controller.setSystemBarsBehavior(
                    WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        } catch (Exception e) {
            Log.w(TAG, "Could not hide system UI: " + e.getMessage());
        }
    }
}
