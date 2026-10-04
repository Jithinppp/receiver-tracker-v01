import type { Issue } from "./types";

function esc(v: string | number | boolean | null | undefined): string {
  const s = String(v ?? "");
  return `"${s.replace(/"/g, '""')}"`;
}

export function issuesToCsv(projectSlug: string, issues: Issue[]): string {
  const header = [
    "first_name",
    "last_name",
    "mobile",
    "receiver_number",
    "issued_at",
    "returned",
    "returned_at",
  ];
  const rows = issues.map((i) =>
    [
      esc(i.firstName),
      esc(i.lastName),
      esc(i.mobile),
      esc(i.receiverNumber),
      esc(
        i.issuedAt
          ? i.issuedAt.toDate().toISOString()
          : ""
      ),
      esc(i.returned ? "yes" : "no"),
      esc(i.returnedAt ? i.returnedAt.toDate().toISOString() : ""),
    ].join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "export.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
