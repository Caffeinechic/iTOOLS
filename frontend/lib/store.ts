import { create } from "zustand";
import { apiFetch } from "./api";

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  roleId?: string;
  committeeId?: string;
  role?: { name: string; tier: string };
  committee?: { name: string };
}

export interface Pipeline {
  id: string;
  title: string;
  description?: string;
  type: string;
  committeeId?: string;
  roleId?: string;
  createdAt: string;
  _count?: { tasks: number };
  statusCounts?: Record<string, number>;
  role?: { name: string; tier: string };
  committee?: { name: string };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  pipelineId?: string;
  assignedTo?: string;
  createdBy?: string;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
  assignee?: { id: string; name: string; email: string };
  creator?: { id: string; name: string };
  pipeline?: { id: string; title: string };
  _count?: { comments: number; files: number };
}

export interface TaskComment {
  id: string;
  content: string;
  createdAt: string;
  user?: { id: string; name: string };
}

export interface TaskFile {
  id: string;
  fileName?: string;
  fileUrl: string;
  mimeType?: string;
  createdAt: string;
  user?: { id: string; name: string };
}

export interface Notification {
  id: string;
  type: string;
  scope: string;
  message: string;
  isRead: boolean;
  sentAt: string;
  sender?: { id: string; name: string };
}

export interface Communication {
  id: string;
  type: "ANNOUNCEMENT" | "MEETING_MINUTES" | "DISCUSSION";
  title: string;
  content: string;
  priority: string;
  pinned: boolean;
  parentId?: string | null;
  meetingDate?: string | null;
  createdAt: string;
  updatedAt: string;
  replyCount?: number;
  author?: { id: string; name: string; email: string };
  committee?: { id: string; name: string };
  replies?: Communication[];
}

export interface Role {
  id: string;
  name: string;
  tier: string;
  roleKind?: "MAIN" | "CHAPTER";
  committeeId?: string;
  committee?: { id: string; name: string; shortName?: string; category?: string };
}

export interface BudgetSummary {
  committeeId: string;
  committeeName?: string;
  fiscalYear: string;
  allocated: number;
  income: number;
  spent: number;
  remaining: number;
  pendingCount: number;
  budgetId?: string;
}

export interface BudgetTransaction {
  id: string;
  committeeId: string;
  fiscalYear: string;
  type: "INCOME" | "EXPENSE" | "REIMBURSEMENT";
  amount: number;
  category: string;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  transactionDate: string;
  createdAt: string;
  creator?: { id: string; name: string };
  approver?: { id: string; name: string };
  committee?: { id: string; name: string };
}

// Auth Store
interface AuthState {
  user: User | null;
  loading: boolean;
  fetchUser: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  fetchUser: async () => {
    try {
      const data = await apiFetch<{ user: User }>("/auth/me");
      set({ user: data.user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
  logout: () => {
    document.cookie = "access_token=; path=/; max-age=0";
    set({ user: null });
    window.location.href = "/login";
  },
}));

// Pipeline Store
interface PipelineState {
  pipelines: Pipeline[];
  loading: boolean;
  fetchPipelines: () => Promise<void>;
}

export const usePipelineStore = create<PipelineState>((set) => ({
  pipelines: [],
  loading: true,
  fetchPipelines: async () => {
    try {
      const data = await apiFetch<{ data: Pipeline[] }>("/pipelines");
      set({ pipelines: data.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));

// Task Store
interface TaskState {
  tasks: Task[];
  loading: boolean;
  fetchTasks: (pipelineId: string) => Promise<void>;
  moveTask: (taskId: string, status: string) => Promise<void>;
  addTask: (task: { title: string; pipelineId: string; description?: string; priority?: string; assignedTo?: string; deadline?: string }) => Promise<void>;
  updateTask: (taskId: string, data: Partial<Task>) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loading: true,
  fetchTasks: async (pipelineId: string) => {
    try {
      const data = await apiFetch<{ data: Task[] }>(`/tasks?pipelineId=${pipelineId}`);
      set({ tasks: data.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  moveTask: async (taskId: string, status: string) => {
    // Optimistic update
    const prev = get().tasks;
    set({
      tasks: prev.map((t) => (t.id === taskId ? { ...t, status } : t)),
    });
    try {
      await apiFetch(`/tasks/${taskId}/move`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    } catch {
      set({ tasks: prev }); // Rollback
    }
  },
  addTask: async (task) => {
    const data = await apiFetch<{ data: Task }>("/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    });
    set({ tasks: [...get().tasks, data.data] });
  },
  updateTask: async (taskId, updateData) => {
    const data = await apiFetch<{ data: Task }>(`/tasks/${taskId}`, {
      method: "PATCH",
      body: JSON.stringify(updateData),
    });
    set({
      tasks: get().tasks.map((t) => (t.id === taskId ? data.data : t)),
    });
  },
}));

// Notification Store
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: true,
  fetchNotifications: async () => {
    try {
      const data = await apiFetch<{ data: Notification[] }>("/notifications");
      set({ notifications: data.data, loading: false });
      get().fetchUnreadCount();
    } catch {
      set({ loading: false });
    }
  },
  fetchUnreadCount: async () => {
    try {
      const data = await apiFetch<{ data: { count: number } }>("/notifications/unread-count");
      set({ unreadCount: data.data.count });
    } catch {
      // ignore
    }
  },
  markRead: async (id: string) => {
    await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
    set({
      notifications: get().notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, get().unreadCount - 1),
    });
  },
  markAllRead: async () => {
    await apiFetch("/notifications/read-all", { method: "PATCH" });
    set({
      notifications: get().notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    });
  },
}));

// Stats Store
interface StatsState {
  stats: { total: number; todo: number; inProgress: number; review: number; done: number; overdue: number } | null;
  loading: boolean;
  fetchStats: () => Promise<void>;
}

export const useStatsStore = create<StatsState>((set) => ({
  stats: null,
  loading: true,
  fetchStats: async () => {
    try {
      const data = await apiFetch<{ data: StatsState["stats"] }>("/tasks/stats/overview");
      set({ stats: data.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));

// Budget Store
interface BudgetState {
  summary: BudgetSummary | null;
  transactions: BudgetTransaction[];
  loading: boolean;
  error: string | null;
  creating: boolean;
  reviewing: boolean;
  fetchBudgetData: (committeeId?: string, fiscalYear?: string) => Promise<void>;
  createTransaction: (payload: {
    committeeId?: string;
    fiscalYear?: string;
    type: "INCOME" | "EXPENSE" | "REIMBURSEMENT";
    amount: number;
    category: string;
    description: string;
    transactionDate?: string;
  }) => Promise<void>;
  reviewTransaction: (id: string, action: "APPROVE" | "REJECT") => Promise<void>;
  setBudgetAllocation: (committeeId: string, allocatedAmount: number, fiscalYear?: string) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  summary: null,
  transactions: [],
  loading: true,
  error: null,
  creating: false,
  reviewing: false,
  fetchBudgetData: async (committeeId, fiscalYear = "2026") => {
    if (!committeeId) {
      set({ loading: false, error: "No committee selected", summary: null, transactions: [] });
      return;
    }
    set({ loading: true, error: null });
    const params = new URLSearchParams({ fiscalYear, committeeId });
    try {
      const summaryRes = await apiFetch<{ data: BudgetSummary }>(`/budget/summary?${params.toString()}`);
      let transactions: BudgetTransaction[] = [];
      try {
        const txRes = await apiFetch<{ data: BudgetTransaction[] }>(`/budget/transactions?${params.toString()}`);
        transactions = Array.isArray(txRes.data) ? txRes.data : [];
      } catch {
        transactions = [];
      }
      set({ summary: summaryRes.data, transactions, loading: false, error: null });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Could not load budget data",
        summary: null,
        transactions: [],
      });
    }
  },
  createTransaction: async (payload) => {
    set({ creating: true });
    try {
      await apiFetch("/budget/transactions", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await get().fetchBudgetData(payload.committeeId, payload.fiscalYear || "2026");
    } finally {
      set({ creating: false });
    }
  },
  reviewTransaction: async (id, action) => {
    set({ reviewing: true });
    try {
      await apiFetch(`/budget/transactions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      const committeeId = get().summary?.committeeId;
      const fiscalYear = get().summary?.fiscalYear || "2026";
      await get().fetchBudgetData(committeeId, fiscalYear);
    } finally {
      set({ reviewing: false });
    }
  },
  setBudgetAllocation: async (committeeId, allocatedAmount, fiscalYear = "2026") => {
    await apiFetch("/budget", {
      method: "POST",
      body: JSON.stringify({ committeeId, allocatedAmount, fiscalYear }),
    });
    await get().fetchBudgetData(committeeId, fiscalYear);
  },
}));

// Communication Store
interface CommunicationState {
  items: Communication[];
  selected: Communication | null;
  loading: boolean;
  fetchCommunications: (type?: string) => Promise<void>;
  fetchOne: (id: string) => Promise<void>;
  create: (data: Partial<Communication> & { title: string; content: string; type: string }) => Promise<void>;
  addReply: (threadId: string, content: string) => Promise<void>;
  clearSelected: () => void;
}

export const useCommunicationStore = create<CommunicationState>((set, get) => ({
  items: [],
  selected: null,
  loading: true,
  fetchCommunications: async (type?: string) => {
    set({ loading: true });
    try {
      const qs = type ? `?type=${type}` : "";
      const data = await apiFetch<{ data: Communication[] }>(`/communications${qs}`);
      set({ items: data.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  fetchOne: async (id: string) => {
    const data = await apiFetch<{ data: Communication }>(`/communications/${id}`);
    set({ selected: data.data });
  },
  create: async (payload) => {
    const data = await apiFetch<{ data: Communication }>("/communications", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    set({ items: [data.data, ...get().items] });
  },
  addReply: async (threadId, content) => {
    const data = await apiFetch<{ data: Communication }>(`/communications/${threadId}/replies`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    const selected = get().selected;
    if (selected?.id === threadId) {
      set({
        selected: {
          ...selected,
          replies: [...(selected.replies || []), data.data],
          replyCount: (selected.replyCount || 0) + 1,
        },
      });
    }
    set({
      items: get().items.map((i) =>
        i.id === threadId ? { ...i, replyCount: (i.replyCount || 0) + 1 } : i
      ),
    });
  },
  clearSelected: () => set({ selected: null }),
}));
