import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2, LoaderCircle, LockKeyhole } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/seconded/forms";
import { supabase } from "@/integrations/supabase/client";

const resetSchema = z.object({ password: z.string().min(8, "Use at least 8 characters.").max(72).regex(/[A-Z]/, "Add an uppercase letter.").regex(/[a-z]/, "Add a lowercase letter.").regex(/[0-9]/, "Add a number."), confirmPassword: z.string() }).refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });
export const Route = createFileRoute("/reset-password")({ head: () => ({ meta: [{ title: "Reset Password — SecondEd" }, { name: "description", content: "Choose a new password for your SecondEd account." }, { property: "og:title", content: "Reset Password — SecondEd" }, { property: "og:description", content: "Securely update your SecondEd account password." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }), component: ResetPasswordPage });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false); const [invalid, setInvalid] = useState(false); const [loading, setLoading] = useState(false); const [success, setSuccess] = useState(false); const [errors, setErrors] = useState<{password?: string; confirmPassword?: string}>({}); const [serverError, setServerError] = useState("");
  useEffect(() => {
    const recoveryHash = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("type") === "recovery";
    supabase.auth.getSession().then(({ data }) => { setReady(true); setInvalid(!recoveryHash && !data.session); });
    const { data } = supabase.auth.onAuthStateChange((event) => { if (event === "PASSWORD_RECOVERY") { setInvalid(false); setReady(true); } });
    return () => data.subscription.unsubscribe();
  }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const result = resetSchema.safeParse({password:String(form.get("password")??""),confirmPassword:String(form.get("confirmPassword")??"")});
    if(!result.success){const next:{password?:string;confirmPassword?:string}={};for(const issue of result.error.issues){const key=issue.path[0] as "password"|"confirmPassword";if(!next[key])next[key]=issue.message}setErrors(next);return}
    setLoading(true);setErrors({});setServerError("");const {error}=await supabase.auth.updateUser({password:result.data.password});setLoading(false);if(error){setServerError("We couldn’t update your password. Request a new reset link and try again.");return}setSuccess(true);window.setTimeout(()=>navigate({to:"/dashboard",replace:true}),1200);
  }
  return <div className="page-container grid min-h-[560px] place-items-center py-10 sm:min-h-[640px] sm:py-14"><div className="surface-card w-full max-w-md p-6 sm:p-8">{!ready ? <div className="flex justify-center py-14"><LoaderCircle className="size-8 animate-spin text-primary"/></div> : invalid ? <div className="py-6 text-center"><AlertCircle className="mx-auto size-12 text-destructive"/><h1 className="mt-4 font-display text-2xl font-extrabold">Reset link unavailable</h1><p className="mt-2 text-sm text-muted-foreground">This link is invalid or has expired. Request a new one to continue.</p><Button className="mt-6" asChild><Link to="/forgot-password">Request a new link</Link></Button></div> : success ? <div className="py-6 text-center"><CheckCircle2 className="mx-auto size-12 text-success"/><h1 className="mt-4 font-display text-2xl font-extrabold">Password updated</h1><p className="mt-2 text-sm text-muted-foreground">Your new password is ready. Opening your dashboard…</p></div> : <><p className="eyebrow">Secure your account</p><h1 className="mt-2 font-display text-3xl font-extrabold">Choose a new password</h1><p className="mb-7 mt-2 text-sm text-muted-foreground">Use a strong password you haven’t used elsewhere.</p>{serverError&&<p className="mb-4 rounded-md border border-destructive/25 bg-destructive/10 p-3 text-sm font-semibold text-destructive">{serverError}</p>}<form className="grid gap-5" onSubmit={submit}><Field label="New Password" error={errors.password} hint="8+ characters with uppercase, lowercase, and a number."><div className="relative"><LockKeyhole className="absolute left-3 top-3 size-4 text-muted-foreground"/><Input name="password" type="password" autoComplete="new-password" className="pl-9"/></div></Field><Field label="Confirm New Password" error={errors.confirmPassword}><div className="relative"><LockKeyhole className="absolute left-3 top-3 size-4 text-muted-foreground"/><Input name="confirmPassword" type="password" autoComplete="new-password" className="pl-9"/></div></Field><Button size="lg" disabled={loading}>{loading?<><LoaderCircle className="animate-spin"/>Updating password…</>:"Update password"}</Button></form></>}</div></div>;
}