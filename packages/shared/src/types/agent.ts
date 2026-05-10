import { z } from "zod";

export const AgentTaskSchema = z.object({
  title: z.string().min(1),
  content: z.string().nullable().optional(),
  dueAt: z.string().nullable().optional(),
  reminderAt: z.string().nullable().optional(),
  priority: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  repeatRule: z
    .union([
      z.object({ type: z.literal("none") }),
      z.object({ type: z.literal("daily"), interval: z.literal(1).default(1) }),
      z.object({ type: z.literal("weekly"), interval: z.literal(1).default(1) }),
    ])
    .optional(),
  tags: z.array(z.string()).default([]),
});

export const AgentCreateTasksSchema = z.object({
  intent: z.literal("create_tasks"),
  tasks: z.array(AgentTaskSchema).min(1),
  memoryUpdates: z.array(z.unknown()).default([]),
});

export const AgentTargetSchema = z.object({
  query: z.string().nullable().optional(),
  ordinal: z.number().int().positive().nullable().optional(),
  recent: z.boolean().optional(),
});

export const AgentTaskPatchSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().nullable().optional(),
  dueAt: z.string().nullable().optional(),
  reminderAt: z.string().nullable().optional(),
  priority: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).optional(),
  repeatRule: z
    .union([
      z.object({ type: z.literal("none") }),
      z.object({ type: z.literal("daily"), interval: z.literal(1).default(1) }),
      z.object({ type: z.literal("weekly"), interval: z.literal(1).default(1) }),
    ])
    .optional(),
  tags: z.array(z.string()).optional(),
});

export const AgentCommandSchema = z.union([
  AgentCreateTasksSchema,
  z.object({
    intent: z.literal("update_tasks"),
    updates: z.array(
      z.object({
        target: AgentTargetSchema,
        patch: AgentTaskPatchSchema,
      }),
    ),
    memoryUpdates: z.array(z.unknown()).default([]),
  }),
  z.object({
    intent: z.literal("complete_tasks"),
    targets: z.array(AgentTargetSchema),
    memoryUpdates: z.array(z.unknown()).default([]),
  }),
  z.object({
    intent: z.literal("delete_tasks"),
    targets: z.array(AgentTargetSchema),
    memoryUpdates: z.array(z.unknown()).default([]),
  }),
  z.object({
    intent: z.literal("set_reminders"),
    updates: z.array(
      z.object({
        target: AgentTargetSchema,
        reminderAt: z.string().nullable(),
      }),
    ),
    memoryUpdates: z.array(z.unknown()).default([]),
  }),
  z.object({
    intent: z.literal("set_repeat"),
    updates: z.array(
      z.object({
        target: AgentTargetSchema,
        repeatRule: z.union([
          z.object({ type: z.literal("none") }),
          z.object({ type: z.literal("daily"), interval: z.literal(1).default(1) }),
          z.object({ type: z.literal("weekly"), interval: z.literal(1).default(1) }),
        ]),
      }),
    ),
    memoryUpdates: z.array(z.unknown()).default([]),
  }),
]);

export type AgentCreateTasks = z.infer<typeof AgentCreateTasksSchema>;
export type AgentCommand = z.infer<typeof AgentCommandSchema>;
export type AgentTarget = z.infer<typeof AgentTargetSchema>;
export type AgentTaskPatch = z.infer<typeof AgentTaskPatchSchema>;
