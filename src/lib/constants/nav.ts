import type { Role } from "@/lib/types/auth";
import {
  Home,
  Users,
  ListChecks,
  Flame,
  FileText,
  DollarSign,
  Briefcase,
  Building2,
  BarChart3,
  Activity,
  AlertTriangle,
  Settings,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** If set, only these roles can see this nav item. */
  roles?: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/leads", label: "All Leads", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: ListChecks },
  { href: "/hot-leads", label: "Hot Leads", icon: Flame },
  { href: "/scores",        label: "Diagnostic Scores",  icon: FileText },
  { href: "/scoring",       label: "Live Scoring",        icon: ClipboardList, roles: ["Admin", "Staff"] as Role[] },
  { href: "/revenue", label: "Revenue", icon: DollarSign },
  { href: "/linkedin", label: "LinkedIn Outreach", icon: Briefcase },
  { href: "/brokers", label: "Broker Queue", icon: Building2 },
  { href: "/channels", label: "Channel Performance", icon: BarChart3 },
  { href: "/health", label: "System Health", icon: Activity },
  { href: "/manual-review", label: "Manual Review", icon: AlertTriangle },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["Admin"] },
];

export function visibleNav(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}
