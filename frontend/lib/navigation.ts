import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Columns3,
  Kanban,
  ListTodo,
  GitBranch,
  Users,
  Building2,
  Shield,
  KeyRound,
  Landmark,
  Receipt,
  Wallet,
  FileSpreadsheet,
  Megaphone,
  MessageSquare,
  FileText,
  Mail,
  Bell,
  Radio,
  History,
  ScrollText,
  Bot,
  Sparkles,
  Wand2,
  Calculator,
  HardDrive,
  Paperclip,
  Settings,
  Plug,
  BarChart3,
  Gauge,
} from "lucide-react";

export type SidebarNavItem = {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number | string;
  soon?: boolean;
  /** When false, link works but won't show as active (alias routes). Default true. */
  highlightOnPrefix?: boolean;
  /** Visible only to Master tier (Founding Member, Faculty Advisor). */
  masterOnly?: boolean;
};

export type SidebarSection = {
  title: string;
  items: SidebarNavItem[];
};

/**
 * ECOS module map → iTools navigation.
 * Labels follow ECOS research; product name stays iTools.
 */
export const ICON_RAIL: SidebarNavItem[] = [
  {
    id: "rail-dashboards",
    href: "/dashboard",
    label: "Dashboards",
    icon: LayoutDashboard,
    highlightOnPrefix: true,
  },
  {
    id: "rail-workflows",
    href: "/dashboard/pipelines",
    label: "Workflows",
    icon: Columns3,
    highlightOnPrefix: true,
  },
  {
    id: "rail-notifications",
    href: "/dashboard/notifications",
    label: "Notifications",
    icon: Bell,
    highlightOnPrefix: true,
  },
  {
    id: "rail-organization",
    href: "/dashboard/members",
    label: "Organization",
    icon: Users,
    highlightOnPrefix: true,
  },
  {
    id: "rail-finance",
    href: "/dashboard/budget",
    label: "Finance",
    icon: Landmark,
    highlightOnPrefix: true,
  },
  {
    id: "rail-communications",
    href: "/dashboard/communications",
    label: "Communications",
    icon: Megaphone,
    highlightOnPrefix: true,
  },
];

export const NAV_SECTIONS: SidebarSection[] = [
  {
    title: "Dashboards & Analytics",
    items: [
      {
        id: "leadership-dashboard",
        href: "/dashboard",
        label: "Leadership dashboard",
        icon: LayoutDashboard,
        highlightOnPrefix: true,
      },
      {
        id: "role-dashboards",
        href: "/dashboard",
        label: "Role dashboards",
        icon: Gauge,
        soon: true,
      },
      {
        id: "org-analytics",
        href: "/dashboard",
        label: "Org analytics",
        icon: BarChart3,
        soon: true,
      },
    ],
  },
  {
    title: "Task & Workflow Engine",
    items: [
      {
        id: "org-pipelines",
        href: "/dashboard/pipelines",
        label: "Org pipelines",
        icon: Columns3,
        highlightOnPrefix: true,
      },
      {
        id: "role-pipelines",
        href: "/dashboard/pipelines",
        label: "Role pipelines",
        icon: GitBranch,
        soon: true,
      },
      {
        id: "kanban-boards",
        href: "/dashboard/pipelines",
        label: "Kanban boards",
        icon: Kanban,
        highlightOnPrefix: false,
      },
      {
        id: "task-assignments",
        href: "/dashboard/pipelines",
        label: "Task assignments",
        icon: ListTodo,
        highlightOnPrefix: false,
      },
    ],
  },
  {
    title: "Role & Hierarchy",
    items: [
      {
        id: "members",
        href: "/dashboard/members",
        label: "Members",
        icon: Users,
        highlightOnPrefix: true,
      },
      {
        id: "committees",
        href: "/dashboard/members",
        label: "Committees",
        icon: Building2,
        highlightOnPrefix: false,
      },
      {
        id: "roles-hierarchy",
        href: "/dashboard/members",
        label: "Roles & hierarchy",
        icon: Shield,
        soon: true,
      },
      {
        id: "permission-tiers",
        href: "/dashboard/members",
        label: "Permission tiers",
        icon: KeyRound,
        soon: true,
      },
    ],
  },
  {
    title: "Finance",
    items: [
      {
        id: "budget-overview",
        href: "/dashboard/budget",
        label: "Budget overview",
        icon: Landmark,
        highlightOnPrefix: true,
      },
      {
        id: "transactions",
        href: "/dashboard/budget",
        label: "Transactions",
        icon: Receipt,
        highlightOnPrefix: false,
      },
      {
        id: "reimbursements",
        href: "/dashboard/budget",
        label: "Reimbursements",
        icon: Wallet,
        highlightOnPrefix: false,
      },
      {
        id: "financial-reports",
        href: "/dashboard/budget",
        label: "Financial reports",
        icon: FileSpreadsheet,
        soon: true,
      },
    ],
  },
  {
    title: "Communications",
    items: [
      {
        id: "announcements",
        href: "/dashboard/communications",
        label: "Announcements",
        icon: Megaphone,
        highlightOnPrefix: true,
      },
      {
        id: "meeting-minutes",
        href: "/dashboard/communications",
        label: "Meeting minutes",
        icon: FileText,
        highlightOnPrefix: false,
      },
      {
        id: "discussions",
        href: "/dashboard/communications",
        label: "Discussions",
        icon: MessageSquare,
        highlightOnPrefix: false,
      },
      {
        id: "correspondence",
        href: "/dashboard/communications",
        label: "Official correspondence",
        icon: Mail,
        soon: true,
      },
    ],
  },
  {
    title: "Notifications",
    items: [
      {
        id: "in-app-alerts",
        href: "/dashboard/notifications",
        label: "In-app alerts",
        icon: Bell,
        highlightOnPrefix: true,
      },
      {
        id: "email-notifications",
        href: "/dashboard/notifications",
        label: "Email notifications",
        icon: Mail,
        soon: true,
      },
      {
        id: "global-broadcasts",
        href: "/dashboard/notifications",
        label: "Global broadcasts",
        icon: Radio,
        soon: true,
      },
    ],
  },
  {
    title: "Activity & Audit",
    items: [
      {
        id: "activity-history",
        href: "/dashboard/notifications",
        label: "Activity history",
        icon: History,
        soon: true,
      },
      {
        id: "audit-logs",
        href: "/dashboard/settings",
        label: "Audit logs",
        icon: ScrollText,
        soon: true,
        masterOnly: true,
      },
    ],
  },
  {
    title: "AI Module",
    items: [
      {
        id: "ai-assistants",
        href: "/dashboard",
        label: "AI assistants",
        icon: Bot,
        soon: true,
      },
      {
        id: "report-generator",
        href: "/dashboard",
        label: "Report generator",
        icon: Sparkles,
        soon: true,
      },
      {
        id: "email-drafts",
        href: "/dashboard",
        label: "Email drafts",
        icon: Wand2,
        soon: true,
      },
      {
        id: "budget-summaries",
        href: "/dashboard",
        label: "Budget summaries",
        icon: Calculator,
        soon: true,
      },
    ],
  },
  {
    title: "File Management",
    items: [
      {
        id: "google-drive",
        href: "/dashboard/settings",
        label: "Google Drive",
        icon: HardDrive,
        soon: true,
      },
      {
        id: "task-attachments",
        href: "/dashboard/pipelines",
        label: "Task attachments",
        icon: Paperclip,
        soon: true,
      },
    ],
  },
];

export const SYSTEM_NAV: SidebarNavItem[] = [
  {
    id: "system-settings",
    href: "/dashboard/settings",
    label: "System settings",
    icon: Settings,
    highlightOnPrefix: true,
  },
  {
    id: "integrations",
    href: "/dashboard/settings",
    label: "Integrations",
    icon: Plug,
    soon: true,
  },
];

export function isNavActive(pathname: string, item: SidebarNavItem): boolean {
  if (item.soon || item.highlightOnPrefix === false) return false;

  if (item.href === "/dashboard") {
    return pathname === "/dashboard";
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function filterNavItems(
  items: SidebarNavItem[],
  userTier?: string
): SidebarNavItem[] {
  const isMaster = userTier === "MASTER";
  return items.filter((item) => !item.masterOnly || isMaster);
}
