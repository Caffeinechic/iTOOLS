"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  KeyRound,
  Plus,
  Pencil,
  Trash2,
  RotateCw,
  Shield,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader, EmptyState, btnPrimary, cardClass, inputClass } from "@/components/dashboard/ui";

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  category: string;
  label: string;
  description: string;
  isSecret: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

interface SettingDefinition {
  key: string;
  category: string;
  label: string;
  description: string;
  isSecret: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  auth: "bg-orange-50 text-orange-700 border-orange-200",
  email: "bg-blue-50 text-blue-700 border-blue-200",
  integration: "bg-violet-50 text-violet-700 border-violet-200",
  general: "bg-slate-50 text-slate-600 border-slate-200",
};

export default function SystemSettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [definitions, setDefinitions] = useState<SettingDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [formKey, setFormKey] = useState("");
  const [formValue, setFormValue] = useState("");
  const [formCategory, setFormCategory] = useState("general");
  const [formLabel, setFormLabel] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsSecret, setFormIsSecret] = useState(true);
  const [showValue, setShowValue] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reloading, setReloading] = useState(false);

  const isMaster = user?.role?.tier === "MASTER";

  const load = async () => {
    setLoading(true);
    try {
      const [settingsRes, defsRes] = await Promise.all([
        apiFetch<{ data: SystemSetting[] }>("/system-settings"),
        apiFetch<{ data: SettingDefinition[] }>("/system-settings/definitions"),
      ]);
      setSettings(settingsRes.data);
      setDefinitions(defsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !isMaster) {
      router.push("/dashboard");
      return;
    }
    if (isMaster) load();
  }, [user, isMaster, router]);

  const openCreate = (prefillKey?: string) => {
    const def = definitions.find((d) => d.key === prefillKey);
    setEditingKey(null);
    setFormKey(prefillKey || "");
    setFormValue("");
    setFormCategory(def?.category || "general");
    setFormLabel(def?.label || "");
    setFormDescription(def?.description || "");
    setFormIsSecret(def?.isSecret ?? true);
    setShowValue(true);
    setDialogOpen(true);
  };

  const openEdit = async (key: string) => {
    try {
      const { data } = await apiFetch<{ data: SystemSetting }>(
        `/system-settings/${key}?reveal=true`
      );
      setEditingKey(key);
      setFormKey(data.key);
      setFormValue(data.value);
      setFormCategory(data.category);
      setFormLabel(data.label);
      setFormDescription(data.description);
      setFormIsSecret(data.isSecret);
      setShowValue(true);
      setDialogOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!formKey.trim() || !formValue.trim()) return;
    setSaving(true);
    try {
      await apiFetch(`/system-settings/${formKey.trim()}`, {
        method: "PUT",
        body: JSON.stringify({
          value: formValue,
          category: formCategory,
          label: formLabel || formKey.replace(/_/g, " "),
          description: formDescription,
          isSecret: formIsSecret,
        }),
      });
      setDialogOpen(false);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Remove setting "${key}"?`)) return;
    try {
      await apiFetch(`/system-settings/${key}`, { method: "DELETE" });
      await load();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReload = async () => {
    setReloading(true);
    try {
      await apiFetch("/system-settings/reload", { method: "POST" });
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setReloading(false);
    }
  };

  const existingKeys = new Set(settings.map((s) => s.key));
  const missingDefs = definitions.filter((d) => !existingKeys.has(d.key));

  if (!isMaster) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="System settings"
        description="Encrypted credentials stored in MongoDB and loaded at runtime. Only bootstrap keys (MONGO_URI, SETTINGS_ENCRYPTION_KEY) stay in your host environment."
      >
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-[var(--itools-border)]"
          onClick={handleReload}
          disabled={reloading}
        >
          <RotateCw className={`w-4 h-4 mr-1.5 ${reloading ? "animate-spin" : ""}`} />
          Reload cache
        </Button>
        <Button size="sm" className={btnPrimary} onClick={() => openCreate()}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add setting
        </Button>
      </PageHeader>

      {missingDefs.length > 0 && (
        <Card className={`${cardClass} border-dashed border-[var(--itools-navy)]/20 bg-[var(--itools-surface)]`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-[var(--itools-navy-deep)]">Suggested settings</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {missingDefs.map((d) => (
              <Button
                key={d.key}
                variant="outline"
                size="sm"
                className="rounded-xl text-xs border-[var(--itools-border)] text-[var(--itools-navy)] hover:bg-[var(--itools-surface)]"
                onClick={() => openCreate(d.key)}
              >
                <KeyRound className="w-3 h-3 mr-1" />
                {d.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className={`h-20 ${cardClass}`} />
          ))}
        </div>
      ) : settings.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No settings yet"
          description="Settings are auto-created on first server start."
        />
      ) : (
        <div className="grid gap-3">
          {settings.map((s) => (
            <Card key={s.id} className={`${cardClass} hover:border-[var(--itools-navy)]/20 transition-colors`}>
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-[var(--itools-navy-deep)] text-sm">{s.label}</span>
                    <Badge variant="outline" className={`text-[10px] font-medium ${CATEGORY_COLORS[s.category] || CATEGORY_COLORS.general}`}>
                      {s.category}
                    </Badge>
                    {s.isSecret && <Lock className="w-3 h-3 text-[var(--itools-muted)]" />}
                  </div>
                  <p className="text-[11px] text-[var(--itools-muted)] font-mono mt-0.5">{s.key}</p>
                  {s.description && (
                    <p className="text-xs text-[var(--itools-muted)] mt-1">{s.description}</p>
                  )}
                  <p className="text-xs font-mono text-[var(--itools-navy-deep)] mt-2 bg-[var(--itools-surface)] inline-block px-2 py-1 rounded-lg">
                    {s.value}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => openEdit(s.key)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  {!["JWT_SECRET", "DEFAULT_PASSWORD"].includes(s.key) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(s.key)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl border-[var(--itools-border)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[var(--itools-navy-deep)]">{editingKey ? "Edit setting" : "Add setting"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--itools-muted)]">Key</Label>
              <Input
                value={formKey}
                onChange={(e) => setFormKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ""))}
                placeholder="JWT_SECRET"
                disabled={!!editingKey}
                className={`font-mono ${inputClass}`}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--itools-muted)]">Value</Label>
              <div className="relative">
                <Input
                  type={showValue ? "text" : "password"}
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  placeholder="Enter value"
                  className={`pr-10 font-mono ${inputClass}`}
                />
                <button
                  type="button"
                  onClick={() => setShowValue(!showValue)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--itools-muted)] hover:text-[var(--itools-navy)]"
                >
                  {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-[var(--itools-muted)]">Category</Label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className={`w-full ${inputClass} px-3 text-sm`}
                >
                  <option value="auth">auth</option>
                  <option value="email">email</option>
                  <option value="integration">integration</option>
                  <option value="general">general</option>
                </select>
              </div>
              <div className="space-y-1.5 flex flex-col justify-end">
                <label className="flex items-center gap-2 text-sm text-[var(--itools-muted)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsSecret}
                    onChange={(e) => setFormIsSecret(e.target.checked)}
                    className="rounded border-[var(--itools-border)]"
                  />
                  Mask as secret
                </label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--itools-muted)]">Label</Label>
              <Input
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
                placeholder="Human-readable name"
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-[var(--itools-muted)]">Description</Label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="What this setting controls"
                className={inputClass}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className={btnPrimary}
              onClick={handleSave}
              disabled={saving || !formKey.trim() || !formValue.trim()}
            >
              {saving ? "Saving..." : "Save & apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
