import data from "@emoji-mart/data";

const CUSTOM_EMOJI_RE = /^<(a)?:([A-Za-z0-9_]{2,32}):(\d{17,20})>$/;

export function parseDiscordEmoji(raw: string | null | undefined): {
  kind: "custom" | "unicode" | "empty";
  animated?: boolean;
  name?: string;
  id?: string;
  tag?: string;
  unicode?: string;
} {
  const input = String(raw || "").trim();
  if (!input) return { kind: "empty" };
  const match = input.match(CUSTOM_EMOJI_RE);
  if (match) {
    return {
      kind: "custom",
      animated: Boolean(match[1]),
      name: match[2],
      id: match[3],
      tag: input,
    };
  }
  return { kind: "unicode", unicode: input };
}

/** Always use .gif for animated custom emojis — Discord's default webp URL is a still frame. */
export function customEmojiUrl(id: string, animated: boolean, size = 48) {
  const ext = animated ? "gif" : "webp";
  return `https://cdn.discordapp.com/emojis/${id}.${ext}?size=${size}${
    animated ? "" : "&quality=lossless"
  }`;
}

export function formatCustomEmojiTag(
  name: string,
  id: string,
  animated: boolean
) {
  return `<${animated ? "a" : ""}:${name}:${id}>`;
}

export type UnicodeEmojiItem = {
  id: string;
  emoji: string;
  label: string;
  keywords: string[];
};

export type UnicodeEmojiCategory = {
  id: string;
  name: string;
  icon: string;
  emojis: UnicodeEmojiItem[];
};

const CATEGORY_META: Record<string, { name: string; icon: string }> = {
  people: { name: "Smileys & People", icon: "😀" },
  nature: { name: "Animals & Nature", icon: "🐻" },
  foods: { name: "Food & Drink", icon: "🍔" },
  activity: { name: "Activity", icon: "⚽" },
  places: { name: "Travel & Places", icon: "✈️" },
  objects: { name: "Objects", icon: "💡" },
  symbols: { name: "Symbols", icon: "🔣" },
  flags: { name: "Flags", icon: "🚩" },
};

type MartEmoji = {
  id: string;
  name: string;
  keywords?: string[];
  skins: Array<{ native: string }>;
};

type MartData = {
  categories: Array<{ id: string; emojis: string[] }>;
  emojis: Record<string, MartEmoji>;
};

const mart = data as unknown as MartData;

function buildUnicodeCategories(): UnicodeEmojiCategory[] {
  return mart.categories
    .filter((cat) => CATEGORY_META[cat.id])
    .map((cat) => {
      const meta = CATEGORY_META[cat.id];
      const emojis: UnicodeEmojiItem[] = [];
      for (const emojiId of cat.emojis) {
        const entry = mart.emojis[emojiId];
        if (!entry?.skins?.[0]?.native) continue;
        emojis.push({
          id: entry.id,
          emoji: entry.skins[0].native,
          label: entry.name,
          keywords: entry.keywords || [],
        });
      }
      return {
        id: cat.id,
        name: meta.name,
        icon: meta.icon,
        emojis,
      };
    })
    .filter((cat) => cat.emojis.length > 0);
}

/** Full Discord-style unicode set (~1800+), grouped like Discord / emoji-mart. */
export const UNICODE_EMOJI_CATEGORIES = buildUnicodeCategories();

export const UNICODE_EMOJI_PACK: UnicodeEmojiItem[] =
  UNICODE_EMOJI_CATEGORIES.flatMap((c) => c.emojis);

export function searchUnicodeEmojis(
  query: string,
  limit = 300
): UnicodeEmojiItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return UNICODE_EMOJI_PACK;
  const scored: Array<{ item: UnicodeEmojiItem; score: number }> = [];
  for (const item of UNICODE_EMOJI_PACK) {
    const id = item.id.toLowerCase();
    const label = item.label.toLowerCase();
    if (item.emoji === q) {
      scored.push({ item, score: 0 });
      continue;
    }
    if (id === q || label === q) {
      scored.push({ item, score: 1 });
      continue;
    }
    if (id.startsWith(q) || label.startsWith(q)) {
      scored.push({ item, score: 2 });
      continue;
    }
    if (
      id.includes(q) ||
      label.includes(q) ||
      item.keywords.some((k) => k.toLowerCase().includes(q))
    ) {
      scored.push({ item, score: 3 });
    }
  }
  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((s) => s.item);
}
