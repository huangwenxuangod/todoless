import { useLocalSearchParams, Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  const updateTaskFields = useTaskStore((s) => s.updateTaskFields);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");

  useEffect(() => {
    if (!task) return;
    setDraftTitle(task.title);
    setDraftContent(task.content ?? "");
  }, [task?.id]);

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
        <View style={styles.row}>
          {[0, 1, 2, 3].map((priority) => (
            <Pressable
              key={priority}
              onPress={() => updateTaskFields(task.id, { priority: priority as 0 | 1 | 2 | 3 })}
              style={[
                styles.priorityBadge,
                {
                  backgroundColor: priorityColors[priority] + "20",
                  opacity: task.priority === priority ? 1 : 0.46,
                },
              ]}
            >
              <View
                style={[
                  styles.priorityDot,
                  { backgroundColor: priorityColors[priority] },
                ]}
              />
              <Text
                style={[
                  styles.priorityText,
                  { color: priorityColors[priority] },
                ]}
              >
                {priorityLabels[priority]}
              </Text>
            </Pressable>
          ))}

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

        <TextInput
          multiline
          onBlur={() => updateTaskFields(task.id, { title: draftTitle.trim() || task.title })}
          onChangeText={setDraftTitle}
          placeholder="Task title"
          placeholderTextColor={colors.faint}
          style={styles.titleInput}
          value={draftTitle}
        />

        <TextInput
          multiline
          onBlur={() => updateTaskFields(task.id, { content: draftContent.trim() ? draftContent : null })}
          onChangeText={setDraftContent}
          placeholder="Add details"
          placeholderTextColor={colors.faint}
          style={styles.contentInput}
          value={draftContent}
        />

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

        <View style={styles.quickSection}>
          <Text style={styles.sectionTitle}>Reminder</Text>
          <View style={styles.quickGrid}>
            <Pressable
              style={styles.quickButton}
              onPress={() => updateTaskFields(task.id, { reminderAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() })}
            >
              <Text style={styles.quickText}>Later 15m</Text>
            </Pressable>
            <Pressable
              style={styles.quickButton}
              onPress={() => updateTaskFields(task.id, { reminderAt: tomorrowAt(9).toISOString() })}
            >
              <Text style={styles.quickText}>Tomorrow 9 AM</Text>
            </Pressable>
            <Pressable
              style={styles.quickButton}
              onPress={() => updateTaskFields(task.id, { reminderAt: null })}
            >
              <Text style={styles.quickText}>Clear</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.quickSection}>
          <Text style={styles.sectionTitle}>Repeat</Text>
          <View style={styles.quickGrid}>
            <Pressable
              style={[styles.quickButton, task.repeatRule.type === "daily" && styles.quickButtonActive]}
              onPress={() => updateTaskFields(task.id, { repeatRule: { type: "daily", interval: 1 } })}
            >
              <Text style={styles.quickText}>Daily</Text>
            </Pressable>
            <Pressable
              style={[styles.quickButton, task.repeatRule.type === "weekly" && styles.quickButtonActive]}
              onPress={() => updateTaskFields(task.id, { repeatRule: { type: "weekly", interval: 1 } })}
            >
              <Text style={styles.quickText}>Weekly</Text>
            </Pressable>
          </View>
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

function tomorrowAt(hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hour, 0, 0, 0);
  return date;
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
  titleInput: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 30,
    padding: 0,
  },
  contentInput: {
    minHeight: 82,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(245, 240, 232, 0.06)",
    padding: spacing.md,
    fontSize: 15,
    color: colors.muted,
    lineHeight: 22,
    textAlignVertical: "top",
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
  quickSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.faint,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  quickButton: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(245, 240, 232, 0.08)",
    justifyContent: "center",
  },
  quickButtonActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + "22",
  },
  quickText: {
    color: colors.text,
    fontWeight: "700",
  },
});
