"use client";

import { useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  Committee,
  CommitteeCategory,
  OrgPickerCategory,
  ORG_CATEGORY_DESCRIPTIONS,
  ORG_CATEGORY_LABELS,
  committeesForOrgPicker,
  committeeShortName,
  roleKindForCommittee,
} from "@/lib/committees";
import { Role } from "@/lib/store";
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
  Building2,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Heart,
  Landmark,
  Plus,
  Users,
} from "lucide-react";
import { btnPrimary, inputClass } from "@/components/dashboard/ui";

const ORG_ICONS: Record<OrgPickerCategory, typeof Building2> = {
  STUDENT_BRANCH: Landmark,
  SOCIETY: Cpu,
  GROUP: Heart,
  EXECUTIVE: Users,
};

const CHAPTER_ROLES = [
  "Chapter Chairperson",
  "Chapter Vice Chairperson",
  "Chapter Secretary",
  "Chapter Treasurer",
  "Chapter Webmaster",
];

const MAIN_ROLES = [
  "Chairperson",
  "Vice Chairperson",
  "Secretary",
  "Treasurer",
  "Webmaster",
];

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  committees: Committee[];
  roles: Role[];
  canPickExecutive: boolean;
  canCreateUnit: boolean;
  onCommitteesChange: () => void;
  onSuccess: () => void;
}

export function AddMemberDialog({
  open,
  onOpenChange,
  committees,
  roles,
  canPickExecutive,
  canCreateUnit,
  onCommitteesChange,
  onSuccess,
}: AddMemberDialogProps) {
  const [step, setStep] = useState(1);
  const [orgCategory, setOrgCategory] = useState<OrgPickerCategory | null>(null);
  const [committeeId, setCommitteeId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingUnit, setCreatingUnit] = useState(false);
  const [newUnitShortName, setNewUnitShortName] = useState("");
  const [newUnitCategory, setNewUnitCategory] = useState<CommitteeCategory>("SOCIETY");

  const selectedCommittee = committees.find((c) => c.id === committeeId);

  const unitOptions = useMemo(() => {
    if (!orgCategory) return [];
    return committeesForOrgPicker(committees, orgCategory);
  }, [committees, orgCategory]);

  const roleOptions = useMemo(() => {
    if (!selectedCommittee) return [];
    const kind = roleKindForCommittee(selectedCommittee);
    const filtered = roles.filter((r) => (r.roleKind || "CHAPTER") === kind);
    const order = kind === "MAIN" ? MAIN_ROLES : CHAPTER_ROLES;
    return [...filtered].sort((a, b) => {
      const ai = order.indexOf(a.name);
      const bi = order.indexOf(b.name);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [roles, selectedCommittee]);

  const reset = () => {
    setStep(1);
    setOrgCategory(null);
    setCommitteeId("");
    setRoleId("");
    setName("");
    setEmail("");
    setError(null);
    setCreatingUnit(false);
    setNewUnitShortName("");
    setNewUnitCategory("SOCIETY");
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const pickOrg = (org: OrgPickerCategory) => {
    setOrgCategory(org);
    setCommitteeId("");
    setRoleId("");
    setCreatingUnit(false);
    const units = committeesForOrgPicker(committees, org);
    if (units.length === 1) {
      setCommitteeId(units[0].id);
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const pickUnit = (id: string) => {
    setCommitteeId(id);
    setRoleId("");
    setCreatingUnit(false);
    setStep(3);
  };

  const handleCreateUnit = async () => {
    if (!newUnitShortName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: Committee }>("/committees", {
        method: "POST",
        body: JSON.stringify({
          shortName: newUnitShortName.trim(),
          category: newUnitCategory,
        }),
      });
      await onCommitteesChange();
      setCommitteeId(res.data.id);
      setCreatingUnit(false);
      setNewUnitShortName("");
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create unit");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !roleId || !committeeId) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          roleId,
          committeeId,
        }),
      });
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add member");
    } finally {
      setSaving(false);
    }
  };

  const orgChoices: OrgPickerCategory[] = canPickExecutive
    ? ["STUDENT_BRANCH", "SOCIETY", "GROUP", "EXECUTIVE"]
    : ["STUDENT_BRANCH", "SOCIETY", "GROUP"];

  const canCreateInCategory =
    canCreateUnit && orgCategory && (orgCategory === "SOCIETY" || orgCategory === "GROUP");

  const stepLabels = [
    "Choose organization type",
    creatingUnit ? "Create new unit" : "Select unit",
    "Assign leadership role",
    "Member details",
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-2xl border-[var(--itools-border)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-[var(--itools-navy-deep)]">
            Add executive member
          </DialogTitle>
          <p className="text-xs text-[var(--itools-muted)] pt-1">
            Step {step} of 4 — {stepLabels[step - 1]}
          </p>
        </DialogHeader>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {orgChoices.map((org) => {
              const Icon = ORG_ICONS[org];
              return (
                <button
                  key={org}
                  type="button"
                  onClick={() => pickOrg(org)}
                  className="text-left rounded-xl border border-[var(--itools-border)] p-4 hover:border-[var(--itools-navy)]/40 hover:bg-[var(--itools-surface)] transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-[var(--itools-navy)]/10 text-[var(--itools-navy)] flex items-center justify-center mb-2 group-hover:bg-[var(--itools-navy)] group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-semibold text-[var(--itools-navy-deep)]">
                    {ORG_CATEGORY_LABELS[org]}
                  </p>
                  <p className="text-[11px] text-[var(--itools-muted)] mt-1 leading-relaxed">
                    {ORG_CATEGORY_DESCRIPTIONS[org]}
                  </p>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && orgCategory && !creatingUnit && (
          <div className="space-y-2">
            {unitOptions.map((unit) => (
              <button
                key={unit.id}
                type="button"
                onClick={() => pickUnit(unit.id)}
                className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                  committeeId === unit.id
                    ? "border-[var(--itools-navy)] bg-[var(--itools-navy)]/5"
                    : "border-[var(--itools-border)] hover:border-[var(--itools-navy)]/30"
                }`}
              >
                <p className="text-sm font-medium text-[var(--itools-navy-deep)]">
                  {committeeShortName(unit)}
                </p>
                <p className="text-[11px] text-[var(--itools-muted)] truncate">{unit.name}</p>
              </button>
            ))}
            {canCreateInCategory && (
              <button
                type="button"
                onClick={() => {
                  setCreatingUnit(true);
                  setNewUnitCategory(orgCategory === "SOCIETY" ? "SOCIETY" : "AFFINITY_GROUP");
                }}
                className="w-full text-left rounded-xl border border-dashed border-[var(--itools-navy)]/30 px-4 py-3 hover:bg-[var(--itools-navy)]/5 transition-colors flex items-center gap-3"
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--itools-navy)]/10 flex items-center justify-center text-[var(--itools-navy)]">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--itools-navy-deep)]">
                    Create new {orgCategory === "SOCIETY" ? "society" : "group"}
                  </p>
                  <p className="text-[11px] text-[var(--itools-muted)]">
                    Add a new chapter with all leadership roles
                  </p>
                </div>
              </button>
            )}
          </div>
        )}

        {step === 2 && creatingUnit && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Unit name</Label>
              <Input
                value={newUnitShortName}
                onChange={(e) => setNewUnitShortName(e.target.value)}
                placeholder={
                  orgCategory === "SOCIETY"
                    ? "e.g. Robotics Society"
                    : "e.g. Women In Engineering"
                }
                className={inputClass}
                autoFocus
              />
              <p className="text-[11px] text-[var(--itools-muted)]">
                Full name: SOU IEEE {newUnitShortName || "…"}{" "}
                {newUnitCategory === "SOCIETY"
                  ? "Society Chapter"
                  : newUnitCategory === "AFFINITY_GROUP"
                    ? "Affinity Group"
                    : "Group"}
              </p>
            </div>
            {orgCategory === "GROUP" && (
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Group type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: "AFFINITY_GROUP" as CommitteeCategory, label: "Affinity Group" },
                      { value: "GROUP" as CommitteeCategory, label: "Student Branch Group" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setNewUnitCategory(opt.value)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                        newUnitCategory === opt.value
                          ? "border-[var(--itools-navy)] bg-[var(--itools-navy)]/5 text-[var(--itools-navy-deep)]"
                          : "border-[var(--itools-border)] text-[var(--itools-muted)] hover:border-[var(--itools-navy)]/30"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-[var(--itools-muted)] rounded-lg bg-[var(--itools-surface)] border border-[var(--itools-border)] px-3 py-2">
              Leadership roles available: Chapter Chairperson, Vice Chairperson, Secretary,
              Treasurer, and Webmaster.
            </p>
            <Button
              type="button"
              onClick={handleCreateUnit}
              disabled={saving || !newUnitShortName.trim()}
              className={btnPrimary + " w-full"}
            >
              {saving ? "Creating…" : "Create unit & continue"}
            </Button>
          </div>
        )}

        {step === 3 && selectedCommittee && (
          <div className="space-y-3">
            <div className="rounded-lg bg-[var(--itools-surface)] border border-[var(--itools-border)] px-3 py-2">
              <p className="text-[11px] text-[var(--itools-muted)]">Adding to</p>
              <p className="text-sm font-medium text-[var(--itools-navy-deep)]">
                {committeeShortName(selectedCommittee)}
              </p>
              <p className="text-[10px] text-[var(--itools-muted)] mt-0.5">
                {roleKindForCommittee(selectedCommittee) === "MAIN"
                  ? "Student Branch leadership"
                  : "Chapter leadership"}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Leadership role</Label>
              <div className="grid gap-2">
                {roleOptions.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRoleId(r.id);
                      setStep(4);
                    }}
                    className={`w-full text-left rounded-xl border px-4 py-3 transition-colors ${
                      roleId === r.id
                        ? "border-[var(--itools-navy)] bg-[var(--itools-navy)]/5"
                        : "border-[var(--itools-border)] hover:border-[var(--itools-navy)]/30"
                    }`}
                  >
                    <p className="text-sm font-medium text-[var(--itools-navy-deep)]">{r.name}</p>
                    <p className="text-[10px] text-[var(--itools-muted)] uppercase tracking-wide mt-0.5">
                      {r.roleKind === "MAIN" ? "Branch officer" : "Chapter officer"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg bg-[var(--itools-surface)] border border-[var(--itools-border)] px-3 py-2 text-xs text-[var(--itools-muted)]">
              <span className="font-medium text-[var(--itools-navy-deep)]">
                {roleOptions.find((r) => r.id === roleId)?.name}
              </span>
              {" · "}
              {selectedCommittee && committeeShortName(selectedCommittee)}
            </div>
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
                placeholder="name@ieeesb.org"
              />
            </div>
            <p className="text-xs text-[var(--itools-muted)]">
              Members use the shared EC default password from System Settings.
            </p>
            <DialogFooter>
              <Button type="submit" disabled={saving} className={btnPrimary}>
                {saving ? "Adding…" : "Add member"}
              </Button>
            </DialogFooter>
          </form>
        )}

        <DialogFooter className="sm:justify-between">
          {step > 1 ? (
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              onClick={() => {
                if (step === 2 && creatingUnit) {
                  setCreatingUnit(false);
                  return;
                }
                setStep((s) => Math.max(1, s - 1));
              }}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          ) : (
            <span />
          )}
          {step < 4 && step > 1 && !creatingUnit && (
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={step === 2 && !committeeId}
              onClick={() => setStep((s) => Math.min(4, s + 1))}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
