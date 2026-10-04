import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { fullName, normalizeReceiver, type Issue } from "./types";

function assertDb() {
  if (!db) throw new Error("Firebase is not configured. Add .env.local first.");
  return db;
}

function validateName(value: string, label: string): string {
  const v = value.trim().replace(/\s+/g, " ");
  if (v.length < 2)
    throw new Error(`${label} must be at least 2 characters.`);
  if (v.length > 40)
    throw new Error(`${label} must be under 40 characters.`);
  if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(v))
    throw new Error(
      `${label} may only contain letters, spaces, hyphens, and apostrophes.`
    );
  return v;
}

function mapIssue(id: string, data: Record<string, unknown>): Issue {
  return {
    id,
    firstName: String(data.firstName ?? ""),
    lastName: String(data.lastName ?? ""),
    fullNameLower: String(data.fullNameLower ?? ""),
    mobile: String(data.mobile ?? ""),
    receiverNumber: String(data.receiverNumber ?? ""),
    issuedAt: (data.issuedAt as Issue["issuedAt"]) ?? null,
    returned: Boolean(data.returned ?? false),
    returnedAt: (data.returnedAt as Issue["returnedAt"]) ?? null,
  };
}

export function subscribeIssues(
  projectId: string,
  cb: (issues: Issue[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  const database = assertDb();
  const q = query(collection(database, "projects", projectId, "issues"), limit(2000));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => mapIssue(d.id, d.data()));
      list.sort((a, b) => {
        const at = a.issuedAt?.toMillis() ?? 0;
        const bt = b.issuedAt?.toMillis() ?? 0;
        return bt - at;
      });
      cb(list);
    },
    (err) => onError?.(err as Error)
  );
}

export async function collectReceiver(
  projectId: string,
  totalReceivers: number,
  input: { firstName: string; lastName: string; mobile: string; receiver: string }
): Promise<void> {
  const database = assertDb();
  const firstName = validateName(input.firstName, "First name");
  const lastName = validateName(input.lastName, "Last name");
  const mobile = input.mobile.trim();
  const receiverNumber = normalizeReceiver(input.receiver);

  if (!/^[+\d][\d\s-]{6,14}$/.test(mobile))
    throw new Error("Enter a valid mobile number.");
  if (!receiverNumber) throw new Error("Enter a valid receiver number.");

  const num = parseInt(receiverNumber, 10);
  if (totalReceivers > 0 && (num < 1 || num > totalReceivers))
    throw new Error(`Receiver must be between 1 and ${totalReceivers}.`);

  // prevent double issue: same receiver still out
  const clash = await getDocs(
    query(
      collection(database, "projects", projectId, "issues"),
      where("receiverNumber", "==", receiverNumber),
      where("returned", "==", false)
    )
  );
  if (!clash.empty) {
    const d = clash.docs[0].data();
    throw new Error(
      `Receiver ${receiverNumber} is already with ${d.firstName ?? ""} ${d.lastName ?? ""}.`
    );
  }

  await addDoc(collection(database, "projects", projectId, "issues"), {
    firstName,
    lastName,
    fullNameLower: fullName(firstName, lastName).toLowerCase(),
    mobile,
    receiverNumber,
    issuedAt: serverTimestamp(),
    returned: false,
    returnedAt: null,
  });
}

/** Search pending (not returned) issues by receiver number or name fragment. */
export async function searchPending(
  projectId: string,
  term: string
): Promise<Issue[]> {
  const database = assertDb();
  const t = term.trim().toLowerCase();
  const q = query(
    collection(database, "projects", projectId, "issues"),
    where("returned", "==", false),
    limit(200)
  );
  const snap = await getDocs(q);
  const all = snap.docs.map((d) => mapIssue(d.id, d.data()));
  if (!t) return all.slice(0, 20);
  const norm = normalizeReceiver(t);
  return all
    .filter((i) => {
      if (norm && i.receiverNumber === norm) return true;
      if (i.fullNameLower.includes(t)) return true;
      if (i.mobile.replace(/\D/g, "").includes(t.replace(/\D/g, "")) && t.replace(/\D/g, "").length >= 3)
        return true;
      return false;
    })
    .slice(0, 20);
}

export async function markReturned(projectId: string, issueId: string) {
  const database = assertDb();
  await updateDoc(doc(database, "projects", projectId, "issues", issueId), {
    returned: true,
    returnedAt: serverTimestamp(),
  });
}

export async function undoReturn(projectId: string, issueId: string) {
  const database = assertDb();
  await updateDoc(doc(database, "projects", projectId, "issues", issueId), {
    returned: false,
    returnedAt: null,
  });
}
