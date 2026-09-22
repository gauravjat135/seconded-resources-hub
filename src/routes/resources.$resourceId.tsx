import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgePercent,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Flag,
  Heart,
  MapPin,
  MessageCircle,
  School,
  ShieldCheck,
  Tags,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { toggleFavorite, useIsFavorite } from "@/data/favorites-store";
import { ContactSellerDialog } from "@/components/seconded/contact-seller-dialog";
import { useCurrentUser } from "@/data/use-current-user";
import { addReport, useHasReported } from "@/data/reports-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import {
  formatPrice,
  getResourceGallery,
  getSellerProfile,
  isListingOwner,
  type ListingOwner,
  type Resource,
  type ResourceStatus,
} from "@/data/marketplace";
import { findResource, loadResources, removeListing, updateListing, useAllResources, useResourcesLoaded } from "@/data/listing-store";
import { supabase } from "@/integrations/supabase/client";

const reportReasons = [
  "Inappropriate content",
  "Incorrect information",
  "Spam",
  "Fraudulent listing",
  "Duplicate listing",
  "Other",
];

export const Route = createFileRoute("/resources/$resourceId")({
  loader: async ({ params }) => {
    if (typeof window === "undefined") return null;
    await loadResources();
    return findResource(params.resourceId) ?? null;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title || "Resource"} — SecondEd` },
      { name: "description", content: loaderData?.description || "Second-hand college resource on SecondEd." },
      { property: "og:title", content: `${loaderData?.title || "Resource"} — SecondEd` },
      { property: "og:description", content: loaderData?.description || "Second-hand college resource on SecondEd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResourceDetails,
});

function Spec({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </p>
      <p className="mt-1 font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ResourceDetails() {
  const params = Route.useParams();
  const fallback = Route.useLoaderData();
  const all = useAllResources();
  const resource = all.find((item) => item.id === params.resourceId) ?? fallback;
  const loaded = useResourcesLoaded();

  if (!resource && !loaded) {
    return (
      <div className="page-container py-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]">
          <div className="aspect-[4/3] w-full animate-pulse rounded-lg bg-muted" />
          <div className="grid gap-3">
            <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-40 w-full animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="page-container py-20 text-center">
        <h1 className="font-display text-3xl font-extrabold">Listing not found</h1>
        <p className="mt-3 text-muted-foreground">This resource may have been removed by its owner.</p>
        <Button className="mt-6" asChild><Link to="/browse">Browse resources</Link></Button>
      </div>
    );
  }

  return <ResourceView key={resource.id} resource={resource} />;
}

function ResourceView({ resource }: { resource: Resource }) {
  const navigate = useNavigate();
  const gallery = getResourceGallery(resource);

  const [activeImage, setActiveImage] = useState(0);
  const { currentUser } = useCurrentUser();
  const favorite = useIsFavorite(resource.id, currentUser);
  const reported = useHasReported(resource.id);
  const [status, setStatus] = useState<ResourceStatus>(resource.status);
  const [contactOpen, setContactOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState(reportReasons[0]!);
  const [reportNote, setReportNote] = useState("");


  const owner = isListingOwner(resource, currentUser);
  const savings = resource.originalPrice - resource.price;
  const percent = Math.round((savings / resource.originalPrice) * 100);
  const seller = getSellerProfile(resource);
  const initials = seller.name.split(" ").map((part) => part[0]).join("");

  async function submitReport() {
    const created = await addReport({
      resourceId: resource.id,
      resourceTitle: resource.title,
      reason,
      note: reportNote.trim(),
    }, currentUser);
    setReportOpen(false);
    setReportNote("");
    if (!created) {
      toast.info("You've already reported this listing", {
        description: "Our team is reviewing your earlier report.",
      });
      return;
    }
    toast.success("Thank you. Your report has been submitted for review.");
  }

  async function deleteListing() {
    setDeleteOpen(false);
    if (!(await removeListing(resource.id, currentUser))) {
      toast.error("You can only delete your own listings.");
      return;
    }
    toast.success("Listing deleted", { description: `${resource.title} was removed from the marketplace.` });
    void navigate({ to: "/my-listings" });
  }

  return (
    <div className="page-container page-enter py-8 sm:py-12">
      <Link to="/browse" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        <ArrowLeft className="size-4" /> Back to resources
      </Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,.85fr)]">
        <div>
          <div className="relative overflow-hidden rounded-lg border border-border bg-card shadow-card">
            <img
              src={gallery[activeImage]}
              alt={resource.title}
              width={1008}
              height={752}
              className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
            />
            {savings > 0 && (
              <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-success px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-card">
                <BadgePercent className="size-3.5" /> Save {formatPrice(savings)}
              </span>
            )}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {gallery.map((image, index) => (
              <button
                key={image}
                type="button"
                onClick={() => setActiveImage(index)}
                aria-label={`View photo ${index + 1}`}
                className={cn(
                  "focus-control overflow-hidden rounded-md border-2 bg-card transition-all hover:-translate-y-0.5",
                  index === activeImage ? "border-primary" : "border-border hover:border-primary/40",
                )}
              >
                <img src={image} alt={`${resource.title} photo ${index + 1}`} className="aspect-[4/3] w-full object-cover" />
              </button>
            ))}
          </div>

          <section className="surface-card mt-8 p-6">
            <h2 className="font-display text-xl font-extrabold">Description</h2>
            <p className="mt-3 leading-7 text-muted-foreground">{resource.description}</p>
          </section>
        </div>

        <aside>
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{resource.category}</Badge>
              <Badge variant={status === "Available" ? "default" : "outline"}>{status}</Badge>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="transition-transform duration-200 hover:scale-110 active:scale-90"
              aria-label={favorite ? "Remove from favorites" : "Save to favorites"}
              aria-pressed={favorite}
              onClick={() => {
                if (!currentUser) { toast.info("Log in to save favorites"); void navigate({ to: "/login" }); return; }
                const saved = toggleFavorite(resource.id, currentUser);
                toast.success(saved ? "Saved to favorites" : "Removed from favorites");
              }}
            >
              <Heart className={cn("transition-all duration-200", favorite && "scale-110 fill-primary text-primary")} />
            </Button>
          </div>

          <h1 className="mt-5 font-display text-3xl font-extrabold sm:text-4xl">{resource.title}</h1>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <span className="text-3xl font-extrabold text-primary">{formatPrice(resource.price)}</span>
            <span className="pb-1 text-muted-foreground line-through">{formatPrice(resource.originalPrice)}</span>
          </div>
          {savings > 0 && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-md border border-success/25 bg-success/10 px-3 py-2 text-sm font-bold text-success">
              <BadgePercent className="size-4" /> You save {formatPrice(savings)} ({percent}% off)
            </p>
          )}

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Spec icon={CheckCircle2} label="Condition" value={resource.condition} />
            <Spec icon={Tags} label="Category" value={resource.category} />
            <Spec icon={MapPin} label="Location" value={resource.location} />
            <Spec icon={CalendarDays} label="Posted" value={resource.posted} />
          </div>

          <div className="surface-card mt-6 p-5">
            <div className="flex items-center gap-3">
              {seller.avatar ? <img src={seller.avatar} alt={seller.name} className="size-12 shrink-0 rounded-full border border-border object-cover" /> : <span className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary font-display font-extrabold text-primary">{initials || <UserRound />}</span>}
              <div className="min-w-0">
                <p className="font-display font-bold">{seller.name}</p>
                <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
                  <School className="size-3.5" /> {seller.college} · {seller.location}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Member since {seller.memberSince}</p>
              </div>
            </div>
          </div>

          {owner ? (
            <div className="mt-6 grid gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your Listing</p>
              <Button size="lg" asChild>
                <Link to="/edit-listing/$listingId" params={{ listingId: resource.id }}>
                  <Edit3 /> Manage Listing
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                disabled={status === "Sold"}
                onClick={async () => {
                  setStatus("Sold");
                  if (!(await updateListing(resource.id, { status: "Sold" }, currentUser))) {
                    toast.error("You can only update your own listings.");
                    return;
                  }
                  toast.success("Listing marked as sold");
                }}
              >
                <CheckCircle2 /> {status === "Sold" ? "Marked as Sold" : "Mark as Sold"}
              </Button>
              <Button size="lg" variant="outline" className="text-destructive" onClick={() => setDeleteOpen(true)}>
                <Trash2 /> Delete Listing
              </Button>
            </div>
          ) : (
            <div className="mt-6 grid gap-3">
               <Button size="lg" className="min-h-12 text-base shadow-sm" onClick={() => { if (!currentUser) { toast.info("Log in to contact this seller"); void navigate({ to: "/login" }); return; } setContactOpen(true); }} disabled={status === "Sold"}>
                <MessageCircle /> {status === "Sold" ? "Resource Sold" : "Contact Seller"}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  if (!currentUser) { toast.info("Log in to save favorites"); void navigate({ to: "/login" }); return; }
                  const saved = toggleFavorite(resource.id, currentUser);
                  toast.success(saved ? "Saved to favorites" : "Removed from favorites");
                }}
              >
                <Heart className={cn("transition-all duration-200", favorite && "fill-primary text-primary")} />{" "}
                {favorite ? "Saved to Favorites" : "Save to Favorites"}
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => setReportOpen(true)}
                disabled={reported}
                title={reported ? "You've already reported this listing" : undefined}
              >
                <Flag /> {reported ? "Report Submitted" : "Report Listing"}
              </Button>
            </div>
          )}

          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4" /> Meet safely in a public campus location
          </p>
        </aside>
      </div>

      <ContactSellerDialog resource={resource} open={contactOpen} onOpenChange={setContactOpen} />

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report this listing</DialogTitle>
            <DialogDescription>{resource.title}</DialogDescription>
          </DialogHeader>
          <p className="text-sm font-semibold text-foreground">Why are you reporting this resource?</p>
          <RadioGroup value={reason} onValueChange={setReason} className="gap-2.5">
            {reportReasons.map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <RadioGroupItem value={item} id={`reason-${item}`} />
                <Label htmlFor={`reason-${item}`} className="font-normal">{item}</Label>
              </div>
            ))}
          </RadioGroup>
          <div className="grid gap-2">
            <Label htmlFor="report-note">Additional message (optional)</Label>
            <Textarea
              id="report-note"
              value={reportNote}
              onChange={(event) => setReportNote(event.target.value)}
              rows={3}
              placeholder="Share any extra detail that helps our review."
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReportOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={submitReport} className="w-full sm:w-auto">Submit Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              {resource.title} will be removed from SecondEd. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteListing}>Delete Listing</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
