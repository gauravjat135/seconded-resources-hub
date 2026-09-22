import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeAccountEmail, type AccountIdentity } from "./account-profile";

// Backend-backed listing reports.

export type ListingReport = {
  id?: string;
  resourceId: string;
  resourceTitle: string;
  reason: string;
  note: string;
  reportedAt: string;
  reportedBy?: string;
  status?: string;
};

type ReportRow = {
  id: string;
  resource_id: string;
  resource_title: string;
  reporter_email: string;
  reason: string;
  note: string;
  status: string;
  created_at: string;
};

let reports: ListingReport[] = [];
let snapshot: ListingReport[] = reports;
let currentEmail = "";
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const serverSnapshot: ListingReport[] = [];

function emit() {
  snapshot = reports;
  listeners.forEach((listener) => listener());
}

async function load() {
  const { data: sessionData } = await supabase.auth.getSession();
  currentEmail = normalizeAccountEmail(sessionData.session?.user.email);
  const { data, error } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
  if (error) {
    reports = [];
    emit();
    return;
  }
  reports = (data as ReportRow[]).map((row) => ({
    id: row.id,
    resourceId: row.resource_id,
    resourceTitle: row.resource_title,
    reason: row.reason,
    note: row.note,
    reportedAt: row.created_at,
    reportedBy: row.reporter_email,
    status: row.status,
  }));
  emit();
}

function ensureLoaded() {
  if (typeof window === "undefined" || loading) return;
  loading = load();
}

function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getReports(): ListingReport[] {
  ensureLoaded();
  return reports;
}

export function hasReported(resourceId: string): boolean {
  return reports.some((report) => report.resourceId === resourceId && report.reportedBy === currentEmail);
}

/** Returns false when this listing was already reported by the current user. */
export async function addReport(
  report: Omit<ListingReport, "reportedAt">,
  reporter: AccountIdentity | null | undefined,
): Promise<boolean> {
  const email = normalizeAccountEmail(reporter?.email) || currentEmail;
  if (!email) return false;
  if (reports.some((item) => item.resourceId === report.resourceId && item.reportedBy === email)) return false;
  const { error } = await supabase.from("reports").insert({
    resource_id: report.resourceId,
    resource_title: report.resourceTitle,
    reporter_id: reporter?.id ?? null,
    reporter_email: email,
    reason: report.reason,
    note: report.note,
  });
  if (error) {
    console.error("Failed to submit report", error.message);
    return false;
  }
  loading = load();
  await loading;
  return true;
}

export async function updateReportStatus(id: string, status: string): Promise<boolean> {
  const { error } = await supabase.from("reports").update({ status }).eq("id", id);
  if (error) {
    console.error("Failed to update report", error.message);
    return false;
  }
  reports = reports.map((report) => (report.id === id ? { ...report, status } : report));
  emit();
  return true;
}

export function useHasReported(resourceId: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => snapshot.some((report) => report.resourceId === resourceId && report.reportedBy === currentEmail),
    () => false,
  );
}

export function useReports(): ListingReport[] {
  return useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot);
}

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "INITIAL_SESSION") {
      loading = load();
    }
  });
}
