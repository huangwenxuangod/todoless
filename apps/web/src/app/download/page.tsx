"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Apple, Monitor, Smartphone } from "lucide-react";

type Platform = "mac" | "windows" | "linux" | "mobile";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "windows";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac") && !ua.includes("iphone")) return "mac";
  if (ua.includes("win")) return "windows";
  if (ua.includes("linux")) return "linux";
  return "mobile";
}

const platforms = {
  mac: {
    label: "macOS",
    icon: Apple,
    file: "todoless_0.1.0_x64.dmg",
    size: "12 MB",
  },
  windows: {
    label: "Windows",
    icon: Monitor,
    file: "todoless_0.1.0_x64-setup.exe",
    size: "10 MB",
  },
  linux: {
    label: "Linux",
    icon: Monitor,
    file: "todoless_0.1.0_amd64.AppImage",
    size: "14 MB",
  },
  mobile: {
    label: "Mobile",
    icon: Smartphone,
    file: null,
    size: null,
  },
};

export default function Download() {
  const [platform, setPlatform] = useState<Platform>("windows");

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const current = platforms[platform];

  return (
    <div className="min-h-screen bg-bg text-text">
      <nav className="border-b border-white/[0.06] px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <a href="/" className="text-lg font-medium">
            todoless
          </a>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-surface">
            <current.icon size={28} className="text-accent" />
          </div>

          <h1 className="mt-6 text-3xl font-semibold">Download todoless</h1>
          <p className="mx-auto mt-4 max-w-md text-muted">
            We detected your system is {current.label}
          </p>

          {current.file ? (
            <div className="mt-8">
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-accent px-8 py-3 font-medium text-bg transition-colors hover:bg-accent/90"
                onClick={() => alert("Download link coming soon")}
              >
                Download for {current.label}
              </button>
              <p className="mt-3 text-xs text-faint">
                {current.file} · {current.size}
              </p>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl bg-surface p-6 ring-1 ring-white/[0.06]">
              <p className="text-muted">Mobile app coming soon</p>
              <div className="mt-4 flex justify-center gap-4">
                <div className="rounded-xl bg-bg px-4 py-2 text-sm text-faint">
                  App Store
                </div>
                <div className="rounded-xl bg-bg px-4 py-2 text-sm text-faint">
                  Google Play
                </div>
              </div>
            </div>
          )}

          {/* Platform Switcher */}
          <div className="mt-12 flex justify-center gap-2">
            {(Object.keys(platforms) as Platform[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                  p === platform
                    ? "bg-surface text-text"
                    : "text-muted hover:text-text"
                }`}
              >
                {platforms[p].label}
              </button>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
