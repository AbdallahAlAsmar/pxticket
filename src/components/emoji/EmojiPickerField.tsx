"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SmilePlus } from "lucide-react";
import { useGuildEmojis, type GuildEmoji } from "@/lib/swr";
import {
  UNICODE_EMOJI_CATEGORIES,
  customEmojiUrlCandidates,
  parseDiscordEmoji,
  prefetchCustomEmojis,
  searchUnicodeEmojis,
  type UnicodeEmojiItem,
} from "@/lib/emoji";
import { cn } from "@/lib/utils";

/** Renders a Discord custom emoji with CDN format fallbacks (no alt-text flash). */
function CustomEmojiImg({
  id,
  animated,
  name,
  className,
  size = 64,
}: {
  id: string;
  animated: boolean;
  name?: string;
  className?: string;
  size?: number;
}) {
  const candidates = useMemo(
    () => customEmojiUrlCandidates(id, animated, size),
    [id, animated, size]
  );
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setIndex(0);
    setFailed(false);
  }, [id, animated, size]);

  if (failed || index >= candidates.length) {
    return (
      <span
        className={cn(
          "inline-flex h-7 w-7 items-center justify-center rounded bg-ink text-[10px] text-muted",
          className
        )}
        title={name || id}
      >
        ?
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={candidates[index]}
      alt=""
      title={name}
      className={cn("object-contain", className)}
      loading="eager"
      decoding="async"
      onError={() => {
        if (index + 1 < candidates.length) setIndex((i) => i + 1);
        else setFailed(true);
      }}
    />
  );
}

function EmojiPreview({ value }: { value: string }) {
  const parsed = parseDiscordEmoji(value);
  if (parsed.kind === "empty") {
    return <span className="text-muted">None</span>;
  }
  if (parsed.kind === "custom" && parsed.id) {
    return (
      <CustomEmojiImg
        id={parsed.id}
        animated={Boolean(parsed.animated)}
        name={parsed.name}
        className="h-6 w-6"
        size={64}
      />
    );
  }
  return <span className="text-xl leading-none">{parsed.unicode}</span>;
}

type PopoutPos = { top: number; left: number; width: number };

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
  const [pos, setPos] = useState<PopoutPos | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoutRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Prefetch/cache while mounted — don't wait for open.
  const { data, isLoading } = useGuildEmojis(guildId);
  const guildEmojis = data?.emojis || [];

  useEffect(() => {
    if (guildEmojis.length) prefetchCustomEmojis(guildEmojis);
  }, [guildEmojis]);

  function updatePosition() {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.min(360, Math.max(280, rect.width + 56));
    const left = Math.min(
      Math.max(8, rect.left),
      window.innerWidth - width - 8
    );
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const preferBelow = spaceBelow >= 280 || spaceBelow >= rect.top;
    const top = preferBelow
      ? rect.bottom + 8
      : Math.max(8, rect.top - 8 - Math.min(352, window.innerHeight - 16));
    setPos({ top, left, width });
  }

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
    function onScrollOrResize() {
      updatePosition();
    }
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (popoutRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
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
    const el = scrollRef.current?.querySelector(`#emoji-cat-${categoryId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const popout =
    open && pos && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popoutRef}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
            }}
            className="z-[90] flex max-h-[22rem] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/50"
            role="dialog"
            aria-label="Emoji picker"
          >
            <div className="flex gap-1 border-b border-line p-2">
              <button
                type="button"
                onClick={() => setTab("server")}
                className={cn(
                  "flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition",
                  tab === "server"
                    ? "bg-copper/20 text-copper-bright"
                    : "text-muted hover:text-cream"
                )}
              >
                Server
              </button>
              <button
                type="button"
                onClick={() => setTab("unicode")}
                className={cn(
                  "flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition",
                  tab === "unicode"
                    ? "bg-copper/20 text-copper-bright"
                    : "text-muted hover:text-cream"
                )}
              >
                Standard
              </button>
            </div>

            <div className="border-b border-line px-2 py-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  tab === "server" ? "Search server…" : "Search emojis…"
                }
                className="focus-ring w-full rounded-lg border border-line bg-ink px-2.5 py-1.5 text-sm text-cream outline-none"
                autoFocus
              />
            </div>

            {tab === "unicode" && !query.trim() ? (
              <div className="flex gap-0.5 overflow-x-auto border-b border-line px-2 py-1.5">
                {UNICODE_EMOJI_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    title={cat.name}
                    onClick={() => scrollToCategory(cat.id)}
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-base transition",
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

            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-2">
              {tab === "server" ? (
                isLoading && !guildEmojis.length ? (
                  <p className="p-3 text-center text-xs text-muted">
                    Loading server emojis…
                  </p>
                ) : filteredGuild.length === 0 ? (
                  <p className="p-3 text-center text-xs text-muted">
                    No custom emojis on this server.
                  </p>
                ) : (
                  <div className="grid grid-cols-8 gap-1">
                    {filteredGuild.map((emoji) => (
                      <button
                        key={emoji.id}
                        type="button"
                        title={`${emoji.name}${emoji.animated ? " (animated)" : ""}`}
                        onClick={() => pickGuild(emoji)}
                        className="relative flex h-9 items-center justify-center rounded-lg border border-transparent bg-ink/40 transition hover:border-copper/40 hover:bg-ink"
                      >
                        <CustomEmojiImg
                          id={emoji.id}
                          animated={emoji.animated}
                          name={emoji.name}
                          className="h-6 w-6"
                          size={64}
                        />
                        {emoji.animated ? (
                          <span className="pointer-events-none absolute bottom-0 right-0 rounded bg-ink/90 px-0.5 text-[7px] font-bold uppercase leading-none text-copper-bright">
                            GIF
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                )
              ) : searchResults ? (
                searchResults.length === 0 ? (
                  <p className="p-3 text-center text-xs text-muted">
                    No matches for “{query.trim()}”.
                  </p>
                ) : (
                  <EmojiGrid items={searchResults} onPick={pickUnicode} />
                )
              ) : (
                <div className="space-y-3">
                  {UNICODE_EMOJI_CATEGORIES.map((cat) => (
                    <section key={cat.id} id={`emoji-cat-${cat.id}`}>
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                        {cat.name}
                      </p>
                      <EmojiGrid items={cat.emojis} onPick={pickUnicode} />
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="space-y-2" ref={rootRef}>
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
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="focus-ring inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-ink px-3 text-sm text-cream transition hover:border-copper/50"
        >
          <SmilePlus className="h-4 w-4 text-copper" />
          {value ? "Change emoji" : "Pick emoji"}
        </button>
      </div>

      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      {popout}
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
    <div className="grid grid-cols-8 gap-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          title={item.label}
          onClick={() => onPick(item.emoji)}
          className="flex h-9 items-center justify-center rounded-lg border border-transparent bg-ink/40 text-lg transition hover:border-copper/40 hover:bg-ink"
        >
          {item.emoji}
        </button>
      ))}
    </div>
  );
}
