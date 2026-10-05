import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { slugify } from "./slug";
import type { Project, ProjectInput } from "./types";

function assertDb() {
  if (!db) throw new Error("Firebase is not configured. Add .env.local first.");
  return db;
}

function mapProject(id: string, data: Record<string, unknown>): Project {
  return {
    id,
    name: String(data.name ?? ""),
    slug: String(data.slug ?? ""),
    location: String(data.location ?? ""),
    details: String(data.details ?? ""),
    eventDate: String(data.eventDate ?? ""),
    totalReceivers: Number(data.totalReceivers ?? 0),
    isActive: Boolean(data.isActive ?? true),
    finished: Boolean(data.finished ?? false),
    finishedAt: (data.finishedAt as Project["finishedAt"]) ?? null,
    createdBy: String(data.createdBy ?? ""),
    createdAt: (data.createdAt as Project["createdAt"]) ?? null,
  };
}

export async function createProject(
  input: ProjectInput,
  uid: string
): Promise<Project> {
  const database = assertDb();
  const name = input.name.trim();
  if (!name) throw new Error("Enter a conference name.");

  // Project names must be unique (case-insensitive).
  const existing = await getDocs(collection(database, "projects"));
  const clash = existing.docs.some(
    (d) =>
      String((d.data() as Record<string, unknown>).name ?? "")
        .trim()
        .toLowerCase() === name.toLowerCase()
  );
  if (clash)
    throw new Error(`A project named "${name}" already exists.`);

  const base = slugify(name);
  let slug = base;
  // ensure uniqueness by checking existing slug
  for (let i = 2; i < 100; i++) {
    const q = query(
      collection(database, "projects"),
      where("slug", "==", slug)
    );
    const snap = await getDocs(q);
    if (snap.empty) break;
    slug = `${base}-${i}`;
  }
  const ref = await addDoc(collection(database, "projects"), {
    name: input.name.trim(),
    slug,
    location: input.location.trim(),
    details: input.details.trim(),
    eventDate: input.eventDate,
    totalReceivers: Math.max(1, Math.floor(Number(input.totalReceivers) || 0)),
    isActive: true,
    finished: false,
    finishedAt: null,
    createdBy: uid,
    createdAt: serverTimestamp(),
  });
  return {
    id: ref.id,
    name: input.name.trim(),
    slug,
    location: input.location.trim(),
    details: input.details.trim(),
    eventDate: input.eventDate,
    totalReceivers: Math.max(1, Math.floor(Number(input.totalReceivers) || 0)),
    isActive: true,
    finished: false,
    finishedAt: null,
    createdBy: uid,
    // Client timestamp so the new card orders correctly before the
    // server snapshot with the real timestamp arrives.
    createdAt: Timestamp.now(),
  };
}

function sortProjects(list: Project[]): Project[] {
  // Newest first, so a just-created project lands at the top.
  list.sort((a, b) => {
    const at = a.createdAt?.toMillis() ?? 0;
    const bt = b.createdAt?.toMillis() ?? 0;
    return bt - at;
  });
  return list;
}

export async function listProjects(onlyActive = false): Promise<Project[]> {
  const database = assertDb();
  const q = onlyActive
    ? query(collection(database, "projects"), where("isActive", "==", true))
    : collection(database, "projects");
  const snap = await getDocs(q);
  return sortProjects(snap.docs.map((d) => mapProject(d.id, d.data())));
}

/** Live project list: fires immediately and on every change. */
export function subscribeProjects(
  cb: (projects: Project[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  const database = assertDb();
  return onSnapshot(
    collection(database, "projects"),
    (snap) =>
      cb(sortProjects(snap.docs.map((d) => mapProject(d.id, d.data())))),
    (err) => onError?.(err as Error)
  );
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const database = assertDb();
  const q = query(collection(database, "projects"), where("slug", "==", slug));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return mapProject(d.id, d.data());
}

export async function setProjectActive(id: string, isActive: boolean) {
  const database = assertDb();
  await updateDoc(doc(database, "projects", id), { isActive });
}

export async function setProjectFinished(id: string, finished: boolean) {
  const database = assertDb();
  await updateDoc(doc(database, "projects", id), {
    finished,
    finishedAt: finished ? serverTimestamp() : null,
  });
}
/** Delete a project and its entire issues record (Firestore has no cascade). */
export async function deleteProject(projectId: string): Promise<void> {
  const database = assertDb();
  for (;;) {
    const snap = await getDocs(
      query(collection(database, "projects", projectId, "issues"), limit(400))
    );
    if (snap.empty) break;
    const batch = writeBatch(database);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    if (snap.size < 400) break;
  }
  await deleteDoc(doc(database, "projects", projectId));
}
