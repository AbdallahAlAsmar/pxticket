import test from "node:test";
import assert from "node:assert/strict";
import { mergeDashboardGuilds } from "../src/lib/guild-list.ts";

test("includes only manageable user guilds and puts bot-installed servers first", () => {
  const guilds = mergeDashboardGuilds(
    [
      { id: "no-access", name: "No access", icon: null, owner: false, permissions: "0" },
      { id: "owner", name: "Beta", icon: null, owner: true, permissions: "0" },
      { id: "manage", name: "Alpha", icon: "alpha", owner: false, permissions: "32" },
      { id: "admin", name: "Gamma", icon: null, owner: false, permissions: "8" },
    ],
    [
      { id: "admin", name: "Gamma", icon: null, memberCount: 42 },
      { id: "manage", name: "Alpha", icon: "alpha", memberCount: 10 },
    ],
    "client-id"
  );

  assert.deepEqual(guilds.map(({ id }) => id), ["manage", "admin", "owner"]);
  assert.deepEqual(guilds.map(({ permissionLabel }) => permissionLabel), [
    "Manage Server",
    "Administrator",
    "Owner",
  ]);
  assert.deepEqual(guilds.map(({ botPresent }) => botPresent), [true, true, false]);
  assert.equal(guilds[0].memberCount, 10);
  assert.equal(guilds[2].memberCount, undefined);
  assert.equal(guilds[2].canManage, true);
  assert.equal(guilds[2].inviteUrl.includes("guild_id=owner"), true);
  assert.equal(guilds[2].inviteUrl.includes("disable_guild_select=true"), true);
  assert.equal(guilds.some(({ id }) => id === "no-access"), false);
});

test("invite link requests only ticket-bot permissions and required OAuth scopes", () => {
  const [guild] = mergeDashboardGuilds(
    [{ id: "server-1", name: "Server", icon: null, owner: true, permissions: "0" }],
    [],
    "application-123"
  );
  const invite = new URL(guild.inviteUrl);

  assert.equal(invite.origin, "https://discord.com");
  assert.equal(invite.pathname, "/oauth2/authorize");
  assert.equal(invite.searchParams.get("client_id"), "application-123");
  assert.equal(invite.searchParams.get("scope"), "bot applications.commands");
  assert.equal(invite.searchParams.get("permissions"), "117776");
  assert.equal(invite.searchParams.get("guild_id"), "server-1");
});
