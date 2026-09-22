import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { ArrowLeft, MessageCircle, Search, Send } from "lucide-react";
import { EmptyState, PageHeader, WorkspaceLayout } from "@/components/seconded/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  conversationRole,
  formatMessageTime,
  markConversationRead,
  sendMessage,
  useConversations,
  type Conversation,
} from "@/data/messages-store";

const searchSchema = z.object({ c: z.string().optional() });

export const Route = createFileRoute("/_authenticated/dashboard/messages")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Messages — SecondEd" },
      { name: "description", content: "Chat with students about the resources you are buying or selling." },
      { property: "og:title", content: "Messages — SecondEd" },
      { property: "og:description", content: "Coordinate resource exchanges with other students on SecondEd." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MessagesPage,
});

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function lastOf(conversation: Conversation) {
  return conversation.messages[conversation.messages.length - 1];
}

function MessagesPage() {
  const { user } = Route.useRouteContext();
  const conversations = useConversations(user);
  const { c } = Route.useSearch();
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const requested = c ? conversations.find((item) => item.id === c) : undefined;
  const active = requested ?? (!c ? conversations[0] : undefined);
  const activeId = active?.id;

  useEffect(() => {
    if (activeId) markConversationRead(activeId, user);
  }, [activeId, user]);

  useEffect(() => {
    setDraft("");
  }, [activeId]);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [activeId, active?.messages.length]);

  function select(id: string) {
    void navigate({ to: "/dashboard/messages", search: { c: id } });
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!activeId || !draft.trim()) return;
    sendMessage(activeId, draft, user);
    setDraft("");
  }

  return (
    <WorkspaceLayout>
      <PageHeader
        eyebrow="Conversations"
        title="Messages"
        description="Coordinate pickup details with other students."
      />

      {conversations.length === 0 ? (
        <EmptyState className="mt-8" icon={MessageCircle} title="No conversations yet." description="When you contact a seller, your conversations will appear here." action={<Button asChild><Link to="/browse"><Search /> Browse Resources</Link></Button>} />
      ) : (
        <div className="surface-card mt-7 grid min-h-[420px] overflow-hidden lg:min-h-[560px] lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside
            className={`border-b border-border lg:border-b-0 lg:block lg:border-r ${c ? "hidden" : "block"}`}
          >
            <div className="border-b border-border p-4 font-display font-bold">Messages</div>
            <ul className="max-h-[520px] overflow-y-auto">
              {conversations.map((conversation) => {
                const last = lastOf(conversation);
                const isActive = conversation.id === activeId;
                const role = conversationRole(conversation, user);
                const person = role === "seller" ? conversation.buyerName : conversation.seller;
                const avatar = role === "seller" ? conversation.buyerAvatar : conversation.sellerAvatar;
                return (
                  <li key={conversation.id}>
                    <button
                      type="button"
                      onClick={() => select(conversation.id)}
                      className={`focus-control flex w-full gap-3 border-b border-border p-4 text-left transition-colors hover:bg-secondary/60 ${
                        isActive ? "bg-secondary" : ""
                      }`}
                    >
                      {avatar ? <img src={avatar} alt={person} className="size-10 shrink-0 rounded-full border border-border object-cover" /> : <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{initialsOf(person)}</span>}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate font-semibold">{person}</span>
                          <span className="shrink-0 text-[11px] text-muted-foreground">
                            {last ? formatMessageTime(last.at) : ""}
                          </span>
                        </span>
                        <span className="block truncate text-xs text-primary">{conversation.resourceTitle}</span>
                        <span className="mt-1 flex items-center gap-2">
                          <span className="truncate text-xs text-muted-foreground">
                            {last ? last.text : "No messages yet"}
                          </span>
                          {conversation.unreadFor === role ? (
                            <span className="size-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                          ) : null}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {active ? (
            <section className={`${c ? "flex" : "hidden lg:flex"} min-h-[420px] flex-col sm:min-h-[460px]`}>
              <header className="flex items-center gap-3 border-b border-border p-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Back to conversations"
                  onClick={() => void navigate({ to: "/dashboard/messages", search: {} })}
                >
                  <ArrowLeft />
                </Button>
                {(conversationRole(active, user) === "seller" ? active.buyerAvatar : active.sellerAvatar) ? <img src={conversationRole(active, user) === "seller" ? active.buyerAvatar : active.sellerAvatar} alt={conversationRole(active, user) === "seller" ? active.buyerName : active.seller} className="size-10 shrink-0 rounded-full border border-border object-cover" /> : <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{initialsOf(conversationRole(active, user) === "seller" ? active.buyerName : active.seller)}</span>}
                <div className="min-w-0">
                  <p className="truncate font-display font-bold">{conversationRole(active, user) === "seller" ? active.buyerName : active.seller}</p>
                  <Link
                    to="/resources/$resourceId"
                    params={{ resourceId: active.resourceId }}
                    className="block truncate text-xs text-primary hover:underline"
                  >
                    {active.resourceTitle}
                  </Link>
                </div>
              </header>

              <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-5">
                {active.messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Say hello to start the conversation.</p>
                ) : (
                  active.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex flex-col ${message.from === conversationRole(active, user) ? "items-end" : "items-start"}`}
                    >
                      <p
                        className={`max-w-[85%] rounded-md p-3 text-sm sm:max-w-sm ${
                          message.from === conversationRole(active, user) ? "bg-primary text-primary-foreground" : "bg-muted"
                        }`}
                      >
                        {message.text}
                      </p>
                      <span className="mt-1 text-[11px] text-muted-foreground">
                        {formatMessageTime(message.at)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <form
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 border-t border-border p-4"
                onSubmit={submit}
              >
                <Input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Write a message..."
                  aria-label="Message"
                />
                <Button type="submit" disabled={draft.trim().length === 0}>
                  <Send /> Send
                </Button>
              </form>
            </section>
          ) : null}
        </div>
      )}
    </WorkspaceLayout>
  );
}
