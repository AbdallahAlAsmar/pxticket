"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  PanelsTopLeft,
  Sparkles,
  ShieldCheck,
  MousePointerClick,
  Send,
  Settings2,
} from "lucide-react";
import { OrbitalHeroSection } from "@/components/ui/orbital-hero-section";
import { Pricing } from "@/components/ui/pricing";
import { SiteNav } from "@/components/landing/SiteNav";

function useNarrow(query = "(max-width: 767px)") {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    const sync = () => setNarrow(m.matches);
    sync();
    m.addEventListener("change", sync);
    return () => m.removeEventListener("change", sync);
  }, [query]);
  return narrow;
}

const features = [
  {
    icon: PanelsTopLeft,
    title: "Panel builder",
    body: "Name panels, categories, roles, and pre-questions without fighting slash-command wizards.",
  },
  {
    icon: Sparkles,
    title: "Live embed studio",
    body: "Color, title, image, author, footer — preview updates as you type, then publish in one click.",
  },
  {
    icon: ShieldCheck,
    title: "Admin-only access",
    body: "Discord OAuth. Only people with Manage Server on bots you’re running can configure them.",
  },
];

const steps = [
  {
    icon: MousePointerClick,
    title: "Sign in with Discord",
    body: "Connect once. We only show servers where you’re an admin and the ticket bot is online.",
  },
  {
    icon: Settings2,
    title: "Configure in the booth",
    body: "Set channels, support roles, language, and embeds with a Discord-accurate preview.",
  },
  {
    icon: Send,
    title: "Publish to Discord",
    body: "Send panels and rules to the right channel instantly — no /mainpanel hopscotch.",
  },
];

const plans = [
  {
    name: "STARTER",
    price: "9",
    yearlyPrice: "7",
    period: "per month",
    features: [
      "1 Discord server",
      "Unlimited ticket panels",
      "Live embed preview",
      "Rules panels",
      "Community support",
    ],
    description: "For a single community getting tickets under control.",
    buttonText: "Start with Discord",
    href: "/login",
    isPopular: false,
  },
  {
    name: "PRO",
    price: "19",
    yearlyPrice: "15",
    period: "per month",
    features: [
      "Up to 5 servers",
      "Everything in Starter",
      "Priority publish & sync",
      "Custom embed branding",
      "Priority support",
    ],
    description: "For networks running multiple ticket systems.",
    buttonText: "Get Pro",
    href: "/login",
    isPopular: true,
  },
  {
    name: "NETWORK",
    price: "49",
    yearlyPrice: "39",
    period: "per month",
    features: [
      "Unlimited servers",
      "Everything in Pro",
      "Dedicated onboarding",
      "SLA-backed support",
      "Custom feature requests",
    ],
    description: "For large RP / store networks that need a booth that scales.",
    buttonText: "Talk to us",
    href: "/login",
    isPopular: false,
  },
];

export function LandingPage() {
  const narrow = useNarrow();
  const { data: session } = useSession();

  return (
    <div className="bg-black text-cream">
      <SiteNav />

      <section className="relative min-h-[92svh] w-full md:min-h-[760px]">
        <OrbitalHeroSection
          focus={narrow ? [0.5, 0.88] : [0.78, 0.45]}
          scrim={narrow ? "top" : "left"}
          scrimStrength={narrow ? 0.95 : 0.93}
          viewRadius={narrow ? 2.1 : 3.05}
          lead={narrow ? 0.04 : 0.1}
          glow={narrow ? 0.55 : 1}
          sunColor="#FFF2CC"
          className="min-h-[92svh] md:min-h-[760px]"
        >
          <div className="flex h-full min-h-[92svh] items-start px-6 pt-24 sm:px-10 md:min-h-[760px] md:items-center md:pt-0 lg:px-20">
            <div className="max-w-[36rem]">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-white/50">
                Discord ticket control
              </p>
              <h1 className="font-display text-[2.6rem] font-light leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl lg:text-[4.1rem]">
                Tickets that
                <br />
                keep moving
              </h1>
              <p className="mt-6 max-w-md text-[0.98rem] leading-relaxed text-white/60 md:mt-7">
                PX Ticket is the control booth for your Discord ticket bot —
                panels, embeds, roles, and rules from one SaaS dashboard. Design
                once, publish instantly.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3 md:mt-10">
                {session?.user ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90"
                  >
                    Open dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      signIn("discord", { callbackUrl: "/dashboard" })
                    }
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90"
                  >
                    Get started free
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
                <a
                  href="#pricing"
                  className="rounded-full border border-white/20 px-6 py-3 text-sm text-white/80 transition hover:border-white/40 hover:text-white"
                >
                  See pricing
                </a>
              </div>
            </div>
          </div>
        </OrbitalHeroSection>
      </section>

      <section id="features" className="border-t border-white/10 bg-ink py-20">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 md:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
              className="rounded-2xl border border-line bg-surface p-6"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-copper/15 text-copper">
                <feature.icon className="h-5 w-5" />
              </div>
              <h2 className="font-display text-lg font-semibold text-cream">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {feature.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="how" className="border-t border-white/10 bg-ink-2 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stamp-bright">
              How it works
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-cream sm:text-4xl">
              From Discord login to live panel in minutes
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="rounded-2xl border border-line bg-surface/60 p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="font-display text-sm text-copper">
                    0{i + 1}
                  </span>
                  <step.icon className="h-5 w-5 text-cream" />
                </div>
                <h3 className="font-display text-lg font-semibold text-cream">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-t border-white/10 bg-black">
        <Pricing
          plans={plans}
          title="Pricing that scales with your servers"
          description={
            "Start free with Discord login.\nUpgrade when you run more communities through the same booth."
          }
        />
      </section>

      <section className="border-t border-white/10 bg-ink px-6 py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-6 rounded-3xl border border-line bg-surface px-8 py-10 md:flex-row md:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold text-cream sm:text-3xl">
              Ready to stop rebuilding panels by hand?
            </h2>
            <p className="mt-2 max-w-lg text-sm text-muted">
              Sign in with Discord and take control of tickets the same way you
              already manage the rest of your stack.
            </p>
          </div>
          {session?.user ? (
            <Link
              href="/dashboard"
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-copper px-6 py-3 text-sm font-semibold text-ink transition hover:bg-copper-bright"
            >
              Go to dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-copper px-6 py-3 text-sm font-semibold text-ink transition hover:bg-copper-bright"
            >
              Login with Discord
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-muted">
        PX Ticket · Discord ticket control booth ·{" "}
        <span className="text-cream/70">pxticket.vercel.app</span>
      </footer>
    </div>
  );
}
