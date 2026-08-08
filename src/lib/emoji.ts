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

export function customEmojiUrl(id: string, animated: boolean) {
  return `https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "png"}?size=48&quality=lossless`;
}

export function formatCustomEmojiTag(name: string, id: string, animated: boolean) {
  return `<${animated ? "a" : ""}:${name}:${id}>`;
}

/** Common Discord-style unicode set (mirrors ticket_bot fallback + extras). */
export const UNICODE_EMOJI_PACK: Array<{ emoji: string; label: string }> = [
  { emoji: "🎫", label: "Ticket" },
  { emoji: "🎟", label: "Admission" },
  { emoji: "✅", label: "Check" },
  { emoji: "❌", label: "Cross" },
  { emoji: "⚠️", label: "Warning" },
  { emoji: "📋", label: "Clipboard" },
  { emoji: "💬", label: "Speech" },
  { emoji: "📝", label: "Memo" },
  { emoji: "🔔", label: "Bell" },
  { emoji: "👋", label: "Wave" },
  { emoji: "💰", label: "Money" },
  { emoji: "🎁", label: "Gift" },
  { emoji: "🛍️", label: "Bags" },
  { emoji: "💳", label: "Card" },
  { emoji: "📞", label: "Phone" },
  { emoji: "📧", label: "Email" },
  { emoji: "🐛", label: "Bug" },
  { emoji: "🔐", label: "Lock" },
  { emoji: "⏰", label: "Alarm" },
  { emoji: "📊", label: "Chart" },
  { emoji: "🌟", label: "Star" },
  { emoji: "💡", label: "Idea" },
  { emoji: "🚀", label: "Rocket" },
  { emoji: "🎯", label: "Target" },
  { emoji: "🛠️", label: "Tools" },
  { emoji: "📦", label: "Package" },
  { emoji: "🧾", label: "Receipt" },
  { emoji: "🧑‍💻", label: "Technologist" },
  { emoji: "👮", label: "Officer" },
  { emoji: "🛡️", label: "Shield" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "❤️", label: "Heart" },
  { emoji: "🟣", label: "Purple" },
  { emoji: "🔵", label: "Blue" },
  { emoji: "🟢", label: "Green" },
  { emoji: "🟡", label: "Yellow" },
  { emoji: "🟠", label: "Orange" },
  { emoji: "⚪", label: "White" },
  { emoji: "⚫", label: "Black" },
  { emoji: "1️⃣", label: "One" },
  { emoji: "2️⃣", label: "Two" },
  { emoji: "3️⃣", label: "Three" },
  { emoji: "❓", label: "Question" },
  { emoji: "‼️", label: "Bangbang" },
  { emoji: "📌", label: "Pin" },
  { emoji: "🧭", label: "Compass" },
  { emoji: "🏠", label: "Home" },
  { emoji: "🏪", label: "Store" },
];
