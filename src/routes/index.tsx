import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  Backpack,
  Beaker,
  BookOpen,
  Calculator,
  Check,
  FileText,
  HandCoins,
  HeartHandshake,
  Laptop,
  MapPin,
  PackageOpen,
  Search,
  ShieldCheck,
  Shirt,
  Sparkles,
  Upload,
  UserRoundSearch,
  UsersRound,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResourceCard } from "@/components/seconded/shared";
import { categories, formatPrice, resources } from "@/data/marketplace";
import heroImage from "@/assets/seconded-campus-marketplace.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SecondEd Resources Hub — College Second-Hand Marketplace" },
      { name: "description", content: "Buy, sell, exchange, and discover affordable second-hand college resources from students near you." },
      { property: "og:title", content: "SecondEd Resources Hub" },
      { property: "og:description", content: "A student-powered marketplace for affordable second-hand college resources." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const categoryIcons = [BookOpen, FileText, Laptop, Calculator, Backpack, Beaker, Shirt, PackageOpen] as const;

const steps = [
  { number: "01", title: "List Your Resource", description: "Post your unused college resources in minutes.", icon: Upload },
  { number: "02", title: "Find Interested Students", description: "Students can discover resources that match their needs.", icon: UserRoundSearch },
  { number: "03", title: "Connect & Exchange", description: "Contact the seller and arrange a convenient exchange.", icon: HeartHandshake },
] as const;

const benefits = [
  { title: "Affordable", description: "Save money on college essentials.", icon: WalletCards },
  { title: "Student Focused", description: "Built specifically around the needs of college students.", icon: UsersRound },
  { title: "Sustainable", description: "Give useful resources a second life.", icon: HeartHandshake },
  { title: "Simple", description: "Find, list and exchange resources easily.", icon: Check },
] as const;

const heroStats = [
  { value: "400+", label: "Active listings" },
  { value: "8", label: "Categories" },
  { value: "3", label: "Campus locations" },
] as const;

function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const featuredResource = resources[0];

  return (
    <>
      {/* Hero */}
      <section className="hero-backdrop relative overflow-hidden border-b border-border bg-card/60">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="page-container relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(420px,1.05fr)] lg:py-24">
          <div className="relative z-10 max-w-2xl">
            <p className="eyebrow flex animate-fade-up items-center gap-2" style={{ animationDelay: "60ms" }}>
              <Sparkles className="size-4" /> The smarter student marketplace
            </p>
            <h1 className="mt-5 animate-fade-up font-display text-4xl font-extrabold leading-[1.06] tracking-tight text-foreground sm:text-5xl lg:text-6xl" style={{ animationDelay: "140ms" }}>
              Buy Smart. Sell Easy. <span className="text-gradient-brand">Reuse More.</span>
            </h1>
            <p className="mt-6 max-w-xl animate-fade-up text-lg leading-8 text-muted-foreground" style={{ animationDelay: "220ms" }}>
              A student-powered marketplace for affordable second-hand college resources — books, notes, calculators and more, right on your campus.
            </p>
            <div className="mt-8 flex animate-fade-up flex-col gap-3 sm:flex-row" style={{ animationDelay: "300ms" }}>
              <Button size="lg" className="shadow-brand transition-transform duration-200 hover:-translate-y-0.5" asChild><Link to="/browse">Browse Resources <ArrowRight /></Link></Button>
              <Button size="lg" variant="outline" className="bg-card/70 backdrop-blur transition-transform duration-200 hover:-translate-y-0.5" asChild><Link to="/sell">Sell an Item</Link></Button>
            </div>
            <div className="mt-8 flex animate-fade-up flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-muted-foreground" style={{ animationDelay: "380ms" }}>
              <span className="flex items-center gap-2"><Check className="size-4 text-success" /> Student-friendly prices</span>
              <span className="flex items-center gap-2"><MapPin className="size-4 text-primary" /> Local campus pickup</span>
              <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Verified student sellers</span>
            </div>
            <dl className="mt-10 grid max-w-md animate-fade-up grid-cols-3 gap-4 border-t border-border pt-6" style={{ animationDelay: "460ms" }}>
              {heroStats.map((stat) => (
                <div key={stat.label}>
                  <dt className="text-xs font-semibold text-muted-foreground">{stat.label}</dt>
                  <dd className="mt-1 font-display text-2xl font-extrabold text-foreground">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-2xl animate-fade-up lg:mx-0" style={{ animationDelay: "240ms" }}>
            <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/15 via-brand-violet/10 to-transparent blur-2xl" aria-hidden />
            <div className="relative aspect-[5/4] overflow-hidden rounded-2xl border border-border bg-muted shadow-card-hover ring-1 ring-foreground/5">
              <img src={heroImage} alt="Students exchanging useful college resources on campus" width={1600} height={1000} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-foreground/65 to-transparent" />
              <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 text-primary-foreground">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest">Campus marketplace</p>
                  <p className="mt-1 font-display text-xl font-extrabold">Useful finds, close to you</p>
                </div>
                <span className="hidden rounded-lg bg-card/95 px-3 py-2 text-sm font-bold text-primary shadow-card backdrop-blur sm:block">400+ listings</span>
              </div>
            </div>
            {featuredResource && (
              <div className="absolute -left-4 -top-6 hidden w-64 items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card-hover sm:flex lg:-left-8">
                <img src={featuredResource.image} alt="" className="size-14 rounded-lg object-cover" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-muted-foreground">Just listed</p>
                  <p className="truncate text-sm font-bold text-foreground">{featuredResource.title}</p>
                  <p className="text-sm font-extrabold text-primary">{formatPrice(featuredResource.price)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="page-container relative z-20 -mt-8 pb-4 sm:-mt-10">
        <div className="grid items-center gap-6 rounded-2xl border border-border bg-card p-6 shadow-card-hover md:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] md:p-8">
          <div>
            <p className="eyebrow">Search the marketplace</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold text-foreground">What are you looking for?</h2>
          </div>
          <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={(event) => { event.preventDefault(); const q=query.trim(); void navigate({to:"/browse",search:q?{q}:{}}); }}>
            <label className="relative">
              <span className="sr-only">Search books, calculators, notes</span>
              <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event)=>setQuery(event.target.value)} className="h-13 rounded-xl pl-12 text-base" placeholder="Search books, calculators, notes..." />
            </label>
            <Button size="lg" type="submit" className="h-13 shadow-brand">Browse Resources <ArrowRight /></Button>
          </form>
        </div>
      </section>

      {/* Categories */}
      <section className="page-container py-14 sm:py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">Explore categories</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground">Everything your semester needs</h2>
          <p className="mt-3 leading-7 text-muted-foreground">Browse useful resources shared by students across campus.</p>
        </div>
        <div className="mt-9 grid grid-cols-2 gap-3.5 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((category, index) => {
            const Icon = categoryIcons[index] ?? PackageOpen;
            return (
              <Link
                key={category.name}
                to="/browse"
                search={{ category: category.name }}
                className="group relative flex min-h-40 flex-col justify-between overflow-hidden rounded-xl border border-border bg-card p-4 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-card-hover"
              >
                <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-primary to-brand-violet transition-transform duration-300 group-hover:scale-x-100" aria-hidden />
                <span className="grid size-11 place-items-center rounded-lg bg-secondary text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-brand">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">{category.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    {category.count} listings
                    <ArrowRight className="size-3 -translate-x-1 text-primary opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured resources */}
      <section className="border-y border-border bg-card">
        <div className="page-container py-16 sm:py-24">
          <div className="flex items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="eyebrow">Featured resources</p>
              <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground">Great finds from students</h2>
              <p className="mt-3 leading-7 text-muted-foreground">Quality essentials at prices that make sense.</p>
            </div>
            <Button variant="outline" className="hidden shrink-0 sm:flex" asChild><Link to="/browse">View all <ArrowRight /></Link></Button>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resources.slice(0, 6).map((resource) => <ResourceCard key={resource.id} resource={resource} />)}
          </div>
          <Button variant="outline" className="mt-8 w-full sm:hidden" asChild><Link to="/browse">View all resources <ArrowRight /></Link></Button>
        </div>
      </section>

      {/* How it works */}
      <section className="page-container py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">How SecondEd works</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground">From unused to useful in three steps</h2>
        </div>
        <div className="relative mt-12 grid gap-6 md:grid-cols-3">
          <div className="absolute left-[16.66%] right-[16.66%] top-8 hidden border-t-2 border-dashed border-primary/25 md:block" aria-hidden />
          {steps.map(({ number, title, description, icon: Icon }) => (
            <article key={number} className="group relative rounded-xl border border-border bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
              <div className="flex items-center justify-between">
                <span className="grid size-16 place-items-center rounded-full border-4 border-background bg-primary font-display text-lg font-extrabold text-primary-foreground shadow-brand transition-transform duration-300 group-hover:scale-105">{number}</span>
                <Icon className="size-6 text-brand-violet" />
              </div>
              <h3 className="mt-6 font-display text-xl font-extrabold text-foreground">{title}</h3>
              <p className="mt-2 leading-7 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Why SecondEd */}
      <section className="border-y border-border bg-secondary/50">
        <div className="page-container py-16 sm:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">Why SecondEd</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground">Better for your budget and your campus</h2>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ title, description, icon: Icon }) => (
              <article key={title} className="group rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
                <span className="grid size-12 place-items-center rounded-lg bg-secondary text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground"><Icon className="size-5" /></span>
                <h3 className="mt-5 font-display text-lg font-extrabold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="page-container py-16 sm:py-24">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-14 text-primary-foreground shadow-brand sm:px-12 sm:py-16">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-dark/60 via-transparent to-brand-purple/40" aria-hidden />
          <div className="relative z-10 max-w-2xl">
            <p className="text-sm font-extrabold uppercase tracking-widest text-primary-foreground/90">Pass it forward</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Have something you no longer need?</h2>
            <p className="mt-4 max-w-xl leading-7 text-primary-foreground/85">Give your unused college resources a second life while helping another student save money.</p>
            <Button variant="secondary" size="lg" className="mt-8 shadow-card transition-transform duration-200 hover:-translate-y-0.5" asChild><Link to="/sell">Sell an Item <ArrowRight /></Link></Button>
          </div>
          <div className="absolute -bottom-12 -right-8 opacity-15"><HandCoins className="size-56" strokeWidth={1} /></div>
        </div>
      </section>
    </>
  );
}
