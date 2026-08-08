"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
];

export function SiteNav() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="font-display text-lg font-bold tracking-tight text-white"
        >
          PX<span className="text-copper">Ticket</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-white/65 transition hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {session?.user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          ) : (
            <>
              <button
                type="button"
                onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
                className="text-sm text-white/70 transition hover:text-white"
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Open dashboard
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          className="rounded-lg border border-white/15 p-2 text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "border-t border-white/10 bg-black/90 px-6 py-4 backdrop-blur md:hidden",
          open ? "block" : "hidden"
        )}
      >
        <div className="flex flex-col gap-3">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-sm text-white/80"
            >
              {link.label}
            </a>
          ))}
          {session?.user ? (
            <Link
              href="/dashboard"
              className="mt-2 rounded-full bg-white px-4 py-2 text-center text-sm font-semibold text-black"
            >
              Dashboard
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
              className="mt-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
            >
              Open dashboard
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
