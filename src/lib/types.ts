export type DiscordUser = {
  id: string;
  name: string;
  email?: string | null;
  image?: string | null;
};

export type GuildSummary = {
  id: string;
  name: string;
  icon: string | null;
  memberCount?: number;
  ownerId?: string;
  permissions?: string;
  permissionLabel?: "Owner" | "Administrator" | "Manage Server";
  botPresent?: boolean;
  canManage?: boolean;
  inviteUrl?: string | null;
};

export type ChannelInfo = {
  id: string;
  name: string;
  type: number;
  parentId: string | null;
  position: number;
};

export type RoleInfo = {
  id: string;
  name: string;
  color: string;
  position: number;
  managed: boolean;
  mentionable: boolean;
};

export type GuildSettings = {
  guildId: string;
  language: "ar" | "en";
  logChannelId: string | null;
  supportRoleIds: string[];
  emojis: { open: string; claimed: string };
  embed: { color: string; footer: string };
  transcriptsEnabled: boolean;
  guildProfile?: {
    bannerUrl?: string | null;
    avatarUrl?: string | null;
  };
};

export type PanelCategory = {
  id: string;
  name: string;
  emoji?: string | null;
  channelEmoji?: string | null;
  supportRoleIds?: string[];
  supportRoleId?: string | null;
  ticketCategoryId?: string | null;
  preQuestions?: { id: string; text: string }[];
};

export type TicketPanel = {
  id: string;
  name: string;
  enabled: boolean;
  channelId: string;
  messageId?: string | null;
  supportRoleId?: string | null;
  categories: PanelCategory[];
  ticketCategoryId?: string | null;
  embedTitle?: string;
  embedDescription?: string;
  embedColor?: string;
  embedImage?: string | null;
  embedAuthorName?: string | null;
  embedAuthorIcon?: string | null;
  embedFooterText?: string;
  embedFooterIcon?: string;
  createdAt?: string;
};

export type RulesItem = {
  id: string;
  name: string;
  embedTitle: string;
  embedDescription: string;
  embedColor: string;
};

export type RulesPanel = {
  id: string;
  name: string;
  channelId: string | null;
  messageId: string | null;
  rulesTitle: string;
  rulesDescription: string;
  rulesColor: string;
  rulesImage?: string | null;
  rulesAuthorName?: string | null;
  rulesAuthorIcon?: string | null;
  rules: RulesItem[];
};

export type GuildStats = {
  openTickets: number;
  totalTickets: number;
  panelCount: number;
  rulesPanelCount: number;
};

export type GuildDetail = {
  guild: GuildSummary;
  settings: GuildSettings;
  panels: TicketPanel[];
  rules: { panels: RulesPanel[] };
  stats: GuildStats;
};
