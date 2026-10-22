package com.task.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(TaskAlertControlPlugin.class);
        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING);

        createNotificationChannels();
    }

    @Override
    protected void onNewIntent(android.content.Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
    }

    @Override
    public void onBackPressed() {
        if (bridge == null || bridge.getWebView() == null) {
            super.onBackPressed();
            return;
        }

        bridge.getWebView().evaluateJavascript(
                "window.dispatchEvent(new Event('nativebackbutton', { cancelable: true }))",
                handled -> {
                    if ("true".equals(handled)) {
                        super.onBackPressed();
                    }
                }
        );
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                // 1. Urgent Task Alarm channel
                NotificationChannel urgentChannel = new NotificationChannel(
                        TaskCallMessagingService.CHANNEL_ID_URGENT,
                        "Urgent Tasks Alarm",
                        NotificationManager.IMPORTANCE_HIGH
                );
                urgentChannel.setDescription("High-priority task alerts with incoming call banner");
                urgentChannel.enableLights(true);
                urgentChannel.setLightColor(0xFF1E69FF);
                urgentChannel.enableVibration(true);
                urgentChannel.setVibrationPattern(new long[]{0, 500, 200, 500});
                urgentChannel.setSound(null, null);
                urgentChannel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
                urgentChannel.setBypassDnd(true);
                manager.createNotificationChannel(urgentChannel);

                // 2. Standard Updates channel (money issued, task completed, expenses)
                NotificationChannel defaultChannel = new NotificationChannel(
                        TaskCallMessagingService.CHANNEL_ID_DEFAULT,
                        "Office CRM Updates",
                        NotificationManager.IMPORTANCE_DEFAULT
                );
                defaultChannel.setDescription("Standard notifications for money, expenses, and task completions");
                defaultChannel.enableLights(true);
                defaultChannel.enableVibration(true);
                defaultChannel.setSound(Settings.System.DEFAULT_NOTIFICATION_URI, null);
                manager.createNotificationChannel(defaultChannel);

                // 3. Android 14+ Full Screen Intent check
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    if (!manager.canUseFullScreenIntent()) {
                        try {
                            android.content.Intent fsiIntent = new android.content.Intent(
                                    android.provider.Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
                                    android.net.Uri.parse("package:" + getPackageName())
                            );
                            startActivity(fsiIntent);
                        } catch (Exception ignored) {}
                    }
                }
            }
        }
    }
}
