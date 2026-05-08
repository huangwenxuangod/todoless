import { useLocalSearchParams, Stack, router } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trash2 } from "lucide-react-native";
import { useTaskStore } from "../../stores/taskStore";
import { colors, spacing, radii } from "../../constants/theme";

const priorityLabels: Record<number, string> = {
  0: "None",
  1: "Low",
  2: "Medium",
  3: "High",
};

const priorityColors: Record<number, string> = {
  0: colors.priorityNone,
  1: colors.priorityLow,
  2: colors.priorityMedium,
  3: colors.priorityHigh,
};

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const task = useTaskStore((s) => s.tasks.find((t) => t.id === id));
  const toggleTask = useTaskStore((s) => s.toggleTask);
  const removeTask = useTaskStore((s) => s.removeTask);

  if (!task) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.empty}>Task not found</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert("Delete Task", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await removeTask(task.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <Stack.Screen
        options={{
          title: "Task",
          headerRight: () => (
            <Pressable onPress={handleDelete} style={styles.headerBtn}>
              <Trash2 size={20} color={colors.error} />
            </Pressable>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Priority */}
        <View style={styles.row}>
          <View
            style={[
              styles.priorityBadge,
              { backgroundColor: priorityColors[task.priority] + "20" },
            ]}
          >
            <View
              style={[
                styles.priorityDot,
                { backgroundColor: priorityColors[task.priority] },
              ]}
            />
            <Text
              style={[
                styles.priorityText,
                { color: priorityColors[task.priority] },
              ]}
            >
              {priorityLabels[task.priority]}
            </Text>
          </View>

          <Pressable
            onPress={() => toggleTask(task.id)}
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  task.status === "done" ? colors.success + "20" : colors.surfaceHover,
              },
            ]}
          >
            <Text
              style={{
                color: task.status === "done" ? colors.success : colors.muted,
              }}
            >
              {task.status === "done" ? "Done" : "Open"}
            </Text>
          </Pressable>
        </View>

        {/* Title */}
        <Text style={styles.title}>{task.title}</Text>

        {/* Content */}
        {task.content && (
          <Text style={styles.content}>{task.content}</Text>
        )}

        {/* Meta */}
        <View style={styles.meta}>
          {task.dueAt && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Due</Text>
              <Text style={styles.metaValue}>
                {new Date(task.dueAt).toLocaleString()}
              </Text>
            </View>
          )}
          {task.reminderAt && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Reminder</Text>
              <Text style={styles.metaValue}>
                {new Date(task.reminderAt).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {task.tags.length > 0 && (
          <View style={styles.tags}>
            {task.tags.map((tag) => (
              <View key={tag.id} style={styles.tag}>
                <Text style={styles.tagText}>{tag.name}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    color: colors.faint,
    fontSize: 15,
  },
  headerBtn: {
    padding: spacing.sm,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  priorityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
  },
  priorityText: {
    fontSize: 13,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 30,
  },
  content: {
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
  },
  meta: {
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(245, 240, 232, 0.06)",
  },
  metaLabel: {
    fontSize: 14,
    color: colors.faint,
  },
  metaValue: {
    fontSize: 14,
    color: colors.text,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  tagText: {
    fontSize: 13,
    color: colors.muted,
  },
});
