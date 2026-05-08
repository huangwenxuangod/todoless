import type { Task, TaskTag } from "../types/task";
import { createDefaultReminderAt } from "../lib/date";

export const seedTags: TaskTag[] = [
  { id: "tag-product", name: "产品", color: "#ff6b6b" },
  { id: "tag-goal", name: "目标", color: "#d6929d" },
  { id: "tag-work", name: "工作", color: "#89b9a6" },
  { id: "tag-life", name: "生活", color: "#b493e6" },
  { id: "tag-plan", name: "计划", color: "#e552ae" },
  { id: "tag-study", name: "学习", color: "#f2ae42" },
  { id: "tag-interview", name: "面试", color: "#ffd35c" },
];

const todayAt = (hour: number) => {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const futureAt = (year: number, month: number, day: number) => {
  const date = new Date(year, month - 1, day, 23, 59, 0, 0);
  return date.toISOString();
};

export const seedTasks: Task[] = [
  {
    id: "task-build-site",
    title: "真的要把构建一个网站的内容给说出来",
    content: "把网站建设想法完整口述出来，让 todoless 自动拆成可以执行的任务。",
    status: "open",
    dueAt: todayAt(23),
    reminderAt: todayAt(14),
    priority: 2,
    tags: [seedTags[0]],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
  },
  {
    id: "task-find-team",
    title: "多尝试去主动找队友，不管是否成",
    content: null,
    status: "open",
    dueAt: todayAt(23),
    reminderAt: todayAt(14),
    priority: 2,
    tags: [seedTags[2]],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
  },
  {
    id: "task-agent",
    title: "研究多agent和单agent所带来的构建差异",
    content: "重点看任务拆解、上下文窗口、工具调用和个人记忆如何影响产品体验。",
    status: "open",
    dueAt: todayAt(23),
    reminderAt: todayAt(14),
    priority: 0,
    tags: [seedTags[5]],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
  },
  {
    id: "task-voice-todos",
    title: "AI Voice Todos 纯粹的AI代办，找到第一批用户",
    content: null,
    status: "open",
    dueAt: todayAt(23),
    reminderAt: todayAt(14),
    priority: 3,
    tags: [seedTags[0], seedTags[1]],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
  },
  {
    id: "task-polish-product",
    title: "打磨自己的产品，continue to me",
    content: null,
    status: "open",
    dueAt: todayAt(23),
    reminderAt: todayAt(14),
    priority: 2,
    tags: [seedTags[0]],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
  },
  {
    id: "task-review",
    title: "复盘今天做的事，设置明天必须的",
    content: "晚上收尾时整理今天的实际完成情况，只留下明天最关键的任务。",
    status: "open",
    dueAt: todayAt(23),
    reminderAt: todayAt(22),
    priority: 3,
    tags: [seedTags[4]],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
  },
  {
    id: "task-no-game",
    title: "不要打游戏，用尽一切方法",
    content: null,
    status: "open",
    dueAt: todayAt(23),
    reminderAt: todayAt(19),
    priority: 3,
    tags: [seedTags[1], seedTags[3]],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
  },
  {
    id: "task-sim",
    title: "香港手机号club sim保障",
    content: null,
    status: "open",
    dueAt: futureAt(2027, 1, 1),
    reminderAt: createDefaultReminderAt(futureAt(2027, 1, 1)),
    priority: 2,
    tags: [seedTags[3]],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
  },
  {
    id: "task-done-one",
    title: "整理 voice-to-task PRD 第一版",
    content: null,
    status: "done",
    dueAt: todayAt(23),
    reminderAt: todayAt(9),
    priority: 1,
    tags: [seedTags[0]],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  },
];
