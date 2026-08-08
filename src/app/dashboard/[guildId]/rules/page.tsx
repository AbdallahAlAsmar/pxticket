"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, Send, Save, Trash2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DiscordEmbedPreview } from "@/components/embed/DiscordEmbedPreview";
import {
  Card,
  Field,
  TextInput,
  TextArea,
  SelectInput,
  PrimaryButton,
  GhostButton,
} from "@/components/ui/forms";
import { FormSkeleton, PanelRowSkeleton } from "@/components/ui/skeleton";
import type { RulesPanel } from "@/lib/types";
import {
  invalidateGuild,
  seedFromBootstrap,
  useGuildBootstrap,
  useGuildRules,
} from "@/lib/swr";
import { mutate } from "swr";

export default function RulesPage() {
  const params = useParams();
  const guildId = String(params.guildId);
  const { data: bootstrap, isLoading: bootLoading } = useGuildBootstrap(guildId);
  const { data: rulesData, error: rulesError, isLoading: rulesLoading } =
    useGuildRules(guildId);

  const [panels, setPanels] = useState<RulesPanel[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (bootstrap) seedFromBootstrap(guildId, bootstrap);
  }, [bootstrap, guildId]);

  useEffect(() => {
    const next =
      rulesData?.panels ||
      bootstrap?.rules?.panels ||
      [];
    if (!rulesData && !bootstrap) return;
    setPanels(next);
    setHydrated(true);
    setSelectedId((prev) => prev || next[0]?.id || null);
  }, [rulesData, bootstrap]);

  useEffect(() => {
    if (rulesError) {
      setError(
        rulesError instanceof Error ? rulesError.message : "Failed to load"
      );
    }
  }, [rulesError]);

  const channels = bootstrap?.channels || [];
  const guildName = bootstrap?.guild?.name || "";

  const selected = useMemo(
    () => panels.find((p) => p.id === selectedId) || null,
    [panels, selectedId]
  );

  const textChannels = useMemo(
    () => channels.filter((c) => c.type === 0 || c.type === 5),
    [channels]
  );

  const loading = (bootLoading || rulesLoading) && !hydrated;

  function patchSelected(patch: Partial<RulesPanel>) {
    if (!selected) return;
    setPanels((prev) =>
      prev.map((p) => (p.id === selected.id ? { ...p, ...patch } : p))
    );
  }

  async function refreshRules(nextPanels?: RulesPanel[]) {
    if (nextPanels) {
      setPanels(nextPanels);
      await mutate(`/api/bot/guilds/${guildId}/rules`, { panels: nextPanels }, {
        revalidate: false,
      });
    } else {
      await mutate(`/api/bot/guilds/${guildId}/rules`);
    }
    await invalidateGuild(guildId);
  }

  async function createPanel() {
    setError(null);
    const res = await fetch(`/api/bot/guilds/${guildId}/rules/panels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName || "Rules" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create");
      return;
    }
    await refreshRules(data.config.panels);
    setSelectedId(data.panel.id);
    setNewName("");
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(
        `/api/bot/guilds/${guildId}/rules/panels/${selected.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selected),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await refreshRules(data.config.panels);
      setMessage("Rules panel saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      await save();
      const res = await fetch(
        `/api/bot/guilds/${guildId}/rules/panels/${selected.id}/publish`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPanels((prev) =>
        prev.map((p) => (p.id === selected.id ? data.panel : p))
      );
      await invalidateGuild(guildId);
      setMessage("Published to Discord.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setSaving(false);
    }
  }

  async function addRule() {
    if (!selected) return;
    const res = await fetch(
      `/api/bot/guilds/${guildId}/rules/panels/${selected.id}/rules`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Rule ${selected.rules.length + 1}` }),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setPanels((prev) =>
      prev.map((p) => (p.id === selected.id ? data.panel : p))
    );
  }

  async function updateRule(
    ruleId: string,
    patch: {
      name?: string;
      embedTitle?: string;
      embedDescription?: string;
      embedColor?: string;
    }
  ) {
    if (!selected) return;
    const res = await fetch(
      `/api/bot/guilds/${guildId}/rules/panels/${selected.id}/rules/${ruleId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }
    );
    const data = await res.json();
    if (res.ok) {
      setPanels((prev) =>
        prev.map((p) => (p.id === selected.id ? data.panel : p))
      );
    }
  }

  async function deleteRule(ruleId: string) {
    if (!selected) return;
    const res = await fetch(
      `/api/bot/guilds/${guildId}/rules/panels/${selected.id}/rules/${ruleId}`,
      { method: "DELETE" }
    );
    const data = await res.json();
    if (res.ok) {
      setPanels((prev) =>
        prev.map((p) => (p.id === selected.id ? data.panel : p))
      );
    }
  }

  return (
    <DashboardShell guildId={guildId} guildName={guildName}>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cream">Rules</h1>
          <p className="mt-2 text-sm text-muted">
            Build rules menus with live embed previews.
          </p>
        </div>
        <div className="flex gap-2">
          <GhostButton type="button" disabled={!selected || saving} onClick={save}>
            <Save className="h-4 w-4" />
            Save
          </GhostButton>
          <PrimaryButton type="button" disabled={!selected || saving} onClick={publish}>
            <Send className="h-4 w-4" />
            Publish
          </PrimaryButton>
        </div>
      </div>

      {message ? (
        <p className="mb-4 rounded-xl border border-ok/30 bg-ok/10 px-4 py-3 text-sm text-ok">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          <PanelRowSkeleton />
          <FormSkeleton />
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            {panels.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`focus-ring rounded-full border px-4 py-2 text-sm transition ${
                  selectedId === p.id
                    ? "border-copper bg-copper/15 text-copper-bright"
                    : "border-line text-muted hover:text-cream"
                }`}
              >
                {p.name}
              </button>
            ))}
            <div className="flex gap-2">
              <TextInput
                className="!w-40"
                placeholder="New panel name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <GhostButton type="button" onClick={createPanel}>
                <Plus className="h-4 w-4" />
                Add panel
              </GhostButton>
            </div>
          </div>

          {!selected ? (
            <Card className="p-10 text-center text-sm text-muted">
              Create a rules panel to get started.
            </Card>
          ) : (
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-6">
                <Card className="space-y-4 p-6">
                  <Field label="Panel name">
                    <TextInput
                      value={selected.name}
                      onChange={(e) => patchSelected({ name: e.target.value })}
                    />
                  </Field>
                  <Field label="Channel">
                    <SelectInput
                      value={selected.channelId || ""}
                      onChange={(e) =>
                        patchSelected({ channelId: e.target.value || null })
                      }
                    >
                      <option value="">Select channel</option>
                      {textChannels.map((c) => (
                        <option key={c.id} value={c.id}>
                          #{c.name}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field label="Title">
                    <TextInput
                      value={selected.rulesTitle}
                      onChange={(e) =>
                        patchSelected({ rulesTitle: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Description">
                    <TextArea
                      rows={4}
                      value={selected.rulesDescription}
                      onChange={(e) =>
                        patchSelected({ rulesDescription: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="Color">
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={`#${selected.rulesColor.replace(/^#/, "")}`}
                        onChange={(e) =>
                          patchSelected({
                            rulesColor: e.target.value
                              .replace(/^#/, "")
                              .toUpperCase(),
                          })
                        }
                        className="h-11 w-14 cursor-pointer rounded-lg border border-line bg-ink"
                      />
                      <TextInput
                        value={selected.rulesColor}
                        onChange={(e) =>
                          patchSelected({
                            rulesColor: e.target.value.replace(/^#/, ""),
                          })
                        }
                      />
                    </div>
                  </Field>
                  <Field label="Image URL">
                    <TextInput
                      value={selected.rulesImage || ""}
                      onChange={(e) =>
                        patchSelected({ rulesImage: e.target.value })
                      }
                    />
                  </Field>
                </Card>

                <Card className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-semibold">Rules</h2>
                    <GhostButton type="button" onClick={addRule}>
                      <Plus className="h-4 w-4" />
                      Add rule
                    </GhostButton>
                  </div>
                  {selected.rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="space-y-3 rounded-xl border border-line bg-ink/50 p-4"
                    >
                      <div className="flex justify-between">
                        <p className="text-sm text-copper">{rule.name}</p>
                        <button
                          type="button"
                          onClick={() => deleteRule(rule.id)}
                          className="text-muted hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <TextInput
                        value={rule.name}
                        onChange={(e) =>
                          updateRule(rule.id, {
                            name: e.target.value,
                            embedTitle: e.target.value,
                          })
                        }
                      />
                      <TextArea
                        rows={3}
                        value={rule.embedDescription}
                        onChange={(e) =>
                          updateRule(rule.id, {
                            embedDescription: e.target.value,
                          })
                        }
                      />
                    </div>
                  ))}
                </Card>
              </div>

              <div className="xl:sticky xl:top-8 xl:self-start">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                  Live preview
                </p>
                <DiscordEmbedPreview
                  authorName={selected.rulesAuthorName}
                  authorIcon={selected.rulesAuthorIcon}
                  title={selected.rulesTitle}
                  description={selected.rulesDescription}
                  color={selected.rulesColor}
                  image={selected.rulesImage}
                  categories={selected.rules.map((r) => ({ name: r.name }))}
                />
                <p className="mt-4 text-center text-xs text-muted">
                  <Link
                    href={`/dashboard/${guildId}`}
                    className="text-copper hover:underline"
                  >
                    Back to overview
                  </Link>
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
}
