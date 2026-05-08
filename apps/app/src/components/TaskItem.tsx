import { Pressable, StyleSheet, Text, View } from "react-native";
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
        <Text
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

        {task.tags.length > 0 && (
          <View style={styles.meta}>
            {task.tags.map((tag) => (
              <View key={tag.id} style={styles.tag}>
                <Text style={styles.tagText}>{tag.name}</Text>
              </View>
            ))}
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
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
  },
  checkbox: {
    paddingTop: 2,
  },
  circle: {
    width: 18,
    height: 18,
    borderRadius: radii.full,
    borderWidth: 2,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  meta: {
    flexDirection: "row",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: colors.panel,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
  },
  tagText: {
    fontSize: 12,
    color: colors.muted,
  },
});
