import * as SQLite from "expo-sqlite";
import type { Task, TaskTag } from "@todoless/shared/types/task";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync("todoless.db");
  }
  return db;
}

export async function initializeDb() {
  const db = await getDb();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      due_at TEXT,
      reminder_at TEXT,
      priority INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_tags (
      task_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (task_id, tag_id)
    );
  `);
}

export async function loadTasks(): Promise<Task[]> {
  const db = await getDb();
  const taskRows = await db.getAllAsync<{
    id: string;
    title: string;
    content: string | null;
    status: "open" | "done";
    due_at: string | null;
    reminder_at: string | null;
    priority: number;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
  }>("SELECT * FROM tasks WHERE deleted_at IS NULL ORDER BY created_at DESC");

  const tagRows = await db.getAllAsync<{
    task_id: string;
    tag_id: string;
    name: string;
    color: string;
  }>(`
    SELECT tt.task_id, t.id AS tag_id, t.name, t.color
    FROM task_tags tt
    JOIN tags t ON tt.tag_id = t.id
  `);

  return taskRows.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    status: row.status,
    dueAt: row.due_at,
    reminderAt: row.reminder_at,
    priority: row.priority as 0 | 1 | 2 | 3,
    tags: tagRows
      .filter((t) => t.task_id === row.id)
      .map((t) => ({ id: t.tag_id, name: t.name, color: t.color })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  }));
}

export async function insertTask(task: Task) {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO tasks
      (id, title, content, status, due_at, reminder_at, priority, created_at, updated_at, completed_at, deleted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      task.id,
      task.title,
      task.content,
      task.status,
      task.dueAt,
      task.reminderAt,
      task.priority,
      task.createdAt,
      task.updatedAt,
      task.completedAt,
    ]
  );

  await db.runAsync("DELETE FROM task_tags WHERE task_id = ?", [task.id]);
  for (const tag of task.tags) {
    await db.runAsync(
      "INSERT OR IGNORE INTO tags (id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      [tag.id, tag.name, tag.color, task.createdAt, task.createdAt]
    );
    await db.runAsync(
      "INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?, ?)",
      [task.id, tag.id]
    );
  }
}

export async function updateTaskStatus(id: string, status: "open" | "done") {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    "UPDATE tasks SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?",
    [status, status === "done" ? now : null, now, id]
  );
}

export async function deleteTask(id: string) {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.runAsync(
    "UPDATE tasks SET deleted_at = ?, updated_at = ? WHERE id = ?",
    [now, now, id]
  );
}
