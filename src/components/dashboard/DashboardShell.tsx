"use client";

import { useState } from "react";
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
  Menu,
  X,
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
  const [open, setOpen] = useState(false);

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
    <div className="flex min-h-screen bg-ink">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-line bg-ink-2/95 backdrop-blur transition-transform duration-250 ease-out md:static md:w-64 md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <Link href="/" className="font-display text-lg font-bold text-cream">
            PX<span className="text-copper">Ticket</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line text-muted hover:text-cream md:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {guildName ? (
          <p className="truncate border-b border-line px-5 py-2 text-xs text-muted">
            {guildName}
          </p>
        ) : null}

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "focus-ring flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition md:py-2.5",
                  active
                    ? "bg-copper/15 text-copper-bright"
                    : "text-muted hover:bg-surface hover:text-cream"
                )}
              >
                <item.icon className="h-5 w-5 md:h-4 md:w-4" />
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
            onClick={() => {
              setOpen(false);
              signOut({ callbackUrl: "/" });
            }}
            className="focus-ring flex w-full items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm text-muted transition hover:border-danger/40 hover:text-danger"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {open ? (
        <div
          className="fixed inset-0 z-30 bg-ink/70 backdrop-blur-sm transition-opacity duration-250 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-ink-2/90 px-4 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line text-cream"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="font-display text-base font-bold text-cream">
            PX<span className="text-copper">Ticket</span>
          </Link>
          <div className="min-w-0 flex-1 text-right">
            <p className="truncate text-xs text-muted">
              {guildName || "Dashboard"}
            </p>
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-clip">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
