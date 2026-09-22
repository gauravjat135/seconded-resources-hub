import { createFileRoute } from "@tanstack/react-router";
import { AdminOverview } from "@/components/seconded/admin-pages";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — SecondEd" },
      { name: "description", content: "SecondEd marketplace administration overview." },
      { property: "og:title", content: "Admin Dashboard — SecondEd" },
      { property: "og:description", content: "Review marketplace activity and community health." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminOverview,
});