import { z } from "zod";

export const AgentTaskSchema = z.object({
  title: z.string().min(1),
  content: z.string().nullable().optional(),
  dueAt: z.string().nullable().optional(),
  reminderAt: z.string().nullable().optional(),
  priority: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  tags: z.array(z.string()).default([]),
});

export const AgentCreateTasksSchema = z.object({
  intent: z.literal("create_tasks"),
  tasks: z.array(AgentTaskSchema).min(1),
  memoryUpdates: z.array(z.unknown()).default([]),
});

export type AgentCreateTasks = z.infer<typeof AgentCreateTasksSchema>;
