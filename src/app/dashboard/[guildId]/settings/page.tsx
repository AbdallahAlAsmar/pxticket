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
import type { ChannelInfo, GuildSettings, RoleInfo } from "@/lib/types";

export default function SettingsPage() {
  const params = useParams();
  const guildId = String(params.guildId);
  const [guildName, setGuildName] = useState("");
  const [settings, setSettings] = useState<GuildSettings | null>(null);
  const [channels, setChannels] = useState<ChannelInfo[]>([]);
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/bot/guilds/${guildId}`).then((r) => r.json()),
      fetch(`/api/bot/guilds/${guildId}/channels`).then((r) => r.json()),
      fetch(`/api/bot/guilds/${guildId}/roles`).then((r) => r.json()),
    ]).then(([guild, ch, rl]) => {
      if (guild.error) setError(guild.error);
      else {
        setGuildName(guild.guild?.name || "");
        setSettings(guild.settings);
      }
      setChannels(ch.channels || []);
      setRoles(rl.roles || []);
    });
  }, [guildId]);

  const textChannels = useMemo(
    () => channels.filter((c) => c.type === 0 || c.type === 5),
    [channels]
  );

  async function save() {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
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

      {!settings ? (
        <div className="h-40 animate-pulse rounded-2xl bg-surface" />
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
              <Field label="Open emoji">
                <TextInput
                  value={settings.emojis.open}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      emojis: { ...settings.emojis, open: e.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Claimed emoji">
                <TextInput
                  value={settings.emojis.claimed}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      emojis: { ...settings.emojis, claimed: e.target.value },
                    })
                  }
                />
              </Field>
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
