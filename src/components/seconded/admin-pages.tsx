import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CheckCircle2,
  Eye,
  FlaskConical,
  Laptop,
  MoreHorizontal,
  NotebookPen,
  Package,
  PackageCheck,
  Search,
  ShieldAlert,
  ShieldCheck,
  Shirt,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, PageHeader, WorkspaceLayout } from "./shared";
import { Metric } from "./dashboard";
import { formatPrice } from "@/data/marketplace";
import { removeListing, useAllResources } from "@/data/listing-store";
import {
  adminStudents,
  recentActivity,
  setReportStatus,
  useAdminReports,
  type AdminReport,
  type AdminStudent,
  type ReportStatus,
} from "@/data/admin-store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const DemoBadge = <Badge variant="secondary" className="border border-primary/20 text-primary">Demo Admin</Badge>;

const statusTone: Record<ReportStatus, "secondary" | "outline" | "destructive"> = {
  Pending: "destructive",
  Reviewing: "secondary",
  Resolved: "outline",
  Dismissed: "outline",
};

export function AdminOverview() {
  const resources = useAllResources();
  const reports = useAdminReports();
  const active = resources.filter((item) => item.status === "Available").length;
  const sold = resources.length - active;
  const pending = reports.filter((report) => report.status === "Pending" || report.status === "Reviewing").length;

  return (
    <WorkspaceLayout admin>
      <PageHeader
        eyebrow="Admin workspace"
        title="Overview"
        description="Review platform activity and keep the student community healthy."
        action={DemoBadge}
      />

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Metric label="Total Students" value={String(adminStudents.length)} detail="Registered on SecondEd" icon={Users} />
        <Metric label="Total Resources" value={String(resources.length)} detail="Listed across all colleges" icon={BookOpen} />
        <Metric label="Active Resources" value={String(active)} detail="Currently available to buy" icon={PackageCheck} />
        <Metric label="Sold Resources" value={String(sold)} detail="Exchanges completed" icon={CheckCircle2} />
        <Metric label="Pending Reports" value={String(pending)} detail="Awaiting a decision" icon={ShieldAlert} />
        <Metric label="Colleges" value={String(new Set(resources.map((r) => r.college)).size)} detail="Communities on the platform" icon={ShieldCheck} />
      </div>

      <section className="surface-card mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-5">
          <h2 className="font-display text-lg font-bold">Recent activity</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/users">Manage users<ArrowRight /></Link>
          </Button>
        </div>
        <ul className="divide-y divide-border">
          {recentActivity.map((item) => (
            <li key={item.id} className="flex items-start gap-3 p-4 transition-colors hover:bg-muted/35 sm:px-5">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-primary">
                {item.kind === "report" ? <ShieldAlert className="size-4" /> : item.kind === "user" ? <Users className="size-4" /> : item.kind === "sale" ? <CheckCircle2 className="size-4" /> : <BookOpen className="size-4" />}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{item.text}</p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </WorkspaceLayout>
  );
}

export function AdminUsers() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminStudent | null>(null);
  const students = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return adminStudents;
    return adminStudents.filter((student) =>
      [student.name, student.email, student.college].some((value) => value.toLowerCase().includes(term)),
    );
  }, [query]);

  return (
    <WorkspaceLayout admin>
      <PageHeader eyebrow="Community" title="Users" description="Review student accounts and marketplace participation." action={DemoBadge} />

      <div className="relative mt-7">
        <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search by name, email or college" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>

      <div className="surface-card mt-5 hidden overflow-hidden md:block">
        <Table className="min-w-[760px]">
          <TableHeader className="bg-muted/70 text-muted-foreground">
            <tr>
              {["Student", "Email", "College", "Role", "Registered", "Status", "Action"].map((head) => (
                <TableHead key={head} className="px-5 py-3 font-bold">{head}</TableHead>
              ))}
            </tr>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="px-5 py-4 font-semibold">{student.name}</TableCell>
                <TableCell className="px-5 py-4 text-muted-foreground">{student.email}</TableCell>
                <TableCell className="px-5 py-4">{student.college}</TableCell>
                <TableCell className="px-5 py-4">{student.role}</TableCell>
                <TableCell className="px-5 py-4 text-muted-foreground">{student.registered}</TableCell>
                <TableCell className="px-5 py-4">
                  <Badge variant={student.status === "Active" ? "secondary" : student.status === "Suspended" ? "destructive" : "outline"}>
                    {student.status}
                  </Badge>
                </TableCell>
                <TableCell className="px-5 py-4">
                  <Button variant="ghost" size="sm" onClick={() => setSelected(student)}>
                    <Eye /> View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-5 grid gap-3 md:hidden">{students.map((student) => <article key={student.id} className="surface-card p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-display font-bold">{student.name}</h2><p className="truncate text-xs text-muted-foreground">{student.email}</p></div><Badge variant={student.status === "Active" ? "secondary" : student.status === "Suspended" ? "destructive" : "outline"}>{student.status}</Badge></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-muted-foreground">College</dt><dd className="mt-0.5 font-semibold">{student.college}</dd></div><div><dt className="text-xs text-muted-foreground">Role</dt><dd className="mt-0.5 font-semibold">{student.role}</dd></div><div><dt className="text-xs text-muted-foreground">Registered</dt><dd className="mt-0.5 font-semibold">{student.registered}</dd></div><div className="flex items-end justify-end"><Button variant="outline" size="sm" onClick={() => setSelected(student)}><Eye /> View</Button></div></dl></article>)}</div>
      {students.length === 0 && <EmptyState className="mt-5 min-h-64" icon={Search} title="No students found" description="Try a different name, email address, or college." />}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>{selected?.email}</DialogDescription>
          </DialogHeader>
          {selected && (
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[
                ["College", selected.college],
                ["Role", selected.role],
                ["Registered", selected.registered],
                ["Account status", selected.status],
                ["Listings", String(selected.listings)],
                ["Items sold", String(selected.sold)],
                ["Location", selected.location],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-border bg-muted/40 px-3 py-2">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </WorkspaceLayout>
  );
}

export function AdminResources() {
  const resources = useAllResources();
  const [pendingRemoval, setPendingRemoval] = useState<{ id: string; title: string } | null>(null);

  async function confirmRemove() {
    if (!pendingRemoval) return;
    const removed = await removeListing(pendingRemoval.id, "admin");
    setPendingRemoval(null);
    if (!removed) {
      toast.error("Could not remove this listing.");
      return;
    }
    toast.success("Listing removed", { description: `${pendingRemoval.title} is no longer on the marketplace.` });
  }

  return (
    <WorkspaceLayout admin>
      <PageHeader eyebrow="Marketplace" title="Resources" description="Review listings and their current marketplace status." action={DemoBadge} />

      <div className="surface-card mt-7 divide-y divide-border overflow-hidden">
        {resources.map((resource) => (
          <div key={resource.id} className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-4 p-4 transition-colors hover:bg-muted/35 sm:grid-cols-[56px_minmax(0,1fr)_auto_auto_auto]">
            <img src={resource.image} alt="" className="size-14 rounded-md object-cover" />
            <div className="min-w-[160px] flex-1">
              <p className="truncate font-semibold">{resource.title}</p>
              <p className="text-xs text-muted-foreground">
                {resource.seller} · {resource.category} · {resource.posted}
              </p>
            </div>
            <p className="font-display font-bold">{formatPrice(resource.price)}</p>
            <Badge variant={resource.status === "Sold" ? "outline" : "secondary"}>{resource.status}</Badge>
            <div className="col-span-2 flex flex-wrap items-center gap-1 sm:col-span-1">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/resources/$resourceId" params={{ resourceId: resource.id }}><Eye /> View</Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => setPendingRemoval({ id: resource.id, title: resource.title })}
              >
                <Trash2 /> Remove
              </Button>
            </div>
          </div>
        ))}
        {resources.length === 0 && <EmptyState icon={Package} title="No resources yet" description="Listings will appear here as students publish them." />}
      </div>

      <AlertDialog open={Boolean(pendingRemoval)} onOpenChange={(open) => !open && setPendingRemoval(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRemoval?.title} will be taken off the marketplace for all students.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove}>Remove Listing</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WorkspaceLayout>
  );
}

export function AdminReports() {
  const reports = useAdminReports();
  const [selected, setSelected] = useState<AdminReport | null>(null);

  function update(report: AdminReport, status: ReportStatus) {
    setReportStatus(report.id, status);
    toast.success(`Report ${status.toLowerCase()}`, { description: report.resourceTitle });
  }

  return (
    <WorkspaceLayout admin>
      <PageHeader eyebrow="Trust and safety" title="Reports" description="Review concerns submitted by the student community." action={DemoBadge} />

      <div className="mt-7 space-y-4">
        {reports.map((report) => (
          <article key={report.id} className="surface-card p-5 transition-colors hover:border-primary/20">
            <div className="flex flex-wrap items-start gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-destructive/10 text-destructive">
                <ShieldAlert />
              </span>
              <div className="min-w-[180px] flex-1">
                <h2 className="font-display font-bold">{report.resourceTitle}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {report.reason} · reported by {report.reportedBy} · {report.date}
                </p>
              </div>
              <Badge variant={statusTone[report.status]}>{report.status}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => { setSelected(report); if (report.status === "Pending") setReportStatus(report.id, "Reviewing"); }}>
                Review
              </Button>
              <Button size="sm" onClick={() => update(report, "Resolved")} disabled={report.status === "Resolved"}>
                Resolve
              </Button>
              <Button variant="ghost" size="sm" onClick={() => update(report, "Dismissed")} disabled={report.status === "Dismissed"}>
                Dismiss
              </Button>
            </div>
          </article>
        ))}
        {reports.length === 0 && <EmptyState icon={ShieldCheck} title="No reports submitted yet" description="New community reports will appear here for review." />}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review report</DialogTitle>
            <DialogDescription>{selected?.resourceTitle}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <p><span className="text-muted-foreground">Reason: </span><span className="font-semibold">{selected.reason}</span></p>
              <p><span className="text-muted-foreground">Reported by: </span><span className="font-semibold">{selected.reportedBy}</span></p>
              <p><span className="text-muted-foreground">Date: </span><span className="font-semibold">{selected.date}</span></p>
              <p className="rounded-md border border-border bg-muted/40 p-3 text-muted-foreground">
                {selected.note || "No additional message was provided."}
              </p>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link to="/resources/$resourceId" params={{ resourceId: selected.resourceId }}>
                  <Eye /> Open listing
                </Link>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </WorkspaceLayout>
  );
}

const categoryCards = [
  { name: "Books", icon: BookOpen },
  { name: "Notes", icon: NotebookPen },
  { name: "Electronics", icon: Laptop },
  { name: "Calculators", icon: Calculator },
  { name: "College Supplies", icon: Package },
  { name: "Lab Equipment", icon: FlaskConical },
  { name: "Uniforms", icon: Shirt },
  { name: "Other", icon: MoreHorizontal },
];

export function AdminCategories() {
  const resources = useAllResources();
  return (
    <WorkspaceLayout admin>
      <PageHeader eyebrow="Marketplace organization" title="Categories" description="Review the categories students use to organize resources." action={DemoBadge} />
      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {categoryCards.map(({ name, icon: Icon }) => (
          <article key={name} className="surface-card interactive-card flex items-center gap-4 p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-md bg-secondary text-primary">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display font-bold">{name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{resources.filter((resource) => resource.category === name && resource.status === "Available").length} active resources</p>
            </div>
            <Badge variant="outline">Active</Badge>
          </article>
        ))}
      </div>
    </WorkspaceLayout>
  );
}
