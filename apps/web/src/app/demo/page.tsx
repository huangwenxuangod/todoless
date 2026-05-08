"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Calendar1,
  TimerReset,
  CalendarDays,
  Inbox,
} from "lucide-react";

const views = [
  { id: "today", label: "Today", icon: Calendar1 },
  { id: "tomorrow", label: "Tomorrow", icon: TimerReset },
  { id: "next7", label: "Next 7 Days", icon: CalendarDays },
  { id: "inbox", label: "Inbox", icon: Inbox },
] as const;

const demoTasks = [
  {
    title: "Submit Q3 report",
    tags: ["Work"],
    time: "Today 15:00",
    priority: 3,
  },
  {
    title: "Book dentist appointment",
    tags: ["Life"],
    time: "Tomorrow 09:00",
    priority: 2,
  },
  {
    title: "Draft product requirements",
    tags: ["Product"],
    time: "Next Wed",
    priority: 1,
  },
];

export default function Demo() {
  const [stage, setStage] = useState<
    "idle" | "recording" | "thinking" | "done"
  >("idle");
  const [activeView, setActiveView] = useState("today");

  const startDemo = () => {
    if (stage !== "idle") return;
    setStage("recording");
    setTimeout(() => setStage("thinking"), 2000);
    setTimeout(() => setStage("done"), 3500);
  };

  const reset = () => setStage("idle");

  return (
    <div className="min-h-screen bg-bg text-text">
      <nav className="border-b border-white/[0.06] px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <a href="/" className="text-lg font-medium">
            todoless
          </a>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-center text-3xl font-semibold">
          Try Voice-to-Task
        </h1>
        <p className="mx-auto mt-4 max-w-md text-center text-muted">
          Tap the mic below to simulate the voice entry flow.
        </p>

        {/* Voice Button */}
        <div className="mt-12 flex justify-center">
          <motion.button
            onClick={stage === "done" ? reset : startDemo}
            whileTap={{ scale: 0.95 }}
            className="relative flex h-24 w-24 items-center justify-center rounded-full bg-surface ring-1 ring-white/[0.08]"
          >
            {stage === "recording" && (
              <motion.div
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-accent/20"
              />
            )}
            <Mic
              size={32}
              className={
                stage === "recording" ? "text-accent" : "text-muted"
              }
            />
          </motion.button>
        </div>

        {/* Status */}
        <div className="mt-6 text-center text-sm text-muted">
          <AnimatePresence mode="wait">
            {stage === "idle" && (
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Tap the mic to start the demo
              </motion.span>
            )}
            {stage === "recording" && (
              <motion.span
                key="recording"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Listening...
              </motion.span>
            )}
            {stage === "thinking" && (
              <motion.span
                key="thinking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Parsing with AI...
              </motion.span>
            )}
            {stage === "done" && (
              <motion.span
                key="done"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                Created 3 tasks
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Task Preview */}
        <div className="mt-12 rounded-2xl bg-surface p-6 ring-1 ring-white/[0.06]">
          {/* View Switcher */}
          <div className="mb-6 flex gap-2">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  activeView === view.id
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:text-text"
                }`}
              >
                <view.icon size={14} />
                {view.label}
              </button>
            ))}
          </div>

          {/* Tasks */}
          <AnimatePresence>
            {stage === "done" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {demoTasks.map((task, i) => (
                  <motion.div
                    key={task.title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className="flex items-center gap-3 rounded-xl bg-bg p-4"
                  >
                    <div
                      className={`h-5 w-5 rounded-full border-2 ${
                        task.priority === 3
                          ? "border-priority-high"
                          : task.priority === 2
                            ? "border-priority-medium"
                            : task.priority === 1
                              ? "border-priority-low"
                              : "border-priority-none"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{task.title}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                        <span className="rounded-full bg-surface-hover px-2 py-0.5">
                          {task.tags[0]}
                        </span>
                        <span>{task.time}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {stage !== "done" && (
            <div className="py-12 text-center text-sm text-faint">
              Tasks will appear here
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
