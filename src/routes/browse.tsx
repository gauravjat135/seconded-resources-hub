import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { z } from "zod";
import { EmptyState, PageHeader, ResourceCard } from "@/components/seconded/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { categories, collegeOptions } from "@/data/marketplace";
import { useAllResources, useResourcesLoaded } from "@/data/listing-store";

const browseSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  condition: z.string().optional(),
  price: z.string().optional(),
  location: z.string().optional(),
  college: z.string().optional(),
  sort: z.string().optional(),
});

type BrowseSearch = z.infer<typeof browseSearchSchema>;
type FilterKey = "category" | "condition" | "price" | "location" | "college";

const conditions = ["New", "Like New", "Good", "Fair", "Used"];
const locations = ["Vasai", "Nalasopara", "Virar"];
const priceOptions = [
  { value: "under-200", label: "Under ₹200" },
  { value: "200-500", label: "₹200 – ₹500" },
  { value: "500-1000", label: "₹500 – ₹1,000" },
  { value: "1000-2500", label: "₹1,000 – ₹2,500" },
  { value: "above-2500", label: "Above ₹2,500" },
];
const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

export const Route = createFileRoute("/browse")({
  validateSearch: browseSearchSchema,
  head: () => ({
    meta: [
      { title: "Browse Resources — SecondEd" },
      { name: "description", content: "Find affordable resources from students in your college community." },
      { property: "og:title", content: "Browse Resources — SecondEd" },
      { property: "og:description", content: "Search and filter affordable second-hand college resources near you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/browse" });
  const [searchInput, setSearchInput] = useState(search.q ?? "");
  const [loading, setLoading] = useState(false);

  const normalized = {
    q: search.q?.trim() ?? "",
    category: search.category ?? "all",
    condition: search.condition ?? "all",
    price: search.price ?? "all",
    location: search.location ?? "all",
    college: search.college ?? "all",
    sort: search.sort ?? "newest",
  };

  const allResources = useAllResources();
  const resourcesLoaded = useResourcesLoaded();
  const resultKey = JSON.stringify(normalized);
  useEffect(() => {
    setSearchInput(search.q ?? "");
  }, [search.q]);
  useEffect(() => {
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 240);
    return () => window.clearTimeout(timer);
  }, [resultKey]);

  const filteredResources = useMemo(() => {
    const query = normalized.q.toLocaleLowerCase();
    const matchesPrice = (price: number) => {
      if (normalized.price === "under-200") return price < 200;
      if (normalized.price === "200-500") return price >= 200 && price <= 500;
      if (normalized.price === "500-1000") return price > 500 && price <= 1000;
      if (normalized.price === "1000-2500") return price > 1000 && price <= 2500;
      if (normalized.price === "above-2500") return price > 2500;
      return true;
    };

    const matches = allResources.filter((resource) => {
      const searchable = [resource.title, resource.description, resource.category, resource.college].join(" ").toLocaleLowerCase();
      return (!query || searchable.includes(query))
        && (normalized.category === "all" || resource.category === normalized.category)
        && (normalized.condition === "all" || resource.condition === normalized.condition)
        && matchesPrice(resource.price)
        && (normalized.location === "all" || resource.location === normalized.location)
        && (normalized.college === "all" || resource.college === normalized.college);
    });

    if (normalized.sort === "price-low") return matches.sort((a, b) => a.price - b.price);
    if (normalized.sort === "price-high") return matches.sort((a, b) => b.price - a.price);
    return matches;
  }, [allResources, normalized.category, normalized.college, normalized.condition, normalized.location, normalized.price, normalized.q, normalized.sort]);

  const updateSearch = (updates: Partial<BrowseSearch>) => {
    void navigate({
      replace: true,
      search: (previous) => ({ ...previous, ...updates }),
    });
  };
  const updateFilter = (key: FilterKey, value: string) => updateSearch({ [key]: value === "all" ? undefined : value });
  const clearAll = () => {
    setSearchInput("");
    void navigate({ replace: true, search: {} });
  };
  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateSearch({ q: searchInput.trim() || undefined });
  };

  const activeFilters = [
    normalized.q ? { key: "q", label: `Search: ${normalized.q}` } : null,
    normalized.category !== "all" ? { key: "category", label: `Category: ${normalized.category}` } : null,
    normalized.condition !== "all" ? { key: "condition", label: `Condition: ${normalized.condition}` } : null,
    normalized.price !== "all" ? { key: "price", label: `Price: ${priceOptions.find((option) => option.value === normalized.price)?.label ?? normalized.price}` } : null,
    normalized.location !== "all" ? { key: "location", label: `Location: ${normalized.location}` } : null,
    normalized.college !== "all" ? { key: "college", label: `College: ${normalized.college}` } : null,
  ].filter((filter): filter is { key: string; label: string } => Boolean(filter));

  const filters = (
    <FilterControls
      values={normalized}
      onChange={updateFilter}
    />
  );

  return (
    <div className="page-container py-10 sm:py-14">
      <PageHeader
        eyebrow="Student marketplace"
        title="Browse Resources"
        description="Find affordable resources from students in your college community."
      />

      <form onSubmit={submitSearch} className="mt-7 flex gap-2 rounded-lg border border-border bg-card p-2 shadow-card">
        <label className="relative min-w-0 flex-1">
          <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <span className="sr-only">Search resources</span>
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="h-12 border-0 pl-12 text-base shadow-none focus-visible:ring-0"
            placeholder="Search resources..."
          />
        </label>
        <Button type="submit" size="lg" className="h-12 px-5"><Search /> <span className="hidden sm:inline">Search</span></Button>
      </form>

      <div className="mt-5 flex items-center gap-3 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex-1"><SlidersHorizontal /> Filters{activeFilters.length > 0 && <Badge className="ml-1 px-1.5">{activeFilters.length}</Badge>}</Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex w-[90%] max-w-sm flex-col overflow-y-auto">
            <SheetHeader className="text-left">
              <SheetTitle>Filter resources</SheetTitle>
              <SheetDescription>Narrow results by category, condition, price, location, or college.</SheetDescription>
            </SheetHeader>
            <div className="flex-1 py-6">{filters}</div>
            <SheetFooter className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={clearAll}>Clear all</Button>
              <SheetClose asChild><Button>Show {filteredResources.length} results</Button></SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <SortSelect value={normalized.sort} onChange={(value) => updateSearch({ sort: value === "newest" ? undefined : value })} />
      </div>

      {activeFilters.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2" aria-label="Active filters">
          {activeFilters.map((filter) => (
            <Badge key={filter.key} variant="secondary" className="gap-1.5 py-1.5 pl-3 pr-2 text-xs">
              {filter.label}
              <button
                type="button"
                aria-label={`Remove ${filter.label}`}
                className="rounded-sm p-0.5 transition-colors hover:bg-primary/10"
                onClick={() => {
                  if (filter.key === "q") setSearchInput("");
                  updateSearch({ [filter.key]: undefined });
                }}
              ><X className="size-3.5" /></button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" onClick={clearAll}>Clear All Filters</Button>
        </div>
      )}

      <div className="mt-7 grid items-start gap-7 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="surface-card sticky top-24 hidden p-5 lg:block">
          <div className="mb-5 flex items-center justify-between"><h2 className="font-display font-bold">Filters</h2>{activeFilters.length > 0 && <Button variant="ghost" size="sm" onClick={clearAll}>Clear all</Button>}</div>
          {filters}
        </aside>

        <section className="min-w-0" aria-live="polite">
          <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
            <p className="text-sm text-muted-foreground"><span className="font-bold text-foreground">{filteredResources.length}</span> {filteredResources.length === 1 ? "resource" : "resources"} found</p>
            <div className="hidden w-52 lg:block"><SortSelect value={normalized.sort} onChange={(value) => updateSearch({ sort: value === "newest" ? undefined : value })} /></div>
          </div>

          {loading || !resourcesLoaded ? (
            <ResourceGridSkeleton />
          ) : filteredResources.length > 0 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredResources.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}
            </div>
          ) : (
            <EmptyState className="mt-6 min-h-96" icon={Search} title="No resources found" description="Try changing your filters or search for something else." action={<Button onClick={clearAll}>Clear All Filters</Button>} />
          )}
        </section>
      </div>
    </div>
  );
}

function FilterControls({ values, onChange }: { values: Record<FilterKey, string>; onChange: (key: FilterKey, value: string) => void }) {
  return (
    <div className="grid gap-5">
      <FilterSelect label="Category" value={values.category} onChange={(value) => onChange("category", value)}>
        <SelectItem value="all">All Categories</SelectItem>
        {categories.map((category) => <SelectItem key={category.name} value={category.name}>{category.name}</SelectItem>)}
      </FilterSelect>
      <FilterSelect label="Condition" value={values.condition} onChange={(value) => onChange("condition", value)}>
        <SelectItem value="all">All Conditions</SelectItem>
        {conditions.map((condition) => <SelectItem key={condition} value={condition}>{condition}</SelectItem>)}
      </FilterSelect>
      <FilterSelect label="Price Range" value={values.price} onChange={(value) => onChange("price", value)}>
        <SelectItem value="all">All Prices</SelectItem>
        {priceOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
      </FilterSelect>
      <FilterSelect label="Location" value={values.location} onChange={(value) => onChange("location", value)}>
        <SelectItem value="all">All Locations</SelectItem>
        {locations.map((location) => <SelectItem key={location} value={location}>{location}</SelectItem>)}
      </FilterSelect>
      <FilterSelect label="College" value={values.college} onChange={(value) => onChange("college", value)}>
        <SelectItem value="all">All Colleges</SelectItem>
        {collegeOptions.map((college) => <SelectItem key={college} value={college}>{college}</SelectItem>)}
      </FilterSelect>
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  const id = `filter-${label.toLocaleLowerCase().replaceAll(" ", "-")}`;
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-xs font-bold uppercase text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-10 bg-background"><SelectValue /></SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  );
}

function SortSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-10 bg-card" aria-label="Sort resources"><SelectValue /></SelectTrigger>
      <SelectContent>{sortOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function ResourceGridSkeleton() {
  return (
    <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading resources">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="surface-card overflow-hidden p-4">
          <Skeleton className="aspect-[4/3] w-full" />
          <Skeleton className="mt-4 h-3 w-20" />
          <Skeleton className="mt-3 h-6 w-4/5" />
          <Skeleton className="mt-4 h-4 w-3/5" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <Skeleton className="mt-5 h-8 w-1/2" />
        </div>
      ))}
    </div>
  );
}