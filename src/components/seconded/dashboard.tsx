import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, BookOpen, CheckCircle2, Eye, Heart, ListPlus, MessageCircle, Pencil, Search, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, WorkspaceLayout } from "./shared";
import { formatPrice } from "@/data/marketplace";
import { getListingsForOwner, useAllResources } from "@/data/listing-store";
import { useFavoriteIds } from "@/data/favorites-store";
import { getAccountProfile } from "@/data/account-profile";
import type { User } from "@supabase/supabase-js";

export function Metric({label,value,detail,icon:Icon}:{label:string;value:string;detail:string;icon:React.ElementType}){return <div className="surface-card interactive-card p-5"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-sm font-semibold text-muted-foreground">{label}</p><p className="mt-2 font-display text-3xl font-extrabold">{value}</p></div><span className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-primary"><Icon className="size-5"/></span></div><p className="mt-3 text-xs leading-5 text-muted-foreground">{detail}</p></div>}

const quickActions=[
  {title:"Sell an Item",description:"List something you no longer need.",to:"/sell",icon:ListPlus},
  {title:"Browse Resources",description:"Find affordable student resources.",to:"/browse",icon:Search},
  {title:"View Favorites",description:"Revisit the resources you saved.",to:"/dashboard/favorites",icon:Heart},
  {title:"View Messages",description:"Catch up with interested students.",to:"/dashboard/messages",icon:MessageCircle},
] as const;

export function StudentDashboard({user}:{user:User|null}){
  const[name,setName]=useState("there");
  useEffect(()=>{if(user){const first=getAccountProfile(user).name.trim().split(/\s+/)[0];setName(first||"there")}},[user]);
  const all=useAllResources();
  const favoriteIds=useFavoriteIds(user);
  const mine=getListingsForOwner(all,user);
  const active=mine.filter((r)=>r.status==="Available").length;
  const sold=mine.filter((r)=>r.status==="Sold").length;
  const recent=mine.slice(0,4);
  return <WorkspaceLayout>
    <PageHeader eyebrow="Student space" title={`Welcome back, ${name}`} description="Here's what's happening with your resources." action={<Button asChild><Link to="/sell"><ListPlus/>Sell an Item</Link></Button>}/>
    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Total Listings" value={String(mine.length)} detail="Everything you have listed" icon={BookOpen}/>
      <Metric label="Active Listings" value={String(active)} detail="Visible to other students" icon={Tags}/>
      <Metric label="Sold Items" value={String(sold)} detail="Completed exchanges" icon={CheckCircle2}/>
      <Metric label="Favorites" value={String(favoriteIds.length)} detail="Resources you saved" icon={Heart}/>
    </div>
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Recent Listings</h2>
        <Button variant="ghost" size="sm" asChild><Link to="/my-listings">View all<ArrowRight/></Link></Button>
      </div>
      <div className="surface-card mt-4 divide-y divide-border overflow-hidden">
        {recent.length===0?(
          <div className="p-8 text-center">
            <p className="font-semibold">No listings yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Sell your first resource to see it here.</p>
            <Button className="mt-4" asChild><Link to="/sell">Sell an Item</Link></Button>
          </div>
        ):recent.map((r)=>(
          <div key={r.id} className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-4 p-4 transition-colors hover:bg-muted/35 md:grid-cols-[64px_minmax(0,1fr)_auto_auto]">
            <img src={r.image} alt={r.title} className="size-16 shrink-0 rounded-md border border-border object-cover"/>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{r.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{formatPrice(r.price)} · {r.condition} · {r.posted}</p>
            </div>
            <Badge variant={r.status==="Available"?"secondary":"outline"} className="shrink-0 gap-1">
              {r.status==="Available"?<BadgeCheck className="size-3.5 text-success"/>:<CheckCircle2 className="size-3.5"/>}
              {r.status}
            </Badge>
            <div className="col-span-2 flex shrink-0 gap-2 md:col-span-1">
              <Button variant="outline" size="sm" asChild><Link to="/resources/$resourceId" params={{resourceId:r.id}}><Eye/>View</Link></Button>
              <Button variant="outline" size="sm" asChild><Link to="/edit-listing/$listingId" params={{listingId:r.id}}><Pencil/>Edit</Link></Button>
            </div>
          </div>
        ))}
      </div>
    </section>
    <section className="mt-8">
      <h2 className="font-display text-xl font-bold">Quick Actions</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((a)=>(
          <Link key={a.title} to={a.to} className="surface-card interactive-card group p-5">
            <span className="grid size-10 place-items-center rounded-md bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><a.icon className="size-5"/></span>
            <p className="mt-4 font-display font-bold">{a.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
          </Link>
        ))}
      </div>
    </section>
  </WorkspaceLayout>
}
