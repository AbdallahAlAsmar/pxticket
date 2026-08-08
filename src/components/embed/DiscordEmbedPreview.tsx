"use client";

import { normalizeHex } from "@/lib/utils";
import { customEmojiUrl, parseDiscordEmoji } from "@/lib/emoji";

export type EmbedPreviewProps = {
  authorName?: string | null;
  authorIcon?: string | null;
  title?: string;
  description?: string;
  color?: string | null;
  image?: string | null;
  footerText?: string;
  footerIcon?: string;
  categories?: { name: string; emoji?: string | null }[];
};

function CategoryEmoji({ raw }: { raw?: string | null }) {
  const parsed = parseDiscordEmoji(raw);
  if (parsed.kind === "custom" && parsed.id) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={customEmojiUrl(parsed.id, Boolean(parsed.animated))}
        alt=""
        className="mr-2 inline-block h-4 w-4 align-[-2px] object-contain"
      />
    );
  }
  if (parsed.kind === "unicode" && parsed.unicode) {
    return <span className="mr-2">{parsed.unicode}</span>;
  }
  return null;
}

export function DiscordEmbedPreview({
  authorName,
  authorIcon,
  title,
  description,
  color,
  image,
  footerText,
  footerIcon,
  categories = [],
}: EmbedPreviewProps) {
  const accent = normalizeHex(color, "#5865F2");

  return (
    <div className="overflow-hidden rounded-xl border border-[#1e1f22] bg-[#313338] shadow-xl">
      <div className="border-b border-[#1e1f22] px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-copper text-xs font-bold text-ink">
            PX
          </div>
          <div>
            <div className="text-sm font-semibold text-white">
              Ticket Bot <span className="ml-1 rounded bg-[#5865F2] px-1 text-[10px] font-bold uppercase">Bot</span>
            </div>
            <div className="text-[11px] text-[#949ba4]">Today at preview</div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div
          className="overflow-hidden rounded"
          style={{ borderLeft: `4px solid ${accent}`, background: "#2b2d31" }}
        >
          <div className="space-y-2 p-3 pl-4">
            {authorName ? (
              <div className="flex items-center gap-2">
                {authorIcon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={authorIcon} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : null}
                <span className="text-sm font-medium text-white">{authorName}</span>
              </div>
            ) : null}

            {title ? <h3 className="text-base font-semibold text-white">{title}</h3> : null}

            {description ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#dbdee1]">
                {description}
              </p>
            ) : null}

            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt=""
                className="mt-2 max-h-56 w-full rounded object-cover"
              />
            ) : null}

            {footerText ? (
              <div className="flex items-center gap-2 pt-1 text-xs text-[#949ba4]">
                {footerIcon ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={footerIcon} alt="" className="h-4 w-4 rounded-full object-cover" />
                ) : null}
                <span>{footerText}</span>
              </div>
            ) : null}
          </div>
        </div>

        {categories.length > 0 ? (
          <div className="mt-3">
            <div className="flex h-10 items-center justify-between rounded bg-[#1e1f22] px-3 text-sm text-[#949ba4]">
              <span>Choose a ticket section</span>
              <span className="text-xs">▾</span>
            </div>
            <div className="mt-1 max-h-32 overflow-auto rounded border border-[#1e1f22] bg-[#2b2d31] text-sm">
              {categories.slice(0, 8).map((cat) => (
                <div
                  key={cat.name}
                  className="flex items-center border-b border-[#1e1f22] px-3 py-2 text-[#dbdee1] last:border-0"
                >
                  <CategoryEmoji raw={cat.emoji} />
                  {cat.name}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
