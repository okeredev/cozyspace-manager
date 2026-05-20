import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Building2,
  Receipt,
  Wrench,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { BrandLockup } from "@/components/brand-mark";

const overview = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
];
const directory = [
  { title: "Users & roles", url: "/admin/users", icon: Users },
  { title: "Properties", url: "/admin/properties", icon: Building2 },
];
const ops = [
  { title: "Payments", url: "/admin/payments", icon: Receipt },
  { title: "Maintenance", url: "/admin/tickets", icon: Wrench },
];

export function AdminSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { signOut, user } = useAuth();
  const isActive = (url: string) =>
    url === "/admin" ? path === "/admin" : path === url || path.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="px-2 py-3">
          <BrandLockup sub="Admin" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {[
          { label: "Overview", items: overview },
          { label: "Directory", items: directory },
          { label: "Operations", items: ops },
        ].map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <ShieldCheck />
              <span className="truncate">{user?.email}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
