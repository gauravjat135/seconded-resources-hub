import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Mail, MapPin, MessageCircle, Phone, School, Send, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice, getSellerProfile, isListingOwner, type Resource } from "@/data/marketplace";
import { startConversation } from "@/data/messages-store";
import { supabase } from "@/integrations/supabase/client";
import { getAccountProfile } from "@/data/account-profile";
import { getCurrentUser } from "@/data/use-current-user";

const DEFAULT_MESSAGE = "I'm interested in this resource. Is it still available?";

export function ContactSellerDialog({ resource, open, onOpenChange }: { resource: Resource; open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const seller = getSellerProfile(resource);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) setMessage(DEFAULT_MESSAGE);
  }, [open, resource.id]);

  async function send() {
    const text = message.trim();
    if (!text) return;
    setSending(true);
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      setSending(false);
      onOpenChange(false);
      toast.info("Log in to contact this seller");
      void navigate({ to: "/login" });
      return;
    }
    const data = { user: sessionUser };
    if (isListingOwner(resource, data.user)) {
      setSending(false);
      onOpenChange(false);
      toast.info("This is your listing");
      return;
    }
    const buyer = getAccountProfile(data.user);
    let conversationId: string;
    try {
      conversationId = await startConversation({
      buyerId: data.user.id,
      buyerEmail: data.user.email ?? "",
      buyerName: buyer.name,
      buyerAvatar: buyer.avatar,
      sellerId: resource.sellerId,
      sellerEmail: seller.email,
      seller: seller.name,
      sellerAvatar: seller.avatar,
      resourceId: resource.id,
      resourceTitle: resource.title,
        message: text,
      });
    } catch (error) {
      setSending(false);
      toast.error("Could not send your message", { description: (error as Error).message });
      return;
    }
    setSending(false);
    onOpenChange(false);
    toast.success("Message sent", { description: `Your conversation with ${seller.name} is ready.` });
    void navigate({ to: "/dashboard/messages", search: { c: conversationId } });
  }

  const mailHref = `mailto:${seller.email}?subject=${encodeURIComponent(`SecondEd: ${resource.title}`)}&body=${encodeURIComponent(message)}`;
  const phoneHref = `tel:${seller.phone.replace(/[^+\d]/g, "")}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><MessageCircle className="size-5 text-primary" /> Contact Seller</DialogTitle>
          <DialogDescription>Connect with the owner of this resource.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <section className="rounded-lg border border-border bg-background p-4" aria-label="Seller information">
            <div className="flex items-center gap-3">
              {seller.avatar ? <img src={seller.avatar} alt={seller.name} width={256} height={256} loading="lazy" className="size-14 rounded-full border border-border object-cover" /> : <span className="grid size-14 place-items-center rounded-full bg-secondary text-primary"><UserRound /></span>}
              <div className="min-w-0"><p className="text-xs font-bold uppercase text-muted-foreground">Seller</p><p className="truncate font-display font-bold text-foreground">{seller.name}</p><p className="text-xs text-muted-foreground">Member since {seller.memberSince}</p></div>
            </div>
            <dl className="mt-4 grid gap-2.5 text-sm">
              <div className="flex gap-2"><School className="mt-0.5 size-4 shrink-0 text-primary" /><div><dt className="text-xs text-muted-foreground">College</dt><dd className="font-medium text-foreground">{seller.college}</dd></div></div>
              <div className="flex gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" /><div><dt className="text-xs text-muted-foreground">Location</dt><dd className="font-medium text-foreground">{seller.location}</dd></div></div>
              <div className="flex gap-2"><Mail className="mt-0.5 size-4 shrink-0 text-primary" /><div className="min-w-0"><dt className="text-xs text-muted-foreground">Email Address</dt><dd className="break-all font-medium text-foreground">{seller.email || "Not provided"}</dd></div></div>
              <div className="flex gap-2"><Phone className="mt-0.5 size-4 shrink-0 text-primary" /><div><dt className="text-xs text-muted-foreground">Phone Number</dt><dd className="font-medium text-foreground">{seller.phone || "Not provided"}</dd></div></div>
            </dl>
          </section>

          <section className="rounded-lg border border-border bg-background p-4" aria-label="Resource information">
            <div className="flex gap-3">
              <img src={resource.image} alt={resource.title} width={1008} height={752} loading="lazy" className="size-20 rounded-md border border-border object-cover" />
              <div className="min-w-0"><p className="text-xs font-bold uppercase text-muted-foreground">Resource</p><p className="font-display font-bold text-foreground">{resource.title}</p><p className="mt-1 font-extrabold text-primary">{formatPrice(resource.price)}</p><p className="mt-1 text-xs text-muted-foreground">Condition: {resource.condition}</p></div>
            </div>
          </section>
        </div>

        <div className="grid gap-2">
          <Label htmlFor={`contact-message-${resource.id}`}>Message</Label>
          <Textarea id={`contact-message-${resource.id}`} value={message} onChange={(event) => setMessage(event.target.value)} rows={4} className="min-h-28 resize-y" />
        </div>

        <DialogFooter className="grid grid-cols-2 sm:grid-cols-4 sm:justify-stretch">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="outline" asChild disabled={!seller.email}><a href={mailHref}><Mail /> Email Seller</a></Button>
          <Button variant="outline" asChild disabled={!seller.phone}><a href={phoneHref}><Phone /> Call Seller</a></Button>
          <Button onClick={send} disabled={sending || !message.trim()}><Send /> {sending ? "Sending…" : "Send Message"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}