"use client";

import { useEffect, useState } from "react";
import {
  Megaphone,
  FileText,
  MessagesSquare,
  Pin,
  Plus,
  Send,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { useCommunicationStore, useAuthStore, Communication } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader, btnPrimary, cardClass, inputClass, EmptyState } from "@/components/dashboard/ui";
import { AppSelect } from "@/components/patterns";

const TABS = [
  { id: "ANNOUNCEMENT", label: "Announcements", icon: Megaphone },
  { id: "MEETING_MINUTES", label: "Meeting Minutes", icon: FileText },
  { id: "DISCUSSION", label: "Discussions", icon: MessagesSquare },
] as const;

function priorityBadge(priority: string) {
  if (priority === "URGENT") return "bg-red-50 text-red-600 border-red-100";
  if (priority === "HIGH") return "bg-amber-50 text-amber-600 border-amber-100";
  return "bg-slate-50 text-slate-600 border-slate-100";
}

function CommCard({
  item,
  onOpen,
}: {
  item: Communication;
  onOpen: (item: Communication) => void;
}) {
  return (
    <Card
      className={`${cardClass} hover:border-[var(--itools-navy)]/25 transition-colors cursor-pointer`}
      onClick={() => onOpen(item)}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {item.pinned && <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
              <h3 className="font-semibold text-[var(--itools-navy-deep)] text-sm truncate">{item.title}</h3>
            </div>
            <p className="text-sm text-[var(--itools-muted)] line-clamp-2">{item.content}</p>
          </div>
          {item.priority !== "NORMAL" && (
            <Badge variant="outline" className={`text-[9px] font-bold shrink-0 ${priorityBadge(item.priority)}`}>
              {item.priority}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-[var(--itools-muted)] pt-1">
          <span>{item.author?.name || "Unknown"}</span>
          <span>
            {item.type === "MEETING_MINUTES" && item.meetingDate
              ? new Date(item.meetingDate).toLocaleDateString()
              : new Date(item.createdAt).toLocaleDateString()}
            {item.replyCount ? ` · ${item.replyCount} replies` : ""}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateDialog({
  open,
  onClose,
  defaultType,
}: {
  open: boolean;
  onClose: () => void;
  defaultType: string;
}) {
  const { create } = useCommunicationStore();
  const [type, setType] = useState(defaultType);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [meetingDate, setMeetingDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setType(defaultType);
      setTitle("");
      setContent("");
      setPriority("NORMAL");
      setMeetingDate("");
      setError("");
    }
  }, [open, defaultType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await create({
        type,
        title,
        content,
        priority,
        ...(meetingDate ? { meetingDate: new Date(meetingDate).toISOString() } : {}),
      } as Communication & { title: string; content: string; type: string });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-2xl border-[var(--itools-border)] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[var(--itools-navy-deep)] font-bold">New communication</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Type</Label>
            <AppSelect
              value={type}
              onValueChange={setType}
              options={[
                { value: "ANNOUNCEMENT", label: "Announcement" },
                { value: "MEETING_MINUTES", label: "Meeting Minutes" },
                { value: "DISCUSSION", label: "Discussion" },
              ]}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[var(--itools-muted)]">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-[var(--itools-muted)]">Content</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={5} className={`${inputClass} resize-none`} />
          </div>
          {type === "MEETING_MINUTES" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--itools-muted)]">Meeting date</Label>
              <Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} className={inputClass} />
            </div>
          )}
          {type === "ANNOUNCEMENT" && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Priority</Label>
              <AppSelect
                value={priority}
                onValueChange={setPriority}
                options={[
                  { value: "NORMAL", label: "Normal" },
                  { value: "HIGH", label: "High" },
                  { value: "URGENT", label: "Urgent" },
                ]}
              />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className={btnPrimary}>
              {saving ? "Publishing..." : "Publish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ThreadView({
  item,
  onBack,
}: {
  item: Communication;
  onBack: () => void;
}) {
  const { addReply } = useCommunicationStore();
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await addReply(item.id, reply.trim());
      setReply("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Button variant="ghost" onClick={onBack} className="rounded-xl gap-2 text-[var(--itools-muted)] -ml-2 hover:text-[var(--itools-navy)]">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>
      <Card className={cardClass}>
        <CardContent className="p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--itools-navy-deep)] font-[family-name:var(--font-display)]">{item.title}</h2>
            <p className="text-xs text-[var(--itools-muted)] mt-1">
              Started by {item.author?.name} · {new Date(item.createdAt).toLocaleString()}
            </p>
          </div>
          <p className="text-sm text-[var(--itools-muted)] leading-relaxed whitespace-pre-wrap">{item.content}</p>
        </CardContent>
      </Card>
      <div className="space-y-3">
        <h3 className="text-xs font-medium text-[var(--itools-muted)]">
          Replies ({item.replies?.length || 0})
        </h3>
        {(item.replies || []).map((r) => (
          <Card key={r.id} className={`${cardClass} bg-[var(--itools-surface)]`}>
            <CardContent className="p-4 space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-[var(--itools-navy-deep)]">{r.author?.name}</span>
                <span className="text-[10px] text-[var(--itools-muted)]">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-[var(--itools-muted)] leading-relaxed">{r.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <form onSubmit={handleReply} className="flex gap-2">
        <Input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Write a reply..."
          className={`${inputClass} flex-1`}
        />
        <Button type="submit" disabled={sending || !reply.trim()} className={btnPrimary}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}

export default function CommunicationsPage() {
  const { user } = useAuthStore();
  const { items, selected, loading, fetchCommunications, fetchOne, clearSelected } = useCommunicationStore();
  const [activeTab, setActiveTab] = useState<string>("ANNOUNCEMENT");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailItem, setDetailItem] = useState<Communication | null>(null);

  const canPost = user?.role?.tier === "MASTER" || user?.role?.tier === "LEADERSHIP" || user?.role?.tier === "OPERATIONS";

  useEffect(() => {
    fetchCommunications(activeTab);
    clearSelected();
    setDetailItem(null);
  }, [activeTab, fetchCommunications, clearSelected]);

  const openItem = async (item: Communication) => {
    if (item.type === "DISCUSSION") {
      await fetchOne(item.id);
      setDetailItem(item);
    } else {
      setDetailItem(item);
    }
  };

  const thread = selected?.id === detailItem?.id ? selected : detailItem;

  if (thread?.type === "DISCUSSION" && selected) {
    return <ThreadView item={selected} onBack={() => { clearSelected(); setDetailItem(null); }} />;
  }

  if (detailItem && detailItem.type !== "DISCUSSION") {
    return (
      <div className="space-y-6 max-w-3xl">
        <Button variant="ghost" onClick={() => setDetailItem(null)} className="rounded-xl gap-2 text-[var(--itools-muted)] -ml-2 hover:text-[var(--itools-navy)]">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Card className={cardClass}>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge variant="outline" className="text-[9px] font-medium mb-2">
                  {detailItem.type === "MEETING_MINUTES" ? "Meeting minutes" : "Announcement"}
                </Badge>
                <h2 className="text-xl font-bold text-[var(--itools-navy-deep)] font-[family-name:var(--font-display)]">{detailItem.title}</h2>
                <p className="text-xs text-[var(--itools-muted)] mt-1">
                  {detailItem.author?.name}
                  {detailItem.meetingDate && ` · Meeting: ${new Date(detailItem.meetingDate).toLocaleDateString()}`}
                </p>
              </div>
              {detailItem.pinned && <Pin className="w-4 h-4 text-amber-500" />}
            </div>
            <p className="text-sm text-[var(--itools-muted)] leading-relaxed whitespace-pre-wrap">{detailItem.content}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Communications" description="Announcements, meeting minutes, and committee discussions.">
        {canPost && (
          <Button onClick={() => setCreateOpen(true)} className={btnPrimary}>
            <Plus className="w-4 h-4 mr-1.5" /> New post
          </Button>
        )}
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[var(--itools-surface)] border border-[var(--itools-border)] rounded-xl p-1 h-auto flex-wrap">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="rounded-lg text-xs font-medium data-[state=active]:bg-[var(--itools-navy)] data-[state=active]:text-white px-3 py-2 gap-1.5"
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className={`h-36 ${cardClass}`} />
                ))}
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                icon={tab.icon}
                title={`No ${tab.label.toLowerCase()} yet`}
                description="Posts from your committee will appear here."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <CommCard key={item.id} item={item} onOpen={openItem} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <CreateDialog open={createOpen} onClose={() => setCreateOpen(false)} defaultType={activeTab} />
    </div>
  );
}
