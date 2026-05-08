import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTaskStore } from "../../stores/taskStore";
import { TaskItem } from "../../components/TaskItem";
import { VoiceButton } from "../../components/VoiceButton";
import { colors, spacing } from "../../constants/theme";
import { router } from "expo-router";

export default function TodayScreen() {
  const openTasks = useTaskStore((s) => s.getOpenTasks());
  const toggleTask = useTaskStore((s) => s.toggleTask);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Today</Text>
        <Text style={styles.count}>{openTasks.length} tasks</Text>
      </View>

      <FlatList
        data={openTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskItem
            task={item}
            onToggle={toggleTask}
            onPress={(task) => router.push(`/task/${task.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No tasks for today</Text>
          </View>
        }
      />

      <VoiceButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: colors.text,
  },
  count: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  empty: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    color: colors.faint,
    fontSize: 15,
  },
});
