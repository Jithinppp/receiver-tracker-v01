"use client";

import { useState } from "react";
import { deleteProject } from "@/lib/projects";

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
  const matches = name === projectName;

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
        <label
          htmlFor="delete-confirm"
          className="mb-1.5 mt-5 block text-xs font-semibold uppercase tracking-[0.08em] text-[#787774]"
        >
          Type <kbd>{projectName}</kbd> to confirm
        </label>
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
          <button onClick={onClose} className="btn-ghost flex-1 py-2.5 text-sm">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!matches || busy}
            className="flex-1 rounded-md bg-[#9F2F2D] py-2.5 text-sm font-semibold text-white transition hover:bg-[#7e2523] disabled:opacity-40"
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
