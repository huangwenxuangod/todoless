import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar1, CalendarDays, ChevronDown, Inbox, MoreHorizontal, Tag } from "lucide-react-native";
import { taskBelongsToView, taskMatchesView } from "@todoless/shared/lib/date";
import type { SmartView, Task } from "@todoless/shared/types/task";
import { useTaskStore } from "../../stores/taskStore";
import { TaskItem } from "../../components/TaskItem";
import { SyncButton } from "../../components/SyncButton";
import { VoiceButton } from "../../components/VoiceButton";
import { colors, radii, spacing } from "../../constants/theme";
import { router } from "expo-router";

const views: Array<{ key: SmartView; label: string; icon: typeof Calendar1 }> = [
  { key: "today", label: "Today", icon: Calendar1 },
  { key: "tomorrow", label: "Tomorrow", icon: Calendar1 },
  { key: "next7", label: "Next 7 Days", icon: CalendarDays },
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "all", label: "Tags", icon: Tag },
];

function taskInView(task: Task, view: SmartView) {
  if (view === "inbox") return !task.dueAt;
  if (view === "all") return task.tags.length > 0;
  return taskMatchesView(task, view);
}

export default function TasksScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const tasks = useTaskStore((s) => s.tasks);
  const toggleTask = useTaskStore((s) => s.toggleTask);
  const activeView = useTaskStore((s) => s.activeView);
  const setActiveView = useTaskStore((s) => s.setActiveView);
  const activeLabel = views.find((view) => view.key === activeView)?.label ?? "Today";
  const openTasks = useMemo(() => {
    if (activeView === "inbox") {
      return tasks.filter((task) => task.status === "open" && !task.dueAt);
    }
    if (activeView === "all") {
      return tasks.filter((task) => task.status === "open" && task.tags.length > 0);
    }
    return tasks.filter((task) => taskBelongsToView(task, activeView));
  }, [activeView, tasks]);
  const doneTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.status === "done" && taskInView(task, activeView)
      ),
    [activeView, tasks]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable style={styles.titleButton} onPress={() => setMenuOpen(true)}>
          <Calendar1 size={24} color={colors.faint} />
          <Text style={styles.title}>{activeLabel}</Text>
          <ChevronDown size={18} color={colors.muted} />
        </Pressable>
        <View style={styles.headerActions}>
          <SyncButton />
          <Pressable style={styles.iconButton}>
            <MoreHorizontal size={22} color={colors.muted} />
          </Pressable>
        </View>
      </View>

      <View style={styles.panel}>
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
              <Text style={styles.emptyText}>Nothing here</Text>
            </View>
          }
          ListFooterComponent={
            doneTasks.length > 0 ? (
              <Pressable style={styles.completedRow}>
                <View style={styles.completedLabel}>
                  <Text style={styles.completedText}>COMPLETED</Text>
                  <Text style={styles.completedCount}>{doneTasks.length}</Text>
                </View>
                <Text style={styles.completedArrow}>›</Text>
              </Pressable>
            ) : null
          }
        />
      </View>

      <VoiceButton />

      <Modal transparent visible={menuOpen} animationType="fade">
        <Pressable style={styles.modalScrim} onPress={() => setMenuOpen(false)}>
          <View style={styles.menu}>
            {views.map((view) => (
              <Pressable
                key={view.key}
                style={[
                  styles.menuItem,
                  activeView === view.key && styles.menuItemActive,
                ]}
                onPress={() => {
                  setActiveView(view.key);
                  setMenuOpen(false);
                }}
              >
                <view.icon
                  size={17}
                  color={activeView === view.key ? colors.text : colors.faint}
                />
                <Text
                  style={[
                    styles.menuText,
                    activeView === view.key && styles.menuTextActive,
                  ]}
                >
                  {view.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  titleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  panel: {
    flex: 1,
    marginHorizontal: spacing.sm,
    backgroundColor: colors.panel,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(245, 240, 232, 0.06)",
  },
  completedRow: {
    marginTop: spacing.md,
    minHeight: 58,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(245, 240, 232, 0.06)",
  },
  completedLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  completedText: {
    fontSize: 15,
    color: colors.muted,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  completedCount: {
    fontSize: 15,
    color: colors.muted,
    fontWeight: "700",
  },
  completedArrow: {
    color: colors.faint,
    fontSize: 28,
    lineHeight: 28,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 126,
  },
  empty: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    color: colors.faint,
    fontSize: 15,
  },
  modalScrim: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    paddingTop: 86,
    paddingHorizontal: spacing.lg,
  },
  menu: {
    width: 220,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(245, 240, 232, 0.08)",
    padding: spacing.xs,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  menuItemActive: {
    backgroundColor: colors.surfaceHover,
  },
  menuText: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: "600",
  },
  menuTextActive: {
    color: colors.text,
  },
});
