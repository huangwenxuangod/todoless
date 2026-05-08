"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mic, Brain, Smartphone, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;

    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSubmitted(true);
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-bg/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-medium tracking-tight">todoless</span>
          </div>
          <div className="hidden items-center gap-8 text-sm text-muted md:flex">
            <Link
              href="/demo"
              className="transition-colors hover:text-text"
            >
              Demo
            </Link>
            <Link
              href="/pricing"
              className="transition-colors hover:text-text"
            >
              Pricing
            </Link>
            <Link
              href="/download"
              className="transition-colors hover:text-text"
            >
              Download
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Tasks from Voice
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg text-muted">
            Hold a shortcut, speak what is on your mind. AI parses time,
            priority, and tags — structured tasks appear instantly.
          </p>

          {/* Waitlist Form */}
          <div className="mx-auto mt-10 max-w-md">
            {!submitted ? (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 rounded-xl bg-surface px-4 py-3 text-sm text-text outline-none ring-1 ring-white/[0.06] transition-all placeholder:text-faint focus:ring-accent/50"
                  required
                />
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-medium text-bg transition-colors hover:bg-accent/90"
                >
                  Join Waitlist
                  <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2 rounded-xl bg-success/10 py-4 text-success"
              >
                <CheckCircle size={18} />
                <span>Thanks for joining. We will be in touch soon.</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-24 grid max-w-4xl gap-6 px-6 sm:grid-cols-3"
        >
          {[
            {
              icon: Mic,
              title: "Voice Entry",
              desc: "Hold a shortcut and speak. Tasks are created when you let go. 3-5x faster than typing.",
            },
            {
              icon: Brain,
              title: "AI Parsing",
              desc: "Automatically recognizes time, priority, and tags. Natural language input is fully supported.",
            },
            {
              icon: Smartphone,
              title: "Cross-Device",
              desc: "Deep management on desktop, quick access on mobile. Data stays in sync across devices.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl bg-surface p-6 ring-1 ring-white/[0.06]"
            >
              <feature.icon className="mb-4 text-accent" size={24} />
              <h3 className="font-medium">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8 text-center text-sm text-faint">
        <p>© 2026 todoless. All rights reserved.</p>
      </footer>
    </div>
  );
}
