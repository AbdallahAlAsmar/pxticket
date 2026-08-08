import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function discordIconUrl(
  id: string,
  icon: string | null | undefined,
  size = 128
) {
  if (!icon) return null;
  const ext = icon.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/icons/${id}/${icon}.${ext}?size=${size}`;
}

export function normalizeHex(color?: string | null, fallback = "#2B2D31") {
  if (!color) return fallback;
  const raw = color.trim().replace(/^#/, "");
  if (/^[0-9A-Fa-f]{6}$/.test(raw)) return `#${raw.toUpperCase()}`;
  return fallback;
}

export const ADMIN_PERMISSION = BigInt(0x8);
export const MANAGE_GUILD_PERMISSION = BigInt(0x20);

export function hasGuildAdmin(permissions: string | number | bigint | undefined) {
  try {
    const perms = BigInt(permissions ?? 0);
    return (
      (perms & ADMIN_PERMISSION) === ADMIN_PERMISSION ||
      (perms & MANAGE_GUILD_PERMISSION) === MANAGE_GUILD_PERMISSION
    );
  } catch {
    return false;
  }
}
