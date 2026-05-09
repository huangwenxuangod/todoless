import { Pressable, StyleSheet, Text, View } from "react-native";
import { Clock, Repeat2 } from "lucide-react-native";
import { formatTaskTime } from "@todoless/shared/lib/date";
import { colors, radii, spacing } from "../constants/theme";
import type { Task } from "@todoless/shared/types/task";

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onPress: (task: Task) => void;
}

const priorityColors: Record<number, string> = {
  0: colors.priorityNone,
  1: colors.priorityLow,
  2: colors.priorityMedium,
  3: colors.priorityHigh,
};

export function TaskItem({ task, onToggle, onPress }: Props) {
  const time = formatTaskTime(task.dueAt);

  return (
    <Pressable onPress={() => onPress(task)} style={styles.container}>
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        style={styles.checkbox}
      >
        <View
          style={[
            styles.circle,
            {
              borderColor: priorityColors[task.priority],
              backgroundColor:
                task.status === "done" ? priorityColors[task.priority] : "transparent",
            },
          ]}
        />
      </Pressable>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              task.status === "done" && {
                textDecorationLine: "line-through",
                color: colors.faint,
              },
            ]}
          >
            {task.title}
          </Text>
          {time && <Text style={styles.time}>{time}</Text>}
        </View>

        {(task.tags.length > 0 || task.reminderAt || task.repeatRule.type !== "none") && (
          <View style={styles.meta}>
            {task.tags.slice(0, 2).map((tag) => (
              <View key={tag.id} style={styles.tagInline}>
                <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                <Text style={styles.tagText}>{tag.name}</Text>
              </View>
            ))}
            {task.reminderAt && (
              <View style={styles.tagInline}>
                <Clock size={11} color={colors.faint} />
                <Text style={styles.tagText}>Reminder</Text>
              </View>
            )}
            {task.repeatRule.type !== "none" && (
              <View style={styles.tagInline}>
                <Repeat2 size={11} color={colors.faint} />
                <Text style={styles.tagText}>
                  {task.repeatRule.type === "daily" ? "Daily" : "Weekly"}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(245, 240, 232, 0.06)",
  },
  checkbox: {
    paddingTop: 2,
  },
  circle: {
    width: 20,
    height: 20,
    borderRadius: radii.full,
    borderWidth: 2,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: 17,
    color: colors.text,
    lineHeight: 24,
  },
  time: {
    fontSize: 15,
    color: "#5b82ff",
    fontWeight: "600",
  },
  meta: {
    flexDirection: "row",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  tagInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
  },
  tagText: {
    fontSize: 12,
    color: colors.muted,
  },
});
