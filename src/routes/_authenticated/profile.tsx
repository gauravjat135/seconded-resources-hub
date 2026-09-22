import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, Camera, CheckCircle2, GraduationCap, Heart, LoaderCircle, Mail, MapPin, Package, Phone, Tag, Trash2 } from "lucide-react";
import { PageHeader, WorkspaceLayout } from "@/components/seconded/shared";
import { Field } from "@/components/seconded/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { getListingsForOwner, syncOwnerProfile, useAllResources } from "@/data/listing-store";
import { collegeChoices, locationOptions } from "@/data/marketplace";
import { useFavoriteIds } from "@/data/favorites-store";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getAccountProfile } from "@/data/account-profile";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "My Profile — SecondEd" }, { name: "description", content: "Manage your SecondEd student profile and see your marketplace activity." }, { property: "og:title", content: "My Profile — SecondEd" }, { property: "og:description", content: "Manage your SecondEd student profile and see your marketplace activity." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Profile,
});

type ProfileForm = { fullName: string; collegeName: string; phone: string; location: string; avatar: string };

const memberSinceFormatter = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" });

function initialsOf(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "SE";
}

function Profile() {
  const { user } = Route.useRouteContext();
  const resources = useAllResources();
  const favoriteIds = useFavoriteIds(user);
  const fileInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProfileForm>({ fullName: "", collegeName: "", phone: "", location: "", avatar: "" });
  const [email, setEmail] = useState("");
  const [memberSince, setMemberSince] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: row } = await supabase
        .from("profiles")
        .select("full_name,college_name,phone,location,avatar_url")
        .eq("id", data.user.id)
        .maybeSingle();
      const meta = data.user.user_metadata ?? {};
      const accountProfile = getAccountProfile(data.user);
      const customized = meta["seconded_profile_customized"] === true;
      setForm({
        fullName: customized ? row?.full_name ?? accountProfile.name : accountProfile.name,
        collegeName: customized ? row?.college_name ?? accountProfile.college : accountProfile.college,
        phone: row?.phone || accountProfile.phone,
        location: row?.location || accountProfile.location,
        avatar: row?.avatar_url || accountProfile.avatar,
      });
      setEmail(data.user.email ?? "");
      setMemberSince(accountProfile.memberSince || (data.user.created_at ? memberSinceFormatter.format(new Date(data.user.created_at)) : ""));
      setLoading(false);
    });
  }, []);

  function pickImage(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Choose an image file for your profile picture."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Profile pictures must be under 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setForm((value) => ({ ...value, avatar: String(reader.result) })); setError(""); setSaved(false); };
    reader.readAsDataURL(file);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    const fullName = form.fullName.trim();
    const collegeName = form.collegeName.trim();
    const phone = form.phone.trim();
    if (fullName.length < 2) { setError("Enter your full name."); return; }
    if (collegeName.length < 2) { setError("Choose your college."); return; }
    if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) { setError("Enter a valid phone number, or leave it empty."); return; }
    setSaving(true);
    const { data } = await supabase.auth.getUser();
    if (!data.user) { setSaving(false); setError("Your session has expired. Please log in again."); return; }
    const { error: updateError } = await supabase
      .from("profiles")
      .upsert({
        id: data.user.id,
        full_name: fullName,
        college_name: collegeName,
        email: data.user.email ?? "",
        phone,
        location: form.location,
        avatar_url: form.avatar,
      })
      .eq("id", data.user.id);
    if (updateError) { setSaving(false); setError("We couldn’t save your profile. Please try again."); return; }
    const { error: metaError } = await supabase.auth.updateUser({ data: { full_name: fullName, college_name: collegeName, phone, location: form.location, avatar_url: form.avatar, seconded_profile_customized: true } });
    setSaving(false);
    if (metaError) setError("We couldn’t save your profile. Please try again.");
    else {
      const updatedProfile = getAccountProfile({
        ...data.user,
        user_metadata: {
          ...data.user.user_metadata,
          full_name: fullName,
          college_name: collegeName,
          phone,
          location: form.location,
          avatar_url: form.avatar,
          seconded_profile_customized: true,
        },
      });
      await syncOwnerProfile(data.user, updatedProfile);
      setSaved(true);
    }
  }

  const mine = getListingsForOwner(resources, user);
  const sold = mine.filter((resource) => resource.status === "Sold").length;
  const stats = [
    { label: "Total Listings", value: mine.length, icon: Package },
    { label: "Items Sold", value: sold, icon: Tag },
    { label: "Favorites", value: favoriteIds.length, icon: Heart },
    { label: "Resources Saved", value: favoriteIds.length, icon: CheckCircle2 },
  ];

  return <WorkspaceLayout>
    <PageHeader eyebrow="Account" title="My Profile" description="Keep your student and college details current." />
    {loading ? <div className="mt-7 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]"><div className="surface-card grid place-items-center p-6"><Skeleton className="size-24 rounded-full"/><Skeleton className="mt-4 h-6 w-32"/><Skeleton className="mt-3 h-4 w-44"/></div><div className="surface-card grid gap-5 p-6"><Skeleton className="h-6 w-44"/><div className="grid gap-4 sm:grid-cols-2">{Array.from({length:4},(_,i)=><Skeleton key={i} className="h-16 w-full"/>)}</div><Skeleton className="ml-auto h-10 w-32"/></div></div> : <>
      <div className="mt-7 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="surface-card h-fit p-6 text-center">
          <div className="relative mx-auto size-24">
            {form.avatar ? <img src={form.avatar} alt={form.fullName} className="size-24 rounded-full border border-border object-cover" /> : <span className="grid size-24 place-items-center rounded-full bg-primary text-3xl font-bold text-primary-foreground">{initialsOf(form.fullName)}</span>}
            <button type="button" onClick={() => fileInput.current?.click()} aria-label="Change profile picture" className="focus-control absolute -bottom-1 -right-1 grid size-9 place-items-center rounded-full border border-border bg-card text-primary shadow-card transition-transform hover:scale-105"><Camera className="size-4" /></button>
          </div>
          {form.avatar && <Button type="button" variant="ghost" size="sm" className="mt-3 text-muted-foreground" onClick={() => setForm((value) => ({ ...value, avatar: "" }))}><Trash2 />Remove photo</Button>}
          <h2 className="mt-3 font-display text-xl font-bold">{form.fullName || "Student"}</h2>
          <p className="mt-1 flex items-center justify-center gap-2 break-all text-sm text-muted-foreground"><Mail className="size-4 shrink-0" />{email}</p>
          <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground"><GraduationCap className="size-4 shrink-0" />{form.collegeName}</p>
          {form.phone && <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground"><Phone className="size-4 shrink-0" />{form.phone}</p>}
          {form.location && <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground"><MapPin className="size-4 shrink-0" />{form.location}</p>}
          {memberSince && <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Member since {memberSince}</p>}
        </aside>
        <form className="surface-card grid gap-5 p-6" onSubmit={save}>
          <h2 className="font-display text-lg font-bold">Personal information</h2>
          {error && <p role="alert" className="flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 p-3 text-sm font-semibold text-destructive"><AlertCircle className="size-4 shrink-0" />{error}</p>}
          {saved && <p role="status" className="flex items-center gap-2 rounded-md border border-success/25 bg-success/10 p-3 text-sm font-semibold text-success"><CheckCircle2 className="size-4 shrink-0" />Profile updated successfully.</p>}
          <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(event) => pickImage(event.target.files?.[0])} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name"><Input value={form.fullName} maxLength={100} onChange={(event) => { setForm((value) => ({ ...value, fullName: event.target.value })); setSaved(false); }} /></Field>
            <Field label="Email Address" hint="Your email is used for login and can’t be changed here."><Input value={email} type="email" disabled /></Field>
            <Field label="College"><Select value={form.collegeName} onValueChange={(value) => { setForm((current) => ({ ...current, collegeName: value })); setSaved(false); }}><SelectTrigger aria-label="College"><SelectValue placeholder="Choose your college" /></SelectTrigger><SelectContent>{collegeChoices.map((college) => <SelectItem key={college} value={college}>{college}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Phone" hint="Optional — shared only when you contact a seller."><Input value={form.phone} type="tel" maxLength={20} placeholder="+91 98765 43210" onChange={(event) => { setForm((value) => ({ ...value, phone: event.target.value })); setSaved(false); }} /></Field>
            <Field label="Location"><Select value={form.location} onValueChange={(value) => { setForm((current) => ({ ...current, location: value })); setSaved(false); }}><SelectTrigger aria-label="Location"><SelectValue placeholder="Choose your location" /></SelectTrigger><SelectContent>{locationOptions.map((location) => <SelectItem key={location} value={location}>{location}</SelectItem>)}</SelectContent></Select></Field>
          </div>
          <div className="flex justify-end"><Button disabled={saving}>{saving ? <><LoaderCircle className="animate-spin" />Saving…</> : "Save Changes"}</Button></div>
        </form>
      </div>
      <section className="mt-10">
        <h2 className="font-display text-lg font-bold">Account Overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">Your marketplace activity at a glance.</p>
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => <div key={stat.label} className="surface-card interactive-card p-5">
            <span className="grid size-10 place-items-center rounded-md bg-secondary text-primary"><stat.icon className="size-5" /></span>
            <p className="mt-3 font-display text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>)}
        </div>
      </section>
    </>}
  </WorkspaceLayout>;
}
