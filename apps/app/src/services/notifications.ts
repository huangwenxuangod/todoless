import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import type { Task } from "@todoless/shared/types/task";

const reminderIdentifierPrefix = "todoless-reminder";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function initNotifications() {
  const current = await Notifications.getPermissionsAsync();
  if (current.status !== "granted") {
    await Notifications.requestPermissionsAsync();
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("reminders", {
      name: "Task reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
    });
  }

  await Notifications.setNotificationCategoryAsync("task-reminder", [
    {
      identifier: "done",
      buttonTitle: "Done",
      options: { opensAppToForeground: false },
    },
    {
      identifier: "later",
      buttonTitle: "Later",
      options: { opensAppToForeground: false },
    },
  ]);
}

export async function syncTaskReminderNotifications(tasks: Task[]) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((notification) => notification.identifier.startsWith(reminderIdentifierPrefix))
      .map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier))
  );

  const now = Date.now();
  const openTasksWithReminder = tasks
    .filter((task) => task.status === "open" && task.reminderAt && new Date(task.reminderAt).getTime() > now)
    .slice(0, 64);

  await Promise.all(openTasksWithReminder.map(scheduleTaskReminder));
}

async function scheduleTaskReminder(task: Task) {
  if (!task.reminderAt) return;
  await Notifications.scheduleNotificationAsync({
    identifier: `${reminderIdentifierPrefix}:${task.id}:${task.reminderAt}`,
    content: {
      title: task.title,
      body: task.content ?? "todoless reminder",
      sound: "default",
      vibrate: [0, 250, 250, 250],
      categoryIdentifier: "task-reminder",
      data: { taskId: task.id },
    },
    trigger: {
      channelId: "reminders",
      date: new Date(task.reminderAt),
    } as Notifications.NotificationTriggerInput,
  });
}
