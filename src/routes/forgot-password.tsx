import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, LoaderCircle, Mail } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/seconded/forms";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot Password — SecondEd" }, { name: "description", content: "Reset your SecondEd account password." }, { property: "og:title", content: "Forgot Password — SecondEd" }, { property: "og:description", content: "Request a secure password reset for your account." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    const parsed = z.string().email("Enter a valid email address.").safeParse(email);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Enter a valid email address."); return; }
    setLoading(true); setError("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${window.location.origin}/reset-password` });
    setLoading(false);
    if (resetError) { setError("We couldn’t send the reset email. Please wait a moment and try again."); return; }
    setSent(true);
  }
  return <div className="page-container grid min-h-[560px] place-items-center py-10 sm:min-h-[640px] sm:py-14"><div className="surface-card w-full max-w-md p-6 sm:p-8">{sent ? <div className="py-6 text-center"><CheckCircle2 className="mx-auto size-12 text-success"/><h1 className="mt-4 font-display text-2xl font-extrabold">Check your email</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">If an account exists for that address, you’ll receive a secure password reset link shortly.</p><Button className="mt-6" variant="outline" asChild><Link to="/login"><ArrowLeft/>Back to Login</Link></Button></div> : <><p className="eyebrow">Account recovery</p><h1 className="mt-2 font-display text-3xl font-extrabold">Forgot your password?</h1><p className="mb-7 mt-2 text-sm leading-6 text-muted-foreground">Enter your email and we’ll send you a secure link to choose a new password.</p><form className="grid gap-5" onSubmit={submit} noValidate><Field label="Email Address" error={error}><div className="relative"><Mail className="absolute left-3 top-3 size-4 text-muted-foreground"/><Input name="email" type="email" autoComplete="email" className="pl-9" placeholder="you@college.edu" aria-invalid={Boolean(error)}/></div></Field><Button size="lg" disabled={loading}>{loading ? <><LoaderCircle className="animate-spin"/>Sending link…</> : "Send reset link"}</Button><Link to="/login" className="mx-auto flex items-center gap-2 text-sm font-bold text-primary"><ArrowLeft className="size-4"/>Back to Login</Link></form></>}</div></div>;
}