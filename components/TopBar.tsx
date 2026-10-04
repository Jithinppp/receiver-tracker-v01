"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { BrandMark } from "./icons";

export default function TopBar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Admin-only chrome: no navbar on sign-in, kiosk, or redirect pages.
  if (!pathname?.startsWith("/admin")) return null;

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#EAEAEA] bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4 sm:px-6">
        <Link href="/admin" className="flex items-center gap-3">
          <BrandMark className="h-8 w-8" />
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold tracking-tight text-[#111111]">
              Receiver Tracker
            </span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-3">
          {loading ? (
            <span className="font-mono text-xs text-[#787774]">…</span>
          ) : user ? (
            <>
              <span className="hidden max-w-48 truncate font-mono text-xs text-[#787774] sm:block">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-md border border-[#EAEAEA] bg-white px-3.5 py-1.5 text-sm font-medium text-[#111111] hover:bg-[#F9F9F8]"
              >
                Log out
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
