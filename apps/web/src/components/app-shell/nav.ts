import {
  Bookmark,
  Code2,
  GraduationCap,
  Home,
  Library,
  ListChecks,
  MessagesSquare,
  Settings,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  key: string; // i18n key from src/lib/i18n
  icon: LucideIcon;
}

export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", key: "home", icon: Home },
  { href: "/support", key: "support", icon: MessagesSquare },
];

export const SUPPORT_NAV: NavItem[] = [
  { href: "/support/resources", key: "resources", icon: Library },
  { href: "/support/saved", key: "saved", icon: Bookmark },
  { href: "/support/steps", key: "nextSteps", icon: ListChecks },
  { href: "/support/human", key: "humanSupport", icon: Users },
];

export const MODULES_NAV: NavItem[] = [
  { href: "/study", key: "academicStudy", icon: GraduationCap },
  { href: "/learn", key: "developerPath", icon: Code2 },
  { href: "/cp", key: "cpCoach", icon: Trophy },
];

export const SETTINGS_NAV: NavItem[] = [{ href: "/settings", key: "settings", icon: Settings }];

/** Mobile bottom bar — keep to 5 items, Support always one tap away. */
export const MOBILE_NAV: NavItem[] = [
  { href: "/dashboard", key: "home", icon: Home },
  { href: "/support", key: "support", icon: MessagesSquare },
  { href: "/learn", key: "learn", icon: Code2 },
  { href: "/cp", key: "cp", icon: Trophy },
  { href: "/settings", key: "settings", icon: Settings },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/support") return pathname === "/support";
  return pathname === href || pathname.startsWith(href + "/");
}
