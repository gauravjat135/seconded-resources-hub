import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ImagePlus, MapPin, RefreshCw, School, Trash2 } from "lucide-react";
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
  type Resource,
} from "@/data/marketplace";
import { addListing, createListingId } from "@/data/listing-store";
import { supabase } from "@/integrations/supabase/client";
import { getAccountProfile } from "@/data/account-profile";

export const Route = createFileRoute("/_authenticated/sell")({
  head: () => ({
    meta: [
      { title: "Sell Your Resource — SecondEd" },
      { name: "description", content: "Give your unused college resources a second life." },
      { property: "og:title", content: "Sell Your Resource — SecondEd" },
      { property: "og:description", content: "List a college resource in minutes on SecondEd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SellPage,
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

const emptyForm: FormState = {
  title: "",
  category: "",
  description: "",
  price: "",
  originalPrice: "",
  condition: "",
  location: "",
  college: "",
  image: "",
};

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

function SellPage() {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [publishing, setPublishing] = useState(false);

  function setField(name: FieldName, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = listingSchema.safeParse(form);
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

    setPublishing(true);
    const data = parsed.data;
    const price = data.price;
    const originalPrice = typeof data.originalPrice === "number" && data.originalPrice > price ? data.originalPrice : price;
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user?.email) {
      setPublishing(false);
      toast.error("Your session has expired. Please log in again.");
      return;
    }
    const accountProfile = getAccountProfile(user);
    const listing: Resource = {
      id: createListingId(data.title),
      title: data.title,
      category: data.category,
      price,
      originalPrice,
      condition: data.condition,
      location: data.location,
      college: data.college,
      seller: accountProfile.name,
      sellerId: user.id,
      ownerEmail: user.email.toLowerCase(),
      sellerProfile: {
        id: user.id,
        name: accountProfile.name,
        email: user.email,
        phone: accountProfile.phone,
        college: accountProfile.college,
        location: accountProfile.location,
        avatar: accountProfile.avatar,
        memberSince: accountProfile.memberSince,
      },
      posted: "Just now",
      image: data.image,
      status: "Available",
      description: data.description,
    };
    try {
      await addListing(listing, user);
    } catch (error) {
      setPublishing(false);
      toast.error("Could not publish your listing", { description: (error as Error).message });
      return;
    }
    toast.success("Resource published", { description: `${listing.title} is now live on SecondEd.` });
    void navigate({ to: "/resources/$resourceId", params: { resourceId: listing.id } });
    setPublishing(false);
  }

  const previewPrice = Number(form.price) || 0;
  const previewOriginal = Number(form.originalPrice) || 0;
  const savings = previewOriginal > previewPrice ? previewOriginal - previewPrice : 0;

  return (
    <WorkspaceLayout>
      <PageHeader
        eyebrow="New listing"
        title="Sell Your Resource"
        description="Give your unused college resources a second life."
      />

      <div className="mt-7 grid gap-8 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,.7fr)]">
        <form className="grid gap-6" onSubmit={handleSubmit} noValidate>
          <section className="surface-card grid gap-5 p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold">Resource details</h2>
            <FieldShell label="Resource Title" htmlFor="title" required error={errors.title}>
              <Input
                id="title"
                value={form.title}
                onChange={(event) => setField("title", event.target.value)}
                placeholder="e.g. Python Programming"
              />
            </FieldShell>

            <FieldShell label="Category" required error={errors.category}>
              <Select value={form.category} onValueChange={(value) => setField("category", value)}>
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
                value={form.description}
                onChange={(event) => setField("description", event.target.value)}
                placeholder="Describe the condition and what is included."
              />
            </FieldShell>
          </section>

          <section className="surface-card grid gap-5 p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold">Pricing</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldShell label="Price (₹)" htmlFor="price" required error={errors.price}>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="1"
                  value={form.price}
                  onChange={(event) => setField("price", event.target.value)}
                  placeholder="350"
                />
              </FieldShell>
              <FieldShell label="Original Price (₹)" htmlFor="originalPrice" hint="Optional — shows buyers how much they save." error={errors.originalPrice}>
                <Input
                  id="originalPrice"
                  type="number"
                  min="0"
                  step="1"
                  value={form.originalPrice}
                  onChange={(event) => setField("originalPrice", event.target.value)}
                  placeholder="700"
                />
              </FieldShell>
            </div>
          </section>

          <section className="surface-card grid gap-5 p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold">Condition and place</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <FieldShell label="Condition" required error={errors.condition}>
                <Select value={form.condition} onValueChange={(value) => setField("condition", value)}>
                  <SelectTrigger aria-label="Condition"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {conditionOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldShell>
              <FieldShell label="Location" required error={errors.location}>
                <Select value={form.location} onValueChange={(value) => setField("location", value)}>
                  <SelectTrigger aria-label="Location"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FieldShell>
              <FieldShell label="College" required error={errors.college}>
                <Select value={form.college} onValueChange={(value) => setField("college", value)}>
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
              {form.image ? (
                <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
                  <img src={form.image} alt="Listing preview" className="aspect-[4/3] w-full rounded-md border border-border object-cover" />
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
              <Link to="/my-listings">Cancel</Link>
            </Button>
            <Button type="submit" size="lg" disabled={publishing}>
              {publishing ? "Publishing..." : "Publish Resource"}
            </Button>
          </div>
        </form>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <p className="eyebrow">Live preview</p>
           <div className="surface-card mt-3 overflow-hidden">
            {form.image ? (
              <img src={form.image} alt="" className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="grid aspect-[4/3] w-full place-items-center bg-secondary/60 text-sm text-muted-foreground">
                Your photo appears here
              </div>
            )}
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{form.category || "Category"}</Badge>
                {form.condition && <Badge variant="outline">{form.condition} Condition</Badge>}
              </div>
              <h3 className="mt-3 font-display text-lg font-bold">{form.title || "Resource title"}</h3>
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <span className="text-2xl font-extrabold text-primary">{formatPrice(previewPrice)}</span>
                {previewOriginal > previewPrice && (
                  <span className="pb-1 text-sm text-muted-foreground line-through">{formatPrice(previewOriginal)}</span>
                )}
              </div>
              {savings > 0 && <p className="mt-2 text-sm font-bold text-success">Save {formatPrice(savings)}</p>}
              <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-3.5" /> {form.location || "Location"}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <School className="size-3.5" /> {form.college || "College"}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">This preview updates as you fill in the form.</p>
        </aside>
      </div>
    </WorkspaceLayout>
  );
}
