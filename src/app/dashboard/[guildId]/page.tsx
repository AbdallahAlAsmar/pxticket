"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  PanelsTopLeft,
  ScrollText,
  Settings,
  Ticket,
  Activity,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card } from "@/components/ui/forms";
import type { GuildDetail } from "@/lib/types";

export default function GuildOverviewPage() {
  const params = useParams();
  const guildId = String(params.guildId);
  const [data, setData] = useState<GuildDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/bot/guilds/${guildId}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed");
        setData(json);
      })
      .catch((err) => setError(err.message));
  }, [guildId]);

  const stats = [
    {
      label: "Open tickets",
      value: data?.stats.openTickets ?? "—",
      icon: Activity,
      color: "text-stamp-bright",
    },
    {
      label: "Total tickets",
      value: data?.stats.totalTickets ?? "—",
      icon: Ticket,
      color: "text-copper",
    },
    {
      label: "Panels",
      value: data?.stats.panelCount ?? "—",
      icon: PanelsTopLeft,
      color: "text-cream",
    },
    {
      label: "Rules panels",
      value: data?.stats.rulesPanelCount ?? "—",
      icon: ScrollText,
      color: "text-muted",
    },
  ];

  const links = [
    {
      href: `/dashboard/${guildId}/panels`,
      title: "Ticket panels",
      body: "Create panels, categories, and publish embeds to channels.",
      icon: PanelsTopLeft,
    },
    {
      href: `/dashboard/${guildId}/rules`,
      title: "Rules panels",
      body: "Build selectable rules embeds without Discord menus.",
      icon: ScrollText,
    },
    {
      href: `/dashboard/${guildId}/settings`,
      title: "Server settings",
      body: "Support roles, log channel, emojis, language, transcripts.",
      icon: Settings,
    },
  ];

  return (
    <DashboardShell guildId={guildId} guildName={data?.guild.name}>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-cream">
          {data?.guild.name || "Server"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Overview of ticket activity and quick jumps into configuration.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm text-cream">
          {error}
        </p>
      ) : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-muted">{stat.label}</p>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <p className="mt-3 font-display text-3xl font-bold text-cream">{stat.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="focus-ring group rounded-2xl border border-line bg-surface p-5 transition hover:border-copper/40"
          >
            <link.icon className="mb-3 h-5 w-5 text-copper" />
            <h2 className="font-display text-lg font-semibold text-cream group-hover:text-copper-bright">
              {link.title}
            </h2>
            <p className="mt-2 text-sm text-muted">{link.body}</p>
          </Link>
        ))}
      </div>
    </DashboardShell>
  );
}
