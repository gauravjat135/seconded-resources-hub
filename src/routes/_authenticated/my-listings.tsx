import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Pencil, BadgeCheck, Trash2, Plus, PackageSearch, HandCoins, Search } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader, WorkspaceLayout } from "@/components/seconded/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { formatPrice, type Resource } from "@/data/marketplace";
import { getListingsForOwner, useAllResources, useResourcesLoaded, updateListing, removeListing } from "@/data/listing-store";

export const Route = createFileRoute("/_authenticated/my-listings")({
  head: () => ({
    meta: [
      { title: "My Listings — SecondEd" },
      { name: "description", content: "Manage the resources you've posted on SecondEd." },
      { property: "og:title", content: "My Listings — SecondEd" },
      { property: "og:description", content: "Manage the resources you've posted on SecondEd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyListings,
});

type TabValue = "all" | "active" | "sold";

function MyListings() {
  const { user } = Route.useRouteContext();
  const resources = useAllResources();
  const loaded = useResourcesLoaded();
  const [tab, setTab] = useState<TabValue>("all");
  const [deleting, setDeleting] = useState<Resource | null>(null);

  const mine = useMemo(
    () => getListingsForOwner(resources, user),
    [resources, user],
  );

  const active = mine.filter((r) => r.status === "Available");
  const sold = mine.filter((r) => r.status === "Sold");
  const shown = tab === "all" ? mine : tab === "active" ? active : sold;

  const markAsSold = async (r: Resource) => {
    if (!(await updateListing(r.id, { status: "Sold" }, user))) {
      toast.error("You can only update your own listings.");
      return;
    }
    toast.success(`"${r.title}" marked as sold.`);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    if (!(await removeListing(deleting.id, user))) {
      toast.error("You can only delete your own listings.");
      return;
    }
    toast.success(`"${deleting.title}" has been deleted.`);
    setDeleting(null);
  };

  const emptyState = (
    <EmptyState icon={PackageSearch} title={tab === "all" ? "No listings yet" : tab === "active" ? "No active listings" : "No sold listings"} description={tab === "sold" ? "Items you mark as sold will appear here." : "When you post a resource for sale, it will show up here."} action={<>
        <Button asChild>
          <Link to="/sell">
            <Plus /> Sell an Item
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/browse">
            <Search /> Browse Resources
          </Link>
        </Button>
      </>}
    />
  );

  return (
    <WorkspaceLayout>
      <PageHeader
        eyebrow="Selling"
        title="My Listings"
        description="Manage the resources you've posted."
        action={
          <Button asChild>
            <Link to="/sell">
              <Plus /> Sell an Item
            </Link>
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)} className="mt-7">
        <TabsList>
          <TabsTrigger value="all">All ({mine.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="sold">Sold ({sold.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-5">
          {!loaded ? (
            <div className="surface-card grid gap-3 p-4">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="h-20 w-full animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : shown.length === 0 ? (
            emptyState
          ) : (
            <div className="surface-card divide-y divide-border overflow-hidden">
              {shown.map((r) => {
                const isSold = r.status === "Sold";
                return (
                  <div
                    key={r.id}
                     className="grid grid-cols-[72px_minmax(0,1fr)] items-start gap-4 p-4 transition-colors hover:bg-muted/35 sm:grid-cols-[72px_minmax(0,1fr)_auto] sm:items-center"
                  >
                    <Link to="/resources/$resourceId" params={{ resourceId: r.id }}>
                      <img src={r.image} alt={r.title} className="size-18 rounded-md object-cover" />
                    </Link>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate font-display font-bold">{r.title}</h2>
                        <Badge variant={isSold ? "secondary" : "default"} className={isSold ? "" : "bg-success text-success-foreground"}>
                          {isSold ? "Sold" : "Active"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {r.category} · <span className="font-semibold text-foreground">{formatPrice(r.price)}</span> · {r.condition}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        📍 {r.location} · 🎓 {r.college} · Posted {r.posted}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 sm:hidden">
                        <ListingActions r={r} isSold={isSold} onSold={markAsSold} onDelete={setDeleting} />
                      </div>
                    </div>
                    <div className="hidden flex-wrap justify-end gap-2 sm:flex sm:max-w-56">
                      <ListingActions r={r} isSold={isSold} onSold={markAsSold} onDelete={setDeleting} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.title}" will be permanently removed from SecondEd. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 /> Delete Listing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </WorkspaceLayout>
  );
}

function ListingActions({
  r,
  isSold,
  onSold,
  onDelete,
}: {
  r: Resource;
  isSold: boolean;
  onSold: (r: Resource) => void;
  onDelete: (r: Resource) => void;
}) {
  return (
    <>
      <Button variant="outline" size="sm" asChild>
        <Link to="/resources/$resourceId" params={{ resourceId: r.id }}>
          <Eye /> View
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link to="/edit-listing/$listingId" params={{ listingId: r.id }}>
          <Pencil /> Edit
        </Link>
      </Button>
      {!isSold && (
        <Button variant="outline" size="sm" onClick={() => onSold(r)}>
          <BadgeCheck /> Mark as Sold
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={() => onDelete(r)}
      >
        <Trash2 /> Delete
      </Button>
    </>
  );
}
