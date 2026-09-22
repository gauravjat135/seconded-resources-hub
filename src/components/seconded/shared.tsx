import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Edit3,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Plus,
  Search,
  School,
  ShieldCheck,
  ShoppingBag,
  Tags,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPrice, getSellerProfile, isListingOwner, type ListingOwner, type Resource } from "@/data/marketplace";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/data/use-current-user";
import { toast } from "sonner";
import { toggleFavorite, useIsFavorite } from "@/data/favorites-store";
import { clearDemoAdminSession, DEMO_ADMIN_SESSION_EVENT, hasDemoAdminSession } from "@/lib/demo-admin";
import { ThemeToggle } from "@/components/seconded/theme-toggle";
import { ContactSellerDialog } from "@/components/seconded/contact-seller-dialog";

const publicLinks = [
  { label: "Home", to: "/" as const },
  { label: "Browse Resources", to: "/browse" as const },
  { label: "Sell an Item", to: "/sell" as const },
  { label: "Favorites", to: "/dashboard/favorites" as const },
];

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group flex min-w-0 items-center gap-2.5" aria-label="SecondEd home">
      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground shadow-brand">
        <BookOpen className="size-5" strokeWidth={2.4} />
      </span>
      <span className={cn("truncate font-display text-xl font-extrabold text-foreground transition-colors group-hover:text-brand-dark", compact && "hidden sm:inline")}>Second<span className="text-primary">Ed</span></span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [demoAdmin, setDemoAdmin] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    let active = true;
    const syncDemoAdmin = () => { const activeDemo = hasDemoAdminSession(); setDemoAdmin(activeDemo); setLoggedIn((current) => activeDemo || current); };
    syncDemoAdmin();
    void supabase.auth.getSession().then(({ data }) => { if (active) { setLoggedIn(hasDemoAdminSession() || Boolean(data.session?.user)); setCheckingSession(false); } });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(hasDemoAdminSession() || Boolean(session?.user));
      setCheckingSession(false);
    });
    window.addEventListener(DEMO_ADMIN_SESSION_EVENT, syncDemoAdmin);
    return () => { active = false; subscription.subscription.unsubscribe(); window.removeEventListener(DEMO_ADMIN_SESSION_EVENT, syncDemoAdmin); };
  }, []);

  async function handleLogout() {
    setSigningOut(true);
    await queryClient.cancelQueries();
    queryClient.clear();
    if (demoAdmin) clearDemoAdminSession();
    else await supabase.auth.signOut();
    setOpen(false);
    await navigate({ to: "/login", replace: true });
    setSigningOut(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 shadow-sm backdrop-blur-md">
      <div className="page-container grid h-17 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
        <Brand />
        <nav className="hidden items-center justify-center gap-1 lg:flex" aria-label="Primary navigation">
          {publicLinks.map((item) => (
            <Link key={item.to} to={item.to} activeOptions={{ exact: item.to === "/" }} className="nav-link" activeProps={{ className: "nav-link-active" }}>{item.label}</Link>
          ))}
        </nav>
        <div className="hidden min-w-[190px] items-center justify-end gap-2 lg:flex">
          <ThemeToggle />
          {checkingSession ? <span className="h-9 w-32 animate-pulse rounded-md bg-muted" aria-label="Checking account"/> : loggedIn ? (
            <>
               <Button variant="ghost" size="sm" asChild><Link to={demoAdmin ? "/admin" : "/dashboard"}><LayoutDashboard />{demoAdmin ? "Admin" : "Dashboard"}</Link></Button>
               {!demoAdmin && <Button variant="ghost" size="icon" asChild><Link to="/profile" aria-label="Profile"><UserRound /></Link></Button>}
              <Button variant="outline" size="sm" onClick={handleLogout} disabled={signingOut}><LogOut />{signingOut ? "Logging out…" : "Logout"}</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/login">Login</Link></Button>
              <Button size="sm" asChild><Link to="/register">Register</Link></Button>
            </>
          )}
        </div>
        <div className="flex items-center justify-end gap-1 lg:hidden">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setOpen((value) => !value)} aria-label={open ? "Close menu" : "Open menu"}>{open ? <X /> : <Menu />}</Button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-card shadow-card lg:hidden">
          <nav className="page-container grid gap-1 py-4" aria-label="Mobile navigation">
            {publicLinks.map((item) => <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="mobile-nav-link" activeProps={{ className: "mobile-nav-link-active" }}>{item.label}</Link>)}
            <ThemeToggle showLabel className="mobile-nav-link" />
            <div className="my-2 border-t border-border" />
            {loggedIn ? (
               <><Link to={demoAdmin ? "/admin" : "/dashboard"} className="mobile-nav-link" onClick={() => setOpen(false)}>{demoAdmin ? "Admin Dashboard" : "Dashboard"}</Link>{!demoAdmin && <Link to="/profile" className="mobile-nav-link" onClick={() => setOpen(false)}>Profile</Link>}<Button variant="ghost" className="justify-start" onClick={handleLogout} disabled={signingOut}><LogOut/>{signingOut ? "Logging out…" : "Logout"}</Button></>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1"><Button variant="outline" asChild><Link to="/login">Login</Link></Button><Button asChild><Link to="/register">Register</Link></Button></div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const exploreLinks = [
    ["Browse Resources", "/browse"], ["Sell an Item", "/sell"], ["Favorites", "/dashboard/favorites"], ["How It Works", "/how-it-works"],
  ] as const;
  const supportLinks = [
    ["About", "/about"], ["Contact", "/contact"], ["Privacy Policy", "/privacy"], ["Terms", "/terms"],
  ] as const;
  return (
    <footer className="border-t border-border bg-card">
      <div className="page-container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] lg:py-14">
        <div>
          <Brand />
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">College Second-Hand Resource Marketplace. Helping useful resources find their next student — affordably and sustainably.</p>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-primary" /> Student verified</span>
            <span className="flex items-center gap-1.5"><MapPin className="size-3.5 text-primary" /> Vasai · Nalasopara · Virar</span>
          </div>
        </div>
        <nav aria-label="Explore">
          <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Explore</p>
          <ul className="mt-4 grid gap-2.5 text-sm">{exploreLinks.map(([label, to]) => <li key={to}><Link to={to} className="text-muted-foreground transition-colors hover:text-primary">{label}</Link></li>)}</ul>
        </nav>
        <nav aria-label="Support">
          <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Support</p>
          <ul className="mt-4 grid gap-2.5 text-sm">{supportLinks.map(([label, to]) => <li key={to}><Link to={to} className="text-muted-foreground transition-colors hover:text-primary">{label}</Link></li>)}</ul>
        </nav>
      </div>
      <div className="border-t border-border bg-muted/30"><div className="page-container flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} SecondEd Resources Hub. Built for students.</span><span className="font-semibold">Buy Smart. Sell Easy. Reuse More.</span></div></div>
    </footer>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen flex-col"><SiteHeader /><main className="flex-1 page-enter">{children}</main><SiteFooter /></div>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) {
  return <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 border-b border-border pb-6 sm:gap-6"><div className="min-w-0">{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-foreground sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p></div>{action && <div className="shrink-0 self-end">{action}</div>}</div>;
}

export function EmptyState({ icon: Icon, title, description, action, className }: { icon: React.ElementType; title: string; description: string; action?: ReactNode; className?: string }) {
  return <div className={cn("grid min-h-72 place-items-center rounded-lg border border-dashed border-border bg-card px-6 py-12 text-center shadow-card", className)}><div className="max-w-md"><span className="mx-auto grid size-14 place-items-center rounded-full bg-secondary text-primary"><Icon className="size-6" /></span><h2 className="mt-5 font-display text-xl font-extrabold text-foreground">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>{action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}</div></div>;
}

export function ResourceCard({
  resource,
  onRemoveFavorite,
}: {
  resource: Resource;
  onRemoveFavorite?: () => void;
}) {
  const savings = Math.max(0, resource.originalPrice - resource.price);
  const seller = getSellerProfile(resource);
  const navigate = useNavigate();
  const [contactOpen, setContactOpen] = useState(false);
  const { currentUser } = useCurrentUser();
  const favorite = useIsFavorite(resource.id, currentUser);
  const owner = isListingOwner(resource, currentUser);
  return (
    <article className="group relative overflow-hidden rounded-lg border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-card-hover">
      <Link to="/resources/$resourceId" params={{ resourceId: resource.id }} className="absolute inset-0 z-10" aria-label={`View ${resource.title}`} />
      <div className="relative aspect-[4/3] overflow-hidden bg-muted"><img src={resource.image} alt={resource.title} width={1008} height={752} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]" /><div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-foreground/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" /><Badge className="absolute left-3 top-3 bg-card/95 text-foreground shadow-sm backdrop-blur hover:bg-card">{resource.condition}</Badge><Button variant="secondary" size="icon" className="absolute right-3 top-3 z-20 shadow-sm transition-transform duration-200 hover:scale-110 active:scale-90" aria-label={favorite ? "Remove from favorites" : "Add to favorites"} aria-pressed={favorite} onClick={(event) => { event.preventDefault(); event.stopPropagation(); if (!currentUser) { toast.info("Log in to save favorites"); void navigate({ to: "/login" }); return; } const saved = toggleFavorite(resource.id, currentUser); toast.success(saved ? "Saved to favorites" : "Removed from favorites", { description: resource.title }); }}><Heart className={cn("transition-all duration-200", favorite && "scale-110 fill-primary text-primary")} /></Button></div>
       <div className="p-4"><div className="flex items-center justify-between gap-3 text-xs text-muted-foreground"><span className="font-semibold text-primary">{resource.category}</span><span>{resource.posted}</span></div><h3 className="mt-2 truncate font-display text-lg font-bold text-foreground">{resource.title}</h3><div className="mt-2 grid gap-1 text-sm text-muted-foreground"><p className="flex items-center gap-1.5"><MapPin className="size-3.5 shrink-0" /><span>{seller.location}</span></p><p className="flex items-center gap-1.5"><School className="size-3.5 shrink-0" /><span className="truncate">{seller.college}</span></p><p className="flex items-center gap-1.5"><UserRound className="size-3.5 shrink-0" /><span>{seller.name}</span></p></div><div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-4"><div><div className="flex flex-wrap items-baseline gap-x-2"><span className="text-xl font-extrabold text-foreground">{formatPrice(resource.price)}</span>{savings>0&&<span className="text-xs text-muted-foreground line-through">{formatPrice(resource.originalPrice)}</span>}</div>{savings>0&&<p className="mt-1 text-xs font-bold text-success">Save {formatPrice(savings)}</p>}</div><span className="flex items-center text-sm font-semibold text-primary transition-transform duration-300 group-hover:translate-x-0.5">View <ChevronRight className="size-4" /></span></div><div className="relative z-20 mt-4 grid gap-2">{owner ? <><p className="text-center text-xs font-bold uppercase text-muted-foreground">Your Listing</p><Button variant="outline" className="w-full" asChild><Link to="/edit-listing/$listingId" params={{ listingId: resource.id }}><Edit3 /> Manage Listing</Link></Button></> : <Button className="w-full" onClick={(event) => { event.preventDefault(); event.stopPropagation(); if (!currentUser) { toast.info("Log in to contact this seller"); void navigate({ to: "/login" }); return; } setContactOpen(true); }} disabled={resource.status === "Sold"}><MessageCircle />{resource.status === "Sold" ? "Resource Sold" : "Contact Seller"}</Button>}{onRemoveFavorite && <Button variant="outline" className="w-full text-destructive" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onRemoveFavorite(); }}><Heart className="fill-current" /> Remove Favorite</Button>}</div></div>
      <ContactSellerDialog resource={resource} open={contactOpen} onOpenChange={setContactOpen} />
    </article>
  );
}


export function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  return <form className="grid gap-2 rounded-lg border border-border bg-card p-2 shadow-card sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={(event) => { event.preventDefault(); const q = query.trim(); void navigate({ to: "/browse", search: q ? { q } : {} }); }}><label className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><span className="sr-only">Search resources</span><Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 border-0 pl-10 shadow-none focus-visible:ring-0" placeholder="Search textbooks, calculators, notes..." /></label><Button size="lg" type="submit">Search resources <ArrowRight /></Button></form>;
}

const studentNav = [
  { label: "Dashboard", to: "/dashboard" as const, icon: LayoutDashboard },
  { label: "My Listings", to: "/my-listings" as const, icon: ShoppingBag },
  { label: "Favorites", to: "/dashboard/favorites" as const, icon: Heart },
  { label: "Messages", to: "/dashboard/messages" as const, icon: MessageCircle },
  { label: "Profile", to: "/profile" as const, icon: UserRound },
  { label: "Sell an Item", to: "/sell" as const, icon: Plus },
];
const adminNav = [
  { label: "Overview", to: "/admin" as const, icon: ShieldCheck },
  { label: "Users", to: "/admin/users" as const, icon: Users },
  { label: "Resources", to: "/admin/resources" as const, icon: BookOpen },
  { label: "Reports", to: "/admin/reports" as const, icon: MessageCircle },
  { label: "Categories", to: "/admin/categories" as const, icon: Tags },
];

export function WorkspaceLayout({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const items = admin ? adminNav : studentNav;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  async function logoutDemoAdmin() { await queryClient.cancelQueries(); queryClient.clear(); clearDemoAdminSession(); await navigate({ to: "/login", replace: true }); }
  async function logoutStudent() { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); await navigate({ to: "/login", replace: true }); }
  return <div className="page-container py-7 sm:py-10"><div className="grid gap-7 lg:grid-cols-[220px_minmax(0,1fr)]"><aside className="min-w-0"><div className="sticky top-24">{admin && <div className="mb-3 hidden items-center justify-between rounded-md border border-primary/20 bg-secondary/60 px-3 py-2 lg:flex"><span className="text-xs font-bold text-primary">Demo Admin</span><ShieldCheck className="size-4 text-primary"/></div>}<div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-card p-1.5 shadow-card sm:grid-cols-4 lg:flex lg:flex-col lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">{items.map(({ label, to, icon: Icon }) => <Link key={to} to={to} activeOptions={{ exact: true }} className="workspace-link min-w-0 flex-col justify-center gap-1 px-1 text-center text-[11px] sm:text-xs lg:flex-row lg:justify-start lg:px-3 lg:text-sm" activeProps={{ className: "workspace-link-active" }}><Icon />{label}</Link>)}{admin && <Button variant="ghost" className="workspace-link min-w-0 flex-col justify-center gap-1 px-1 text-[11px] sm:text-xs lg:flex-row lg:justify-start lg:px-3 lg:text-sm" onClick={logoutDemoAdmin}><LogOut/>Logout</Button>}{!admin && <Button variant="ghost" className="workspace-link min-w-0 flex-col justify-center gap-1 px-1 text-[11px] sm:text-xs lg:flex-row lg:justify-start lg:px-3 lg:text-sm" onClick={logoutStudent}><LogOut/>Logout</Button>}</div></div></aside><div className="min-w-0">{children}</div></div></div>;
}
