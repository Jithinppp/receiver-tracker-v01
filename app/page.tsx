"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { BrandMark } from "@/components/icons";

export default function Home() {
  const { login, configured, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/admin");
  }, [loading, user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      router.push("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-sm px-4 py-24 sm:py-32">
      <div className="text-center">
        <BrandMark className="mx-auto h-12 w-12" />
        <h1 className="serif-tight mt-5 text-4xl">Sign in.</h1>
        <p className="mt-3 text-sm text-[#787774]">
          Manage conference receiver projects — create events, share the
          kiosk link with the table iPad, and track every unit. Use the
          same sign-in on the company iPad.
        </p>
      </div>

      {!configured && (
        <div className="mt-6 rounded-md bg-[#FBF3DB] p-3 text-center text-sm font-medium text-[#956400]">
          Firebase not connected — add .env.local first.
        </div>
      )}

      <form onSubmit={submit} className="mt-8 space-y-4">
        <input
          className="field"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          aria-label="Email"
        />
        <input
          className="field"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          aria-label="Password"
        />
        {error && (
          <div className="rounded-md bg-[#FDEBEC] p-3 text-sm font-medium text-[#9F2F2D]">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={busy || loading}
          className="btn-primary w-full py-3 text-[15px] disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#787774]">
        No account? Contact your admin for access.
      </p>
    </main>
  );
}
