import Database from "@tauri-apps/plugin-sql";
import { seedTags, seedTasks } from "../data/seed";
import type { RepeatRule, Task, TaskPriority, TaskStatus, TaskTag } from "@todoless/shared/types/task";

type TaskRow = {
  id: string;
  title: string;
  content: string | null;
  status: TaskStatus;
  due_at: string | null;
  reminder_at: string | null;
  priority: TaskPriority;
  repeat_rule: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  deleted_at: string | null;
};

type TagRow = {
  id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
};

let dbPromise: Promise<Database> | null = null;

const tagColors = ["#ff6b6b", "#89b9a6", "#f2ae42", "#b493e6", "#6aa6ff", "#d6929d", "#8dd0c7"];

export async function getDb() {
  if (!dbPromise) {
    dbPromise = Database.load("sqlite:todoless.db");
  }
  return dbPromise;
}

export async function initializeDb() {
  const db = await getDb();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      status TEXT NOT NULL,
      due_at TEXT,
      reminder_at TEXT,
      priority INTEGER NOT NULL DEFAULT 1,
      repeat_rule TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      deleted_at TEXT
    )
  `);
  await ensureTaskColumn("repeat_rule", "TEXT");
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS task_tags (
      task_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (task_id, tag_id)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS recent_context (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      title_snapshot TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  const countRows = await db.select<Array<{ count: number }>>("SELECT COUNT(*) as count FROM tasks");
  if ((countRows[0]?.count ?? 0) === 0) {
    await seedDb();
  }
}

async function seedDb() {
  const db = await getDb();
  for (const tag of seedTags) {
    await upsertTag(tag.name, tag.color, tag.id);
  }
  for (const task of seedTasks) {
    await insertTask(task, "seed");
  }
}

export async function loadTasksAndTags() {
  const db = await getDb();
  const taskRows = await db.select<TaskRow[]>("SELECT * FROM tasks WHERE deleted_at IS NULL ORDER BY created_at DESC");
  const tagRows = await db.select<TagRow[]>("SELECT * FROM tags ORDER BY name ASC");
  const relationRows = await db.select<Array<{ task_id: string; tag_id: string }>>("SELECT task_id, tag_id FROM task_tags");
  const tags = tagRows.map(rowToTag);
  const tagMap = new Map(tags.map((tag) => [tag.id, tag]));
  const tasks = taskRows.map((row) => {
    const taskTags = relationRows
      .filter((relation) => relation.task_id === row.id)
      .map((relation) => tagMap.get(relation.tag_id))
      .filter((tag): tag is TaskTag => Boolean(tag));
    return rowToTask(row, taskTags);
  });
  return { tasks, tags };
}

export async function insertTask(task: Task, eventType = "task.created") {
  const db = await getDb();
  await db.execute(
    `INSERT OR REPLACE INTO tasks
      (id, title, content, status, due_at, reminder_at, priority, repeat_rule, created_at, updated_at, completed_at, deleted_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NULL)`,
    [
      task.id,
      task.title,
      task.content,
      task.status,
      task.dueAt,
      task.reminderAt,
      task.priority,
      serializeRepeatRule(task.repeatRule),
      task.createdAt,
      task.updatedAt,
      task.completedAt,
    ],
  );
  await db.execute("DELETE FROM task_tags WHERE task_id = $1", [task.id]);
  for (const tag of task.tags) {
    const storedTag = await upsertTag(tag.name, tag.color, tag.id);
    await db.execute("INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES ($1, $2)", [task.id, storedTag.id]);
  }
  await pushRecentContext(task.id, task.title);
  await recordEvent(eventType, { task });
}

export async function updateTask(task: Task, eventType = "task.updated", payload: unknown = { task }) {
  const db = await getDb();
  await db.execute(
    `UPDATE tasks
      SET title = $1, content = $2, status = $3, due_at = $4, reminder_at = $5, priority = $6, repeat_rule = $7, updated_at = $8, completed_at = $9
      WHERE id = $10`,
    [
      task.title,
      task.content,
      task.status,
      task.dueAt,
      task.reminderAt,
      task.priority,
      serializeRepeatRule(task.repeatRule),
      task.updatedAt,
      task.completedAt,
      task.id,
    ],
  );
  await recordEvent(eventType, payload);
}

export async function softDeleteTask(id: string) {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute("UPDATE tasks SET deleted_at = $1, updated_at = $1 WHERE id = $2", [now, id]);
  await recordEvent("task.deleted", { id, deletedAt: now });
}

export async function upsertTag(name: string, color?: string, id?: string) {
  const db = await getDb();
  const normalizedName = name.trim();
  const existing = await db.select<TagRow[]>("SELECT * FROM tags WHERE name = $1 LIMIT 1", [normalizedName]);
  if (existing[0]) return rowToTag(existing[0]);
  const now = new Date().toISOString();
  const tag: TaskTag = {
    id: id ?? `tag-${crypto.randomUUID()}`,
    name: normalizedName,
    color: color ?? tagColors[Math.abs(hashString(normalizedName)) % tagColors.length],
  };
  await db.execute("INSERT INTO tags (id, name, color, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)", [
    tag.id,
    tag.name,
    tag.color,
    now,
    now,
  ]);
  await recordEvent("tag.created", { tag });
  return tag;
}

export async function recordEvent(type: string, payload: unknown) {
  const db = await getDb();
  await db.execute("INSERT INTO events (id, type, payload_json, created_at) VALUES ($1, $2, $3, $4)", [
    crypto.randomUUID(),
    type,
    JSON.stringify(payload),
    new Date().toISOString(),
  ]);
}

export async function loadRecentTaskTitles(limit = 10) {
  const db = await getDb();
  const rows = await db.select<Array<{ title_snapshot: string }>>(
    "SELECT title_snapshot FROM recent_context ORDER BY created_at DESC LIMIT $1",
    [limit],
  );
  return rows.map((row) => row.title_snapshot);
}

async function pushRecentContext(taskId: string, title: string) {
  const db = await getDb();
  await db.execute("INSERT INTO recent_context (id, task_id, title_snapshot, created_at) VALUES ($1, $2, $3, $4)", [
    crypto.randomUUID(),
    taskId,
    title,
    new Date().toISOString(),
  ]);
  const oldRows = await db.select<Array<{ id: string }>>("SELECT id FROM recent_context ORDER BY created_at DESC LIMIT -1 OFFSET 10");
  for (const row of oldRows) {
    await db.execute("DELETE FROM recent_context WHERE id = $1", [row.id]);
  }
}

function rowToTag(row: TagRow): TaskTag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
  };
}

function rowToTask(row: TaskRow, tags: TaskTag[]): Task {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    status: row.status,
    dueAt: row.due_at,
    reminderAt: row.reminder_at,
    priority: row.priority,
    repeatRule: parseRepeatRule(row.repeat_rule),
    tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

async function ensureTaskColumn(name: string, definition: string) {
  const db = await getDb();
  const columns = await db.select<Array<{ name: string }>>("PRAGMA table_info(tasks)");
  if (!columns.some((column) => column.name === name)) {
    await db.execute(`ALTER TABLE tasks ADD COLUMN ${name} ${definition}`);
  }
}

function serializeRepeatRule(rule: RepeatRule) {
  return rule.type === "none" ? null : JSON.stringify(rule);
}

function parseRepeatRule(value: string | null): RepeatRule {
  if (!value) return { type: "none" };
  try {
    const parsed = JSON.parse(value) as Partial<RepeatRule>;
    if (parsed.type === "daily") return { type: "daily", interval: 1 };
    if (parsed.type === "weekly") return { type: "weekly", interval: 1 };
    return { type: "none" };
  } catch {
    return { type: "none" };
  }
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}
