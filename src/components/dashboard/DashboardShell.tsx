"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Settings,
  PanelsTopLeft,
  ScrollText,
  LogOut,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";

const baseNav = [
  { href: "/dashboard", label: "Servers", icon: LayoutDashboard, exact: true },
];

export function DashboardShell({
  children,
  guildId,
  guildName,
}: {
  children: React.ReactNode;
  guildId?: string;
  guildName?: string;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const guildNav = guildId
    ? [
        {
          href: `/dashboard/${guildId}`,
          label: "Overview",
          icon: Ticket,
          exact: true,
        },
        {
          href: `/dashboard/${guildId}/panels`,
          label: "Panels",
          icon: PanelsTopLeft,
        },
        {
          href: `/dashboard/${guildId}/rules`,
          label: "Rules",
          icon: ScrollText,
        },
        {
          href: `/dashboard/${guildId}/settings`,
          label: "Settings",
          icon: Settings,
        },
      ]
    : [];

  const nav = [...baseNav, ...guildNav];

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-line bg-ink-2/90 backdrop-blur">
        <div className="border-b border-line px-5 py-5">
          <Link href="/" className="font-display text-lg font-bold text-cream">
            PX<span className="text-copper">Ticket</span>
          </Link>
          {guildName ? (
            <p className="mt-2 truncate text-xs text-muted">{guildName}</p>
          ) : null}
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "focus-ring flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-copper/15 text-copper-bright"
                    : "text-muted hover:bg-surface hover:text-cream"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line p-4">
          <div className="mb-3 flex items-center gap-3">
            {session?.user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt=""
                className="h-9 w-9 rounded-full"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-surface" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-cream">
                {session?.user?.name || "User"}
              </p>
              <p className="truncate text-xs text-muted">Discord</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="focus-ring flex w-full items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm text-muted transition hover:border-danger/40 hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
