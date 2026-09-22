import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveAsset } from "./asset-map";
import { isListingOwner, type ListingOwner, type Resource, type SellerProfile } from "./marketplace";

// Backend-backed listing store.
// Listings live in the `listings` table; this module keeps a local snapshot so
// the existing screens can keep reading data synchronously.

type ListingRow = {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price: number;
  category: string;
  condition: string;
  location: string;
  college: string;
  image: string;
  status: string;
  owner_id: string | null;
  owner_email: string;
  posted: string;
  seller_name: string;
  seller_phone: string;
  seller_college: string;
  seller_location: string;
  seller_avatar: string;
  seller_member_since: string;
};

let snapshot: Resource[] = [];
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const serverSnapshot: Resource[] = [];

function emit() {
  listeners.forEach((listener) => listener());
}

function toResource(row: ListingRow): Resource {
  const sellerProfile: SellerProfile = {
    id: row.owner_id ?? row.owner_email,
    name: row.seller_name,
    email: row.owner_email,
    phone: row.seller_phone,
    college: row.seller_college as Resource["college"],
    location: row.seller_location as Resource["location"],
    avatar: resolveAsset(row.seller_avatar),
    memberSince: row.seller_member_since,
  };
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    price: row.price,
    originalPrice: row.original_price,
    condition: row.condition,
    location: row.location as Resource["location"],
    college: row.college as Resource["college"],
    seller: row.seller_name,
    sellerId: row.owner_id ?? row.owner_email,
    ownerEmail: row.owner_email,
    sellerProfile,
    posted: row.posted,
    image: resolveAsset(row.image),
    status: row.status as Resource["status"],
    description: row.description,
  };
}

function toRow(resource: Resource, owner: ListingOwner): Omit<ListingRow, "owner_id"> & { owner_id: string | null } {
  const profile = resource.sellerProfile;
  return {
    id: resource.id,
    title: resource.title,
    description: resource.description,
    price: resource.price,
    original_price: resource.originalPrice,
    category: resource.category,
    condition: resource.condition,
    location: resource.location,
    college: resource.college,
    image: resource.image,
    status: resource.status,
    owner_id: owner.id ?? null,
    owner_email: (owner.email ?? "").trim().toLowerCase(),
    posted: resource.posted || "Just now",
    seller_name: profile?.name ?? resource.seller,
    seller_phone: profile?.phone ?? "",
    seller_college: profile?.college ?? resource.college,
    seller_location: profile?.location ?? resource.location,
    seller_avatar: profile?.avatar ?? "",
    seller_member_since: profile?.memberSince ?? "2026",
  };
}

export async function loadResources(force = false): Promise<Resource[]> {
  if (!force && loading) {
    await loading;
    return snapshot;
  }
  loading = (async () => {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Failed to load listings", error.message);
      return;
    }
    snapshot = (data as ListingRow[]).map(toResource);
    loaded = true;
    emit();
  })();
  await loading;
  return snapshot;
}

function ensureLoaded() {
  if (typeof window === "undefined" || loaded || loading) return;
  void loadResources();
}

function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAllResources(): Resource[] {
  ensureLoaded();
  return snapshot;
}

export function useAllResources(): Resource[] {
  return useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot);
}

export function useResourcesLoaded(): boolean {
  return useSyncExternalStore(subscribe, () => loaded, () => false);
}

export function findResource(id: string): Resource | undefined {
  return getAllResources().find((resource) => resource.id === id);
}

export function getListingsForOwner(resources: Resource[], owner: ListingOwner | null | undefined): Resource[] {
  return resources.filter((resource) => isListingOwner(resource, owner));
}

export function createListingId(title: string): string {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "listing";
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

export async function addListing(listing: Resource, owner: ListingOwner): Promise<Resource> {
  if (!owner.id || !owner.email) throw new Error("A signed-in owner is required to create a listing");
  const row = toRow(listing, owner);
  const { data, error } = await supabase.from("listings").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  const created = toResource(data as ListingRow);
  snapshot = [created, ...snapshot.filter((item) => item.id !== created.id)];
  emit();
  return created;
}

export async function syncOwnerProfile(owner: ListingOwner, profile: SellerProfile): Promise<void> {
  const ownerEmail = (owner.email ?? "").trim().toLowerCase();
  if (!ownerEmail) return;
  const { error } = await supabase
    .from("listings")
    .update({
      seller_name: profile.name,
      seller_phone: profile.phone,
      seller_college: profile.college,
      seller_location: profile.location,
      seller_avatar: profile.avatar,
      seller_member_since: profile.memberSince,
      ...(owner.id ? { owner_id: owner.id } : {}),
    })
    .eq("owner_email", ownerEmail);
  if (error) {
    console.error("Failed to sync seller profile", error.message);
    return;
  }
  await loadResources(true);
}

export async function updateListing(
  id: string,
  patch: Partial<Resource>,
  actor: ListingOwner | "admin" | null,
): Promise<boolean> {
  const existing = snapshot.find((resource) => resource.id === id);
  if (!existing || (actor !== "admin" && !isListingOwner(existing, actor))) return false;
  const update: Record<string, unknown> = {};
  if (patch.title !== undefined) update["title"] = patch.title;
  if (patch.description !== undefined) update["description"] = patch.description;
  if (patch.price !== undefined) update["price"] = patch.price;
  if (patch.originalPrice !== undefined) update["original_price"] = patch.originalPrice;
  if (patch.category !== undefined) update["category"] = patch.category;
  if (patch.condition !== undefined) update["condition"] = patch.condition;
  if (patch.location !== undefined) update["location"] = patch.location;
  if (patch.college !== undefined) update["college"] = patch.college;
  if (patch.image !== undefined) update["image"] = patch.image;
  if (patch.status !== undefined) update["status"] = patch.status;
  if (Object.keys(update).length === 0) return true;
  const { error } = await supabase.from("listings").update(update as never).eq("id", id);
  if (error) {
    console.error("Failed to update listing", error.message);
    return false;
  }
  snapshot = snapshot.map((resource) => (resource.id === id ? { ...resource, ...patch } : resource));
  emit();
  return true;
}

export async function removeListing(id: string, actor: ListingOwner | "admin" | null): Promise<boolean> {
  const existing = snapshot.find((resource) => resource.id === id);
  if (!existing || (actor !== "admin" && !isListingOwner(existing, actor))) return false;
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) {
    console.error("Failed to delete listing", error.message);
    return false;
  }
  snapshot = snapshot.filter((resource) => resource.id !== id);
  emit();
  return true;
}

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT") void loadResources(true);
  });
}
