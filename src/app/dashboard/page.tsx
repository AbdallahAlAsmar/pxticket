"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, ExternalLink, RefreshCw, Server } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ServerCardSkeleton } from "@/components/ui/skeleton";
import { GhostButton } from "@/components/ui/forms";
import { discordIconUrl } from "@/lib/utils";
import { useGuilds } from "@/lib/swr";
import type { GuildSummary } from "@/lib/types";
import { mutate } from "swr";

function GuildCard({ guild }: { guild: GuildSummary }) {
  const icon = discordIconUrl(guild.id, guild.icon);
  const installed = Boolean(guild.botPresent);
  const content = (
    <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition hover:border-copper/40 hover:bg-surface-2">
      {icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon} alt="" className="h-14 w-14 rounded-2xl" />
      ) : (
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-ink text-lg font-bold text-copper">
          {guild.name.slice(0, 1)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-base font-semibold text-cream group-hover:text-copper-bright">
          {guild.name}
        </p>
        <p className="mt-1 text-xs text-muted">
          {guild.permissionLabel || "Manage Server"}
          {installed && guild.memberCount !== undefined
            ? ` · ${guild.memberCount.toLocaleString()} members`
            : ""}
        </p>
      </div>
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${
          installed
            ? "border-green-500/25 bg-green-500/10 text-green-300"
            : "border-copper/25 bg-copper/10 text-copper-bright"
        }`}
      >
        {installed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
        {installed ? "Bot installed" : "Invite bot"}
      </span>
    </div>
  );

  if (installed) {
    return (
      <Link href={`/dashboard/${guild.id}`} className="focus-ring group block rounded-2xl">
        {content}
      </Link>
    );
  }
  if (!guild.inviteUrl) return <div className="group rounded-2xl opacity-70">{content}</div>;
  return (
    <a href={guild.inviteUrl} target="_blank" rel="noreferrer"
      aria-label={`Invite PX Ticket to ${guild.name}`}
      className="focus-ring group block rounded-2xl">
      {content}
    </a>
  );
}

function GuildGrid({ guilds }: { guilds: GuildSummary[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {guilds.map((guild, index) => (
        <motion.div key={guild.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
          <GuildCard guild={guild} />
        </motion.div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data, error, isLoading, isValidating } = useGuilds();
  const guilds = data?.guilds || [];
  const installedGuilds = guilds.filter((guild) => guild.botPresent);
  const inviteGuilds = guilds.filter((guild) => !guild.botPresent);

  async function refresh() {
    await mutate("/api/bot/guilds");
  }

  return (
    <DashboardShell>
      <div className="mb-6 md:mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-cream">Your servers</h1>
          <p className="mt-2 text-sm text-muted">
            Servers you own or can manage. PX Ticket servers appear first; select another server to invite the bot.
          </p>
        </div>
        <GhostButton type="button" onClick={refresh} disabled={isValidating}>
          <RefreshCw className={`h-4 w-4 ${isValidating ? "animate-spin" : ""}`} />
          Refresh
        </GhostButton>
      </div>

      {isLoading && !data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <ServerCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-5 text-sm text-cream">
          <AlertCircle className="mt-0.5 h-5 w-5 text-danger" />
          <div>
            <p className="font-medium">Could not load your servers</p>
            <p className="mt-1 text-muted">
              {error instanceof Error ? error.message : "Failed to load"}
            </p>
          </div>
        </div>
      ) : guilds.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center">
          <Server className="mx-auto mb-3 h-8 w-8 text-muted" />
          <p className="font-medium text-cream">No servers you can manage</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Servers appear here when you own them or have Administrator or Manage Server permission.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {installedGuilds.length > 0 && (
            <section aria-labelledby="installed-servers-heading">
              <h2 id="installed-servers-heading" className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
                PX Ticket installed <span className="ml-1 text-cream">{installedGuilds.length}</span>
              </h2>
              <GuildGrid guilds={installedGuilds} />
            </section>
          )}
          {inviteGuilds.length > 0 && (
            <section aria-labelledby="invite-servers-heading">
              <h2 id="invite-servers-heading" className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
                Other servers you can manage <span className="ml-1 text-cream">{inviteGuilds.length}</span>
              </h2>
              <GuildGrid guilds={inviteGuilds} />
            </section>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
