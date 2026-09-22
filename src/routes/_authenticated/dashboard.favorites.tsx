import { createFileRoute, Link } from "@tanstack/react-router";
import { HeartOff, Search } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader, ResourceCard, WorkspaceLayout } from "@/components/seconded/shared";
import { Button } from "@/components/ui/button";
import { useAllResources } from "@/data/listing-store";
import { removeFavorite, useFavoriteIds } from "@/data/favorites-store";

export const Route = createFileRoute("/_authenticated/dashboard/favorites")({
  head: () => ({
    meta: [
      { title: "My Favorites — SecondEd" },
      { name: "description", content: "Resources you've saved for later on SecondEd." },
      { property: "og:title", content: "My Favorites — SecondEd" },
      { property: "og:description", content: "Review the college resources you saved for later." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { user } = Route.useRouteContext();
  const resources = useAllResources();
  const favoriteIds = useFavoriteIds(user);
  const saved = favoriteIds
    .map((id) => resources.find((resource) => resource.id === id))
    .filter((resource): resource is NonNullable<typeof resource> => Boolean(resource));

  return (
    <WorkspaceLayout>
      <PageHeader
        eyebrow="Saved resources"
        title="My Favorites"
        description="Resources you've saved for later."
        action={
          <Button variant="outline" asChild>
            <Link to="/browse">
              <Search /> Browse Resources
            </Link>
          </Button>
        }
      />

      {saved.length === 0 ? (
        <EmptyState className="mt-8" icon={HeartOff} title="No saved resources yet." description="Tap the heart on any resource to keep it here for later." action={<Button asChild><Link to="/browse">Browse Resources</Link></Button>} />
      ) : (
        <>
          <p className="mt-6 text-sm text-muted-foreground">
            {saved.length} saved {saved.length === 1 ? "resource" : "resources"}
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {saved.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onRemoveFavorite={() => {
                  removeFavorite(resource.id, user);
                  toast.success("Removed from favorites", { description: resource.title });
                }}
              />
            ))}
          </div>
        </>
      )}
    </WorkspaceLayout>
  );
}
