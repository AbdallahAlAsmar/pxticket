"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import {
  LayoutDashboard,
  PanelsTopLeft,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

const HeroScene = dynamic(
  () => import("./HeroScene").then((m) => m.HeroScene),
  { ssr: false, loading: () => <div className="absolute inset-0 -z-10 bg-ink" /> }
);

const features = [
  {
    icon: PanelsTopLeft,
    title: "Panels in minutes",
    body: "Build ticket panels with categories, roles, and questions — no slash-command maze.",
  },
  {
    icon: Sparkles,
    title: "Live embed studio",
    body: "Tune title, color, image, and footer while a Discord-accurate preview updates instantly.",
  },
  {
    icon: ShieldCheck,
    title: "Discord-secured",
    body: "Login with Discord. Only admins of servers where the bot is present can configure.",
  },
];

export function LandingPage() {
  const { data: session } = useSession();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <header className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-display text-xl font-bold tracking-tight text-cream">
          PX<span className="text-copper">Ticket</span>
        </Link>
        <div className="flex items-center gap-3">
          {session?.user ? (
            <Link
              href="/dashboard"
              className="focus-ring inline-flex items-center gap-2 rounded-full bg-copper px-4 py-2 text-sm font-semibold text-ink transition hover:bg-copper-bright"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-4 py-2 text-sm font-medium text-cream backdrop-blur transition hover:border-copper/50 hover:bg-surface"
            >
              Login with Discord
            </button>
          )}
        </div>
      </header>

      <section className="relative mx-auto flex min-h-[88vh] w-full max-w-6xl flex-col justify-center px-6 pb-20 pt-8">
        <HeroScene />

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-2xl"
        >
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.22em] text-stamp-bright">
            Ticket control booth
          </p>
          <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-cream sm:text-6xl md:text-7xl">
            PX<span className="text-copper">Ticket</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted">
            Stop rebuilding panels in Discord every time. Configure embeds, channels,
            roles, and rules from one living dashboard — then publish in a click.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {session?.user ? (
              <Link
                href="/dashboard"
                className="focus-ring group inline-flex items-center gap-2 rounded-full bg-copper px-6 py-3 text-sm font-bold text-ink transition hover:bg-copper-bright"
              >
                Open dashboard
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
                className="focus-ring group inline-flex items-center gap-2 rounded-full bg-copper px-6 py-3 text-sm font-bold text-ink transition hover:bg-copper-bright"
              >
                Login with Discord
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </button>
            )}
            <a
              href="#features"
              className="focus-ring inline-flex items-center rounded-full border border-line px-5 py-3 text-sm font-medium text-muted transition hover:border-line hover:text-cream"
            >
              See what you control
            </a>
          </div>
        </motion.div>
      </section>

      <section id="features" className="relative z-10 border-t border-line/60 bg-ink-2/80 py-20 backdrop-blur">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 md:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="noise-overlay relative overflow-hidden rounded-2xl border border-line bg-surface p-6"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-copper/15 text-copper">
                <feature.icon className="h-5 w-5" />
              </div>
              <h2 className="font-display text-lg font-semibold text-cream">{feature.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{feature.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="border-t border-line/50 py-8 text-center text-sm text-muted">
        PX Ticket · control booth for Discord ticket bots ·{" "}
        <span className="text-cream/70">pxticket.vercel.app</span>
      </footer>
    </div>
  );
}
