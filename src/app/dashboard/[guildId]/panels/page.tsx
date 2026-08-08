"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, Power, Send } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card, PrimaryButton, GhostButton } from "@/components/ui/forms";
import type { TicketPanel } from "@/lib/types";

export default function PanelsPage() {
  const params = useParams();
  const guildId = String(params.guildId);
  const [guildName, setGuildName] = useState("");
  const [panels, setPanels] = useState<TicketPanel[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    const [guild, list] = await Promise.all([
      fetch(`/api/bot/guilds/${guildId}`).then((r) => r.json()),
      fetch(`/api/bot/guilds/${guildId}/panels`).then((r) => r.json()),
    ]);
    if (guild.guild) setGuildName(guild.guild.name);
    if (list.error) setError(list.error);
    else setPanels(list.panels || []);
  }

  useEffect(() => {
    load();
  }, [guildId]);

  async function toggle(panel: TicketPanel) {
    setBusyId(panel.id);
    try {
      const res = await fetch(
        `/api/bot/guilds/${guildId}/panels/${panel.id}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: !panel.enabled }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPanels((prev) =>
        prev.map((p) => (p.id === panel.id ? data.panel : p))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusyId(null);
    }
  }

  async function publish(panel: TicketPanel) {
    setBusyId(panel.id);
    setError(null);
    try {
      const res = await fetch(
        `/api/bot/guilds/${guildId}/panels/${panel.id}/publish`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPanels((prev) =>
        prev.map((p) => (p.id === panel.id ? data.panel : p))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
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

      {error ? (
        <p className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      {panels.length === 0 ? (
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
                  {panel.enabled ? "Disable" : "Enable"}
                </GhostButton>
                <GhostButton
                  type="button"
                  disabled={busyId === panel.id}
                  onClick={() => publish(panel)}
                >
                  <Send className="h-4 w-4" />
                  Publish
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
