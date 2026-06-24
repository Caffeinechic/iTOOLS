"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuthStore, useBudgetStore, useNotificationStore } from "@/lib/store";
import type { User } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Landmark, Plus, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader, EmptyState, cardClass, btnPrimary, inputClass } from "@/components/dashboard/ui";

type CommitteeOption = { id: string; name: string; shortName?: string };

const CATEGORIES = ["Travel", "Events", "Merchandise", "Sponsorship", "Misc"] as const;
const TYPES = ["INCOME", "EXPENSE", "REIMBURSEMENT"] as const;

function pickDefaultCommittee(list: CommitteeOption[], user: User | null): string {
  if (user?.committeeId && list.some((c) => c.id === user.committeeId)) {
    return user.committeeId;
  }
  const mainSb = list.find(
    (c) =>
      c.shortName === "Main SB" ||
      c.name === "Silver Oak University IEEE Student Branch"
  );
  if (mainSb) return mainSb.id;
  return list[0]?.id ?? "";
}

export default function BudgetPage() {
  const { user, loading: authLoading } = useAuthStore();
  const { fetchUnreadCount } = useNotificationStore();
  const {
    summary,
    transactions,
    loading,
    error,
    creating,
    reviewing,
    createTransaction,
    reviewTransaction,
    setBudgetAllocation,
  } = useBudgetStore();

  const [committees, setCommittees] = useState<CommitteeOption[]>([]);
  const [committeesError, setCommitteesError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedCommitteeId, setSelectedCommitteeId] = useState<string>("");
  const [addOpen, setAddOpen] = useState(false);
  const [allocOpen, setAllocOpen] = useState(false);
  const [allocAmount, setAllocAmount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [type, setType] = useState<(typeof TYPES)[number]>("EXPENSE");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Events");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const isLeadership = user?.role?.tier === "LEADERSHIP" || user?.role?.tier === "MASTER";

  const loadPage = async (userSnapshot: User, isActive: () => boolean) => {
    setPageLoading(true);
    setCommitteesError(null);
    useBudgetStore.setState({ error: null });

    try {
      const res = await apiFetch<{ data: CommitteeOption[] }>("/budget/committees");
      if (!isActive()) return;

      const list = Array.isArray(res.data)
        ? res.data.filter((c): c is CommitteeOption => Boolean(c?.id && c?.name))
        : [];

      if (!list.length) {
        setCommittees([]);
        setCommitteesError("No committees available for your account.");
        useBudgetStore.setState({ loading: false, summary: null, transactions: [] });
        return;
      }

      const committeeId = pickDefaultCommittee(list, userSnapshot);
      setCommittees(list);
      setSelectedCommitteeId(committeeId);
      await useBudgetStore.getState().fetchBudgetData(committeeId, "2026");
    } catch (err) {
      if (!isActive()) return;
      const message = err instanceof Error ? err.message : "Could not load budget page";
      setCommitteesError(message);
      useBudgetStore.setState({ loading: false, summary: null, transactions: [], error: message });
    } finally {
      if (isActive()) setPageLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user) return;

    let active = true;
    void loadPage(user, () => active);
    return () => {
      active = false;
    };
  }, [authLoading, user?.id, user?.committeeId]);

  const reload = async () => {
    if (!user) return;
    if (committees.length && selectedCommitteeId) {
      await useBudgetStore.getState().fetchBudgetData(selectedCommitteeId, "2026");
      return;
    }
    await loadPage(user, () => true);
  };

  const pending = useMemo(() => transactions.filter((t) => t.status === "PENDING"), [transactions]);
  const recent = useMemo(() => transactions.slice(0, 20), [transactions]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommitteeId || !amount || !description.trim()) return;
    setFormError(null);
    try {
      await createTransaction({
        committeeId: selectedCommitteeId,
        fiscalYear: "2026",
        type,
        category,
        amount: Number(amount),
        description: description.trim(),
      });
      await fetchUnreadCount();
      setAddOpen(false);
      setAmount("");
      setDescription("");
      setType("EXPENSE");
      setCategory("Events");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save transaction");
    }
  };

  const handleApprove = async (id: string, action: "APPROVE" | "REJECT") => {
    try {
      await reviewTransaction(id, action);
      await fetchUnreadCount();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not update transaction");
    }
  };

  const handleSetAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommitteeId || !allocAmount) return;
    setFormError(null);
    try {
      await setBudgetAllocation(selectedCommitteeId, Number(allocAmount), "2026");
      setAllocOpen(false);
      setAllocAmount("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not set budget");
    }
  };

  const showSkeleton = authLoading || pageLoading;

  if (showSkeleton) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-52" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className={`h-28 ${cardClass}`} />
          ))}
        </div>
      </div>
    );
  }

  if (committeesError || error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Budget & finance" description="Track allocations, expenses, and approvals." />
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
          <span>{committeesError || error || "Budget data could not be loaded."}</span>
          <Button variant="outline" size="sm" className="rounded-lg shrink-0" onClick={() => reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const budgetSummary = summary ?? {
    committeeId: selectedCommitteeId,
    committeeName: committees.find((c) => c.id === selectedCommitteeId)?.name ?? "",
    fiscalYear: "2026",
    allocated: 0,
    income: 0,
    spent: 0,
    remaining: 0,
    pendingCount: 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Budget & finance" description="Track allocations, expenses, reimbursements, and approval flow.">
        <Button variant="outline" size="icon" onClick={() => reload()} className="h-9 w-9 rounded-xl border-[var(--itools-border)]">
          <RefreshCw className="w-4 h-4 text-[var(--itools-muted)]" />
        </Button>
        {isLeadership && (
          <Button variant="outline" onClick={() => setAllocOpen(true)} className="rounded-xl border-[var(--itools-border)]">
            Set allocation
          </Button>
        )}
        <Button onClick={() => setAddOpen(true)} className={btnPrimary}>
          <Plus className="w-4 h-4 mr-1.5" /> Add transaction
        </Button>
      </PageHeader>

      {formError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={selectedCommitteeId}
          onChange={async (e) => {
            const id = e.target.value;
            setSelectedCommitteeId(id);
            await useBudgetStore.getState().fetchBudgetData(id, "2026");
          }}
          className={`${inputClass} px-3 w-full sm:w-[420px] text-sm`}
        >
          {committees.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {budgetSummary.committeeName && (
          <p className="text-xs text-[var(--itools-muted)] self-center">FY {budgetSummary.fiscalYear}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Allocated" value={budgetSummary.allocated} />
        <MetricCard title="Income" value={budgetSummary.income} />
        <MetricCard title="Spent" value={budgetSummary.spent} />
        <MetricCard title="Remaining" value={budgetSummary.remaining} highlight />
      </div>

      {isLeadership && pending.length > 0 && (
        <Card className={cardClass}>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--itools-navy-deep)]">Pending approvals ({pending.length})</h3>
            <div className="space-y-2">
              {pending.map((txn) => (
                <div key={txn.id} className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-xl border border-[var(--itools-border)] p-3">
                  <div>
                    <p className="text-sm text-[var(--itools-navy-deep)] font-medium">
                      {txn.type} · ₹{txn.amount.toLocaleString()} · {txn.category}
                    </p>
                    <p className="text-xs text-[var(--itools-muted)]">{txn.description}</p>
                    {txn.creator && <p className="text-[11px] text-[var(--itools-muted)]">By {txn.creator.name}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" disabled={reviewing} className="rounded-lg" onClick={() => handleApprove(txn.id, "REJECT")}>
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                    <Button size="sm" disabled={reviewing} className="rounded-lg bg-[var(--itools-navy)] hover:bg-[var(--itools-navy-deep)]" onClick={() => handleApprove(txn.id, "APPROVE")}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className={cardClass}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--itools-navy-deep)]">Transactions ({transactions.length})</h3>
            <p className="text-xs text-[var(--itools-muted)]">Pending: {budgetSummary.pendingCount}</p>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={Landmark} title="No transactions yet" description="Add your first budget transaction to start tracking." />
          ) : (
            <div className="space-y-2">
              {recent.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--itools-border)] p-3">
                  <div className="min-w-0">
                    <p className="text-sm text-[var(--itools-navy-deep)] font-medium truncate">
                      {txn.type} · {txn.category}
                    </p>
                    <p className="text-xs text-[var(--itools-muted)] truncate">{txn.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[var(--itools-navy-deep)]">₹{txn.amount.toLocaleString()}</p>
                    <Badge variant="outline" className={`text-[10px] ${statusClass(txn.status)}`}>
                      {txn.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="rounded-2xl border-[var(--itools-border)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--itools-navy-deep)]">Add transaction</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleAdd}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <select value={type} onChange={(e) => setType(e.target.value as (typeof TYPES)[number])} className={`w-full ${inputClass} px-3`}>
                  {TYPES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <select value={category} onChange={(e) => setCategory(e.target.value as (typeof CATEGORIES)[number])} className={`w-full ${inputClass} px-3`}>
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Amount (₹)</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="1" className={inputClass} required />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" className={btnPrimary} disabled={creating}>{creating ? "Saving..." : "Submit"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={allocOpen} onOpenChange={setAllocOpen}>
        <DialogContent className="rounded-2xl border-[var(--itools-border)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--itools-navy-deep)]">Set annual allocation</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSetAllocation}>
            <p className="text-sm text-[var(--itools-muted)]">{budgetSummary.committeeName} · FY 2026</p>
            <div className="space-y-1.5">
              <Label>Allocated amount (₹)</Label>
              <Input value={allocAmount} onChange={(e) => setAllocAmount(e.target.value)} type="number" min="0" className={inputClass} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setAllocOpen(false)}>Cancel</Button>
              <Button type="submit" className={btnPrimary}>Save allocation</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({ title, value, highlight = false }: { title: string; value: number; highlight?: boolean }) {
  return (
    <Card className={`${cardClass} ${highlight ? "border-[var(--itools-navy)]/30" : ""}`}>
      <CardContent className="p-4">
        <p className="text-xs text-[var(--itools-muted)]">{title}</p>
        <p className="mt-1 text-xl font-semibold text-[var(--itools-navy-deep)]">₹{value.toLocaleString()}</p>
      </CardContent>
    </Card>
  );
}

function statusClass(status: string) {
  if (status === "APPROVED") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "REJECTED") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}
