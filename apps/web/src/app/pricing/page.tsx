"use client";

import { motion } from "framer-motion";
import { Check, Zap, Users } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    price: "Free",
    period: "",
    description: "For personal light use",
    icon: Zap,
    features: [
      "1 desktop device",
      "Local SQLite storage",
      "Basic voice entry",
      "Dark theme",
      "Basic tag management",
    ],
    cta: "Start Free",
    href: "/download",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$4.99",
    period: "/mo",
    description: "For productivity seekers",
    icon: Zap,
    features: [
      "Unlimited device sync",
      "Priority AI parsing queue",
      "All themes (light/dark/system)",
      "Unlimited tags & smart views",
      "SenseVoice local model",
      "Export data",
    ],
    cta: "Upgrade to Pro",
    href: "/download",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$12",
    period: "/seat/mo",
    description: "For small team collaboration",
    icon: Users,
    features: [
      "Everything in Pro",
      "Shared workspace",
      "Team task assignment",
      "Admin dashboard",
      "Priority support",
      "SSO login",
    ],
    cta: "Contact Sales",
    href: "mailto:hello@todoless.app",
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <nav className="border-b border-white/[0.06] px-6 py-4">
        <div className="mx-auto max-w-5xl">
          <a href="/" className="text-lg font-medium">
            todoless
          </a>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-20">
        <div className="text-center">
          <h1 className="text-3xl font-semibold sm:text-4xl">
            Simple Pricing
          </h1>
          <p className="mx-auto mt-4 max-w-md text-muted">
            Local-first, cloud optional. Upgrade or cancel anytime.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 ${
                plan.highlighted
                  ? "bg-surface ring-2 ring-accent"
                  : "bg-surface/50 ring-1 ring-white/[0.06]"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-bg">
                  Recommended
                </div>
              )}

              <div className="flex items-center gap-2">
                <plan.icon size={20} className="text-muted" />
                <span className="font-medium">{plan.name}</span>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-semibold">{plan.price}</span>
                {plan.period && (
                  <span className="text-muted">{plan.period}</span>
                )}
              </div>

              <p className="mt-2 text-sm text-muted">{plan.description}</p>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm"
                  >
                    <Check
                      size={16}
                      className="mt-0.5 shrink-0 text-success"
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`mt-6 block w-full rounded-xl py-2.5 text-center text-sm font-medium transition-colors ${
                  plan.highlighted
                    ? "bg-accent text-bg hover:bg-accent/90"
                    : "bg-surface-hover text-text hover:bg-surface"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
