"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuthStore, Role } from "@/lib/store";
import {
  Committee,
  MEMBER_FILTER_TABS,
  committeeCategory,
  committeeShortName,
} from "@/lib/committees";
import { AddMemberDialog } from "@/components/members/add-member-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  Search,
  UserPlus,
  RotateCw,
  Pencil,
  Mail,
  Briefcase,
  Trash2,
} from "lucide-react";
import { PageHeader, EmptyState, cardClass, btnPrimary, inputClass } from "@/components/dashboard/ui";

interface Member {
  id: string;
  name: string;
  email: string;
  roleId?: string;
  createdAt: string;
  role: {
    name: string;
    tier: string;
    roleKind?: string;
  };
  committee?: {
    id: string;
    name: string;
    shortName?: string;
    category?: string;
    year: string;
    status: string;
  };
}

export default function MembersPage() {
  const { user } = useAuthStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("tier-desc");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRoleId, setEditRoleId] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const canManage = user?.role?.tier === "MASTER" || user?.role?.tier === "LEADERSHIP";
  const canPickExecutive = user?.role?.tier === "MASTER";
  const canCreateUnit =
    user?.role?.tier === "MASTER" ||
    (user?.role?.tier === "LEADERSHIP" &&
      (user.committee?.name === "Silver Oak University IEEE Student Branch" ||
        user.committee?.name === "Executive Chairs"));

  const loadCommittees = useCallback(async () => {
    try {
      const res = await apiFetch<{ data: Committee[] }>("/committees");
      setCommittees(Array.isArray(res.data) ? res.data : []);
    } catch {
      setCommittees([]);
    }
  }, []);

  const loadRoles = async () => {
    try {
      const res = await apiFetch<{ data: Role[] }>("/roles");
      const all = res.data;
      if (user?.role?.tier === "LEADERSHIP" && user.committeeId) {
        setRoles(
          all.filter(
            (r) =>
              !r.committeeId ||
              r.committeeId === user.committeeId ||
              r.committee?.id === user.committeeId
          )
        );
      } else {
        setRoles(all);
      }
    } catch {
      setRoles([]);
    }
  };

  const loadMembers = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { data } = await apiFetch<{ data: Member[] }>("/users");
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setMembers([]);
      setLoadError(err instanceof Error ? err.message : "Could not load members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    loadCommittees();
  }, [loadCommittees]);

  useEffect(() => {
    if ((addOpen || editOpen) && canManage) {
      loadRoles();
    }
  }, [addOpen, editOpen, canManage, user?.committeeId, user?.role?.tier]);

  const openEdit = async (member: Member) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditEmail(member.email);
    setEditRoleId(member.roleId || "");
    setFormError(null);
    setEditOpen(true);
    await loadRoles();
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editName.trim() || !editEmail.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      const body: Record<string, string> = {
        name: editName.trim(),
        email: editEmail.trim(),
      };
      if (editRoleId) body.roleId = editRoleId;
      await apiFetch(`/users/${editingMember.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setEditOpen(false);
      setEditingMember(null);
      await loadMembers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not update member");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (member: Member) => {
    if (!confirm(`Remove ${member.name} from the roster?`)) return;
    setFormError(null);
    try {
      await apiFetch(`/users/${member.id}`, { method: "DELETE" });
      await loadMembers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not remove member");
    }
  };

  const getTierBadgeDetails = (tier: string) => {
    switch (tier) {
      case "MASTER":
        return { label: "FACULTY", className: "bg-red-50 text-red-600 border-red-100" };
      case "LEADERSHIP":
        return { label: "CORE", className: "bg-blue-50 text-blue-600 border-blue-100" };
      case "OPERATIONS":
        return { label: "EXECUTIVE", className: "bg-emerald-50 text-emerald-600 border-emerald-100" };
      default:
        return { label: "MEMBER", className: "bg-slate-50 text-slate-600 border-slate-100" };
    }
  };

  const getTierPriority = (tier: string) => {
    switch (tier) {
      case "MASTER":
        return 4;
      case "LEADERSHIP":
        return 3;
      case "OPERATIONS":
        return 2;
      default:
        return 1;
    }
  };

  const getCategoryBadge = (member: Member) => {
    if (!member.committee) return null;
    const cat = committeeCategory(member.committee as Committee);
    const labels: Record<string, string> = {
      EXECUTIVE: "Executive",
      STUDENT_BRANCH: "Student Branch",
      SOCIETY: "Society",
      AFFINITY_GROUP: "Affinity Group",
      GROUP: "Group",
    };
    return labels[cat] || cat;
  };

  const searchedMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      (m.role?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  const classifiedMembers = useMemo(() => {
    const tab = MEMBER_FILTER_TABS.find((t) => t.id === activeTab);
    if (!tab || activeTab === "all") return searchedMembers;
    if (!("categories" in tab)) return searchedMembers;
    return searchedMembers.filter((member) => {
      if (!member.committee) return false;
      const cat = committeeCategory(member.committee as Committee);
      return tab.categories.includes(cat);
    });
  }, [searchedMembers, activeTab]);

  const sortedMembers = [...classifiedMembers].sort((a, b) => {
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    if (sortBy === "name-desc") return b.name.localeCompare(a.name);
    if (sortBy === "tier-desc") {
      const priorityA = getTierPriority(a.role?.tier || "");
      const priorityB = getTierPriority(b.role?.tier || "");
      if (priorityB !== priorityA) return priorityB - priorityA;
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "date-desc")
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === "date-asc")
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return 0;
  });

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: members.length };
    for (const tab of MEMBER_FILTER_TABS) {
      if (tab.id === "all" || !("categories" in tab)) continue;
      counts[tab.id] = members.filter((m) => {
        if (!m.committee) return false;
        return tab.categories.includes(committeeCategory(m.committee as Committee));
      }).length;
    }
    return counts;
  }, [members]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-52" />
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 bg-white border border-slate-200/50 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Members"
        description={`IEEE Student Branch executive roster · ${members.length} members`}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={loadMembers}
          className="h-9 w-9 rounded-xl border-[var(--itools-border)]"
        >
          <RotateCw className="w-4 h-4 text-[var(--itools-muted)]" />
        </Button>
        {canManage && (
          <Button onClick={() => setAddOpen(true)} className={btnPrimary}>
            <UserPlus className="w-4 h-4 mr-1.5" /> Add member
          </Button>
        )}
      </PageHeader>

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
          <span>{loadError}</span>
          <Button variant="outline" size="sm" className="rounded-lg shrink-0" onClick={loadMembers}>
            Retry
          </Button>
        </div>
      )}

      {formError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {MEMBER_FILTER_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tabCounts[tab.id] ?? 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-lg transition-colors shrink-0 ${
                isActive
                  ? "bg-[var(--itools-navy)] text-white"
                  : "bg-white text-[var(--itools-muted)] border border-[var(--itools-border)] hover:text-[var(--itools-navy-deep)]"
              }`}
            >
              {tab.label}
              {tab.id !== "all" && (
                <span className={`ml-1.5 ${isActive ? "text-white/70" : "text-[var(--itools-muted)]"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--itools-muted)]" />
          <Input
            type="text"
            placeholder="Search by name, role, or email…"
            className={`pl-10 ${inputClass}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={`${inputClass} px-3 w-full sm:w-auto text-sm`}
          aria-label="Sort members"
        >
          <option value="tier-desc">Leadership first</option>
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="date-desc">Newest</option>
          <option value="date-asc">Oldest</option>
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedMembers.map((member) => {
          const tierDetails = getTierBadgeDetails(member.role?.tier || "MEMBER");
          const formattedDate = new Date(member.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          const initial = member.name.charAt(0).toUpperCase();
          const categoryLabel = getCategoryBadge(member);

          return (
            <Card
              key={member.id}
              className={`${cardClass} flex flex-col overflow-hidden hover:border-[var(--itools-navy)]/20 transition-colors`}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="w-10 h-10 bg-[var(--itools-surface)] rounded-lg flex items-center justify-center font-semibold text-[var(--itools-navy)] text-sm">
                    {initial}
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(member)}
                        className="w-8 h-8 rounded-lg bg-[var(--itools-surface)] hover:bg-[var(--itools-border)] border border-[var(--itools-border)] flex items-center justify-center transition-colors text-[var(--itools-muted)] hover:text-[var(--itools-navy-deep)]"
                        aria-label={`Edit ${member.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(member)}
                        className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 border border-red-100 flex items-center justify-center transition-colors text-red-500"
                        aria-label={`Remove ${member.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-2.5">
                  <div>
                    <h3 className="font-semibold text-[var(--itools-navy-deep)] text-sm">
                      {member.name}
                    </h3>
                    <p className="text-xs text-[var(--itools-muted)] mt-0.5">
                      {member.role?.name || "Member"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge
                      variant="outline"
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border tracking-wider ${tierDetails.className}`}
                    >
                      {tierDetails.label}
                    </Badge>
                    {categoryLabel && (
                      <Badge
                        variant="outline"
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-violet-100 bg-violet-50 text-violet-600 tracking-wider"
                      >
                        {categoryLabel}
                      </Badge>
                    )}
                    {member.committee && (
                      <Badge
                        variant="outline"
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600 tracking-wider"
                      >
                        {committeeShortName(member.committee as Committee)}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-[var(--itools-surface)] border border-[var(--itools-border)] p-2.5 space-y-1.5 text-xs text-[var(--itools-muted)]">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {member.committee
                        ? committeeShortName(member.committee as Committee)
                        : "No unit assigned"}
                    </span>
                  </div>
                </div>
              </CardContent>
              <div className="px-4 py-2.5 border-t border-[var(--itools-border)] flex justify-between text-[11px] text-[var(--itools-muted)]">
                <span>Added</span>
                <span className="text-[var(--itools-navy-deep)] font-medium">{formattedDate}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {sortedMembers.length === 0 && !loadError && (
        <EmptyState icon={User} title="No members found" description="Try a different filter or search term." />
      )}

      <AddMemberDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        committees={committees}
        roles={roles}
        canPickExecutive={canPickExecutive}
        canCreateUnit={!!canCreateUnit}
        onCommitteesChange={loadCommittees}
        onSuccess={loadMembers}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="rounded-2xl border-[var(--itools-border)]">
          <DialogHeader>
            <DialogTitle className="font-display">Edit member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditMember} className="space-y-4">
            {formError && editOpen && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {formError}
              </p>
            )}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Full name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Email</Label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Role</Label>
              <select
                value={editRoleId}
                onChange={(e) => setEditRoleId(e.target.value)}
                className={`w-full ${inputClass} px-3`}
              >
                <option value="">Keep current role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                    {r.committee ? ` — ${committeeShortName(r.committee)}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
