import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveAsset } from "./asset-map";
import { normalizeAccountEmail, type AccountIdentity } from "./account-profile";

// Backend-backed conversations and messages.

export type ChatMessage = { id: string; from: "buyer" | "seller"; text: string; at: number };
export type Conversation = {
  id: string;
  buyerId: string;
  buyerEmail: string;
  buyerName: string;
  buyerAvatar?: string;
  sellerId: string;
  sellerEmail: string;
  seller: string;
  sellerAvatar?: string;
  resourceId: string;
  resourceTitle: string;
  unreadFor: "buyer" | "seller" | null;
  messages: ChatMessage[];
};

type ConversationRow = {
  id: string;
  buyer_id: string | null;
  buyer_email: string;
  buyer_name: string;
  buyer_avatar: string | null;
  seller_id: string | null;
  seller_email: string;
  seller_name: string;
  seller_avatar: string | null;
  resource_id: string;
  resource_title: string;
  unread_for: string | null;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_role: string;
  body: string;
  created_at: string;
};

let conversations: Conversation[] = [];
let snapshot: Conversation[] = conversations;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const serverSnapshot: Conversation[] = [];

function emit() {
  snapshot = conversations;
  listeners.forEach((listener) => listener());
}

async function load() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.user) {
    conversations = [];
    emit();
    return;
  }
  const [{ data: conversationRows, error }, { data: messageRows }] = await Promise.all([
    supabase.from("conversations").select("*").order("updated_at", { ascending: false }),
    supabase.from("messages").select("*").order("created_at", { ascending: true }),
  ]);
  if (error) {
    console.error("Failed to load conversations", error.message);
    return;
  }
  const grouped = new Map<string, ChatMessage[]>();
  for (const row of (messageRows ?? []) as MessageRow[]) {
    const list = grouped.get(row.conversation_id) ?? [];
    list.push({
      id: row.id,
      from: row.sender_role === "seller" ? "seller" : "buyer",
      text: row.body,
      at: new Date(row.created_at).getTime(),
    });
    grouped.set(row.conversation_id, list);
  }
  conversations = ((conversationRows ?? []) as ConversationRow[]).map((row) => ({
    id: row.id,
    buyerId: row.buyer_id ?? row.buyer_email,
    buyerEmail: row.buyer_email,
    buyerName: row.buyer_name,
    ...(row.buyer_avatar ? { buyerAvatar: resolveAsset(row.buyer_avatar) } : {}),
    sellerId: row.seller_id ?? row.seller_email,
    sellerEmail: row.seller_email,
    seller: row.seller_name,
    ...(row.seller_avatar ? { sellerAvatar: resolveAsset(row.seller_avatar) } : {}),
    resourceId: row.resource_id,
    resourceTitle: row.resource_title,
    unreadFor: row.unread_for === "buyer" || row.unread_for === "seller" ? row.unread_for : null,
    messages: grouped.get(row.id) ?? [],
  }));
  emit();
}

function ensureLoaded() {
  if (typeof window === "undefined" || loading) return;
  loading = load();
}

function subscribe(listener: () => void) {
  ensureLoaded();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function matches(conversation: Conversation, owner: AccountIdentity | null | undefined) {
  const email = normalizeAccountEmail(owner?.email);
  return Boolean(
    (owner?.id && (conversation.buyerId === owner.id || conversation.sellerId === owner.id)) ||
      (email &&
        (normalizeAccountEmail(conversation.buyerEmail) === email ||
          normalizeAccountEmail(conversation.sellerEmail) === email)),
  );
}

export function conversationRole(conversation: Conversation, owner: AccountIdentity | null | undefined): "buyer" | "seller" {
  const email = normalizeAccountEmail(owner?.email);
  return (owner?.id && conversation.sellerId === owner.id) ||
    (email && normalizeAccountEmail(conversation.sellerEmail) === email)
    ? "seller"
    : "buyer";
}

export function useConversations(owner: AccountIdentity | null | undefined): Conversation[] {
  const all = useSyncExternalStore(subscribe, () => snapshot, () => serverSnapshot);
  return all.filter((conversation) => matches(conversation, owner));
}

export async function startConversation(input: {
  buyerId: string;
  buyerEmail: string;
  buyerName: string;
  buyerAvatar?: string;
  sellerId: string;
  sellerEmail: string;
  seller: string;
  sellerAvatar?: string;
  resourceId: string;
  resourceTitle: string;
  message?: string;
}): Promise<string> {
  const buyerEmail = normalizeAccountEmail(input.buyerEmail);
  const sellerEmail = normalizeAccountEmail(input.sellerEmail);
  const text = input.message?.trim() ?? "";

  const { data: existingRows } = await supabase
    .from("conversations")
    .select("id")
    .eq("buyer_email", buyerEmail)
    .eq("seller_email", sellerEmail)
    .eq("resource_id", input.resourceId)
    .limit(1);

  let conversationId = (existingRows as { id: string }[] | null)?.[0]?.id ?? "";

  if (!conversationId) {
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        buyer_id: input.buyerId,
        buyer_email: buyerEmail,
        buyer_name: input.buyerName,
        buyer_avatar: input.buyerAvatar ?? null,
        seller_email: sellerEmail,
        seller_name: input.seller,
        seller_avatar: input.sellerAvatar ?? null,
        resource_id: input.resourceId,
        resource_title: input.resourceTitle,
        unread_for: "seller",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    conversationId = (data as { id: string }).id;
  }

  if (text) {
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_role: "buyer",
      sender_email: buyerEmail,
      body: text,
    });
    if (error) throw new Error(error.message);
    await supabase.from("conversations").update({ unread_for: "seller" }).eq("id", conversationId);
  }

  loading = load();
  await loading;
  return conversationId;
}

export function sendMessage(conversationId: string, text: string, owner: AccountIdentity | null | undefined) {
  const trimmed = text.trim();
  const conversation = conversations.find((item) => item.id === conversationId);
  if (!trimmed || !conversation || !matches(conversation, owner)) return false;
  const role = conversationRole(conversation, owner);
  const optimistic: ChatMessage = { id: `local-${Date.now()}`, from: role, text: trimmed, at: Date.now() };
  conversations = conversations.map((item) =>
    item.id === conversationId
      ? { ...item, unreadFor: role === "buyer" ? ("seller" as const) : ("buyer" as const), messages: [...item.messages, optimistic] }
      : item,
  );
  emit();
  void (async () => {
    const senderEmail = normalizeAccountEmail(owner?.email);
    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_role: role, sender_email: senderEmail, body: trimmed });
    if (error) {
      console.error("Failed to send message", error.message);
      return;
    }
    await supabase
      .from("conversations")
      .update({ unread_for: role === "buyer" ? "seller" : "buyer" })
      .eq("id", conversationId);
    loading = load();
  })();
  return true;
}

export function markConversationRead(conversationId: string, owner: AccountIdentity | null | undefined) {
  const conversation = conversations.find((item) => item.id === conversationId);
  if (!conversation || !matches(conversation, owner)) return;
  const role = conversationRole(conversation, owner);
  if (conversation.unreadFor !== role) return;
  conversations = conversations.map((item) => (item.id === conversationId ? { ...item, unreadFor: null } : item));
  emit();
  void supabase.from("conversations").update({ unread_for: null }).eq("id", conversationId);
}

export function formatMessageTime(at: number): string {
  const minutes = Math.round((Date.now() - at) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(at).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "INITIAL_SESSION") {
      loading = load();
    }
  });
}
