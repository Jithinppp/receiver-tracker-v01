"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Reveal from "@/components/Reveal";
import { CheckIcon, SearchIcon } from "@/components/icons";
import { markReturned, searchPending } from "@/lib/issues";
import { getProjectBySlug } from "@/lib/projects";
import type { Issue, Project } from "@/lib/types";

export default function ReturnPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Issue[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<Issue | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Issue | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!slug || !user) return;
    getProjectBySlug(slug).then((p) => p && setProject(p));
  }, [slug, user]);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => router.push(`/${slug}`), 10000);
    return () => clearTimeout(t);
  }, [done, router, slug]);

  const runSearch = async (value?: string) => {
    if (!project) return;
    setError("");
    setSearching(true);
    try {
      const list = await searchPending(project.id, value ?? term);
      setResults(list);
      if (list.length === 0)
        setError("Nothing still out matches that. Try the receiver number.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (!project) return;
    let cancelled = false;
    searchPending(project.id, "")
      .then((list) => {
        if (!cancelled) setResults(list);
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Search failed.");
      });
    return () => {
      cancelled = true;
    };
  }, [project]);

  const doReturn = async () => {
    if (!project || !confirm) return;
    setBusy(true);
    try {
      await markReturned(project.id, confirm.id);
      setDone(confirm);
      setConfirm(null);
      setResults((r) => r.filter((x) => x.id !== confirm.id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Return failed.");
    } finally {
      setBusy(false);
    }
  };

  if (authLoading || !user) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center">
        <p className="font-mono text-sm text-[#787774]">Checking access…</p>
      </main>
    );
  }

  if (done) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <Reveal>
          <div className="card p-10 text-center sm:p-12">
            <span className="tag tag-blue">Returned</span>
            <CheckIcon className="mx-auto mt-5 h-10 w-10 text-[#1F6C9F]" />
            <h1 className="serif-tight mt-4 text-4xl">
              Thanks, {done.firstName}.
            </h1>
            <p className="mt-3 text-[15px]">
              Receiver <kbd>#{done.receiverNumber}</kbd> is back on the
              desk record.
            </p>
            <Link
              href={`/${slug}`}
              className="btn-primary mt-7 inline-block px-8 py-3 text-[15px]"
            >
              Done — back to desk
            </Link>
          </div>
        </Reveal>
      </main>
    );
  }

  if (project && (project.finished || !project.isActive)) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="card p-10 text-center sm:p-12">
          <span className="tag tag-neutral">
            {project.finished ? "Finished" : "Paused"}
          </span>
          <h1 className="serif-tight mt-4 text-4xl">{project.name}</h1>
          <p className="mt-2 text-sm text-[#787774]">
            {project.finished
              ? "This event has finished. No more collects or returns."
              : "This desk is paused. Please check back shortly."}
          </p>
          <Link
            href={`/${slug}`}
            className="btn-ghost mt-6 inline-block px-6 py-2.5 text-sm"
          >
            Back to desk
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href={`/${slug}`}
        className="text-sm font-medium text-[#787774] hover:text-[#111111]"
      >
        ← Back to desk
      </Link>
      <Reveal>
        <section className="card mt-3 p-8 sm:p-10">
          <p className="eyebrow">Return — {project?.name ?? "…"}</p>
          <h1 className="serif-tight mt-2 text-4xl">Hand it back.</h1>
          <p className="mt-2 text-sm text-[#787774]">
            Type the <span className="font-semibold text-[#111111]">receiver number</span> or
            your <span className="font-semibold text-[#111111]">last name</span>, then
            confirm your entry.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              runSearch();
            }}
            className="mt-6 flex gap-2"
          >
            <input
              className="field field-lg"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="45  or  Carter"
            />
            <button
              type="submit"
              className="btn-primary inline-flex shrink-0 items-center gap-2 px-5 text-sm"
              disabled={searching}
            >
              <SearchIcon className="h-4 w-4" />
              {searching ? "…" : "Search"}
            </button>
          </form>

          {error && (
            <div className="mt-3 rounded-md bg-[#FBF3DB] p-3 text-sm font-medium text-[#956400]">
              {error}
            </div>
          )}

          {results.length > 0 && (
            <ul className="mt-5 border-t border-[#EAEAEA]">
              {results.map((r) => (
                <li key={r.id} className="border-b border-[#EAEAEA]">
                  <button
                    onClick={() => setConfirm(r)}
                    className="flex w-full items-center justify-between gap-3 py-4 text-left transition hover:bg-[#F9F9F8]"
                  >
                    <span className="px-1">
                      <span className="block font-semibold text-[#111111]">
                        {r.firstName} {r.lastName}
                      </span>
                      <span className="block font-mono text-xs text-[#787774]">
                        ending {r.mobile.slice(-4)} ·{" "}
                        {r.issuedAt
                          ? r.issuedAt.toDate().toLocaleString()
                          : "—"}
                      </span>
                    </span>
                    <kbd className="mr-1 shrink-0 text-sm">
                      #{r.receiverNumber}
                    </kbd>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 font-mono text-xs text-[#787774]">
            Only receivers still out are listed. Tap your row to confirm.
          </p>
        </section>
      </Reveal>

      {confirm && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/40 p-4">
          <div className="flex min-h-full items-center justify-center">
          <div className="card w-full max-w-md p-8 text-center">
            <p className="eyebrow">Confirm return</p>
            <div className="serif-tight mt-2 text-3xl">
              {confirm.firstName} {confirm.lastName}
            </div>
            <div className="mt-4">
              <kbd className="text-lg">#{confirm.receiverNumber}</kbd>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setConfirm(null)}
                className="btn-ghost flex-1 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={doReturn}
                disabled={busy}
                className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-60"
              >
                {busy ? "…" : "Confirm return"}
              </button>
            </div>
          </div>
          </div>
        </div>
      )}
    </main>
  );
}
