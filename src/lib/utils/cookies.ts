import "server-only";
import { cookies } from "next/headers";

const SIDEBAR_COOKIE = "sidebar-collapsed";

export function getSidebarCollapsed(): boolean {
  return cookies().get(SIDEBAR_COOKIE)?.value === "1";
}
