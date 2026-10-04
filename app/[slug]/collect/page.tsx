"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Reveal from "@/components/Reveal";
import { CheckIcon } from "@/components/icons";
import { collectReceiver } from "@/lib/issues";
import { getProjectBySlug } from "@/lib/projects";
import type { Project } from "@/lib/types";

export default function CollectPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [missing, setMissing] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", mobile: "", receiver: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ name: string; receiver: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!slug || !user) return;
    getProjectBySlug(slug)
      .then((p) => (p ? setProject(p) : setMissing(true)))
      .catch(() => setMissing(true));
  }, [slug, user]);

  // auto-reset kiosk after success
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => router.push(`/${slug}`), 12000);
    return () => clearTimeout(t);
  }, [done, router, slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    setError("");
    setBusy(true);
    try {
      await collectReceiver(project.id, project.totalReceivers, form);
      setDone({ name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(), receiver: form.receiver.replace(/\D/g, "") });
      setForm({ firstName: "", lastName: "", mobile: "", receiver: "" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save. Try again.");
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

  if (missing) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-24 text-center">
        <div className="card p-10">
          <p className="serif-tight text-2xl">Project not found.</p>
        </div>
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

  if (done) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <Reveal>
          <div className="card p-10 text-center sm:p-12">
            <span className="tag tag-green">Recorded</span>
            <CheckIcon className="mx-auto mt-5 h-10 w-10 text-[#19be26]" />
            <h1 className="serif-tight mt-4 text-4xl">
              Thank you, {done.name}.
            </h1>
            <p className="mt-3 text-[15px]">
              Receiver <kbd>#{done.receiver}</kbd> is now listed under your
              name.
            </p>
            <div className="mx-auto mt-6 max-w-sm border-t border-[#EAEAEA] pt-6">
              <p className="serif-tight text-2xl">
                Please return it at this desk when the session ends.
              </p>
            </div>
            <Link
              href={`/${slug}`}
              className="btn-primary mt-7 inline-block px-8 py-3 text-[15px]"
            >
              Done — back to desk
            </Link>
            <p className="mt-3 font-mono text-xs text-[#787774]">
              This screen resets shortly.
            </p>
          </div>
        </Reveal>
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
          <p className="eyebrow">Collect — {project?.name ?? "…"}</p>
          <h1 className="serif-tight mt-2 text-4xl">Take a receiver.</h1>
          <p className="mt-2 text-sm text-[#787774]">
            Fill this in once. The desk keeps the rest of the record.
          </p>
          <form onSubmit={submit} className="mt-7 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[#787774]">
                  First name
                </label>
                <input
                  className="field field-lg"
                  required
                  minLength={2}
                  maxLength={40}
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  placeholder="James"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[#787774]">
                  Last name
                </label>
                <input
                  className="field field-lg"
                  required
                  minLength={2}
                  maxLength={40}
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  placeholder="Carter"
                  autoComplete="family-name"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[#787774]">
                Mobile number
              </label>
              <input
                className="field field-lg"
                required
                inputMode="tel"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder="+971 50 123 4567"
                autoComplete="tel"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-[#787774]">
                Receiver number
              </label>
              <input
                className="field field-lg font-mono text-2xl"
                required
                inputMode="numeric"
                value={form.receiver}
                onChange={(e) => setForm({ ...form, receiver: e.target.value })}
                placeholder="45"
              />
              <p className="mt-1.5 font-mono text-xs text-[#787774]">
                Printed on the unit · 1–{project?.totalReceivers ?? "…"}
              </p>
            </div>
            {error && (
              <div className="rounded-md bg-[#FDEBEC] p-3 text-sm font-medium text-[#9F2F2D]">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={busy}
              className="btn-primary w-full py-4 text-base disabled:opacity-60"
            >
              {busy ? "Saving…" : "Submit — collect"}
            </button>
          </form>
        </section>
      </Reveal>
    </main>
  );
}
