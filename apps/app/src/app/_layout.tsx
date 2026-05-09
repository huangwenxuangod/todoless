import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { msUntilNextLocalDay } from "@todoless/shared/lib/date";
import { useTaskStore } from "../stores/taskStore";
import { colors } from "../constants/theme";

export default function RootLayout() {
  const hydrate = useTaskStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

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
