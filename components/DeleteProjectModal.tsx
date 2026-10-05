"use client";

import { useState } from "react";
import { deleteProject } from "@/lib/projects";
import { CheckIcon, CopyIcon } from "./icons";

type Props = {
  projectId: string;
  projectName: string;
  /** Pass null when the count isn't loaded; modal then omits the number. */
  issueCount: number | null;
  onClose: () => void;
  onDeleted: () => void;
};

export default function DeleteProjectModal({
  projectId,
  projectName,
  issueCount,
  onClose,
  onDeleted,
}: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const matches = name === projectName;

  const copyName = async () => {
    try {
      await navigator.clipboard.writeText(projectName);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Copy failed — type the name manually.");
    }
  };

  const submit = async () => {
    if (!matches || busy) return;
    setBusy(true);
    setError("");
    try {
      await deleteProject(projectId);
      onDeleted();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/40 p-4">
      <div className="flex min-h-full items-center justify-center">
      <div className="card w-full max-w-md p-8">
        <p className="eyebrow">Delete project</p>
        <h2 className="serif-tight mt-1 text-3xl">Are you sure?</h2>
        <p className="mt-3 text-sm">
          This deletes{" "}
          <span className="font-semibold text-[#111111]">{projectName}</span>{" "}
          and{" "}
          {issueCount === null
            ? "its entire issue record"
            : `all ${issueCount} issue records`}
          . There is no undo.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="mb-1.5 mt-5 flex items-center gap-2">
            <label
              htmlFor="delete-confirm"
              className="text-xs font-semibold uppercase tracking-[0.08em] text-[#787774]"
            >
              Type <kbd>{projectName}</kbd> to confirm
            </label>
            <button
              type="button"
              onClick={copyName}
              title="Copy project name"
              aria-label="Copy project name"
              className="grid h-6 w-6 place-items-center rounded-md border border-[#EAEAEA] bg-white text-[#787774] transition hover:text-[#111111]"
            >
              {copied ? (
                <CheckIcon className="h-3.5 w-3.5" />
              ) : (
                <CopyIcon className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          <input
            id="delete-confirm"
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={projectName}
            autoComplete="off"
          />
          {error && (
            <div className="mt-3 rounded-md bg-[#FDEBEC] p-3 text-sm font-medium text-[#9F2F2D]">
              {error}
            </div>
          )}
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1 py-2.5 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!matches || busy}
              className="flex-1 rounded-md bg-[#9F2F2D] py-2.5 text-sm font-semibold text-white transition hover:bg-[#7e2523] disabled:opacity-40"
            >
              {busy ? "Deleting…" : "Delete"}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
