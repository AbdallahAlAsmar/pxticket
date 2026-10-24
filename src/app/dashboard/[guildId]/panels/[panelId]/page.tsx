"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Trash2, Send, Save } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { DiscordEmbedPreview } from "@/components/embed/DiscordEmbedPreview";
import { EmojiPickerField } from "@/components/emoji/EmojiPickerField";
import {
  Card,
  Field,
  TextInput,
  TextArea,
  SelectInput,
  PrimaryButton,
  GhostButton,
} from "@/components/ui/forms";
import { FormSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { PanelCategory, TicketPanel } from "@/lib/types";
import {
  invalidateGuild,
  seedFromBootstrap,
  useGuildBootstrap,
  useTicketPanel,
} from "@/lib/swr";
import { mutate } from "swr";

const emptyPanel = (): Partial<TicketPanel> => ({
  name: "New Panel",
  enabled: true,
  channelId: "",
  supportRoleId: null,
  ticketCategoryId: null,
  categories: [],
  embedTitle: "Support Tickets",
  embedDescription: "Select a category to create a ticket:",
  embedColor: "0099FF",
  embedImage: "",
  embedAuthorName: "",
  embedAuthorIcon: "",
  embedFooterText: "",
  embedFooterIcon: "",
});

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "")
    .slice(0, 80) || `cat-${Date.now()}`;
}

export default function PanelEditorPage() {
  const params = useParams();
  const router = useRouter();
  const guildId = String(params.guildId);
  const panelId = String(params.panelId);
  const isNew = panelId === "new";

  const { data: bootstrap, isLoading: bootLoading } = useGuildBootstrap(guildId);
  const { data: panelData, isLoading: panelLoading, error: panelError } =
    useTicketPanel(guildId, panelId);

  const [panel, setPanel] = useState<Partial<TicketPanel>>(emptyPanel());
  const [hydrated, setHydrated] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const channels = bootstrap?.channels || [];
  const roles = bootstrap?.roles || [];
  const guildName = bootstrap?.guild?.name || "";

  useEffect(() => {
    if (isNew) {
      setHydrated(true);
      return;
    }
    // Prefer dedicated panel fetch; fall back to bootstrap list for faster first paint.
    const fromFetch = panelData?.panel;
    const fromBootstrap = bootstrap?.panels?.find((p) => p.id === panelId);
    const next = fromFetch || fromBootstrap;
    if (next) {
      setPanel(next);
      setHydrated(true);
    }
  }, [isNew, panelData, bootstrap, panelId]);

  useEffect(() => {
    if (panelError) {
      setError(panelError instanceof Error ? panelError.message : "Panel not found");
    }
  }, [panelError]);

  // Warm related SWR keys from bootstrap so other pages feel instant.
  useEffect(() => {
    if (!bootstrap) return;
    seedFromBootstrap(guildId, bootstrap);
  }, [bootstrap, guildId]);

  const textChannels = useMemo(
    () => channels.filter((c) => c.type === 0 || c.type === 5),
    [channels]
  );
  const categories = useMemo(
    () => channels.filter((c) => c.type === 4),
    [channels]
  );

  const loading =
    (!isNew && !hydrated && (bootLoading || panelLoading)) ||
    (bootLoading && !bootstrap);

  function updateCategory(index: number, patch: Partial<PanelCategory>) {
    const next = [...(panel.categories || [])];
    next[index] = { ...next[index], ...patch };
    setPanel({ ...panel, categories: next });
  }

  function addCategory() {
    const name = `Category ${(panel.categories?.length || 0) + 1}`;
    setPanel({
      ...panel,
      categories: [
        ...(panel.categories || []),
        {
          id: slugify(name),
          name,
          emoji: "🎫",
          channelEmoji: null,
          supportRoleIds: [],
          supportRoleId: null,
          ticketCategoryId: null,
          preQuestions: [],
        },
      ],
    });
  }

  function removeCategory(index: number) {
    setPanel({
      ...panel,
      categories: (panel.categories || []).filter((_, i) => i !== index),
    });
  }

  function addQuestion(catIndex: number) {
    const cats = [...(panel.categories || [])];
    const questions = [...(cats[catIndex].preQuestions || [])];
    if (questions.length >= 5) return;
    questions.push({ id: `${Date.now()}`, text: "" });
    cats[catIndex] = { ...cats[catIndex], preQuestions: questions };
    setPanel({ ...panel, categories: cats });
  }

  async function save(andPublish = false) {
    setSaving(true);
    setMessage(andPublish ? "Saving and publishing…" : "Saving…");
    setError(null);
    try {
      if (!panel.name || !panel.channelId) {
        throw new Error("Panel name and channel are required.");
      }

      const payload = {
        ...panel,
        categories: (panel.categories || []).map((c) => ({
          ...c,
          id: c.id || slugify(c.name),
          supportRoleIds: c.supportRoleIds?.length
            ? c.supportRoleIds
            : c.supportRoleId
              ? [c.supportRoleId]
              : [],
        })),
      };

      let savedId = panelId;
      if (isNew) {
        const res = await fetch(`/api/bot/guilds/${guildId}/panels`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Create failed");
        savedId = data.panel.id;
        setPanel(data.panel);
        await invalidateGuild(guildId);
        router.replace(`/dashboard/${guildId}/panels/${savedId}`);
      } else {
        const res = await fetch(`/api/bot/guilds/${guildId}/panels/${panelId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Save failed");
        setPanel(data.panel);
        await invalidateGuild(guildId);
        await mutate(`/api/bot/guilds/${guildId}/panels/${panelId}`);
      }

      if (andPublish) {
        setMessage("Publishing to Discord…");
        const pub = await fetch(
          `/api/bot/guilds/${guildId}/panels/${savedId}/publish`,
          { method: "POST" }
        );
        const pubData = await pub.json();
        if (!pub.ok) throw new Error(pubData.error || "Publish failed");
        setPanel(pubData.panel);
        await invalidateGuild(guildId);
        setMessage("Saved and published to Discord.");
      } else {
        setMessage("Panel saved.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  async function removePanel() {
    if (isNew) return;
    if (!confirm("Delete this panel?")) return;
    const res = await fetch(`/api/bot/guilds/${guildId}/panels/${panelId}`, {
      method: "DELETE",
    });
    if (res.ok) router.push(`/dashboard/${guildId}/panels`);
  }

  return (
    <DashboardShell guildId={guildId} guildName={guildName}>
      <div className="mb-4 md:mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-cream">
            {isNew ? "New panel" : panel.name || "Edit panel"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Changes on the left update the Discord preview instantly.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew ? (
            <GhostButton type="button" onClick={removePanel}>
              <Trash2 className="h-4 w-4" />
              Delete
            </GhostButton>
          ) : null}
          <GhostButton type="button" disabled={saving} onClick={() => save(false)}>
            <Save className="h-4 w-4" />
            Save
          </GhostButton>
          <PrimaryButton type="button" disabled={saving} onClick={() => save(true)}>
            <Send className="h-4 w-4" />
            Save & publish
          </PrimaryButton>
        </div>
      </div>

      {isMobile && (
        <div className="mb-4 flex border-b border-line md:hidden sticky top-0 z-10 bg-ink/95 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('edit')}
            className={cn(
              "flex-1 py-2 text-sm font-medium border-b-2 transition",
              activeTab === 'edit'
                ? "border-copper text-copper-bright"
                : "text-muted border-transparent"
            )}
          >
            Edit
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={cn(
              "flex-1 py-2 text-sm font-medium border-b-2 transition",
              activeTab === 'preview'
                ? "border-copper text-copper-bright"
                : "text-muted border-transparent"
            )}
          >
            Preview
          </button>
        </div>
      )}

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
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className={cn("space-y-6", isMobile && activeTab === 'preview' && 'hidden')}>
            <FormSkeleton />
            <FormSkeleton />
          </div>
          <div className={cn("", isMobile && activeTab === 'edit' && 'hidden')}>
            <FormSkeleton />
          </div>
        </div>
      ) : (
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className={cn("space-y-6", isMobile && activeTab === 'preview' && 'hidden')}>
          <Card className="space-y-4 p-6">
            <h2 className="font-display text-lg font-semibold">Basics</h2>
            <Field label="Panel name" required>
              <TextInput
                value={panel.name || ""}
                onChange={(e) => setPanel({ ...panel, name: e.target.value })}
              />
            </Field>
            <Field label="Post channel" required hint="Where the panel message will appear">
              <SelectInput
                value={panel.channelId || ""}
                onChange={(e) => setPanel({ ...panel, channelId: e.target.value })}
              >
                <option value="">Select channel</option>
                {textChannels.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Default support role">
              <SelectInput
                value={panel.supportRoleId || ""}
                onChange={(e) =>
                  setPanel({ ...panel, supportRoleId: e.target.value || null })
                }
              >
                <option value="">None</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    @{r.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Ticket category (Discord category)">
              <SelectInput
                value={panel.ticketCategoryId || ""}
                onChange={(e) =>
                  setPanel({ ...panel, ticketCategoryId: e.target.value || null })
                }
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="font-display text-lg font-semibold">Embed</h2>
            <Field label="Title">
              <TextInput
                value={panel.embedTitle || ""}
                onChange={(e) => setPanel({ ...panel, embedTitle: e.target.value })}
              />
            </Field>
            <Field label="Description">
              <TextArea
                rows={6}
                value={panel.embedDescription || ""}
                onChange={(e) =>
                  setPanel({ ...panel, embedDescription: e.target.value })
                }
              />
            </Field>
            <Field label="Color">
              <div className="flex gap-3">
                <input
                  type="color"
                  value={`#${String(panel.embedColor || "0099FF").replace(/^#/, "")}`}
                  onChange={(e) =>
                    setPanel({
                      ...panel,
                      embedColor: e.target.value.replace(/^#/, "").toUpperCase(),
                    })
                  }
                  className="h-11 w-14 cursor-pointer rounded-lg border border-line bg-ink"
                />
                <TextInput
                  value={panel.embedColor || ""}
                  onChange={(e) =>
                    setPanel({ ...panel, embedColor: e.target.value.replace(/^#/, "") })
                  }
                />
              </div>
            </Field>
            <Field label="Image URL">
              <TextInput
                value={panel.embedImage || ""}
                onChange={(e) => setPanel({ ...panel, embedImage: e.target.value })}
                placeholder="https://..."
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Author name">
                <TextInput
                  value={panel.embedAuthorName || ""}
                  onChange={(e) =>
                    setPanel({ ...panel, embedAuthorName: e.target.value })
                  }
                />
              </Field>
              <Field label="Author icon URL">
                <TextInput
                  value={panel.embedAuthorIcon || ""}
                  onChange={(e) =>
                    setPanel({ ...panel, embedAuthorIcon: e.target.value })
                  }
                />
              </Field>
              <Field label="Footer text">
                <TextInput
                  value={panel.embedFooterText || ""}
                  onChange={(e) =>
                    setPanel({ ...panel, embedFooterText: e.target.value })
                  }
                />
              </Field>
              <Field label="Footer icon URL">
                <TextInput
                  value={panel.embedFooterIcon || ""}
                  onChange={(e) =>
                    setPanel({ ...panel, embedFooterIcon: e.target.value })
                  }
                />
              </Field>
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Categories</h2>
              <GhostButton type="button" onClick={addCategory}>
                <Plus className="h-4 w-4" />
                Add
              </GhostButton>
            </div>

            {(panel.categories || []).length === 0 ? (
              <p className="text-sm text-muted">
                Add categories that appear in the ticket dropdown.
              </p>
            ) : (
              <div className="space-y-4">
                {(panel.categories || []).map((cat, index) => (
                  <div
                    key={`${cat.id}-${index}`}
                    className="space-y-3 rounded-xl border border-line bg-ink/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-copper">
                        Category {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeCategory(index)}
                        className="text-muted transition hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Name">
                        <TextInput
                          value={cat.name}
                          onChange={(e) =>
                            updateCategory(index, {
                              name: e.target.value,
                              id: slugify(e.target.value),
                            })
                          }
                        />
                      </Field>
                      <EmojiPickerField
                        guildId={guildId}
                        label="Emoji"
                        value={cat.emoji || ""}
                        onChange={(next) => updateCategory(index, { emoji: next })}
                        hint="Server custom emojis first, then standard Discord emojis."
                      />
                      <EmojiPickerField
                        guildId={guildId}
                        label="Channel emoji"
                        value={cat.channelEmoji || ""}
                        onChange={(next) =>
                          updateCategory(index, { channelEmoji: next })
                        }
                      />
                      <Field label="Support role">
                        <SelectInput
                          value={cat.supportRoleId || cat.supportRoleIds?.[0] || ""}
                          onChange={(e) =>
                            updateCategory(index, {
                              supportRoleId: e.target.value || null,
                              supportRoleIds: e.target.value ? [e.target.value] : [],
                            })
                          }
                        >
                          <option value="">Use panel default</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              @{r.name}
                            </option>
                          ))}
                        </SelectInput>
                      </Field>
                      <Field label="Ticket category override">
                        <SelectInput
                          value={cat.ticketCategoryId || ""}
                          onChange={(e) =>
                            updateCategory(index, {
                              ticketCategoryId: e.target.value || null,
                            })
                          }
                        >
                          <option value="">Use panel default</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </SelectInput>
                      </Field>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-wider text-muted">
                          Pre-open questions (max 5)
                        </p>
                        <GhostButton
                          type="button"
                          className="!px-2 !py-1 text-xs"
                          onClick={() => addQuestion(index)}
                        >
                          Add question
                        </GhostButton>
                      </div>
                      {(cat.preQuestions || []).map((q, qi) => (
                        <TextInput
                          key={q.id}
                          value={q.text}
                          placeholder={`Question ${qi + 1}`}
                          onChange={(e) => {
                            const questions = [...(cat.preQuestions || [])];
                            questions[qi] = { ...q, text: e.target.value };
                            updateCategory(index, { preQuestions: questions });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className={cn("xl:sticky xl:top-6 xl:self-start xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto", isMobile && activeTab === 'edit' && 'hidden')}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            Live preview
          </p>
          <DiscordEmbedPreview
            authorName={panel.embedAuthorName}
            authorIcon={panel.embedAuthorIcon}
            title={panel.embedTitle}
            description={panel.embedDescription}
            color={panel.embedColor}
            image={panel.embedImage}
            footerText={panel.embedFooterText}
            footerIcon={panel.embedFooterIcon}
            categories={panel.categories}
          />
        </div>
      </div>
      )}
    </DashboardShell>
  );
}
