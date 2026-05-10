import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { msUntilNextLocalDay } from "@todoless/shared/lib/date";
import { useTaskStore } from "../stores/taskStore";
import { colors } from "../constants/theme";
import { initNotifications, syncTaskReminderNotifications } from "../services/notifications";

export default function RootLayout() {
  const hydrate = useTaskStore((s) => s.hydrate);
  const tasks = useTaskStore((s) => s.tasks);

  useEffect(() => {
    void initNotifications();
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    void syncTaskReminderNotifications(tasks);
  }, [tasks]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const taskId = response.notification.request.content.data?.taskId;
      if (typeof taskId !== "string") return;

      if (response.actionIdentifier === "done") {
        void useTaskStore.getState().toggleTask(taskId);
        return;
      }

      if (response.actionIdentifier === "later") {
        void useTaskStore
          .getState()
          .updateTaskFields(taskId, { reminderAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() });
        return;
      }

      // Keep routing lazy here; Expo Router will hydrate before the tap resolves in normal app use.
      void import("expo-router").then(({ router }) => router.push(`/task/${taskId}`));
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const timeoutId = setTimeout(() => {
      void hydrate();
      intervalId = setInterval(() => void hydrate(), 24 * 60 * 60 * 1000);
    }, msUntilNextLocalDay() + 1000);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [hydrate]);

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="task/[id]"
          options={{ title: "Task", presentation: "modal" }}
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
