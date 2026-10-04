"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import Reveal from "@/components/Reveal";
import { ReceiverIcon, ReturnIcon } from "@/components/icons";
import { getProjectBySlug } from "@/lib/projects";
import type { Project } from "@/lib/types";

export default function KioskHome() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!slug || !user) return;
    getProjectBySlug(slug)
      .then((p) => {
        if (!p) setMissing(true);
        else setProject(p);
      })
      .catch(() => setMissing(true))
      .finally(() => setLoading(false));
  }, [slug, user]);

  if (authLoading || !user || loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="font-mono text-sm text-[#787774]">Loading desk…</p>
      </main>
    );
  }

  if (missing || !project) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="card p-10">
          <p className="serif-tight text-3xl">Project not found.</p>
          <p className="mt-2 text-sm text-[#787774]">
            Check the address with the event team. It looks like{" "}
            <kbd>/conference-name</kbd>.
          </p>
        </div>
      </main>
    );
  }

  if (project.finished || !project.isActive) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
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
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <Reveal>
        <section className="card p-8 text-center sm:p-10">
          <h1 className="serif-tight text-4xl sm:text-5xl">
            {project.name}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-[#787774]">
            Borrowing a receiver for the session? Tap Collect and enter
            your name, mobile, and receiver number. Finished with it?
            Tap Return.
          </p>
        </section>
      </Reveal>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Reveal index={0}>
          <Link
            href={`/${slug}/collect`}
            className="block rounded-xl bg-brand p-8 text-center text-white transition hover:bg-brand-dark active:scale-[0.98] sm:p-10"
          >
            <ReceiverIcon className="mx-auto h-10 w-10" />
            <div className="serif-tight mt-4 text-3xl">Collect</div>
            <p className="mt-1 text-sm text-white/70">
              Taking a receiver? Start here.
            </p>
            <div className="mx-auto mt-5 w-fit border border-white/25 px-5 py-2 text-sm font-medium">
              Tap to collect
            </div>
          </Link>
        </Reveal>
        <Reveal index={1}>
          <Link
            href={`/${slug}/return`}
            className="lift block rounded-xl border border-[#EAEAEA] bg-white p-8 text-center sm:p-10"
          >
            <ReturnIcon className="mx-auto h-10 w-10 text-[#111111]" />
            <div className="serif-tight mt-4 text-3xl text-[#111111]">
              Return
            </div>
            <p className="mt-1 text-sm text-[#787774]">
              Finished with it? Hand it back here.
            </p>
            <div className="mx-auto mt-5 w-fit bg-brand px-5 py-2 text-sm font-medium text-white">
              Tap to return
            </div>
          </Link>
        </Reveal>
      </div>

      <p className="mt-6 text-center text-xs text-[#787774]">
        Enter your first and last name exactly as written, so the desk can
        match your return.
      </p>
    </main>
  );
}
