import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken?: string;
    error?: string;
  }
}

type DiscordToken = {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  id?: string;
  error?: string;
};

async function refreshDiscordAccessToken(token: DiscordToken): Promise<DiscordToken> {
  if (!token.refreshToken) {
    return { ...token, error: "RefreshTokenMissing" };
  }

  try {
    const body = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID!,
      client_secret: process.env.DISCORD_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
    });

    const res = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    const data = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      error?: string;
    };

    if (!res.ok || !data.access_token) {
      return { ...token, error: "RefreshAccessTokenError" };
    }

    return {
      ...token,
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? token.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + Number(data.expires_in || 604800),
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      // Discord includes `iss=https://discord.com` in OAuth callbacks; set the
      // expected issuer so Auth.js does not compare it with its generic fallback.
      issuer: "https://discord.com",
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify email guilds guilds.members.read",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      const t = token as typeof token & DiscordToken;

      if (account?.access_token) {
        t.accessToken = account.access_token;
        t.refreshToken = account.refresh_token;
        t.expiresAt =
          Number(account.expires_at) ||
          Math.floor(Date.now() / 1000) + Number(account.expires_in || 604800);
        t.error = undefined;
      }

      if (profile && "id" in profile && profile.id) {
        t.id = String(profile.id);
      }

      // Refresh a bit early so Discord guild checks don't randomly 401.
      if (t.expiresAt && Date.now() / 1000 > t.expiresAt - 60) {
        return (await refreshDiscordAccessToken(t)) as typeof token;
      }

      return t;
    },
    async session({ session, token }) {
      const t = token as typeof token & DiscordToken;
      if (session.user) {
        session.user.id = String(t.id || token.sub || "");
      }
      session.accessToken =
        typeof t.accessToken === "string" ? t.accessToken : undefined;
      if (t.error) {
        session.error = t.error;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  trustHost: true,
});
