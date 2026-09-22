import { createFileRoute } from "@tanstack/react-router";
import { AdminCategories } from "@/components/seconded/admin-pages";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  head: () => ({
    meta: [
      { title: "Categories — SecondEd Admin" },
      { name: "description", content: "Review SecondEd marketplace resource categories." },
      { property: "og:title", content: "Categories — SecondEd Admin" },
      { property: "og:description", content: "Review marketplace resource categories and activity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminCategories,
});