import type { User } from "@supabase/supabase-js";
import { demoSellerProfiles, type SellerProfile } from "./marketplace";

export type AccountIdentity = { id?: string | null; email?: string | null };

export function normalizeAccountEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export function getDemoProfile(email: string | null | undefined): SellerProfile | undefined {
  const normalized = normalizeAccountEmail(email);
  return demoSellerProfiles.find((profile) => normalizeAccountEmail(profile.email) === normalized);
}

export function getAccountProfile(user: User): SellerProfile {
  const metadata = user.user_metadata ?? {};
  const demo = getDemoProfile(user.email);
  const customized = metadata["seconded_profile_customized"] === true;
  if (demo && !customized) return { ...demo, id: user.id, email: user.email ?? demo.email };

  const createdAt = new Date(user.created_at);
  return {
    id: user.id,
    name: String(metadata["full_name"] ?? demo?.name ?? user.email?.split("@")[0] ?? "SecondEd Student"),
    email: user.email ?? demo?.email ?? "",
    phone: String(metadata["phone"] ?? demo?.phone ?? ""),
    college: (String(metadata["college_name"] ?? demo?.college ?? "Other")) as SellerProfile["college"],
    location: (String(metadata["location"] ?? demo?.location ?? "Vasai")) as SellerProfile["location"],
    avatar: String(metadata["avatar_url"] ?? demo?.avatar ?? ""),
    memberSince: Number.isNaN(createdAt.getTime())
      ? demo?.memberSince ?? "2026"
      : createdAt.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
  };
}