"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuthStore, Role } from "@/lib/store";
import {
  Committee,
  MEMBER_FILTER_TABS,
  MemberFilterTabId,
  CHAPTER_LEADERSHIP_ROLES,
  MAIN_LEADERSHIP_ROLES,
  committeeCategory,
  committeeShortName,
  committeesForMemberFilter,
  roleHierarchyPriority,
  roleKindForCommittee,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  Search,
  UserPlus,
  RotateCw,
  Pencil,
  Mail,
  Briefcase,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { PageHeader, EmptyState, cardClass, btnPrimary, inputClass } from "@/components/dashboard/ui";
import { AppSelect } from "@/components/patterns";

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
  const [activeTab, setActiveTab] = useState<MemberFilterTabId>("all");
  const [activeCommitteeId, setActiveCommitteeId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("hierarchy");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRoleId, setEditRoleId] = useState("");
  const [editCommitteeId, setEditCommitteeId] = useState("");
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
    setEditCommitteeId(member.committee?.id || "");
    setFormError(null);
    setEditOpen(true);
    await loadRoles();
  };

  const editCommittee = committees.find((c) => c.id === editCommitteeId);

  const editRoleOptions = useMemo(() => {
    if (!editCommittee) return roles;
    const kind = roleKindForCommittee(editCommittee);
    const filtered = roles.filter((r) => (r.roleKind || "CHAPTER") === kind);
    const order: readonly string[] =
      kind === "MAIN" ? MAIN_LEADERSHIP_ROLES : CHAPTER_LEADERSHIP_ROLES;
    return [...filtered].sort((a, b) => {
      const ai = order.indexOf(a.name);
      const bi = order.indexOf(b.name);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [roles, editCommittee]);

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
      if (editCommitteeId) body.committeeId = editCommitteeId;
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

  const handleDeleteMember = async (member: Member, closeEdit = false) => {
    if (!confirm(`Remove ${member.name} from the roster?`)) return;
    setFormError(null);
    try {
      await apiFetch(`/users/${member.id}`, { method: "DELETE" });
      if (closeEdit) {
        setEditOpen(false);
        setEditingMember(null);
      }
      await loadMembers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not remove member");
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

  const unitFilterOptions = useMemo(
    () => committeesForMemberFilter(committees, activeTab),
    [committees, activeTab]
  );

  const classifiedMembers = useMemo(() => {
    if (activeCommitteeId) {
      return searchedMembers.filter((member) => member.committee?.id === activeCommitteeId);
    }
    const tab = MEMBER_FILTER_TABS.find((t) => t.id === activeTab);
    if (!tab || activeTab === "all") return searchedMembers;
    if (!("categories" in tab)) return searchedMembers;
    return searchedMembers.filter((member) => {
      if (!member.committee) return false;
      const cat = committeeCategory(member.committee as Committee);
      return tab.categories.includes(cat);
    });
  }, [searchedMembers, activeTab, activeCommitteeId]);

  const sortedMembers = [...classifiedMembers].sort((a, b) => {
    if (sortBy === "name-asc") return a.name.localeCompare(b.name);
    if (sortBy === "name-desc") return b.name.localeCompare(a.name);
    if (sortBy === "hierarchy") {
      const unitA = a.committee ? committeeShortName(a.committee as Committee) : "zzz";
      const unitB = b.committee ? committeeShortName(b.committee as Committee) : "zzz";
      const unitCmp = unitA.localeCompare(unitB);
      if (unitCmp !== 0) return unitCmp;
      const roleCmp =
        roleHierarchyPriority(a.role?.name || "") - roleHierarchyPriority(b.role?.name || "");
      if (roleCmp !== 0) return roleCmp;
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

  const unitCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const member of members) {
      if (!member.committee?.id) continue;
      counts[member.committee.id] = (counts[member.committee.id] ?? 0) + 1;
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

      <div className="space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {MEMBER_FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.id && !activeCommitteeId;
            const count = tabCounts[tab.id] ?? 0;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setActiveCommitteeId(null);
                }}
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

        {unitFilterOptions.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {unitFilterOptions.map((unit) => {
              const isActive = activeCommitteeId === unit.id;
              const count = unitCounts[unit.id] ?? 0;
              return (
                <button
                  key={unit.id}
                  onClick={() => {
                    setActiveCommitteeId(isActive ? null : unit.id);
                    if (!isActive && activeTab === "all") {
                      const tab = MEMBER_FILTER_TABS.find(
                        (t) =>
                          "categories" in t &&
                          t.categories.includes(committeeCategory(unit))
                      );
                      if (tab) setActiveTab(tab.id);
                    }
                  }}
                  className={`whitespace-nowrap px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors shrink-0 ${
                    isActive
                      ? "bg-violet-600 text-white"
                      : count > 0
                        ? "bg-violet-50 text-violet-700 border border-violet-100 hover:border-violet-200"
                        : "bg-white text-[var(--itools-muted)] border border-[var(--itools-border)] hover:text-[var(--itools-navy-deep)]"
                  }`}
                  title={unit.name}
                >
                  {committeeShortName(unit)}
                  <span className={`ml-1 ${isActive ? "text-white/70" : "opacity-70"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--itools-muted)]" />
          <Input
            type="text"
            placeholder="Search by name, role, or email..."
            className={`pl-10 ${inputClass}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <AppSelect
          value={sortBy}
          onValueChange={setSortBy}
          className="w-full sm:w-[11rem]"
          options={[
            { value: "hierarchy", label: "Role hierarchy" },
            { value: "name-asc", label: "Name A–Z" },
            { value: "name-desc", label: "Name Z–A" },
            { value: "date-desc", label: "Newest" },
            { value: "date-asc", label: "Oldest" },
          ]}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedMembers.map((member) => {
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="w-8 h-8 rounded-lg bg-[var(--itools-surface)] hover:bg-[var(--itools-border)] border border-[var(--itools-border)] flex items-center justify-center transition-colors text-[var(--itools-muted)] hover:text-[var(--itools-navy-deep)]"
                          aria-label={`Actions for ${member.name}`}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl">
                        <DropdownMenuItem onClick={() => openEdit(member)} className="gap-2 cursor-pointer">
                          <Pencil className="w-3.5 h-3.5" />
                          Edit member
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteMember(member)}
                          className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
              <Label className="text-sm font-medium">Unit</Label>
              <AppSelect
                value={editCommitteeId || "__none__"}
                onValueChange={(v) => {
                  setEditCommitteeId(v === "__none__" ? "" : v);
                  setEditRoleId("");
                }}
                options={[
                  { value: "__none__", label: "No unit" },
                  ...committees.map((c) => ({
                    value: c.id,
                    label: `${committeeShortName(c)} - ${c.name}`,
                  })),
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Leadership role</Label>
              <AppSelect
                value={editRoleId || "__keep__"}
                onValueChange={(v) => setEditRoleId(v === "__keep__" ? "" : v)}
                options={[
                  { value: "__keep__", label: "Keep current role" },
                  ...editRoleOptions.map((r) => ({ value: r.id, label: r.name })),
                ]}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() =>
                  editingMember && handleDeleteMember(editingMember, true)
                }
                className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 mr-auto"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                Remove
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
