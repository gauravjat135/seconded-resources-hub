import { useSyncExternalStore } from "react";
import { updateReportStatus, useReports } from "./reports-store";

// Demonstration administration data. Replace with persisted records later.
export type AdminStudent = {
  id: string;
  name: string;
  email: string;
  college: string;
  role: "Student" | "Moderator";
  registered: string;
  status: "Active" | "Suspended" | "Pending";
  listings: number;
  sold: number;
  location: string;
};

export const adminStudents: AdminStudent[] = [
  { id: "u-1", name: "Maya Rivera", email: "maya@viva.edu", college: "Viva College", role: "Student", registered: "12 Mar 2024", status: "Active", listings: 4, sold: 2, location: "Vasai" },
  { id: "u-2", name: "Ethan Kim", email: "ethan@patkar.edu", college: "Patkar College", role: "Student", registered: "04 Aug 2024", status: "Active", listings: 2, sold: 1, location: "Nalasopara" },
  { id: "u-3", name: "Noah Patel", email: "noah@vartak.edu", college: "N.G. Vartak College", role: "Student", registered: "21 Jan 2024", status: "Pending", listings: 6, sold: 3, location: "Virar" },
  { id: "u-4", name: "Priya Shah", email: "priya@stjohn.edu", college: "St. John College", role: "Moderator", registered: "09 Jul 2023", status: "Active", listings: 3, sold: 3, location: "Vasai" },
  { id: "u-5", name: "Aarav Mehta", email: "aarav@viva.edu", college: "Viva College", role: "Student", registered: "18 Jun 2024", status: "Active", listings: 5, sold: 1, location: "Nalasopara" },
  { id: "u-6", name: "Sana Khan", email: "sana@patkar.edu", college: "Patkar College", role: "Student", registered: "02 Nov 2024", status: "Suspended", listings: 1, sold: 0, location: "Virar" },
  { id: "u-7", name: "Kabir Joshi", email: "kabir@vartak.edu", college: "N.G. Vartak College", role: "Student", registered: "27 Sep 2023", status: "Active", listings: 7, sold: 4, location: "Vasai" },
  { id: "u-8", name: "Neha Pawar", email: "neha@stjohn.edu", college: "St. John College", role: "Student", registered: "15 Dec 2024", status: "Active", listings: 2, sold: 0, location: "Nalasopara" },
];

export type ReportStatus = "Pending" | "Reviewing" | "Resolved" | "Dismissed";

export type AdminReport = {
  id: string;
  resourceId: string;
  resourceTitle: string;
  reportedBy: string;
  reason: string;
  note: string;
  date: string;
  status: ReportStatus;
};

const demoReports: Omit<AdminReport, "status">[] = [
  { id: "r-1", resourceId: "scientific-calculator", resourceTitle: "Scientific Calculator", reportedBy: "Ethan Kim", reason: "Incorrect information", note: "Condition looks worse than described.", date: "18 min ago" },
  { id: "r-2", resourceId: "organic-chemistry-notes", resourceTitle: "Organic Chemistry Notes", reportedBy: "Maya Rivera", reason: "Duplicate listing", note: "Same notes posted twice.", date: "3 hours ago" },
  { id: "r-3", resourceId: "wireless-keyboard", resourceTitle: "Wireless Keyboard", reportedBy: "Kabir Joshi", reason: "Spam", note: "", date: "Yesterday" },
];

const STATUS_KEY = "seconded-report-statuses";
let statuses: Record<string, ReportStatus> = {};
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STATUS_KEY);
    if (raw) statuses = JSON.parse(raw) as Record<string, ReportStatus>;
  } catch {
    statuses = {};
  }
}

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let snapshot: Record<string, ReportStatus> = {};
function getSnapshot() {
  if (JSON.stringify(statuses) !== JSON.stringify(snapshot)) snapshot = { ...statuses };
  return snapshot;
}

export function setReportStatus(id: string, status: ReportStatus) {
  load();
  statuses = { ...statuses, [id]: status };
  if (/^[0-9a-f-]{36}$/i.test(id)) void updateReportStatus(id, status);
  try {
    window.localStorage.setItem(STATUS_KEY, JSON.stringify(statuses));
  } catch {
    /* ignore */
  }
  listeners.forEach((listener) => listener());
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** Demo reports plus reports students submitted from the listing pages. */
export function useAdminReports(): AdminReport[] {
  const submitted = useReports();
  const overrides = useSyncExternalStore(subscribe, getSnapshot, () => snapshot);

  const fromStudents: AdminReport[] = submitted.map((report) => ({
    id: report.id ?? `user-${report.resourceId}`,
    resourceId: report.resourceId,
    resourceTitle: report.resourceTitle,
    reportedBy: report.reportedBy ?? "Student",
    reason: report.reason,
    note: report.note,
    date: formatDate(report.reportedAt),
    status: (report.status as ReportStatus | undefined) ?? "Pending",
  }));

  return [...fromStudents, ...demoReports.map((report) => ({ ...report, status: "Pending" as ReportStatus }))].map(
    (report) => ({ ...report, status: overrides[report.id] ?? report.status }),
  );
}

export const recentActivity = [
  { id: "a-1", text: "Aarav Mehta published “Electronics Lab Kit”", time: "8 min ago", kind: "listing" as const },
  { id: "a-2", text: "Ethan Kim reported “Scientific Calculator”", time: "18 min ago", kind: "report" as const },
  { id: "a-3", text: "Neha Pawar joined from St. John College", time: "1 hour ago", kind: "user" as const },
  { id: "a-4", text: "Maya Rivera marked “Engineering Textbook Set” as sold", time: "3 hours ago", kind: "sale" as const },
  { id: "a-5", text: "Kabir Joshi published “Geometry Drawing Set”", time: "Yesterday", kind: "listing" as const },
  { id: "a-6", text: "Priya Shah resolved a duplicate listing report", time: "Yesterday", kind: "report" as const },
];
