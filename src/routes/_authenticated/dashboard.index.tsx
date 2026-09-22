import { createFileRoute } from "@tanstack/react-router";
import { StudentDashboard } from "@/components/seconded/dashboard";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — SecondEd" },
      { name: "description", content: "Manage your SecondEd marketplace activity." },
      { property: "og:title", content: "Student Dashboard — SecondEd" },
      { property: "og:description", content: "Manage listings, favorites, and messages on SecondEd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardRoute,
});

function DashboardRoute() {
  const { user } = Route.useRouteContext();
  return <StudentDashboard user={user} />;
}
