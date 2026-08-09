"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, Power, Send } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card, PrimaryButton, GhostButton } from "@/components/ui/forms";
import { PanelRowSkeleton } from "@/components/ui/skeleton";
import { invalidateGuild, seedFromBootstrap, useGuildBootstrap, useGuildPanels } from "@/lib/swr";
import { useEffect, useState } from "react";
import type { TicketPanel } from "@/lib/types";
import { mutate } from "swr";

export default function PanelsPage() {
  const params = useParams();
  const guildId = String(params.guildId);
  const { data: bootstrap } = useGuildBootstrap(guildId);
  const { data, error, isLoading } = useGuildPanels(guildId);
  const panels = data?.panels || bootstrap?.panels || [];
  const guildName = bootstrap?.guild?.name || "";
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (bootstrap) seedFromBootstrap(guildId, bootstrap);
  }, [bootstrap, guildId]);

  async function refreshPanels() {
    await mutate(`/api/bot/guilds/${guildId}/panels`);
    await invalidateGuild(guildId);
  }

  async function toggle(panel: TicketPanel) {
    setBusyId(panel.id);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/bot/guilds/${guildId}/panels/${panel.id}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: !panel.enabled }),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      await refreshPanels();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  async function publish(panel: TicketPanel) {
    setBusyId(panel.id);
    setActionError(null);
    try {
      const res = await fetch(
        `/api/bot/guilds/${guildId}/panels/${panel.id}/publish`,
        { method: "POST" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      await refreshPanels();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <DashboardShell guildId={guildId} guildName={guildName}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">Panels</h1>
          <p className="mt-2 text-sm text-muted">
            Design ticket panels and publish them into Discord channels.
          </p>
        </div>
        <Link href={`/dashboard/${guildId}/panels/new`}>
          <PrimaryButton type="button">
            <Plus className="h-4 w-4" />
            New panel
          </PrimaryButton>
        </Link>
      </div>

      {actionError || error ? (
        <p className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm">
          {actionError || (error instanceof Error ? error.message : "Failed to load")}
        </p>
      ) : null}

      {isLoading && !panels.length ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <PanelRowSkeleton key={i} />
          ))}
        </div>
      ) : panels.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-medium text-cream">No panels yet</p>
          <p className="mt-2 text-sm text-muted">
            Create your first panel and configure the embed live.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {panels.map((panel) => (
            <Card key={panel.id} className="flex flex-wrap items-center gap-4 p-5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/${guildId}/panels/${panel.id}`}
                    className="font-display text-lg font-semibold text-cream hover:text-copper-bright"
                  >
                    {panel.name}
                  </Link>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                      panel.enabled
                        ? "bg-ok/15 text-ok"
                        : "bg-muted/20 text-muted"
                    }`}
                  >
                    {panel.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {(panel.categories?.length || 0)} categories · channel{" "}
                  <code className="text-cream/80">{panel.channelId || "unset"}</code>
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <GhostButton
                  type="button"
                  disabled={busyId === panel.id}
                  onClick={() => toggle(panel)}
                >
                  <Power className="h-4 w-4" />
                  {busyId === panel.id
                    ? panel.enabled
                      ? "Disabling…"
                      : "Enabling…"
                    : panel.enabled
                      ? "Disable"
                      : "Enable"}
                </GhostButton>
                <GhostButton
                  type="button"
                  disabled={busyId === panel.id}
                  onClick={() => publish(panel)}
                >
                  <Send className="h-4 w-4" />
                  {busyId === panel.id ? "Publishing…" : "Publish"}
                </GhostButton>
                <Link href={`/dashboard/${guildId}/panels/${panel.id}`}>
                  <PrimaryButton type="button">Edit</PrimaryButton>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
