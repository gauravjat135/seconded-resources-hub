import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { ImagePlus, Lock, MapPin, RefreshCw, School, Trash2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { PageHeader, WorkspaceLayout } from "@/components/seconded/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  categoryOptions,
  collegeChoices,
  conditionOptions,
  formatPrice,
  locationOptions,
  isListingOwner,
} from "@/data/marketplace";
import { updateListing, useAllResources } from "@/data/listing-store";

export const Route = createFileRoute("/_authenticated/edit-listing/$listingId")({
  head: () => ({
    meta: [
      { title: "Edit Resource — SecondEd" },
      { name: "description", content: "Update the details of your SecondEd resource listing." },
      { property: "og:title", content: "Edit Resource — SecondEd" },
      { property: "og:description", content: "Keep your resource details accurate and up to date." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditListingPage,
});

const listingSchema = z.object({
  title: z.string().trim().min(3, "Enter a resource title of at least 3 characters").max(100, "Keep the title under 100 characters"),
  category: z.enum(categoryOptions, { message: "Select a category" }),
  description: z.string().trim().min(20, "Add a description of at least 20 characters").max(1000, "Keep the description under 1000 characters"),
  price: z.coerce.number({ message: "Enter a price" }).min(1, "Enter a price above ₹0").max(500000, "Enter a realistic price"),
  originalPrice: z.union([z.literal(""), z.coerce.number().min(0).max(500000)]).optional(),
  condition: z.enum(conditionOptions, { message: "Select a condition" }),
  location: z.enum(locationOptions, { message: "Select a location" }),
  college: z.enum(collegeChoices, { message: "Select a college" }),
  image: z.string().min(1, "Upload at least one photo"),
});

type FieldName = keyof z.infer<typeof listingSchema>;
type FormState = Record<FieldName, string>;

function FieldShell({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs font-semibold text-destructive">{error}</p>}
    </div>
  );
}

function NoticeCard({ title, body, action }: { title: string; body: string; action: React.ReactNode }) {
  return (
    <div className="surface-card mt-8 grid max-w-xl gap-3 p-8 text-center">
      <Lock className="mx-auto text-muted-foreground" />
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="text-sm text-muted-foreground">{body}</p>
      <div className="mt-2 flex justify-center">{action}</div>
    </div>
  );
}

function EditListingPage() {
  const { user } = Route.useRouteContext();
  const { listingId } = useParams({ from: "/_authenticated/edit-listing/$listingId" });
  const navigate = useNavigate();
  const resources = useAllResources();
  const fileInput = useRef<HTMLInputElement>(null);

  const resource = useMemo(
    () => resources.find((item) => item.id === listingId),
    [resources, listingId],
  );
  const owner = resource ? isListingOwner(resource, user) : false;

  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [saving, setSaving] = useState(false);

  const initial: FormState | null = resource
    ? {
        title: resource.title,
        category: resource.category,
        description: resource.description ?? "",
        price: String(resource.price),
        originalPrice: resource.originalPrice && resource.originalPrice > resource.price ? String(resource.originalPrice) : "",
        condition: resource.condition,
        location: resource.location ?? "",
        college: resource.college ?? "",
        image: resource.image,
      }
    : null;

  const values = form ?? initial;

  function setField(name: FieldName, value: string) {
    setForm((current) => ({ ...(current ?? (initial as FormState)), [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((current) => ({ ...current, image: "Choose an image file (JPG, PNG or WEBP)" }));
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setErrors((current) => ({ ...current, image: "Choose an image smaller than 3 MB" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setField("image", String(reader.result));
    reader.readAsDataURL(file);
  }

  if (!resource || !values) {
    return (
      <WorkspaceLayout>
        <PageHeader eyebrow="Listing settings" title="Edit Resource" description="Keep your resource details accurate and up to date." />
        <NoticeCard
          title="Listing not found"
          body="This listing may have been removed or the link is incorrect."
          action={
            <Button asChild>
              <Link to="/my-listings">Back to My Listings</Link>
            </Button>
          }
        />
      </WorkspaceLayout>
    );
  }

  if (!owner) {
    return (
      <WorkspaceLayout>
        <PageHeader eyebrow="Listing settings" title="Edit Resource" description="Keep your resource details accurate and up to date." />
        <NoticeCard
          title="You can't edit this listing"
          body="Only the student who posted a resource can edit it."
          action={
            <Button asChild>
              <Link to="/resources/$resourceId" params={{ resourceId: resource.id }}>View listing</Link>
            </Button>
          }
        />
      </WorkspaceLayout>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!resource || !values) return;
    const parsed = listingSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: Partial<Record<FieldName, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldName;
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      toast.error("Please complete the required fields");
      return;
    }

    setSaving(true);
    const data = parsed.data;
    const price = data.price;
    const originalPrice = typeof data.originalPrice === "number" && data.originalPrice > price ? data.originalPrice : price;
    const updated = await updateListing(resource.id, {
      title: data.title,
      category: data.category,
      description: data.description,
      price,
      originalPrice,
      condition: data.condition,
      location: data.location,
      college: data.college,
      image: data.image,
    }, user);
    if (!updated) {
      setSaving(false);
      toast.error("You can only edit your own listings.");
      return;
    }
    toast.success("Changes saved", { description: `${data.title} has been updated.` });
    void navigate({ to: "/resources/$resourceId", params: { resourceId: resource.id } });
    setSaving(false);
  }

  const previewPrice = Number(values.price) || 0;
  const previewOriginal = Number(values.originalPrice) || 0;
  const savings = previewOriginal > previewPrice ? previewOriginal - previewPrice : 0;

  return (
    <WorkspaceLayout>
      <PageHeader
        eyebrow="Listing settings"
        title="Edit Resource"
        description="Keep your resource details accurate and up to date."
      />

      <div className="mt-7 grid gap-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,.7fr)]">
        <form className="grid gap-6" onSubmit={handleSubmit} noValidate>
           <section className="surface-card grid gap-5 p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold">Resource details</h2>
            <FieldShell label="Resource Title" htmlFor="title" required error={errors.title}>
              <Input id="title" value={values.title} onChange={(event) => setField("title", event.target.value)} placeholder="e.g. Python Programming" />
            </FieldShell>

            <FieldShell label="Category" required error={errors.category}>
              <Select value={values.category} onValueChange={(value) => setField("category", value)}>
                <SelectTrigger aria-label="Category"><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldShell>

            <FieldShell
              label="Description"
              htmlFor="description"
              required
              hint="Mention edition, wear, included accessories and anything a buyer should know."
              error={errors.description}
            >
              <Textarea
                id="description"
                rows={5}
                value={values.description}
                onChange={(event) => setField("description", event.target.value)}
                placeholder="Describe the condition and what is included."
              />
            </FieldShell>
          </section>

           <section className="surface-card grid gap-5 p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold">Pricing</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldShell label="Price (₹)" htmlFor="price" required error={errors.price}>
                <Input id="price" type="number" min="0" step="1" value={values.price} onChange={(event) => setField("price", event.target.value)} placeholder="350" />
              </FieldShell>
              <FieldShell label="Original Price (₹)" htmlFor="originalPrice" hint="Optional — shows buyers how much they save." error={errors.originalPrice}>
                <Input id="originalPrice" type="number" min="0" step="1" value={values.originalPrice} onChange={(event) => setField("originalPrice", event.target.value)} placeholder="700" />
              </FieldShell>
            </div>
          </section>

           <section className="surface-card grid gap-5 p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold">Condition and place</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <FieldShell label="Condition" required error={errors.condition}>
                <Select value={values.condition} onValueChange={(value) => setField("condition", value)}>
                  <SelectTrigger aria-label="Condition"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldShell>
              <FieldShell label="Location" required error={errors.location}>
                <Select value={values.location} onValueChange={(value) => setField("location", value)}>
                  <SelectTrigger aria-label="Location"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldShell>
              <FieldShell label="College" required error={errors.college}>
                <Select value={values.college} onValueChange={(value) => setField("college", value)}>
                  <SelectTrigger aria-label="College"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {collegeChoices.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldShell>
            </div>
          </section>

           <section className="surface-card grid gap-5 p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold">Photos</h2>
            <FieldShell
              label="Upload Images"
              required
              hint="Use a clear, well-lit photo of the actual resource. JPG, PNG or WEBP up to 3 MB."
              error={errors.image}
            >
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label="Upload resource image"
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
              {values.image ? (
                <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
                  <img src={values.image} alt="Listing preview" className="aspect-[4/3] w-full rounded-md border border-border object-cover" />
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => fileInput.current?.click()}>
                      <RefreshCw /> Replace image
                    </Button>
                    <Button type="button" variant="ghost" className="text-destructive" onClick={() => setField("image", "")}>
                      <Trash2 /> Remove image
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  className={cn(
                     "focus-control grid min-h-36 w-full place-items-center rounded-md border border-dashed border-primary/40 bg-secondary/50 p-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-secondary",
                    errors.image && "border-destructive/60",
                  )}
                >
                  <span>
                    <ImagePlus className="mx-auto mb-2 text-primary" />
                    <span className="font-semibold text-foreground">Upload image</span>
                    <span className="mt-1 block text-xs">Click to choose a photo from your device</span>
                  </span>
                </button>
              )}
            </FieldShell>
          </section>

          <div className="flex flex-wrap justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link to="/resources/$resourceId" params={{ resourceId: resource.id }}>Cancel</Link>
            </Button>
            <Button type="submit" size="lg" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <p className="eyebrow">Live preview</p>
           <div className="surface-card mt-3 overflow-hidden">
            {values.image ? (
              <img src={values.image} alt="" className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="grid aspect-[4/3] w-full place-items-center bg-secondary/60 text-sm text-muted-foreground">
                Your photo appears here
              </div>
            )}
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{values.category || "Category"}</Badge>
                {values.condition && <Badge variant="outline">{values.condition} Condition</Badge>}
              </div>
              <h3 className="mt-3 font-display text-lg font-bold">{values.title || "Resource title"}</h3>
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <span className="text-2xl font-extrabold text-primary">{formatPrice(previewPrice)}</span>
                {previewOriginal > previewPrice && (
                  <span className="pb-1 text-sm text-muted-foreground line-through">{formatPrice(previewOriginal)}</span>
                )}
              </div>
              {savings > 0 && <p className="mt-2 text-sm font-bold text-success">Save {formatPrice(savings)}</p>}
              <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-3.5" /> {values.location || "Location"}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <School className="size-3.5" /> {values.college || "College"}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">This preview updates as you edit.</p>
        </aside>
      </div>
    </WorkspaceLayout>
  );
}
