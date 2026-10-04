import type { Timestamp } from "firebase/firestore";

export type Project = {
  id: string;
  name: string;
  slug: string;
  location: string;
  details: string;
  eventDate: string; // ISO date string (yyyy-mm-dd)
  totalReceivers: number;
  isActive: boolean;
  finished: boolean;
  finishedAt: Timestamp | null;
  createdBy: string;
  createdAt: Timestamp | null;
};

export type ProjectInput = {
  name: string;
  location: string;
  details: string;
  eventDate: string;
  totalReceivers: number;
};

export type Issue = {
  id: string;
  firstName: string;
  lastName: string;
  fullNameLower: string;
  mobile: string;
  receiverNumber: string; // normalized, no leading zeros
  issuedAt: Timestamp | null;
  returned: boolean;
  returnedAt: Timestamp | null;
};

export function normalizeReceiver(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  return String(parseInt(digits, 10));
}

export function fullName(first: string, last: string): string {
  return `${first.trim()} ${last.trim()}`.trim();
}
