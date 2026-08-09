"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  Card,
  Field,
  TextInput,
  SelectInput,
  PrimaryButton,
  GhostButton,
} from "@/components/ui/forms";
import { EmojiPickerField } from "@/components/emoji/EmojiPickerField";
import { FormSkeleton } from "@/components/ui/skeleton";
import type { GuildSettings } from "@/lib/types";
import {
  invalidateGuild,
  seedFromBootstrap,
  useGuildBootstrap,
} from "@/lib/swr";

export default function SettingsPage() {
  const params = useParams();
  const guildId = String(params.guildId);
  const { data: bootstrap, error: bootError, isLoading } =
    useGuildBootstrap(guildId);

  const [settings, setSettings] = useState<GuildSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bootstrap) return;
    seedFromBootstrap(guildId, bootstrap);
    setSettings(bootstrap.settings);
  }, [bootstrap, guildId]);

  useEffect(() => {
    if (bootError) {
      setError(
        bootError instanceof Error ? bootError.message : "Failed to load"
      );
    }
  }, [bootError]);

  const channels = bootstrap?.channels || [];
  const roles = bootstrap?.roles || [];
  const guildName = bootstrap?.guild?.name || "";

  const textChannels = useMemo(
    () => channels.filter((c) => c.type === 0 || c.type === 5),
    [channels]
  );

  async function save() {
    if (!settings) return;
    setSaving(true);
    setMessage("Saving changes…");
    setError(null);
    try {
      const res = await fetch(`/api/bot/guilds/${guildId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSettings(data.settings);
      await invalidateGuild(guildId);
      setMessage("Settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function toggleRole(roleId: string) {
    if (!settings) return;
    const has = settings.supportRoleIds.includes(roleId);
    setSettings({
      ...settings,
      supportRoleIds: has
        ? settings.supportRoleIds.filter((id) => id !== roleId)
        : [...settings.supportRoleIds, roleId],
    });
  }

  const loading = isLoading && !settings;

  return (
    <DashboardShell guildId={guildId} guildName={guildName}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">Settings</h1>
          <p className="mt-2 text-sm text-muted">
            Global ticket behavior for this server.
          </p>
        </div>
        <PrimaryButton type="button" onClick={save} disabled={!settings || saving}>
          {saving ? "Saving…" : "Save changes"}
        </PrimaryButton>
      </div>

      {message ? (
        <p className="mb-4 rounded-xl border border-ok/30 bg-ok/10 px-4 py-3 text-sm text-ok">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-cream">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <FormSkeleton />
          <FormSkeleton />
        </div>
      ) : !settings ? (
        <Card className="p-10 text-center text-sm text-muted">
          Could not load settings.
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="space-y-5 p-6">
            <h2 className="font-display text-lg font-semibold">Channels & language</h2>
            <Field label="Log channel">
              <SelectInput
                value={settings.logChannelId || ""}
                onChange={(e) =>
                  setSettings({ ...settings, logChannelId: e.target.value || null })
                }
              >
                <option value="">No log channel</option>
                {textChannels.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Language">
              <SelectInput
                value={settings.language}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    language: e.target.value as "ar" | "en",
                  })
                }
              >
                <option value="ar">Arabic</option>
                <option value="en">English</option>
              </SelectInput>
            </Field>
            <Field label="Transcripts">
              <SelectInput
                value={settings.transcriptsEnabled ? "on" : "off"}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    transcriptsEnabled: e.target.value === "on",
                  })
                }
              >
                <option value="on">Enabled</option>
                <option value="off">Disabled</option>
              </SelectInput>
            </Field>
          </Card>

          <Card className="space-y-5 p-6">
            <h2 className="font-display text-lg font-semibold">Embed defaults & emojis</h2>
            <Field label="Default embed color">
              <div className="flex gap-3">
                <input
                  type="color"
                  value={settings.embed.color || "#2B2D31"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      embed: { ...settings.embed, color: e.target.value.toUpperCase() },
                    })
                  }
                  className="h-11 w-14 cursor-pointer rounded-lg border border-line bg-ink"
                />
                <TextInput
                  value={settings.embed.color}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      embed: { ...settings.embed, color: e.target.value },
                    })
                  }
                />
              </div>
            </Field>
            <Field label="Default footer">
              <TextInput
                value={settings.embed.footer}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    embed: { ...settings.embed, footer: e.target.value },
                  })
                }
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <EmojiPickerField
                guildId={guildId}
                label="Open emoji"
                value={settings.emojis.open}
                onChange={(next) =>
                  setSettings({
                    ...settings,
                    emojis: { ...settings.emojis, open: next || "🎫" },
                  })
                }
              />
              <EmojiPickerField
                guildId={guildId}
                label="Claimed emoji"
                value={settings.emojis.claimed}
                onChange={(next) =>
                  setSettings({
                    ...settings,
                    emojis: { ...settings.emojis, claimed: next || "🎟" },
                  })
                }
              />
            </div>
          </Card>

          <Card className="space-y-4 p-6 lg:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold">Support roles</h2>
              <GhostButton
                type="button"
                onClick={() => setSettings({ ...settings, supportRoleIds: [] })}
              >
                Clear
              </GhostButton>
            </div>
            <p className="text-sm text-muted">
              Staff roles that can claim and manage tickets by default.
            </p>
            <div className="flex flex-wrap gap-2">
              {roles.map((role) => {
                const active = settings.supportRoleIds.includes(role.id);
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className={`focus-ring rounded-full border px-3 py-1.5 text-sm transition ${
                      active
                        ? "border-copper bg-copper/15 text-copper-bright"
                        : "border-line text-muted hover:border-line hover:text-cream"
                    }`}
                    style={
                      role.color && role.color !== "#000000"
                        ? { boxShadow: `inset 3px 0 0 ${role.color}` }
                        : undefined
                    }
                  >
                    @{role.name}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </DashboardShell>
  );
}
