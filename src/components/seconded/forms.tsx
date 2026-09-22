import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { AlertCircle, Check, CheckCircle2, Eye, EyeOff, GraduationCap, LoaderCircle, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, isDemoAdminCredentials, startDemoAdminSession } from "@/lib/demo-admin";

export function Field({ label, children, hint, error }: { label: string; children: ReactNode; hint?: string | undefined; error?: string | undefined }) {
  return <label className="grid gap-2 text-sm font-bold text-foreground"><span>{label}</span>{children}{error ? <span className="flex items-center gap-1 text-xs font-semibold text-destructive"><AlertCircle className="size-3.5" />{error}</span> : hint ? <span className="text-xs font-normal leading-5 text-muted-foreground">{hint}</span> : null}</label>;
}

const emailSchema = z.string().trim().min(1, "Email address is required.").email("Enter a valid email address.").max(255, "Email is too long.");
const passwordSchema = z.string().min(8, "Use at least 8 characters.").max(72, "Use no more than 72 characters.").regex(/[A-Z]/, "Add at least one uppercase letter.").regex(/[a-z]/, "Add at least one lowercase letter.").regex(/[0-9]/, "Add at least one number.");
const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required.").max(100, "Full name is too long."),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password."),
  collegeName: z.string().trim().min(2, "College name is required.").max(150, "College name is too long."),
}).refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });
const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "Password is required.") });
type FormErrors = Partial<Record<"fullName" | "email" | "password" | "confirmPassword" | "collegeName", string>>;

function authMessage(message: string) {
  if (/invalid login credentials/i.test(message)) return "The email or password is incorrect.";
  if (/already registered|already been registered/i.test(message)) return "An account already exists for this email.";
  if (/password/i.test(message) && /weak|pwned|compromised/i.test(message)) return "Choose a stronger password that has not appeared in a data breach.";
  if (/rate limit/i.test(message)) return "Too many attempts. Please wait a moment and try again.";
  return "We couldn’t complete that request. Please try again.";
}

function PasswordInput({ name, placeholder, invalid, newPassword = false }: { name: string; placeholder: string; invalid?: boolean; newPassword?: boolean }) {
  const [visible, setVisible] = useState(false);
  return <div className="relative"><LockKeyhole className="absolute left-3 top-3 size-4 text-muted-foreground"/><Input name={name} required type={visible ? "text" : "password"} autoComplete={newPassword ? "new-password" : "current-password"} aria-invalid={invalid} className="px-9" placeholder={placeholder}/><Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 text-muted-foreground" onClick={() => setVisible((value) => !value)} aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff/> : <Eye/>}</Button></div>;
}

export function AuthForm({ register = false }: { register?: boolean }) {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [remember, setRemember] = useState(true);
  const [savedEmail, setSavedEmail] = useState("");

  useEffect(() => {
    if (!register) setSavedEmail(window.localStorage.getItem("seconded-remembered-email") ?? "");
  }, [register]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError("");
    setSuccess("");
    const form = new FormData(event.currentTarget);
    const values = {
      fullName: String(form.get("fullName") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      confirmPassword: String(form.get("confirmPassword") ?? ""),
      collegeName: String(form.get("collegeName") ?? ""),
    };
    const result = register ? registerSchema.safeParse(values) : loginSchema.safeParse(values);
    if (!result.success) {
      const nextErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      if (register) {
        const parsed = registerSchema.parse(values);
        const { data, error } = await supabase.auth.signUp({ email: parsed.email, password: parsed.password, options: { data: { full_name: parsed.fullName, college_name: parsed.collegeName } } });
        if (error) throw error;
        if (!data.user || !data.session) throw new Error("Account creation did not start a session.");
        const { error: profileError } = await supabase.from("profiles").insert({ id: data.user.id, full_name: parsed.fullName, college_name: parsed.collegeName });
        if (profileError) {
          await supabase.auth.signOut();
          throw profileError;
        }
        setSuccess("Account created. Opening your dashboard…");
      } else {
        const parsed = loginSchema.parse(values);
        if (isDemoAdminCredentials(parsed.email, parsed.password)) {
          startDemoAdminSession();
          setSuccess("Demo administrator access ready. Opening the admin dashboard…");
          await navigate({ to: "/admin", replace: true });
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({ email: parsed.email, password: parsed.password });
        if (error) throw error;
        if (remember) window.localStorage.setItem("seconded-remembered-email", parsed.email);
        else window.localStorage.removeItem("seconded-remembered-email");
        setSuccess("Welcome back. Opening your dashboard…");
      }
      await navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      setServerError(authMessage(error instanceof Error ? error.message : ""));
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event: React.ChangeEvent<HTMLFormElement>) {
    const name = event.target.name as keyof FormErrors;
    if (name && errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
    if (serverError) setServerError("");
  }

  function fillDemoCredentials(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.closest("form");
    if (!form) return;
    const email = form.elements.namedItem("email");
    const password = form.elements.namedItem("password");
    if (email instanceof HTMLInputElement) email.value = DEMO_ADMIN_EMAIL;
    if (password instanceof HTMLInputElement) password.value = DEMO_ADMIN_PASSWORD;
    setErrors({});
    setServerError("");
  }

  return <form className="grid gap-4" noValidate onChange={handleChange} onSubmit={handleSubmit}>
    {serverError && <div role="alert" className="flex gap-2 rounded-md border border-destructive/25 bg-destructive/10 p-3 text-sm font-semibold text-destructive"><AlertCircle className="mt-0.5 size-4 shrink-0"/>{serverError}</div>}
    {success && <div role="status" className="flex gap-2 rounded-md border border-success/25 bg-success/10 p-3 text-sm font-semibold text-success"><CheckCircle2 className="mt-0.5 size-4 shrink-0"/>{success}</div>}
    {register && <Field label="Full Name" error={errors.fullName}><div className="relative"><UserRound className="absolute left-3 top-3 size-4 text-muted-foreground"/><Input name="fullName" required autoComplete="name" aria-invalid={Boolean(errors.fullName)} className="pl-9" placeholder="Your full name"/></div></Field>}
    <Field label="Email Address" error={errors.email}><div className="relative"><Mail className="absolute left-3 top-3 size-4 text-muted-foreground"/><Input name="email" required type="email" autoComplete="email" defaultValue={savedEmail} aria-invalid={Boolean(errors.email)} className="pl-9" placeholder="you@college.edu"/></div></Field>
    <Field label="Password" error={errors.password} hint={register ? "8+ characters with uppercase, lowercase, and a number." : undefined}><PasswordInput name="password" newPassword={register} placeholder={register ? "Create a strong password" : "Enter your password"} invalid={Boolean(errors.password)}/></Field>
    {register && <Field label="Confirm Password" error={errors.confirmPassword}><PasswordInput name="confirmPassword" newPassword placeholder="Enter your password again" invalid={Boolean(errors.confirmPassword)}/></Field>}
    {register && <Field label="College Name" error={errors.collegeName}><div className="relative"><GraduationCap className="absolute left-3 top-3 size-4 text-muted-foreground"/><Input name="collegeName" required autoComplete="organization" aria-invalid={Boolean(errors.collegeName)} className="pl-9" placeholder="Your college or university"/></div></Field>}
    {!register && <><div className="flex items-center justify-between gap-4 text-sm"><label className="flex cursor-pointer items-center gap-2 text-muted-foreground"><Checkbox checked={remember} onCheckedChange={(checked) => setRemember(checked === true)}/>Remember me</label><Link to="/forgot-password" className="font-bold text-primary hover:text-brand-dark">Forgot Password?</Link></div><div className="rounded-md border border-primary/20 bg-secondary/60 p-4"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"><ShieldCheck className="size-4"/></span><div className="min-w-0 flex-1"><p className="text-sm font-extrabold text-foreground">Demo Admin</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Presentation access for the demonstration admin workspace.</p><dl className="mt-3 grid gap-1 text-xs"><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Email</dt><dd className="font-semibold text-foreground">{DEMO_ADMIN_EMAIL}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted-foreground">Password</dt><dd className="font-semibold text-foreground">{DEMO_ADMIN_PASSWORD}</dd></div></dl><Button type="button" variant="outline" size="sm" className="mt-3 w-full bg-card" onClick={fillDemoCredentials}>Use demo credentials</Button></div></div></div></>}
    <Button size="lg" type="submit" className="mt-1" disabled={loading}>{loading ? <><LoaderCircle className="animate-spin"/>{register ? "Creating account…" : "Logging in…"}</> : register ? <><Check/>Create account</> : "Login"}</Button>
    <p className="text-center text-sm text-muted-foreground">{register ? "Already have an account? " : "Don't have an account? "}<Link to={register ? "/login" : "/register"} className="font-bold text-primary hover:text-brand-dark">{register ? "Login" : "Create one"}</Link></p>
  </form>;
}
