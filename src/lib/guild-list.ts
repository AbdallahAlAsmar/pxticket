export type DiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
};

export type BotGuild = {
  id: string;
  name: string;
  icon: string | null;
  memberCount?: number;
};

export type DashboardGuild = {
  id: string;
  name: string;
  icon: string | null;
  permissions: string;
  permissionLabel: "Owner" | "Administrator" | "Manage Server";
  botPresent: boolean;
  canManage: true;
  memberCount?: number;
  inviteUrl: string | null;
};

const BIGINT_ONE = BigInt(1);
const ADMINISTRATOR = BIGINT_ONE << BigInt(3);
const MANAGE_GUILD = BIGINT_ONE << BigInt(5);
const TICKET_BOT_PERMISSIONS = [
  BigInt(4), // Manage Channels
  BigInt(10), // View Channels
  BigInt(11), // Send Messages
  BigInt(14), // Embed Links
  BigInt(15), // Attach Files
  BigInt(16), // Read Message History
].reduce((all, bit) => all | (BIGINT_ONE << bit), BigInt(0));

function permissionBits(value: string | undefined) {
  try {
    return BigInt(value || "0");
  } catch {
    return BigInt(0);
  }
}

function manageablePermissionLabel(guild: DiscordGuild) {
  if (guild.owner) return "Owner" as const;
  const permissions = permissionBits(guild.permissions);
  if ((permissions & ADMINISTRATOR) === ADMINISTRATOR) return "Administrator" as const;
  if ((permissions & MANAGE_GUILD) === MANAGE_GUILD) return "Manage Server" as const;
  return null;
}

function botInviteUrl(clientId: string, guildId: string) {
  const url = new URL("https://discord.com/oauth2/authorize");
  url.search = new URLSearchParams({
    client_id: clientId,
    scope: "bot applications.commands",
    permissions: TICKET_BOT_PERMISSIONS.toString(),
    guild_id: guildId,
    disable_guild_select: "true",
  }).toString();
  return url.toString();
}

export function mergeDashboardGuilds(
  userGuilds: DiscordGuild[],
  botGuilds: BotGuild[],
  clientId: string
): DashboardGuild[] {
  const botGuildById = new Map(botGuilds.map((guild) => [guild.id, guild]));

  return userGuilds
    .flatMap((guild) => {
      const permissionLabel = manageablePermissionLabel(guild);
      if (!permissionLabel) return [];

      const botGuild = botGuildById.get(guild.id);
      return [
        {
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          permissions: guild.permissions,
          permissionLabel,
          botPresent: Boolean(botGuild),
          canManage: true as const,
          memberCount: botGuild?.memberCount,
          inviteUrl: botGuild ? null : botInviteUrl(clientId, guild.id),
        },
      ];
    })
    .sort(
      (a, b) =>
        Number(b.botPresent) - Number(a.botPresent) ||
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    );
}
