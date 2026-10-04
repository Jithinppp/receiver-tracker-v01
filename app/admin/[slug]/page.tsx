"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Reveal from "@/components/Reveal";
import DeleteProjectModal from "@/components/DeleteProjectModal";
import { ExternalIcon } from "@/components/icons";
import { downloadCsv, issuesToCsv } from "@/lib/csv";
import { markReturned, subscribeIssues, undoReturn } from "@/lib/issues";
import { getProjectBySlug, setProjectActive, setProjectFinished } from "@/lib/projects";
import type { Issue, Project } from "@/lib/types";

export default function ProjectDashboard() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const { user, loading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "out" | "returned">("all");
  const [copied, setCopied] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  useEffect(() => {
    if (!slug || !user) return;
    getProjectBySlug(slug)
      .then((p) => {
        if (!p) setMissing(true);
        else {
          setProject(p);
          const unsub = subscribeIssues(
            p.id,
            setIssues,
            (e) => setError(e.message)
          );
          return unsub;
        }
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Load failed")
      );
  }, [slug, user]);

  const stats = useMemo(() => {
    const issued = issues.length;
    const returned = issues.filter((i) => i.returned).length;
    const out = issued - returned;
    const total = project?.totalReceivers ?? 0;
    const left = Math.max(0, total - out);
    return { issued, returned, out, total, left };
  }, [issues, project]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return issues.filter((i) => {
      if (filter === "out" && i.returned) return false;
      if (filter === "returned" && !i.returned) return false;
      if (!t) return true;
      return (
        `${i.firstName} ${i.lastName}`.toLowerCase().includes(t) ||
        i.receiverNumber.includes(t.replace(/\D/g, "")) ||
        i.mobile.includes(t)
      );
    });
  }, [issues, q, filter]);

  if (loading)
    return (
      <main className="mx-auto max-w-5xl px-4 py-24 sm:px-6">
        <p className="font-mono text-sm text-[#787774]">Loading…</p>
      </main>
    );
  if (!user) return null;
  if (missing)
    return (
      <main className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="card p-10">
          <p className="serif-tight text-2xl">Project not found.</p>
        </div>
      </main>
    );

  const kioskUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/${slug}`
      : `/${slug}`;

  const statCells: Array<[string, string, string]> = [
    ["Out now", String(stats.out), "md:col-span-2"],
    ["Left in stock", String(stats.left), "md:col-span-2"],
    ["Inventory", String(stats.total), "md:col-span-2"],
    ["Total issued", String(stats.issued), "md:col-span-3"],
    ["Returned", String(stats.returned), "md:col-span-3"],
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <Link
        href="/admin"
        className="text-sm font-medium text-[#787774] hover:text-[#111111]"
      >
        ← All projects
      </Link>

      <Reveal>
        <section className="card mt-3 p-8 sm:p-10">
          <div>
            <div>
              <p className="eyebrow">
                {(project?.location || "Conference").slice(0, 40)}
                {project?.eventDate ? ` · ${project.eventDate}` : ""}
              </p>
              <h1 className="serif-tight mt-2 text-4xl sm:text-5xl">
                {project?.name ?? "Loading…"}
              </h1>
              {project?.details && (
                <p className="mt-3 max-w-xl text-[15px]">{project.details}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {project?.finished ? (
                  <span className="tag tag-neutral">Finished</span>
                ) : project?.isActive ? (
                  <span className="tag tag-green">Live</span>
                ) : (
                  <span className="tag tag-neutral">Paused</span>
                )}
                <span className="break-all font-mono text-xs text-[#787774]">
                  {kioskUrl}
                </span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(kioskUrl).then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  });
                }}
                className="btn-ghost px-4 py-2 text-sm"
              >
                {copied ? "Copied" : "Copy kiosk link"}
              </button>
              <Link href={`/${slug}`} className="btn-ghost px-4 py-2 text-sm">
                Open kiosk
              </Link>
              <a
                href={kioskUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open kiosk in new tab"
                aria-label="Open kiosk in new tab"
                className="btn-ghost grid h-9 w-9 place-items-center"
              >
                <ExternalIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Count bento */}
      <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-6">
        {statCells.map(([label, value, span], i) => (
          <Reveal key={label} index={i} className={span}>
            <div className="card-flat p-6">
              <div className="serif-tight text-4xl">{value}</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#787774]">
                {label}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Record */}
      <Reveal index={1}>
        <section className="card mt-4">
          <div className="flex flex-col gap-3 border-b border-[#EAEAEA] p-5 sm:flex-row sm:items-center">
            <input
              className="field sm:max-w-xs"
              placeholder="Filter by name, receiver, mobile…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="flex gap-2 text-sm">
              {(
                [
                  ["all", `All (${issues.length})`],
                  ["out", `Out (${stats.out})`],
                  ["returned", `Returned (${stats.returned})`],
                ] as const
              ).map(([f, label]) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-md border px-3.5 py-1.5 font-medium transition ${
                    filter === f
                      ? "border-brand bg-brand text-white"
                      : "border-[#EAEAEA] bg-white text-[#787774] hover:text-[#111111]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 sm:ml-auto">
              <button
                onClick={() =>
                  project &&
                  downloadCsv(`${slug}-receivers.csv`, issuesToCsv(slug, issues))
                }
                className="btn-ghost px-4 py-2 text-sm"
              >
                CSV export
              </button>
              {project && !project.finished && (
                <button
                  onClick={async () => {
                    await setProjectActive(project.id, !project.isActive);
                    setProject({ ...project, isActive: !project.isActive });
                  }}
                  className="btn-ghost px-4 py-2 text-sm"
                >
                  {project.isActive ? "Pause" : "Resume"}
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mx-5 mt-4 rounded-md bg-[#FDEBEC] p-3 text-sm text-[#9F2F2D]">
              {error}
            </div>
          )}

          <div className="overflow-x-auto px-5 pb-6">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.08em] text-[#787774]">
                  <th className="py-3 pr-3 font-semibold">Guest</th>
                  <th className="py-3 pr-3 font-semibold">Mobile</th>
                  <th className="py-3 pr-3 font-semibold">Receiver</th>
                  <th className="py-3 pr-3 font-semibold">Issued</th>
                  <th className="py-3 pr-3 font-semibold">Status</th>
                  <th className="py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((i) => (
                  <tr key={i.id} className="border-t border-[#EAEAEA]">
                    <td className="py-3 pr-3 font-semibold text-[#111111]">
                      {i.firstName} {i.lastName}
                    </td>
                    <td className="py-3 pr-3 font-mono text-[13px]">
                      {i.mobile}
                    </td>
                    <td className="py-3 pr-3">
                      <kbd>#{i.receiverNumber}</kbd>
                    </td>
                    <td className="py-3 pr-3 text-[#787774]">
                      {i.issuedAt
                        ? i.issuedAt.toDate().toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-3 pr-3">
                      {i.returned ? (
                        <span className="tag tag-green">Returned</span>
                      ) : (
                        <span className="tag tag-yellow">Out</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {project &&
                        (i.returned ? (
                          <button
                            onClick={() => undoReturn(project.id, i.id)}
                            className="rounded-md border border-[#EAEAEA] bg-white px-3 py-1.5 text-xs font-medium hover:bg-[#F9F9F8]"
                          >
                            Undo
                          </button>
                        ) : (
                          <button
                            onClick={() => markReturned(project.id, i.id)}
                            className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-dark"
                          >
                            Mark returned
                          </button>
                        ))}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-[#787774]"
                    >
                      Nothing here yet. Collect entries from the kiosk appear
                      in this list as they happen.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </Reveal>

      {/* Danger zone */}
      <Reveal index={2}>
        <section className="card mt-4 p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="serif-tight text-2xl">Danger zone.</h2>
              <p className="mt-1 max-w-md text-sm text-[#787774]">
                Finishing ends the event: the kiosk stops accepting collects
                and returns. Deleting removes the project and its entire
                issue record. Neither pause nor finish can be undone from
                the kiosk — only here.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {project?.finished ? (
                <button
                  onClick={async () => {
                    if (!project) return;
                    try {
                      await setProjectFinished(project.id, false);
                      setProject({ ...project, finished: false });
                    } catch (e: unknown) {
                      setError(
                        e instanceof Error ? e.message : "Reopen failed."
                      );
                    }
                  }}
                  className="btn-ghost px-4 py-2 text-sm"
                >
                  Reopen event
                </button>
              ) : (
                <button
                  onClick={() => setShowFinish(true)}
                  className="rounded-md bg-[#FBF3DB] px-4 py-2 text-sm font-semibold text-[#956400] transition hover:bg-[#f6e8c4]"
                >
                  Finish event
                </button>
              )}
              <button
                onClick={() => setShowDelete(true)}
                className="rounded-md bg-[#FDEBEC] px-4 py-2 text-sm font-semibold text-[#9F2F2D] transition hover:bg-[#fbd9db]"
              >
                Delete project
              </button>
            </div>
          </div>
        </section>
      </Reveal>

      {showFinish && project && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/40 p-4">
          <div className="flex min-h-full items-center justify-center">
            <div className="card w-full max-w-md p-8">
              <p className="eyebrow">Finish event</p>
              <h2 className="serif-tight mt-1 text-3xl">
                End {project.name}?
              </h2>
              <p className="mt-3 text-sm">
                The kiosk will stop accepting collects and returns. The
                record stays available here, and you can reopen the event
                later if needed.
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => setShowFinish(false)}
                  className="btn-ghost flex-1 py-2.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setFinishing(true);
                    try {
                      await setProjectFinished(project.id, true);
                      setProject({ ...project, finished: true });
                      setShowFinish(false);
                    } catch (e: unknown) {
                      setError(
                        e instanceof Error ? e.message : "Finish failed."
                      );
                      setShowFinish(false);
                    } finally {
                      setFinishing(false);
                    }
                  }}
                  disabled={finishing}
                  className="flex-1 rounded-md bg-[#956400] py-2.5 text-sm font-semibold text-white transition hover:bg-[#7a5200] disabled:opacity-60"
                >
                  {finishing ? "Finishing…" : "Finish event"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDelete && project && (
        <DeleteProjectModal
          projectId={project.id}
          projectName={project.name}
          issueCount={issues.length}
          onClose={() => setShowDelete(false)}
          onDeleted={() => router.push("/admin")}
        />
      )}
    </main>
  );
}
