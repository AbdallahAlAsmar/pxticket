"use client";

import { useMemo, useState } from "react";
import { SmilePlus, X } from "lucide-react";
import { useGuildEmojis, type GuildEmoji } from "@/lib/swr";
import {
  UNICODE_EMOJI_PACK,
  customEmojiUrl,
  parseDiscordEmoji,
} from "@/lib/emoji";
import { cn } from "@/lib/utils";

function EmojiPreview({ value }: { value: string }) {
  const parsed = parseDiscordEmoji(value);
  if (parsed.kind === "empty") {
    return <span className="text-muted">None</span>;
  }
  if (parsed.kind === "custom" && parsed.id) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={customEmojiUrl(parsed.id, Boolean(parsed.animated))}
        alt={parsed.name || "emoji"}
        className="h-6 w-6 object-contain"
      />
    );
  }
  return <span className="text-xl leading-none">{parsed.unicode}</span>;
}

export function EmojiPickerField({
  guildId,
  label,
  value,
  onChange,
  hint,
}: {
  guildId: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"server" | "unicode">("server");
  const [query, setQuery] = useState("");
  const { data, isLoading } = useGuildEmojis(open ? guildId : undefined);
  const guildEmojis = data?.emojis || [];

  const filteredGuild = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return guildEmojis;
    return guildEmojis.filter((e) => e.name.toLowerCase().includes(q));
  }, [guildEmojis, query]);

  const filteredUnicode = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return UNICODE_EMOJI_PACK;
    return UNICODE_EMOJI_PACK.filter(
      (e) => e.label.toLowerCase().includes(q) || e.emoji.includes(q)
    );
  }, [query]);

  function pickGuild(emoji: GuildEmoji) {
    onChange(emoji.tag);
    setOpen(false);
  }

  function pickUnicode(emoji: string) {
    onChange(emoji);
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-cream">{label}</span>
        {value ? (
          <button
            type="button"
            className="text-xs text-muted hover:text-danger"
            onClick={() => onChange("")}
          >
            Clear
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex h-11 min-w-[3rem] items-center justify-center rounded-xl border border-line bg-ink px-3">
          <EmojiPreview value={value} />
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="focus-ring inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-ink px-3 text-sm text-cream transition hover:border-copper/50"
        >
          <SmilePlus className="h-4 w-4 text-copper" />
          {value ? "Change emoji" : "Pick emoji"}
        </button>
      </div>

      {hint ? <p className="text-xs text-muted">{hint}</p> : null}

      {value && parseDiscordEmoji(value).kind === "custom" ? (
        <p className="truncate font-mono text-[11px] text-muted">{value}</p>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="font-display text-sm font-semibold text-cream">
                Choose emoji
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-ink hover:text-cream"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-2 border-b border-line px-4 py-2">
              <button
                type="button"
                onClick={() => setTab("server")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  tab === "server"
                    ? "bg-copper/20 text-copper-bright"
                    : "text-muted hover:text-cream"
                )}
              >
                Server emojis
              </button>
              <button
                type="button"
                onClick={() => setTab("unicode")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  tab === "unicode"
                    ? "bg-copper/20 text-copper-bright"
                    : "text-muted hover:text-cream"
                )}
              >
                Standard
              </button>
            </div>

            <div className="border-b border-line px-4 py-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="focus-ring w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-cream outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {tab === "server" ? (
                isLoading ? (
                  <p className="p-4 text-center text-sm text-muted">
                    Loading server emojis…
                  </p>
                ) : filteredGuild.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted">
                    No custom emojis found on this server.
                  </p>
                ) : (
                  <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                    {filteredGuild.map((emoji) => (
                      <button
                        key={emoji.id}
                        type="button"
                        title={emoji.name}
                        onClick={() => pickGuild(emoji)}
                        className="flex h-11 items-center justify-center rounded-xl border border-transparent bg-ink/50 transition hover:border-copper/40 hover:bg-ink"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={emoji.url}
                          alt={emoji.name}
                          className="h-7 w-7 object-contain"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                )
              ) : (
                <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                  {filteredUnicode.map((item) => (
                    <button
                      key={item.emoji + item.label}
                      type="button"
                      title={item.label}
                      onClick={() => pickUnicode(item.emoji)}
                      className="flex h-11 items-center justify-center rounded-xl border border-transparent bg-ink/50 text-xl transition hover:border-copper/40 hover:bg-ink"
                    >
                      {item.emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
