"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuthStore, useBudgetStore, useNotificationStore } from "@/lib/store";
import type { User } from "@/lib/store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { PageTitle, EmptyState, StatCard, AppSelect } from "@/components/patterns";
import { pageStackClass, panelCardClass, btnPrimary, inputClass } from "@/lib/tokens";

const cardClass = panelCardClass;

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
      <div className={pageStackClass}>
        <Skeleton className="h-10 w-52" />
        <div className="content-grid sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className={`h-28 ${cardClass}`} />
          ))}
        </div>
      </div>
    );
  }

  if (committeesError || error) {
    return (
      <div className={pageStackClass}>
        <PageTitle title="Budget & finance" />
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700 flex items-center justify-between gap-3">
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
    <div className={pageStackClass}>
      <PageTitle title="Budget & finance">
        <Button variant="outline" size="icon" onClick={() => reload()} className="h-9 w-9 shrink-0">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </Button>
        {isLeadership && (
          <Button variant="outline" onClick={() => setAllocOpen(true)} className="shrink-0">
            Set allocation
          </Button>
        )}
        <Button onClick={() => setAddOpen(true)} variant="brand" className="shrink-0">
          <Plus className="w-4 h-4 mr-1.5" /> Add transaction
        </Button>
      </PageTitle>

      {formError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">{formError}</div>
      )}

      <div className="page-filter-bar">
        <AppSelect
          value={selectedCommitteeId}
          onValueChange={async (id) => {
            setSelectedCommitteeId(id);
            await useBudgetStore.getState().fetchBudgetData(id, "2026");
          }}
          options={committees.map((c) => ({ value: c.id, label: c.name }))}
          className="w-full sm:max-w-md"
        />
        <span className="text-xs font-medium text-muted-foreground sm:ml-auto shrink-0">
          FY {budgetSummary.fiscalYear}
        </span>
      </div>

      <div className="content-grid sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Allocated" value={budgetSummary.allocated} prefix="₹" />
        <StatCard label="Income" value={budgetSummary.income} prefix="₹" />
        <StatCard label="Spent" value={budgetSummary.spent} prefix="₹" />
        <StatCard label="Remaining" value={budgetSummary.remaining} prefix="₹" highlight />
      </div>

      {isLeadership && pending.length > 0 && (
        <Card className={cardClass}>
          <CardHeader className="pb-3">
            <h3 className="text-sm font-semibold text-brand-deep">Pending approvals ({pending.length})</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.map((txn) => (
              <div
                key={txn.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between rounded-xl border border-border/60 p-4"
              >
                  <div>
                    <p className="text-sm text-brand-deep font-medium">
                      {txn.type} · ₹{txn.amount.toLocaleString()} · {txn.category}
                    </p>
                    <p className="text-xs text-muted-foreground">{txn.description}</p>
                    {txn.creator && <p className="text-[11px] text-muted-foreground">By {txn.creator.name}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" disabled={reviewing} onClick={() => handleApprove(txn.id, "REJECT")}>
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                    <Button size="sm" variant="brand" disabled={reviewing} onClick={() => handleApprove(txn.id, "APPROVE")}>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      <Card className={cardClass}>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <h3 className="text-sm font-semibold text-brand-deep">Transactions ({transactions.length})</h3>
          <p className="text-xs text-muted-foreground">Pending: {budgetSummary.pendingCount}</p>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <EmptyState icon={Landmark} title="No transactions yet" description="Add your first budget transaction to start tracking." />
          ) : (
            <div className="space-y-3">
              {recent.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border/60 p-4 hover:bg-secondary/35 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-brand-deep font-medium truncate">
                      {txn.type} · {txn.category}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{txn.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-brand-deep tabular-nums">₹{txn.amount.toLocaleString()}</p>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add transaction</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleAdd}>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <AppSelect
                  value={type}
                  onValueChange={(v) => setType(v as (typeof TYPES)[number])}
                  options={TYPES.map((item) => ({ value: item, label: item }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <AppSelect
                  value={category}
                  onValueChange={(v) => setCategory(v as (typeof CATEGORIES)[number])}
                  options={CATEGORIES.map((item) => ({ value: item, label: item }))}
                />
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set annual allocation</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSetAllocation}>
            <p className="text-sm text-muted-foreground">{budgetSummary.committeeName} · FY 2026</p>
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

function statusClass(status: string) {
  if (status === "APPROVED") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "REJECTED") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}
