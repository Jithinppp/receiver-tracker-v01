"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Reveal from "@/components/Reveal";
import { ExternalIcon } from "@/components/icons";
import { DocIcon, PlusIcon } from "@/components/icons";
import { createProject, listProjects } from "@/lib/projects";
import type { Project } from "@/lib/types";

const SPAN_CLASS = [
  "md:col-span-4",
  "md:col-span-2",
  "md:col-span-2",
  "md:col-span-4",
  "md:col-span-3",
  "md:col-span-3",
];

export default function AdminPage() {
  const { user, loading, configured } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "",
    details: "",
    eventDate: "",
    totalReceivers: "60",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    listProjects(false)
      .then(setProjects)
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setFetching(false));
  }, [user]);

  const refresh = async () => {
    try {
      setProjects(await listProjects(false));
    } catch {
      /* noop */
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");
    setBusy(true);
    try {
      await createProject(
        {
          name: form.name,
          location: form.location,
          details: form.details,
          eventDate: form.eventDate,
          totalReceivers: parseInt(form.totalReceivers, 10) || 0,
        },
        user.uid
      );
      setForm({ name: "", location: "", details: "", eventDate: "", totalReceivers: "60" });
      setShowNew(false);
      await refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Create failed.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
        <p className="font-mono text-sm text-[#787774]">Loading…</p>
      </main>
    );
  }
  if (!user) return null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Admin — {user.email}</p>
            <h1 className="serif-tight mt-2 text-4xl sm:text-5xl">
              Conferences.
            </h1>
            <p className="mt-3 max-w-md text-[15px]">
              One project per event. Open its kiosk address on the table
              iPad; guests handle the rest.
            </p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <PlusIcon className="h-4 w-4" />
            New project
          </button>
        </div>
      </Reveal>

      <div className="mt-6 flex flex-wrap gap-2">
        {!configured && (
          <span className="tag tag-yellow">
            Firebase not connected — add .env.local
          </span>
        )}
        {error && <span className="tag tag-red">{error}</span>}
      </div>

      {showNew && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/40 p-4">
          <div className="flex min-h-full items-center justify-center">
          <form onSubmit={submit} className="card w-full max-w-lg p-8">
            <p className="eyebrow">New project</p>
            <h2 className="serif-tight mt-1 text-3xl">Conference details</h2>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[#787774]">
                  Conference name
                </label>
                <input
                  className="field"
                  required
                  placeholder="GITEX Global 2026"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[#787774]">
                    Location
                  </label>
                  <input
                    className="field"
                    required
                    placeholder="Hall 3, Dubai World Trade Centre"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[#787774]">
                    Date
                  </label>
                  <input
                    className="field"
                    type="date"
                    value={form.eventDate}
                    onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[#787774]">
                  Notes <span className="normal-case text-[#A8A7A3]">(optional)</span>
                </label>
                <textarea
                  className="field"
                  rows={3}
                  placeholder="Contact person, table number, session timings"
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[#787774]">
                  Total receivers carried
                </label>
                <input
                  className="field"
                  type="number"
                  min={1}
                  max={2000}
                  required
                  value={form.totalReceivers}
                  onChange={(e) =>
                    setForm({ ...form, totalReceivers: e.target.value })
                  }
                />
                <p className="mt-1.5 font-mono text-xs text-[#787774]">
                  left in stock = total − out now
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="btn-ghost flex-1 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="btn-primary flex-1 py-2.5 text-sm disabled:opacity-60"
              >
                {busy ? "Creating…" : "Create project"}
              </button>
            </div>
            {error && (
              <div className="mt-4 rounded-md bg-[#FDEBEC] p-3 text-sm font-medium text-[#9F2F2D]">
                {error}
              </div>
            )}
          </form>
          </div>
        </div>
      )}

      {!fetching && projects.length === 0 && (
        <Reveal index={1}>
          <div className="card mt-8 p-10 text-center sm:p-14">
            <DocIcon className="mx-auto h-8 w-8 text-[#787774]" />
            <h2 className="serif-tight mt-4 text-2xl">No projects yet.</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm">
              Create the first conference above. Its kiosk address is what
              goes on the iPad.
            </p>
          </div>
        </Reveal>
      )}

      {!fetching && projects.length > 0 && (
        <div className="mt-8 grid gap-4 md:grid-cols-6">
          {projects.map((p, i) => (
            <Reveal
              as="article"
              key={p.id}
              index={i % 4}
              className={`card lift p-7 ${SPAN_CLASS[i % SPAN_CLASS.length]}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-mono text-xs text-[#787774]">
                  {(p.location || "Conference").slice(0, 30)}
                  {p.eventDate ? ` · ${p.eventDate}` : ""}
                </span>
                {p.finished ? (
                  <span className="tag tag-neutral shrink-0">Finished</span>
                ) : p.isActive ? (
                  <span className="tag tag-green shrink-0">Live</span>
                ) : (
                  <span className="tag tag-neutral shrink-0">Paused</span>
                )}
              </div>
              <h2 className="serif-tight mt-3 truncate text-[28px]">
                {p.name}
              </h2>
              <p className="mt-1 font-mono text-xs text-[#787774]">
                /{p.slug} · {p.totalReceivers} units
              </p>
              <div className="mt-6 flex gap-2 border-t border-[#EAEAEA] pt-5">
                <Link
                  href={`/admin/${p.slug}`}
                  className="btn-primary flex-1 py-2 text-center text-sm"
                >
                  Dashboard
                </Link>
                <Link
                  href={`/${p.slug}`}
                  className="btn-ghost flex-1 py-2 text-center text-sm"
                >
                  Kiosk
                </Link>
                <a
                  href={`/${p.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open kiosk in new tab"
                  aria-label={`Open ${p.name} kiosk in new tab`}
                  className="btn-ghost grid w-10 shrink-0 place-items-center"
                >
                  <ExternalIcon className="h-4 w-4" />
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </main>
  );
}
