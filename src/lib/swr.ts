"use client";

import useSWR, { mutate } from "swr";
import type {
  ChannelInfo,
  GuildDetail,
  GuildSummary,
  RoleInfo,
  RulesPanel,
  TicketPanel,
} from "@/lib/types";

export type GuildEmoji = {
  id: string;
  name: string;
  animated: boolean;
  url: string;
  tag: string;
};

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export function useGuilds() {
  return useSWR<{ guilds: GuildSummary[] }>("/api/bot/guilds", fetcher, {
    revalidateOnFocus: true,
    dedupingInterval: 5_000,
  });
}

export function useGuildDetail(guildId: string | undefined) {
  return useSWR<GuildDetail>(
    guildId ? `/api/bot/guilds/${guildId}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 20_000 }
  );
}

export function useGuildChannels(guildId: string | undefined) {
  return useSWR<{ channels: ChannelInfo[] }>(
    guildId ? `/api/bot/guilds/${guildId}/channels` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
}

export function useGuildRoles(guildId: string | undefined) {
  return useSWR<{ roles: RoleInfo[] }>(
    guildId ? `/api/bot/guilds/${guildId}/roles` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
}

export function useGuildPanels(guildId: string | undefined) {
  return useSWR<{ panels: TicketPanel[] }>(
    guildId ? `/api/bot/guilds/${guildId}/panels` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 15_000 }
  );
}

export function useGuildRules(guildId: string | undefined) {
  return useSWR<{ panels: RulesPanel[] }>(
    guildId ? `/api/bot/guilds/${guildId}/rules` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 15_000 }
  );
}

export type GuildBootstrap = GuildDetail & {
  channels: ChannelInfo[];
  roles: RoleInfo[];
  emojis: GuildEmoji[];
};

/** Seed related keys from a bootstrap payload so navigations feel instant. */
export function seedFromBootstrap(guildId: string, bootstrap: GuildBootstrap) {
  void mutate(`/api/bot/guilds/${guildId}`, bootstrap, { revalidate: false });
  void mutate(
    `/api/bot/guilds/${guildId}/channels`,
    { channels: bootstrap.channels },
    { revalidate: false }
  );
  void mutate(
    `/api/bot/guilds/${guildId}/roles`,
    { roles: bootstrap.roles },
    { revalidate: false }
  );
  void mutate(
    `/api/bot/guilds/${guildId}/emojis`,
    { emojis: bootstrap.emojis },
    { revalidate: false }
  );
  void mutate(
    `/api/bot/guilds/${guildId}/panels`,
    { panels: bootstrap.panels },
    { revalidate: false }
  );
  void mutate(
    `/api/bot/guilds/${guildId}/rules`,
    bootstrap.rules,
    { revalidate: false }
  );
}

export function useGuildEmojis(guildId: string | undefined) {
  return useSWR<{ emojis: GuildEmoji[] }>(
    guildId ? `/api/bot/guilds/${guildId}/emojis` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300_000,
      revalidateIfStale: false,
    }
  );
}

export function useGuildBootstrap(guildId: string | undefined) {
  return useSWR<GuildBootstrap>(
    guildId ? `/api/bot/guilds/${guildId}/bootstrap` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 20_000 }
  );
}

export function useTicketPanel(guildId: string | undefined, panelId: string | undefined) {
  const isNew = panelId === "new";
  return useSWR<{ panel: TicketPanel }>(
    guildId && panelId && !isNew ? `/api/bot/guilds/${guildId}/panels/${panelId}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10_000 }
  );
}

export async function invalidateGuild(guildId: string) {
  await Promise.all([
    mutate(`/api/bot/guilds/${guildId}`),
    mutate(`/api/bot/guilds/${guildId}/panels`),
    mutate(`/api/bot/guilds/${guildId}/rules`),
    mutate(`/api/bot/guilds/${guildId}/bootstrap`),
    mutate(`/api/bot/guilds`),
  ]);
}
