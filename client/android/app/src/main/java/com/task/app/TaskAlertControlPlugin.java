package com.task.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TaskAlertControl")
public class TaskAlertControlPlugin extends Plugin {
    @PluginMethod
    public void stopAlarm(PluginCall call) {
        TaskAlertService.stopAlarm(getContext());
        call.resolve();
    }

    @PluginMethod
    public void clearTaskNotification(PluginCall call) {
        String taskId = call.getString("taskId");
        TaskAlertService.clearTaskNotification(getContext(), taskId);
        call.resolve();
    }

}
