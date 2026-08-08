"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Server, AlertCircle, RefreshCw } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { discordIconUrl } from "@/lib/utils";
import type { GuildSummary } from "@/lib/types";
import { GhostButton } from "@/components/ui/forms";

export default function DashboardPage() {
  const [guilds, setGuilds] = useState<GuildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bot/guilds");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load servers");
      setGuilds(data.guilds || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">Your servers</h1>
          <p className="mt-2 text-sm text-muted">
            Servers where you have Manage Server and PX Ticket is online.
          </p>
        </div>
        <GhostButton type="button" onClick={load}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </GhostButton>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-5 text-sm text-cream">
          <AlertCircle className="mt-0.5 h-5 w-5 text-danger" />
          <div>
            <p className="font-medium">Could not reach the bot API</p>
            <p className="mt-1 text-muted">{error}</p>
            <p className="mt-2 text-xs text-muted">
              Make sure the ticket bot is running with DASHBOARD_API_SECRET set, and
              BOT_API_URL / BOT_API_SECRET match in Vercel.
            </p>
          </div>
        </div>
      ) : guilds.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center">
          <Server className="mx-auto mb-3 h-8 w-8 text-muted" />
          <p className="font-medium text-cream">No manageable servers yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Invite the ticket bot to a server where you are an admin, then refresh.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guilds.map((guild, i) => {
            const icon = discordIconUrl(guild.id, guild.icon);
            return (
              <motion.div
                key={guild.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  href={`/dashboard/${guild.id}`}
                  className="focus-ring group flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition hover:border-copper/40 hover:bg-surface-2"
                >
                  {icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={icon} alt="" className="h-14 w-14 rounded-2xl" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-lg font-bold text-copper">
                      {guild.name.slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-semibold text-cream group-hover:text-copper-bright">
                      {guild.name}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {guild.memberCount
                        ? `${guild.memberCount.toLocaleString()} members`
                        : "Ready to configure"}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
