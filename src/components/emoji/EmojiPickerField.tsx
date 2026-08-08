"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SmilePlus, X } from "lucide-react";
import { useGuildEmojis, type GuildEmoji } from "@/lib/swr";
import {
  UNICODE_EMOJI_CATEGORIES,
  customEmojiUrl,
  parseDiscordEmoji,
  searchUnicodeEmojis,
  type UnicodeEmojiItem,
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
        src={customEmojiUrl(parsed.id, Boolean(parsed.animated), 64)}
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
  const [activeCategory, setActiveCategory] = useState(
    UNICODE_EMOJI_CATEGORIES[0]?.id || "people"
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useGuildEmojis(open ? guildId : undefined);
  const guildEmojis = data?.emojis || [];

  useEffect(() => {
    if (!open) {
      setQuery("");
      setTab("server");
    }
  }, [open]);

  const filteredGuild = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return guildEmojis;
    return guildEmojis.filter((e) => e.name.toLowerCase().includes(q));
  }, [guildEmojis, query]);

  const searchResults = useMemo(() => {
    const q = query.trim();
    if (!q) return null;
    return searchUnicodeEmojis(q);
  }, [query]);

  function pickGuild(emoji: GuildEmoji) {
    onChange(emoji.tag);
    setOpen(false);
  }

  function pickUnicode(emoji: string) {
    onChange(emoji);
    setOpen(false);
  }

  function scrollToCategory(categoryId: string) {
    setActiveCategory(categoryId);
    const el = document.getElementById(`emoji-cat-${categoryId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
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
                placeholder={
                  tab === "server"
                    ? "Search server emojis…"
                    : "Search all emojis…"
                }
                className="focus-ring w-full rounded-xl border border-line bg-ink px-3 py-2 text-sm text-cream outline-none"
                autoFocus
              />
            </div>

            {tab === "unicode" && !query.trim() ? (
              <div className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2">
                {UNICODE_EMOJI_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    title={cat.name}
                    onClick={() => scrollToCategory(cat.id)}
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg transition",
                      activeCategory === cat.id
                        ? "bg-copper/20"
                        : "hover:bg-ink"
                    )}
                  >
                    {cat.icon}
                  </button>
                ))}
              </div>
            ) : null}

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3">
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
                  <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-9">
                    {filteredGuild.map((emoji) => (
                      <button
                        key={emoji.id}
                        type="button"
                        title={`${emoji.name}${emoji.animated ? " (animated)" : ""}`}
                        onClick={() => pickGuild(emoji)}
                        className="relative flex h-10 items-center justify-center rounded-xl border border-transparent bg-ink/50 transition hover:border-copper/40 hover:bg-ink"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={customEmojiUrl(emoji.id, emoji.animated, 64)}
                          alt={emoji.name}
                          className="h-7 w-7 object-contain"
                          loading="lazy"
                        />
                        {emoji.animated ? (
                          <span className="absolute bottom-0.5 right-0.5 rounded bg-ink/90 px-0.5 text-[8px] font-bold uppercase text-copper-bright">
                            GIF
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                )
              ) : searchResults ? (
                searchResults.length === 0 ? (
                  <p className="p-4 text-center text-sm text-muted">
                    No emojis match “{query.trim()}”.
                  </p>
                ) : (
                  <EmojiGrid items={searchResults} onPick={pickUnicode} />
                )
              ) : (
                <div className="space-y-5">
                  {UNICODE_EMOJI_CATEGORIES.map((cat) => (
                    <section key={cat.id} id={`emoji-cat-${cat.id}`}>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                        {cat.name}
                      </p>
                      <EmojiGrid
                        items={cat.emojis}
                        onPick={pickUnicode}
                      />
                    </section>
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

function EmojiGrid({
  items,
  onPick,
}: {
  items: UnicodeEmojiItem[];
  onPick: (emoji: string) => void;
}) {
  return (
    <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-9">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          title={item.label}
          onClick={() => onPick(item.emoji)}
          className="flex h-10 items-center justify-center rounded-xl border border-transparent bg-ink/40 text-xl transition hover:border-copper/40 hover:bg-ink"
        >
          {item.emoji}
        </button>
      ))}
    </div>
  );
}
